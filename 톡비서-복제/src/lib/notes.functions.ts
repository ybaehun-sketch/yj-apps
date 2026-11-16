import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LANGS, aiLangRule, trL, type Lang } from "./i18n";
import { NOTE_CATEGORIES, firstUrl, normalizeAnalysis, parseOg, sanitizeEdit } from "./notes";
import { callGemini, getGeminiApiKey, parseDataUrl, parseGeminiJson, type GeminiInputPart } from "./gemini.server";

/** 음성 메모 → 텍스트 (Gemini 멀티모달 오디오 인식). */
export const transcribeVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ audioBase64: z.string().max(9_000_000), mimeType: z.string().max(60), lang: z.enum(LANGS).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!getGeminiApiKey()) throw new Error("음성 인식 설정이 없어요");
    if (!data.audioBase64.trim()) throw new Error("녹음이 비어 있어요");
    const mimeType = data.mimeType.split(";")[0]?.trim() || "audio/webm";
    const text = await callGemini({
      instructions: `Transcribe the spoken audio verbatim in ${data.lang ?? "ko"}. Output only the transcribed text with no extra commentary.`,
      input: [
        { type: "text", text: "이 음성을 들리는 대로 정확히 받아적어 주세요." },
        { type: "audio", data: data.audioBase64, mime_type: mimeType },
      ],
      maxOutputTokens: 800,
      json: false,
    });
    if (text === null) throw new Error("음성을 텍스트로 바꾸지 못했어요");
    return { text: text.trim() };
  });

// One AI call per dump (same model as 찻잔 타로). Result is stored so reminders need no AI later.
export const analyzeAndSaveNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        text: z.string().max(4000),
        imagePath: z.string().max(300).nullable(),
        imageDataUrl: z.string().max(3_000_000).nullable(),
        audioPath: z.string().max(300).nullable().optional(),
        filePath: z.string().max(300).nullable().optional(),
        fileName: z.string().max(300).nullable().optional(),
        kind: z.enum(["text", "image", "link", "voice"]).optional(),
        tzOffsetMin: z.number().int().min(-840).max(840),
        lang: z.enum(LANGS).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const L: Lang = data.lang ?? "ko";
    const { supabase, userId } = context;
    if (data.imagePath && !data.imagePath.startsWith(`${userId}/`)) throw new Error("Forbidden");
    if (data.audioPath && !data.audioPath.startsWith(`${userId}/`)) throw new Error("Forbidden");
    if (data.filePath && !data.filePath.startsWith(`${userId}/`)) throw new Error("Forbidden");
    if (!data.text.trim() && !data.imageDataUrl) throw new Error("내용이 비어 있어요");

    const { data: custom } = await supabase.from("user_categories").select("name, hint").limit(30);
    const extra = (custom ?? []).map((c) => c.name);
    const customLine = extra.length
      ? `\n사용자 맞춤 카테고리(해당하면 기본보다 우선): ${(custom ?? []).map((c) => (c.hint ? `${c.name}(${c.hint})` : c.name)).join(", ")}`
      : "";
    const now = new Date();
    const localNow = new Date(now.getTime() - data.tzOffsetMin * 60000).toISOString().slice(0, 16);
    const offH = -data.tzOffsetMin / 60;
    const tz = `UTC${offH >= 0 ? "+" : ""}${offH}`;
    const instructions = `너는 다정하고 똑똑한 '톡비서'다. 사용자가 던진 텍스트/스크린샷을 분석해 JSON 하나만 출력한다.
현재 사용자 현지 시각: ${localNow} (${tz}). 상대 날짜("다음 주 토요일", "내일")는 이 기준으로 계산하라.
스키마: {"summary": 핵심 1줄 요약(40자 이내), "category": ${[...NOTE_CATEGORIES, ...extra].join("|")} 중 하나, "has_date": boolean, "detected_date": 시간대 포함 ISO 8601 또는 null, "remind_at": 일정 전날 20:00 또는 당일 아침 08:00 (시간대 포함 ISO) 또는 null, "remind_message": 그 시점에 건넬 다정한 1줄 알림 또는 null, "tags": 검색용 키워드 3~5개(# 없이), "secretary_reply": 방금 받은 직후 건넬 짧은 확인 한마디(이모지 1~2개)}.
스크린샷이면 이미지 속 글자(청첩장, 예약 문자, 영수증, 상품명, 가게 이름)를 읽어서 판단하라. 시간이 없으면 일정은 12:00로 가정.${customLine}` + aiLangRule(L);

    const url = data.imagePath ? null : firstUrl(data.text);
    const og = url ? await fetchOg(url) : null;
    const ogLine = og?.title ? `\n\n[링크 정보] 제목: ${og.title}${og.author ? ` / 채널: ${og.author}` : ""}${og.description ? ` / 설명: ${og.description}` : ""}\n(주소만 보지 말고 이 제목·내용의 주제로 분류·요약하라)` : "";
    const parts: GeminiInputPart[] = [
      { type: "text", text: `다음 내용을 분석해 JSON으로 답해줘.\n\n${data.text.trim() || "(텍스트 없음, 스크린샷만)"}${ogLine}` },
    ];
    if (data.imageDataUrl) {
      const img = parseDataUrl(data.imageDataUrl);
      if (img) parts.push({ type: "image", data: img.data, mime_type: img.mime_type });
    }

    let raw: unknown = {};
    if (getGeminiApiKey()) {
      const text = await callGemini({
        instructions,
        input: parts,
        maxOutputTokens: 1200,
      });
      raw = parseGeminiJson(text) ?? {};
    }

    const a = normalizeAnalysis(raw, data.text, data.tzOffsetMin, extra);
    const { data: row, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        kind: data.kind ?? (data.imagePath ? "image" : url ? "link" : "text"),
        content: data.text,
        image_path: data.imagePath,
        audio_path: data.audioPath ?? null,
        file_path: data.filePath ?? null,
        file_name: data.fileName ?? null,
        confirmed: false,
        link_url: url,
        link_title: og?.title ?? null,
        link_description: og?.description ?? null,
        link_image: og?.image ?? null,
        ...a,
      })
      .select()
      .single();
    if (error) {
      console.error("note insert failed", error);
      throw new Error("저장에 실패했어요");
    }
    return row;
  });

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
    if (h === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (h === "youtube.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]+)/);
      return m?.[2] ?? null;
    }
  } catch { /* not a url */ }
  return null;
}

async function fetchOg(url: string): Promise<{ title: string | null; description: string | null; image: string | null; author?: string | null } | null> {
  const yt = youtubeId(url);
  if (yt) {
    try {
      const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${yt}`)}`);
      const j = r.ok ? ((await r.json()) as { title?: string; author_name?: string }) : {};
      return {
        title: j.title?.slice(0, 200) ?? null,
        author: j.author_name ?? null,
        description: j.author_name ? `▶ YouTube · ${j.author_name}` : "▶ YouTube",
        image: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
      };
    } catch (e) {
      console.error("yt oembed failed", e);
      return { title: null, description: "▶ YouTube", image: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` };
    }
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; JungbiBot/1.0)", Accept: "text/html" } });
    clearTimeout(t);
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    const html = (await res.text()).slice(0, 300_000);
    return parseOg(html, res.url || url);
  } catch (e) {
    console.error("og fetch failed", url, e);
    return null;
  }
}

/** 저장된 메모를 근거로 질문에 답한다 (질문은 저장하지 않음). */
export const askNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ question: z.string().min(1).max(500), tzOffsetMin: z.number().int().min(-840).max(840), lang: z.enum(LANGS).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const L: Lang = data.lang ?? "ko";
    const { data: rows, error } = await context.supabase
      .from("notes")
      .select("id, created_at, kind, content, summary, category, detected_date, tags, link_title")
      .eq("confirmed", true)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("서류함을 열지 못했어요");
    if (!rows.length) return { answer: trL(L, "아직 서류함이 비어 있어요. 먼저 뭐든 던져 주세요 📂"), noteIds: [] as string[] };

    const localNow = new Date(Date.now() - data.tzOffsetMin * 60000).toISOString().slice(0, 16);
    const docs = rows.map((r) => ({
      id: r.id, saved: r.created_at.slice(0, 10), kind: r.kind, category: r.category, summary: r.summary,
      date: r.detected_date, tags: r.tags, title: r.link_title, text: r.content.slice(0, 300),
    }));
    if (!getGeminiApiKey()) throw new Error("AI 설정이 없어요");
    const instructions = `너는 '톡비서'다. 사용자의 저장된 메모(JSON)만 근거로 질문에 답한다. 현재 현지 시각: ${localNow}. 날짜는 현지 기준으로 말하라.
JSON 하나만 출력: {"answer": 한국어 1~2문장, 간결하고 다정하게(이모지 1개), 메모에 없으면 솔직히 못 찾았다고, "note_ids": 근거가 된 메모 id 배열(관련도 순)}.
개수·통계·현황 질문(몇 개, 얼마나 등)은 정확한 개수와 형태/카테고리별 내역으로 답하고 note_ids에는 해당 메모를 모두(최대 20개) 넣는다(화면에서 접어 두고 사용자가 원할 때만 펼친다). 특정 메모 찾기는 가장 관련된 1~2개만 고른다.
중요: 질문이 사용자 메모에 대한 것이 아니라 너(톡비서) 자신에 대한 질문(이름·정체·할 수 있는 일)이면 메모를 뒤지지 말고 "저는 초간편 AI 톡비서예요! 🧹 ..."처럼 자기소개하고 note_ids는 []. 일상 잡담·푸념 질문이면 "메모에서 못 찾았다"고 하지 말고 "저는 톡비서예요~ 🧹 일상 잡담은 서툴지만, 메모 정리·검색은 자신 있어요!" 톤으로 짧게 안내하고 note_ids는 [].\n[톡비서 본분] 톡비서는 컨설턴트·기획자·창작자·만능 에이전트가 아니라 "정리·기록 비서"다. 가격 책정, 아이디어 제안, 전략, 맞춤형 에이전트 역할 등을 "잡아드릴게요/맞춰드릴게요"처럼 약속하지 마라. 대신 "그건 제 영역 밖이에요 😅 생각을 툭 던져주시면 아이디어 메모로 정리해 두고 나중에 바로 꺼내드릴게요"처럼 정리·보관·알림으로 담백하게 유도한다.
의도가 모호하면(예: "이 책 읽어봤어?", "그거 어떻게 됐지?"처럼 '이/그/저것' 지칭 대상이 메모에서 특정되지 않거나, 저장 메모 찾기인지 외부 정보·감상을 원하는지 불분명) "못 찾았다"로 끝내지 말고 되물어라. answer는 2~3문장 허용: "혹시 저장해두신 ○○ 메모를 찾으시는 걸까요, 아니면 새 ○○ 정보를 원하시는 걸까요? 😊 제목이나 핵심 단어를 알려주시면 바로 찾아드리고, 링크나 스샷을 던져주시면 정리해 둘게요 (실시간 웹검색은 서툴러요 🧹)" 톤. note_ids는 [] (관련 후보가 1~2개 있으면 그것을 넣고 "이 메모 말씀이세요?"라고 확인).` + aiLangRule(L);
    const text = await callGemini({
      instructions,
      input: `메모 목록(json):\n${JSON.stringify(docs)}\n\n질문: ${data.question}`,
      maxOutputTokens: 800,
    });
    if (text === null) throw new Error("찾다가 문제가 생겼어요");
    const parsed = parseGeminiJson<{ answer?: unknown; note_ids?: unknown }>(text) ?? {};
    const valid = new Set(rows.map((r) => r.id));
    const noteIds = Array.isArray(parsed.note_ids) ? parsed.note_ids.filter((x): x is string => typeof x === "string" && valid.has(x)).slice(0, 20) : [];
    return { answer: typeof parsed.answer === "string" && parsed.answer.trim() ? parsed.answer.trim().slice(0, 300) : trL(L, "관련 메모를 찾지 못했어요 🔍"), noteIds };
  });

/** 최근 10개 대화 흐름을 보고 직전 메모를 자연어로 수정한다 (잡담은 짧게 컷). */
export const editFromChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ message: z.string().min(1).max(300), tzOffsetMin: z.number().int().min(-840).max(840), lang: z.enum(LANGS).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const L: Lang = data.lang ?? "ko";
    const { supabase } = context;
    const [{ data: notes }, { data: answers }, { data: custom }] = await Promise.all([
      supabase.from("notes").select("id, created_at, summary, category, detected_date, remind_at, tags, content").order("created_at", { ascending: false }).limit(10),
      supabase.from("chat_answers").select("created_at, question, answer").order("created_at", { ascending: false }).limit(10),
      supabase.from("user_categories").select("name").limit(30),
    ]);
    if (!notes?.length) return { answer: trL(L, "아직 고칠 메모가 없어요. 먼저 뭐든 던져 주세요 📂"), noteIds: [] as string[] };
    // 경량 맥락: 최근 10턴 (메모 메타데이터 + 사용자 발화)만
    const turns = [
      ...notes.map((n) => ({ at: n.created_at, type: "memo", id: n.id, said: n.content.slice(0, 80), summary: n.summary, category: n.category, date: n.detected_date, remind_at: n.remind_at, tags: n.tags })),
      ...(answers ?? []).map((a) => ({ at: a.created_at, type: "chat", said: a.question.slice(0, 80), reply: a.answer.slice(0, 80) })),
    ].sort((x, y) => x.at.localeCompare(y.at)).slice(-10);
    const allowed = [...NOTE_CATEGORIES, ...(custom ?? []).map((c) => c.name)] as string[];
    const localNow = new Date(Date.now() - data.tzOffsetMin * 60000).toISOString().slice(0, 16);
    const offH = -data.tzOffsetMin / 60;
    if (!getGeminiApiKey()) throw new Error("AI 설정이 없어요");
    const instructions = `너는 '톡비서'다. 최근 대화 흐름(오래된→최신)을 보고 사용자가 어떤 메모를 고치려는지 판단한다. 보통 가장 최근 메모를 가리킨다.
현재 현지 시각: ${localNow} (UTC${offH >= 0 ? "+" : ""}${offH}). 시각은 시간대 포함 ISO로.
JSON 하나만 출력: {"intent": "edit"|"chat", "note_id": 수정할 메모 id 또는 null, "changes": {"remind_at"?: ISO 또는 null(알림 끄기), "category"?: ${allowed.join("|")}, "summary"?: 새 요약, "tags_add"?: [], "tags_remove"?: []}, "reply": 한국어 1문장 다정한 확인(무엇을 어떻게 바꿨는지, 이모지 1개)}.
메모 수정과 무관한 잡담이면 intent "chat", reply는 "저는 톡비서예요~" 로 시작해 정리·검색·알림 수정을 돕는다고 짧게.` + aiLangRule(L);
    const text = await callGemini({
      instructions,
      input: `최근 대화(json):\n${JSON.stringify(turns)}\n\n사용자: ${data.message}`,
      maxOutputTokens: 500,
    });
    if (text === null) throw new Error("수정하다 문제가 생겼어요");
    const p = parseGeminiJson<{ intent?: unknown; note_id?: unknown; changes?: unknown; reply?: unknown }>(text) ?? {};
    const reply = typeof p.reply === "string" && p.reply.trim() ? p.reply.trim().slice(0, 200) : "";
    const target = notes.find((n) => n.id === p.note_id);
    if (p.intent !== "edit" || !target) {
      return { answer: reply || trL(L, "저는 톡비서예요~ 🧹 메모 정리·검색·알림 수정을 도와드릴게요!"), noteIds: [] as string[] };
    }
    const changes = sanitizeEdit(p.changes, target.tags, allowed);
    if (!Object.keys(changes).length) return { answer: trL(L, "어떤 부분을 고칠지 잘 모르겠어요. 예: \"알람은 화요일 오전 10시로\" 🙏"), noteIds: [target.id] };
    // 수정 후에는 다시 저장 확인(✔️/🗑️)을 받는다
    const { error } = await supabase.from("notes").update({ ...changes, confirmed: false }).eq("id", target.id);
    if (error) { console.error("edit update failed", error); throw new Error("수정하지 못했어요"); }
    return { answer: reply || trL(L, "말씀하신 대로 고쳐 두었어요 ✏️"), noteIds: [target.id] };
  });

/** 한 문장의 의도를 AI가 1회 판정 (정규식 땜질 대신). 실패 시 null → 클라이언트가 기존 규칙으로 대체. */
export const routeIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(4000), lastAnswer: z.string().max(400).nullable() }).parse(d))
  .handler(async ({ data }) => {
    if (!getGeminiApiKey()) return { intent: null as string | null };
    const instructions = `너는 메모 비서 앱 '톡비서'의 의도 분류기다. 사용자의 한마디를 아래 중 하나로 분류해 JSON {"intent": "..."}만 출력.
dump: 나중을 위해 남기는 기록·메모·일정·할일·생각·감상 (예: "오늘 날씨 추움", "다음주 수요일 동생 생일", "~라고 저장해줘", "우유 사기"). 애매하면 dump.
query: 이미 저장한 내 메모를 찾거나 개수·현황을 묻기 (예: "성수동 파스타집 어디였지?", "오늘 몇 개 던졌어?", "이 책 읽어봤어?", "그거 어떻게 됐지?" — 이/그/저것을 가리키는 질문은 항상 query)
edit: 직전/기존 메모의 알림·날짜·카테고리·태그·제목 수정 요청 (예: "알람은 화요일 10시로", "태그에 가족 추가")
web: 실시간 외부 정보 조회 요청 (예: "오늘 날씨 어때?", "환율 검색해줘")
create: 표·글·시·번역 등 창작 요청
clear: 채팅창/대화 기록을 비우거나 청소해 달라는 요청 (예: "채팅창 청소해줘", "대화 다 지워줘")
self: 톡비서 자신에 대한 질문 (이름·정체·기능)
chat: 인사·잡담·푸념·장난·역할놀이·호칭 요구 (예: "심심해", "나한테 형이라고 해봐", "오늘 뭐 먹을까?")`;
    const text = await callGemini({
      instructions,
      input: `${data.lastAnswer ? `직전 톡비서 말: ${data.lastAnswer}\n` : ""}json으로 분류할 사용자 말: ${data.text.slice(0, 600)}`,
      maxOutputTokens: 200,
    });
    const parsed = parseGeminiJson<{ intent?: unknown }>(text);
    const i = String(parsed?.intent ?? "");
    return { intent: ["dump", "query", "edit", "web", "create", "self", "chat", "clear"].includes(i) ? i : null };
  });

/**
 * 통합 비서: 텍스트 한마디를 최근 맥락과 함께 1회 판단 + 바로 실행.
 * create/update는 서버에서 즉시 DB 반영, query는 클라이언트가 전체 검색(askNotes)으로 이어감.
 */
export const agentTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(4000), tzOffsetMin: z.number().int().min(-840).max(840), lang: z.enum(LANGS).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const L: Lang = data.lang ?? "ko";
    const { supabase, userId } = context;
    const [{ data: notes }, { data: answers }, { data: custom }] = await Promise.all([
      supabase.from("notes").select("id, created_at, summary, category, detected_date, remind_at, tags, content").order("created_at", { ascending: false }).limit(10),
      supabase.from("chat_answers").select("created_at, question, answer").order("created_at", { ascending: false }).limit(6),
      supabase.from("user_categories").select("name, hint").limit(30),
    ]);
    const extra = (custom ?? []).map((c) => c.name);
    const allowed = [...NOTE_CATEGORIES, ...extra] as string[];
    const turns = [
      ...(notes ?? []).map((n) => ({ at: n.created_at, type: "memo", id: n.id, said: n.content.slice(0, 80), summary: n.summary, category: n.category, date: n.detected_date, remind_at: n.remind_at })),
      ...(answers ?? []).map((a) => ({ at: a.created_at, type: "chat", said: a.question.slice(0, 80), reply: a.answer.slice(0, 80) })),
    ].sort((x, y) => x.at.localeCompare(y.at)).slice(-10);
    const localNow = new Date(Date.now() - data.tzOffsetMin * 60000).toISOString().slice(0, 16);
    const offH = -data.tzOffsetMin / 60;
    const tz = `UTC${offH >= 0 ? "+" : ""}${offH}`;
    const customLine = extra.length ? `\n사용자 맞춤 카테고리(해당하면 우선): ${(custom ?? []).map((c) => (c.hint ? `${c.name}(${c.hint})` : c.name)).join(", ")}` : "";

    if (!getGeminiApiKey()) return { action: "fallback" as const, answer: "", noteIds: [] as string[] };
    const instructions = `너는 초간편 AI '톡비서'다. 사람 비서처럼 사용자의 말 전체 뜻과 최근 흐름(오래된→최신)을 함께 보고, 지금 무엇을 해야 하는지 스스로 판단해 바로 실행할 내용을 JSON 하나로 출력한다.
현재 현지 시각: ${localNow} (${tz}). 시각은 모두 시간대 포함 ISO 8601.
행동(action) 판단 원칙 — 단어가 아니라 '사용자가 원하는 결과'로 판단하라:
- create: 사용자가 새로운 사실·일정·할일·생각을 맡기는 것. 알림 시각을 함께 부탁해도(예: "~있으니 8시에 알려줘") 그 대상이 최근 메모에 없으면 새로 저장하는 것이다.
- update: 최근 메모 중 이미 있는 대상의 알림·날짜·카테고리·요약·태그를 바꾸라는 것. 대상 메모 id가 분명할 때만.
- query: 이미 저장해 둔 메모를 찾거나 개수·현황을 묻는 것 (최근 맥락에 없어도 전체 서류함에서 찾아야 하면 query).
- clear: 채팅창/대화 기록을 비워 달라는 것.
- chat: 저장할 가치가 없는 인사·잡담·감정 푸념·장난·역할놀이, 톡비서 자신에 대한 질문, 실시간 웹검색이나 창작(표·글·번역) 요청. 판단이 어렵게 모호하면 chat으로 짧게 되물어라.
출력 스키마:
{"action": "create"|"update"|"query"|"clear"|"chat",
 "note": (create일 때) {"summary": 40자 이내 핵심 요약, "category": ${allowed.join("|")}, "has_date": boolean, "detected_date": ISO|null, "remind_at": 사용자가 알림 시각을 말했으면 정확히 그 시각, 아니면 일정 전날 20:00 또는 당일 아침 08:00, 날짜 없으면 null, "remind_message": 1줄|null, "tags": 3~5개},
 "note_id": (update일 때) 대상 메모 id,
 "changes": (update일 때) {"remind_at"?: ISO|null, "category"?, "summary"?, "tags_add"?: [], "tags_remove"?: []},
 "reply": 한국어 1~2문장. 실제로 하는 행동과 정확히 일치하게(저장했으면 저장했다고, 되묻는 거면 질문으로). chat이면 "저는 톡비서예요~ 🧹"처럼 정리·검색·알림 같은 내 강점으로 안내 (웹검색·창작은 '서툴지만' 표현). 이모지 1개.}\n[톡비서 본분] 톡비서는 컨설턴트·기획자·창작자·만능 에이전트가 아니라 "정리·기록 비서"다. 가격 책정, 아이디어 제안, 전략, 맞춤형 에이전트 역할 등을 "잡아드릴게요/맞춰드릴게요"처럼 약속하지 마라. 대신 "그건 제 영역 밖이에요 😅 생각을 툭 던져주시면 아이디어 메모로 정리해 두고 나중에 바로 꺼내드릴게요"처럼 정리·보관·알림으로 담백하게 유도한다.
시간이 없는 일정은 12:00로 가정.${customLine}` + aiLangRule(L);
    const out = await callGemini({
      instructions,
      input: `최근 흐름(json):\n${JSON.stringify(turns)}\n\n사용자 말: ${data.text.slice(0, 1500)}`,
      maxOutputTokens: 700,
    });
    const p = parseGeminiJson<{ action?: unknown; note?: unknown; note_id?: unknown; changes?: unknown; reply?: unknown }>(out);
    if (!p) return { action: "fallback" as const, answer: "", noteIds: [] as string[] };
    const reply = typeof p.reply === "string" ? p.reply.trim().slice(0, 300) : "";
    let action = String(p.action ?? "");

    if (action === "update") {
      const target = (notes ?? []).find((n) => n.id === p.note_id);
      const changes = target ? sanitizeEdit(p.changes, target.tags, allowed) : {};
      if (target && Object.keys(changes).length) {
        const { error } = await supabase.from("notes").update({ ...changes, confirmed: false }).eq("id", target.id);
        if (error) { console.error("agent update failed", error); throw new Error("수정하지 못했어요"); }
        return { action: "update" as const, answer: reply || trL(L, "말씀하신 대로 고쳐 두었어요 ✏️"), noteIds: [target.id] };
      }
      action = "create"; // 안전망: 고칠 대상이 없으면 말로만 끝내지 않고 새로 저장
    }
    if (action === "create") {
      const n = (p.note && typeof p.note === "object" ? p.note : {}) as Record<string, unknown>;
      const a = normalizeAnalysis({ ...n, secretary_reply: reply }, data.text, data.tzOffsetMin, extra);
      const { error } = await supabase.from("notes").insert({ user_id: userId, kind: "text", content: data.text, confirmed: false, link_url: null, ...a });
      if (error) { console.error("agent insert failed", error); throw new Error("저장에 실패했어요"); }
      return { action: "create" as const, answer: "", noteIds: [] as string[] };
    }
    if (action === "query" || action === "clear") return { action, answer: "", noteIds: [] as string[] } as { action: "query" | "clear"; answer: string; noteIds: string[] };
    return { action: "chat" as const, answer: reply || trL(L, "저는 톡비서예요~ 🧹 메모 정리·검색·알림을 도와드릴게요!"), noteIds: [] as string[] };
  });
