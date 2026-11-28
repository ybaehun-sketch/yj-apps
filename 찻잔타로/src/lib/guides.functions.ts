import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { isAdminEmail } from "./access";

const DEFAULT_SUPABASE_URL = "https://zgjpszhkiblaqyrukmey.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GR34C0DfqqMh3kZ6Cw1FAA_zG3aclhu";
const LEGACY_LOVABLE_PROJECT_ID = "gdngxtkwkxteiumlvagf";

function publicClient() {
  const rawUrl = process.env["SUPABASE_URL"];
  const rawKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const useDefault = !rawUrl || !rawKey || rawUrl.includes(LEGACY_LOVABLE_PROJECT_ID);
  const url = useDefault ? DEFAULT_SUPABASE_URL : rawUrl;
  const key = useDefault ? DEFAULT_SUPABASE_PUBLISHABLE_KEY : rawKey;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listGuides = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("guides").select("slug, title, description, created_at")
    .eq("published", true).order("created_at", { ascending: false }).limit(200);
  return data ?? [];
});

export const getGuide = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { data: g } = await publicClient()
      .from("guides").select("slug, title, description, body, created_at, updated_at")
      .eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!g) throw notFound();
    return g;
  });

function assertAdmin(claims: unknown) {
  if (!isAdminEmail((claims as Record<string, unknown> | undefined)?.["email"] as string | undefined))
    throw new Error("관리자만 이용할 수 있어요.");
}

export const adminListGuides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("guides").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

const guideInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "주소는 영어 소문자·숫자·하이픈만 써주세요."),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(300),
  body: z.string().min(1).max(50000),
  published: z.boolean(),
});

export const adminSaveGuide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => guideInput.parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = { slug: data.slug, title: data.title, description: data.description, body: data.body, published: data.published, updated_at: new Date().toISOString() };
    const q = data.id
      ? supabaseAdmin.from("guides").update(row).eq("id", data.id)
      : supabaseAdmin.from("guides").insert(row);
    const { error } = await q;
    if (error) throw new Error(error.code === "23505" ? "같은 주소의 글이 이미 있어요." : "저장하지 못했어요.");
    return { ok: true };
  });

export const adminDeleteGuide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("guides").delete().eq("id", data.id);
    return { ok: true };
  });

const draftInput = z.object({
  prompt: z.string().trim().min(1).max(8000),
  topic: z.string().trim().max(300).optional(),
});

/** AI가 기존 글 제목과 겹치지 않게 초안(제목·주소·요약·본문)을 채운다. 저장은 하지 않는다. */
export const adminDraftGuide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => draftInput.parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // 토큰 절약: 본문은 빼고 최근 글 제목·주소만 보낸다.
    const { data: rows } = await supabaseAdmin
      .from("guides").select("title, slug").order("created_at", { ascending: false }).limit(150);
    const existing = (rows ?? []).map((r) => `- ${r.title} (${r.slug})`).join("\n") || "(아직 없음)";
    const geminiKey = (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"])?.trim();
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!geminiKey && !apiKey) throw new Error("AI 키가 설정되어 있지 않아요.");
    const instructions = `${data.prompt}

[이미 올린 글 — 이 주제들과 겹치거나 비슷한 글은 절대 쓰지 마세요]
${existing}

[출력 규칙]
반드시 JSON 객체 하나만 출력하세요. 키: title(한국어 제목), slug(영어 소문자·숫자·하이픈만, 60자 이내, 위 목록과 다른 값), description(검색 결과용 한 줄 요약, 120자 안팎), body(마크다운 본문: ## 소제목, - 목록, **굵게**, 빈 줄로 문단 구분. 제목(#)은 본문에 넣지 마세요).`;
    const userPrompt = `${data.topic ? `오늘의 주제 힌트: ${data.topic}` : "아직 다루지 않은, 검색이 많을 만한 새 주제를 골라 써 주세요."}\n(반드시 지정된 JSON 형식으로만 답해 주세요.)`;
    let text = "";
    if (geminiKey) {
      for (const model of ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"]) {
        const gRes = await fetch(
          `https://tokbiseo-gemini-proxy.ybaehun.workers.dev/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: instructions }] },
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
              generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8000 },
            }),
          },
        ).catch(() => null);
        if (!gRes || !gRes.ok) continue;
        const gJson = (await gRes.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        text = (gJson.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        if (text) break;
      }
      if (!text) throw new Error("AI가 초안을 쓰지 못했어요. 잠시 후 다시 눌러 주세요.");
    } else {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-5.4-mini",
          instructions,
          reasoning: { effort: "low" },
          max_output_tokens: 8000,
          text: { format: { type: "json_object" } },
          input: [{ role: "user", content: userPrompt }],
        }),
      }).catch(() => null);
      if (!res || !res.ok) {
        if (res) console.error("draft error", res.status, (await res.text()).slice(0, 500));
        throw new Error("AI가 초안을 쓰지 못했어요. 잠시 후 다시 눌러 주세요.");
      }
      const json = (await res.json()) as { output?: { content?: { type: string; text?: string }[] }[] };
      text = (json.output ?? []).flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text).join("");
    }
    let p: Record<string, unknown>;
    try { p = JSON.parse(text); } catch { throw new Error("AI 답을 읽지 못했어요. 다시 눌러 주세요."); }
    const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string).trim() : "");
    return {
      title: s("title"),
      slug: s("slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120),
      description: s("description").slice(0, 300),
      body: s("body"),
    };
  });

const imageInput = z.object({
  base64: z.string().min(1).max(7_500_000),
  type: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});

/** 관리자가 고른 사진을 비공개 저장소에 올리고 글에 넣을 주소를 돌려준다. */
export const adminUploadGuideImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => imageInput.parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = data.type.split("/")[1] === "jpeg" ? "jpg" : data.type.split("/")[1];
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { error } = await supabaseAdmin.storage.from("guide-images").upload(name, bytes, { contentType: data.type });
    if (error) throw new Error("사진을 올리지 못했어요.");
    return { url: `/api/public/guide-image/${name}` };
  });
