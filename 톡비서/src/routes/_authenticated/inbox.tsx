import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Settings, X, Bell, CalendarDays, MessageCircle, Plus, Image as ImageIcon, Camera, Mic, Square, FileText, Check, Trash2, Pin, Copy, Pencil } from "lucide-react";
import { uploadBlockReason, sumUsage, type Usage } from "@/lib/storage-quota";
import { NoteMetaEditor, NotesCalendar, PlanBadge, SettingsSheet, useCustomCategories, usePrefs } from "@/components/inbox-extras";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { agentTurn, analyzeAndSaveNote, askNotes, editFromChat, routeIntent, transcribeVoice } from "@/lib/notes.functions";
import { OFFTOPIC_REPLY, offTopicKind, catEmoji, isChitchat, isEdit, isQuestion, isYes } from "@/lib/notes";
import { isSilenceHallucination } from "@/lib/voice-guard";
import { blobToDataUrl, compressToWebp } from "@/lib/image-compress";
import { blobToBase64, downloadFile, extractDocText } from "@/lib/doc-text";
import jungbiAvatar from "@/assets/jungbi-avatar.png";
import { deleteAccount } from "@/lib/account.functions";
import { t as tr, locale, getLang, useLang } from "@/lib/i18n";
import { requestNotificationPermission, useReminders } from "@/lib/reminders";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [
      { title: "나의 서류함 — 톡비서" },
      { name: "description", content: "던진 스샷과 메모를 AI 비서가 날짜·카테고리·요약 카드로 정리해 보여줍니다." },
      { property: "og:title", content: "톡비서 서류함" },
      { property: "og:description", content: "스샷·메모를 던지면 예쁜 카드로 정리돼요." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inbox,
});

type Note = Tables<"notes">;
type Answer = { id: string; q: string; answer: string; noteIds: string[]; at: string };
const LOADERS = ["비서가 서류함을 뒤지는 중... 📂", "스샷 속 글자를 읽는 중... 🔍", "날짜를 챙기는 중... 📅"];
const MAX_REC_SEC = 60;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(locale(), { month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(locale(), { hour: "numeric", minute: "2-digit" });

function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: true }).limit(500);
      if (error) throw error;
      const paths = data.flatMap((n) => [n.image_path, n.audio_path, n.file_path]).filter((p): p is string => !!p);
      const urls: Record<string, string> = {};
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("shots").createSignedUrls(paths, 3600);
        signed?.forEach((s) => { if (s.path && s.signedUrl) urls[s.path] = s.signedUrl; });
      }
      return { notes: data, urls };
    },
  });
}

const PinCtx = createContext<{ pins: string[]; toggle: (id: string) => void }>({ pins: [], toggle: () => {} });
const PIN_KEY = "jungbi.pins";
const CLEAR_KEY = "jungbi.chatClearedAt";
const MAX_PINS = 3;

function usePins() {
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => { try { setPins(JSON.parse(localStorage.getItem(PIN_KEY) ?? "[]")); } catch { /* ignore */ } }, []);
  const toggle = (id: string) => setPins((cur) => {
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur].slice(0, MAX_PINS);
    localStorage.setItem(PIN_KEY, JSON.stringify(next));
    return next;
  });
  return { pins, toggle };
}

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

function noteCopyText(n: Note) {
  return [n.summary, n.detected_date ? `📅 ${fmtDate(n.detected_date)}` : "", n.tags.length ? n.tags.map((t) => `#${t}`).join(" ") : "", n.link_url ?? ""].filter(Boolean).join("\n");
}

function PinnedBar({ notes }: { notes: Note[] }) {
  const { pins, toggle } = useContext(PinCtx);
  const [open, setOpen] = useState(false);
  const list = pins.map((id) => notes.find((n) => n.id === id)).filter((n): n is Note => !!n);
  if (!list.length) return null;
  const shown = open ? list : list.slice(0, 1);
  return (
    <div className="border-b border-border bg-card/95 px-3 py-1.5">
      {shown.map((n) => (
        <div key={n.id} className="flex items-center gap-2 py-1 text-xs text-foreground">
          <Pin className="size-3.5 shrink-0 text-primary-foreground fill-primary" />
          <button className="min-w-0 flex-1 truncate text-left font-medium" onClick={() => document.getElementById(`note-${n.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
            {catEmoji(n.category)} {n.summary}
          </button>
          <button aria-label={tr("고정 해제")} onClick={() => toggle(n.id)} className="rounded-full p-0.5 text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>
        </div>
      ))}
      {list.length > 1 && <button onClick={() => setOpen(!open)} className="w-full text-center text-[11px] text-muted-foreground">{open ? tr("접기 ▲") : tr("고정 {0}개 모두 보기 ▼", list.length)}</button>}
    </div>
  );
}

function CopyButton({ text, label = tr("복사") }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button aria-label={label} onClick={async () => { if (await copyText(text)) { setDone(true); setTimeout(() => setDone(false), 1500); } }}
      className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted">
      {done ? <><Check className="size-3" />{tr("복사됨")}</> : <><Copy className="size-3" />{label}</>}
    </button>
  );
}

const LOCAL_USER_ID = "00000000-0000-0000-0000-000000000001";

function Inbox() {
  const lang = useLang();
  const pinState = usePins();
  const nav = useNavigate();
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeAndSaveNote);
  const { data, isLoading } = useNotes();
  const { data: usage } = useQuery({
    queryKey: ["usage"],
    queryFn: async (): Promise<Usage> => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id ?? LOCAL_USER_ID;
      const { data: files } = await supabase.storage.from("shots").list(uid, { limit: 1000 });
      return sumUsage((files ?? []).map((f) => ({ name: f.name, size: Number((f.metadata as { size?: number } | null)?.size ?? 0) })));
    },
  });
  const quotaErr = (size: number) => { const r = uploadBlockReason(prefs.plan, user.created, usage?.total ?? 0, size); return r ? tr(r) : null; };
  const [view, setView] = useState<"stream" | "calendar">("stream");
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = usePrefs();
  useCustomCategories();
  const [user, setUser] = useState<{ email: string; created: string | null }>({ email: "local@talk-secretary", created: null });
  useEffect(() => {
    void supabase.auth.getUser().then(({ data: u }) =>
      setUser({ email: u.user?.email ?? "local@talk-secretary", created: u.user?.created_at ?? null }),
    );
  }, []);
  const [text, setText] = useState("");
  const [img, setImg] = useState<{ blob: Blob; preview: string } | null>(null);
  const [pending, setPending] = useState<{ text: string; preview: string | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loaderIdx, setLoaderIdx] = useState(0);
  const [menu, setMenu] = useState(false);
  const [rec, setRec] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const cancelRef = useRef(false);
  const recStartRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickBottomRef = useRef(true);

  const notes = useMemo(() => data?.notes ?? [], [data]);
  const savedNotes = useMemo(() => notes.filter((n) => n.confirmed), [notes]);
  const { activeAlarms, dismissAlarm } = useReminders(savedNotes, prefs.alarm, async (noteId) => {
    await supabase.from("notes").update({ reminded: true }).eq("id", noteId);
    await qc.invalidateQueries({ queryKey: ["notes"] });
  });
  const ask = useServerFn(askNotes);
  const edit = useServerFn(editFromChat);
  const route = useServerFn(routeIntent);
  const agent = useServerFn(agentTurn);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  useEffect(() => {
    const reset = () => { dragDepth.current = 0; setDragging(false); };
    window.addEventListener("dragend", reset);
    window.addEventListener("drop", reset);
    return () => { window.removeEventListener("dragend", reset); window.removeEventListener("drop", reset); };
  }, []);
  const { data: answerRows } = useQuery({
    queryKey: ["chat_answers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_answers").select("*").order("created_at", { ascending: true }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const answers = useMemo<Answer[]>(
    () => (answerRows ?? []).map((r) => ({ id: r.id, q: r.question, answer: r.answer, noteIds: r.note_ids, at: r.created_at })),
    [answerRows],
  );
  const [clearedAt, setClearedAt] = useState<string>("");
  useEffect(() => { try { setClearedAt(localStorage.getItem(CLEAR_KEY) ?? ""); } catch { /* ignore */ } }, []);
  const stream = useMemo(() => {
    const items: ({ t: "note"; at: string; n: Note } | { t: "ans"; at: string; a: Answer })[] = [
      ...notes.map((n) => ({ t: "note" as const, at: n.created_at, n })),
      ...answers.map((a) => ({ t: "ans" as const, at: a.at, a })),
    ];
    return items.filter((x) => !clearedAt || x.at > clearedAt).sort((x, y) => x.at.localeCompare(y.at));
  }, [notes, answers, clearedAt]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior });
  };
  useEffect(() => {
    stickBottomRef.current = true;
    scrollToBottom("smooth");
  }, [notes.length, answers.length, pending]);
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setLoaderIdx((i) => (i + 1) % LOADERS.length), 1400);
    return () => clearInterval(t);
  }, [pending]);

  // 다른 앱의 [공유] → 톡비서로 들어온 링크/텍스트를 자동으로 던지기
  const sharedHandled = useRef(false);
  useEffect(() => {
    if (sharedHandled.current) return;
    const p = new URLSearchParams(window.location.search);
    const parts = [p.get("shared_title"), p.get("shared_text"), p.get("shared_url")]
      .map((s) => (s ?? "").trim()).filter(Boolean);
    if (!parts.length) return;
    sharedHandled.current = true;
    const shared = parts.filter((s, i) => !parts.some((o, j) => j !== i && o.includes(s) && (o.length > s.length || j < i))).join("\n");
    window.history.replaceState(null, "", window.location.pathname);
    void send({ text: shared });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function attach(file: Blob) {
    try {
      const blob = await compressToWebp(file);
      setImg({ blob, preview: URL.createObjectURL(blob) });
    } catch { setErr(tr("이미지를 읽지 못했어요")); }
  }

  function onPaste(e: React.ClipboardEvent) {
    const file = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"))?.getAsFile();
    if (file) { e.preventDefault(); void attach(file); }
  }

  async function confirmNote(id: string) {
    const { error } = await supabase.from("notes").update({ confirmed: true }).eq("id", id);
    if (error) { setErr(tr("저장하지 못했어요")); return; }
    await qc.invalidateQueries({ queryKey: ["notes"] });
  }

  async function updateNote(id: string, patch: { category: string; tags: string[] }) {
    const { error } = await supabase.from("notes").update({ category: patch.category, tags: patch.tags, confirmed: true }).eq("id", id);
    if (error) { setErr(tr("저장하지 못했어요")); return; }
    await qc.invalidateQueries({ queryKey: ["notes"] });
  }

  async function discardNote(n: Note) {
    const files = [n.image_path, n.audio_path, n.file_path].filter((p): p is string => !!p);
    if (files.length) await supabase.storage.from("shots").remove(files);
    const { error } = await supabase.from("notes").delete().eq("id", n.id);
    if (error) { setErr(tr("지우지 못했어요")); return; }
    // 내 요청은 그대로 남기고, 톡비서 말풍선만 "삭제된 메모예요"로 바꿔 둔다
    const q = n.content?.trim() || (n.image_path ? tr("📸 스샷") : n.audio_path ? tr("🎙️ 음성 메모") : n.file_name ? `📄 ${n.file_name}` : tr("메모"));
    await supabase.from("chat_answers").insert({ question: q, answer: tr("🗑️ 삭제된 메모예요"), note_ids: [], created_at: n.created_at });
    await qc.invalidateQueries({ queryKey: ["notes"] });
    await qc.invalidateQueries({ queryKey: ["chat_answers"] });
    await qc.invalidateQueries({ queryKey: ["usage"] });
  }

  const [clearAsk, setClearAsk] = useState<string | null>(null);
  async function clearChat() {
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user.id;
    if (!uid) return;
    // 채팅창 청소: 메모·캘린더 기록은 보존하고 화면에서만 지움
    await supabase.from("notes").update({ confirmed: true }).eq("user_id", uid).eq("confirmed", false);
    const a = await supabase.from("chat_answers").delete().eq("user_id", uid);
    if (a.error) { setErr(tr("채팅창을 비우지 못했어요")); return; }
    try { localStorage.setItem(CLEAR_KEY, new Date().toISOString()); localStorage.removeItem(PIN_KEY); } catch { /* ignore */ }
    window.location.reload();
  }

  async function send(opts?: { text: string; kind?: "voice"; audioPath?: string; filePath?: string; fileName?: string }) {
    const t = (opts?.text ?? text).trim();
    const current = opts ? null : img;
    if (!t && !current) return;
    if (pending && !opts) return;
    setErr(null);
    if (prefs.alarm) requestNotificationPermission();
    if (clearAsk && !opts && !current) {
      setText("");
      if (isYes(t)) { setClearAsk(null); await clearChat(); return; }
      setClearAsk(null);
      if (/^(아니|아뇨|취소|됐어|안\s?해|싫어|노|no\b|nope|cancel|いいえ|やめ|キャンセル)/i.test(t)) return;
    }
    // 확인 없이 다음 대화를 이어가면 대기 중인 메모는 자동 저장
    if (!opts && !(t && isYes(t))) {
      const waitingIds = notes.filter((n) => !n.confirmed).map((n) => n.id);
      if (waitingIds.length) {
        void supabase.from("notes").update({ confirmed: true }).in("id", waitingIds)
          .then(() => qc.invalidateQueries({ queryKey: ["notes"] }));
      }
    }
    if (!opts && !current) {
      const waiting = [...notes].reverse().find((n) => !n.confirmed);
      if (waiting && isYes(t)) { setText(""); await confirmNote(waiting.id); return; }
      // 의도는 AI가 한 번에 판정 (주소만 던진 건 바로 저장). AI 실패 시에만 예전 규칙으로 대체.
      // 링크가 담긴 말은 미리보기 분석기로 직행, 그 외 텍스트는 통합 비서가 판단+실행을 한 번에
      let intent: string | null = /https?:\/\/\S+/.test(t) ? "dump" : null;
      if (!intent) {
        setPending({ text: t, preview: null }); setText(""); setView("stream");
        try {
          const r = await agent({ data: { text: t, tzOffsetMin: new Date().getTimezoneOffset(), lang } });
          if (r.action === "create" || r.action === "update") {
            await qc.invalidateQueries({ queryKey: ["notes"] });
            await qc.invalidateQueries({ queryKey: ["usage"] });
            if (r.action === "update") {
              await supabase.from("chat_answers").insert({ question: t, answer: r.answer, note_ids: r.noteIds });
              await qc.invalidateQueries({ queryKey: ["chat_answers"] });
            }
            setPending(null); return;
          }
          if (r.action === "chat") {
            await supabase.from("chat_answers").insert({ question: t, answer: r.answer, note_ids: [] });
            await qc.invalidateQueries({ queryKey: ["chat_answers"] });
            setPending(null); return;
          }
          intent = r.action === "fallback" ? null : r.action;
        } catch { intent = null; }
        if (!intent) {
          try { intent = (await route({ data: { text: t, lastAnswer: answers.at(-1)?.answer.slice(0, 400) ?? null } })).intent; } catch { intent = null; }
        }
        setPending(null);
        if (!intent && /(채팅|대화)(창|방|\s?기록|\s?내용)?\s*(을|를)?\s*(다\s?|모두\s?|전부\s?)?(청소|비워|비우|지워|초기화|정리)/.test(t)) intent = "clear";
        if (!intent) intent = isChitchat(t) ? offTopicKind(t) : isEdit(t) && !isQuestion(t) ? "edit" : isQuestion(t) ? "query" : "dump";
      }
      if (intent === "clear") { setText(""); setView("stream"); setClearAsk(t); return; }
      if (intent === "web" || intent === "create" || intent === "chat" || intent === "self") {
        setText(""); setView("stream");
        await supabase.from("chat_answers").insert({ question: t, answer: tr(OFFTOPIC_REPLY[intent]), note_ids: [] });
        await qc.invalidateQueries({ queryKey: ["chat_answers"] });
        return;
      }
      const editing = intent === "edit";
      if (editing || intent === "query") {
        setText(""); setView("stream");
        setPending({ text: t, preview: null });
        try {
          const tz = new Date().getTimezoneOffset();
          const r = editing ? await edit({ data: { message: t, tzOffsetMin: tz, lang } }) : await ask({ data: { question: t, tzOffsetMin: tz, lang } });
          if (editing) await qc.invalidateQueries({ queryKey: ["notes"] });
          const { error: saveErr } = await supabase.from("chat_answers").insert({ question: t, answer: r.answer, note_ids: r.noteIds });
          if (saveErr) console.error("chat_answers insert failed", saveErr);
          await qc.invalidateQueries({ queryKey: ["chat_answers"] });
        } catch { setErr(tr("찾다가 문제가 생겼어요. 다시 물어봐 주세요 🙏")); setText(t); }
        finally { setPending(null); }
        return;
      }
    }
    if (current) { const q = quotaErr(current.blob.size); if (q) { setErr(q); return; } }
    setPending({ text: t, preview: current?.preview ?? null });
    setText(""); setImg(null); setMenu(false); setView("stream");
    try {
      let imagePath: string | null = null;
      let uploadPromise: Promise<void> | null = null;
      let imageDataUrl: string | null = null;
      if (current) {
        const { data: s } = await supabase.auth.getSession();
        imagePath = `${s.session?.user.id ?? LOCAL_USER_ID}/${crypto.randomUUID()}.webp`;
        uploadPromise = supabase.storage
          .from("shots")
          .upload(imagePath, current.blob, { contentType: "image/webp" })
          .then((up) => { if (up.error) throw up.error; });
        imageDataUrl = await blobToDataUrl(current.blob);
      }
      await Promise.all([
        uploadPromise,
        analyze({ data: { text: t, imagePath, imageDataUrl, audioPath: opts?.audioPath ?? null, filePath: opts?.filePath ?? null, fileName: opts?.fileName ?? null, kind: opts?.kind, tzOffsetMin: new Date().getTimezoneOffset(), lang } }),
      ]);
      await qc.invalidateQueries({ queryKey: ["notes"] });
      await qc.invalidateQueries({ queryKey: ["usage"] });
    } catch (e) {
      console.error(e);
      setErr(tr("앗, 정리하다 문제가 생겼어요. 다시 던져 주세요 🙏"));
      if (!opts) setText(t);
    } finally {
      setPending(null);
    }
  }

  async function onDocFile(f: File) {
    setMenu(false);
    try {
      if (f.type.startsWith("image/")) { await attach(f); return; }
      const q = quotaErr(f.size);
      if (q) { setErr(q); return; }
      const doc = await extractDocText(f);
      const { data: s } = await supabase.auth.getSession();
      const ext = (f.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      const filePath = `${s.session?.user.id ?? LOCAL_USER_ID}/doc-${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("shots").upload(filePath, f, { contentType: f.type || "application/octet-stream" });
      if (up.error) { setErr(tr("원본 파일을 보관하지 못했어요")); return; }
      if (!doc.readable) setErr(tr("본문 글자를 읽을 수 없는 파일이라 원본 파일만 안전하게 보관했어요 📄"));
      const text = doc.readable ? doc.text : `📄 ${f.name}\n${tr("내용을 읽을 수 없는 파일 형식이라 원본 파일만 보관했어요.")}`;
      await send({ text, filePath, fileName: f.name });
    } catch { setErr(tr("문서를 읽지 못했어요")); }
  }

  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRef = useRef<any>(null);
  function toggleDictation() {
    if (listening) { speechRef.current?.stop(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { setErr(tr("이 브라우저는 말로 입력을 지원하지 않아요. ➕ 메뉴의 음성 녹음을 써 주세요")); return; }
    const r = new SR();
    r.lang = locale(); r.interimResults = true; r.continuous = true;
    const base = text ? text.trimEnd() + " " : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      setText(base + s);
    };
    r.onerror = (e: { error?: string }) => { if (e.error === "not-allowed") setErr(tr("마이크 권한을 허용해 주세요 🎙️")); };
    r.onend = () => { setListening(false); speechRef.current = null; };
    speechRef.current = r;
    setErr(null); setListening(true);
    r.start();
  }

  async function startRecording() {
    setMenu(false);
    if (rec) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const r = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 });
      chunksRef.current = [];
      cancelRef.current = false;
      r.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelRef.current) void finishRecording(r.mimeType || "audio/webm");
      };
      recRef.current = r;
      recStartRef.current = Date.now();
      r.start();
      setRec(true); setRecSec(0);
      timerRef.current = setInterval(() => {
        setRecSec((s) => {
          const n = s + 1;
          if (n >= MAX_REC_SEC) setTimeout(() => stopRecording(), 0);
          return Math.min(n, MAX_REC_SEC);
        });
      }, 1000);
    } catch { setErr(tr("마이크 권한을 허용해 주세요 🎙️")); }
  }

  function stopRecording(cancel = false) {
    if (!recRef.current) return;
    cancelRef.current = cancel;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRec(false);
    recRef.current.stop();
    recRef.current = null;
  }

  async function finishRecording(mime: string) {
    const type = mime.split(";")[0] || "audio/webm";
    const blob = new Blob(chunksRef.current, { type });
    if (blob.size < 1200) { setErr(tr("녹음이 너무 짧아요. 다시 시도해 주세요")); return; }
    const q = quotaErr(blob.size);
    if (q) { setErr(q); return; }
    setErr(null);
    setPending({ text: tr("🎙️ 음성 메모 듣는 중..."), preview: null });
    try {
      const { data: s } = await supabase.auth.getSession();
      const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
      const audioPath = `${s.session?.user.id ?? LOCAL_USER_ID}/voice-${crypto.randomUUID()}.${ext}`;
      const [up, trn] = await Promise.all([
        supabase.storage.from("shots").upload(audioPath, blob, { contentType: type }),
        blobToBase64(blob).then((audioBase64) => transcribeVoice({ data: { audioBase64, mimeType: type, lang: getLang() } })),
      ]);
      if (up.error) throw up.error;
      const said = trn.text?.trim() ?? "";
      const durSec = recStartRef.current ? (Date.now() - recStartRef.current) / 1000 : 99;
      if (!said || durSec < 1.5 || isSilenceHallucination(said)) {
        await supabase.storage.from("shots").remove([audioPath]);
        setErr(tr("녹음된 말이 없어요 🎙️ 다시 말씀해 주세요"));
        return;
      }
      await send({ text: said, kind: "voice", audioPath });
    } catch (e) {
      console.error(e);
      setErr(tr("음성 메모를 정리하지 못했어요. 다시 시도해 주세요"));
    } finally {
      setPending(null);
    }
  }

  function onDropFiles(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (f.type.startsWith("image/")) void attach(f);
    else void onDocFile(f);
  }

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col bg-background"
      onDragEnter={(e) => { if (e.dataTransfer.types.includes("Files")) { dragDepth.current += 1; setDragging(true); } }}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
      onDragLeave={() => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (dragDepth.current === 0) setDragging(false); }}
      onDrop={(e) => { dragDepth.current = 0; onDropFiles(e); }}>
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-50 rounded-2xl ring-2 ring-inset ring-primary/60">
          <div className="absolute inset-x-0 bottom-24 flex justify-center">
            <div className="rounded-full border border-dashed border-primary bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-md">
              {tr("📂 여기에 놓으면 바로 정리해요")}
            </div>
          </div>
        </div>
      )}
      <PinCtx.Provider value={pinState}>
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={jungbiAvatar} alt={tr("톡비서")} width={36} height={36} className="size-9 rounded-2xl bg-primary object-cover" />
            <h1 className="flex items-center gap-1.5 text-sm font-bold text-foreground">{tr("톡비서")}<PlanBadge plan={prefs.plan} /></h1>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex rounded-full bg-muted p-0.5">
              <button onClick={() => setView("stream")} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${view === "stream" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><MessageCircle className="size-3.5" />{tr("채팅")}</button>
              <button onClick={() => setView("calendar")} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${view === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><CalendarDays className="size-3.5" />{tr("캘린더")}</button>
            </div>
            <button aria-label={tr("설정")} onClick={() => setShowSettings(true)} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
              <Settings className="size-4" />
            </button>
          </div>
        </div>
      </header>
      {activeAlarms.length > 0 && (
        <div className="space-y-1.5 border-b border-border bg-primary/15 px-3 py-2">
          {activeAlarms.map((alarm) => (
            <div key={alarm.id} className="flex items-start gap-2.5 rounded-xl bg-card px-3 py-2.5 shadow-sm ring-1 ring-primary/40">
              <Bell className="mt-0.5 size-4 shrink-0 animate-bounce text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">{tr("톡비서 알림 ⏰")}</p>
                <p className="text-xs text-foreground">{alarm.remind_message || alarm.summary}</p>
              </div>
              <button
                aria-label={tr("알림 닫기")}
                onClick={() => dismissAlarm(alarm.id)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {view === "stream" && <PinnedBar notes={savedNotes} />}

      {view === "calendar" ? <NotesCalendar notes={savedNotes} urls={data?.urls ?? {}} onUpdate={(id, p) => void updateNote(id, p)} onDelete={(n) => void discardNote(n)} /> : <main
        onScroll={(e) => {
          const el = e.currentTarget;
          stickBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
        onLoadCapture={() => {
          if (stickBottomRef.current) scrollToBottom("auto");
        }}
        className="flex-1 space-y-4 overflow-y-auto bg-chat px-3 py-4">
        {isLoading && <p className="text-center text-xs text-muted-foreground">{tr("서류함 여는 중...")}</p>}
        {!isLoading && notes.length === 0 && !pending && (
          <div className="mx-auto mt-10 max-w-xs rounded-2xl bg-card/80 p-5 text-center text-sm text-foreground shadow-sm">
            <p className="text-2xl">📂</p>
            <p className="mt-2 font-semibold">{tr("아직 비어 있어요")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{tr("스크린샷, 메모, 링크를 그냥 던져 주세요. 날짜가 있으면 제가 미리 챙겨 드릴게요.")}</p>
          </div>
        )}
        {(() => {
          // 각 메모의 확인 버튼은 그 메모를 가리킨 "가장 마지막" 말풍선에만 표시
          const lastRef: Record<string, string> = {};
          for (const it of stream) {
            if (it.t === "note") lastRef[it.n.id] = `n:${it.n.id}`;
            else for (const id of it.a.noteIds) lastRef[id] = `a:${it.a.id}`;
          }
          return stream.map((it) => it.t === "note"
            ? <NoteThread key={it.n.id} note={lastRef[it.n.id] === `n:${it.n.id}` ? it.n : { ...it.n, confirmed: true }} imageUrl={it.n.image_path ? data?.urls[it.n.image_path] : undefined} audioUrl={it.n.audio_path ? data?.urls[it.n.audio_path] : undefined} fileUrl={it.n.file_path ? data?.urls[it.n.file_path] : undefined} onConfirm={() => void confirmNote(it.n.id)} onDiscard={() => void discardNote(it.n)} onUpdate={(p) => void updateNote(it.n.id, p)} />
            : <AnswerThread key={it.a.id} a={it.a} notes={notes.filter((n) => it.a.noteIds.includes(n.id) && lastRef[n.id] === `a:${it.a.id}` ? true : it.a.noteIds.includes(n.id)).sort((x, y) => it.a.noteIds.indexOf(x.id) - it.a.noteIds.indexOf(y.id))} urls={data?.urls ?? {}}
                showConfirm={it.a.noteIds.some((id) => lastRef[id] === `a:${it.a.id}`)} onConfirm={(n) => void confirmNote(n.id)} onDiscard={(n) => void discardNote(n)} onUpdate={(n, p) => void updateNote(n.id, p)} />);
        })()}
        {clearAsk && (
          <>
            <UserBubble text={clearAsk} />
            <div className="flex items-end gap-2">
              <Avatar />
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm">
                <span>{tr("채팅창을 지금 모두 비울까요?")} <span className="block text-[11px] text-muted-foreground">{tr("저장된 메모와 캘린더는 그대로 남아요 🍃")}</span></span>
                <button aria-label={tr("비우기")} onClick={() => { setClearAsk(null); void clearChat(); }} className="rounded-full bg-primary p-1.5 text-primary-foreground"><Check className="size-4" /></button>
                <button aria-label={tr("취소")} onClick={() => setClearAsk(null)} className="rounded-full bg-muted p-1.5 text-muted-foreground"><X className="size-4" /></button>
              </div>
            </div>
          </>
        )}
        {pending && (
          <>
            <UserBubble text={pending.text} imageUrl={pending.preview ?? undefined} />
            <div className="flex items-end gap-2">
              <Avatar />
              <div className="animate-pulse rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5 text-sm text-muted-foreground shadow-sm">{tr(LOADERS[loaderIdx]!)}</div>
            </div>
          </>
        )}
        <div ref={endRef} />
      </main>}
      </PinCtx.Provider>
      {showSettings && <SettingsSheet usage={usage} email={user.email} joinedAt={user.created} prefs={prefs} setPrefs={setPrefs} onClose={() => setShowSettings(false)} onLogout={async () => { await supabase.auth.signOut(); nav({ to: "/login" }); }}
        onDeleteAccount={async () => {
          await deleteAccount();
          Object.keys(localStorage).filter((k) => k.startsWith("jungbi.")).forEach((k) => localStorage.removeItem(k));
          await supabase.auth.signOut().catch(() => {});
          nav({ to: "/login" });
        }} />}

      <div className="border-t border-border bg-card px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {err && <p className="mb-1.5 text-xs text-destructive">{err}</p>}
        {img && (
          <div className="relative mb-2 inline-block">
            <img src={img.preview} alt={tr("첨부 미리보기")} className="h-20 rounded-lg object-cover" />
            <button aria-label={tr("첨부 취소")} onClick={() => setImg(null)} className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background">
              <X className="size-3" />
            </button>
          </div>
        )}
        {rec && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            <span className="size-2 animate-pulse rounded-full bg-destructive" />
            <span>{tr("녹음 중")} {Math.floor(recSec / 60)}:{String(recSec % 60).padStart(2, "0")} / 1:00</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-destructive/20">
              <div className="h-full bg-destructive transition-all" style={{ width: `${(recSec / MAX_REC_SEC) * 100}%` }} />
            </div>
            <button onClick={() => stopRecording(true)} className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"><X className="size-3" />{tr("취소")}</button>
            <button onClick={() => stopRecording()} className="flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
              <Square className="size-3" />{tr("완료")}
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="relative flex items-end">
            <button aria-label={tr("첨부 메뉴")} onClick={() => setMenu((m) => !m)} className="rounded-full p-2.5 text-muted-foreground hover:bg-muted">
              <Plus className={`size-5 transition-transform ${menu ? "rotate-45" : ""}`} />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute bottom-12 left-0 z-50 w-52 overflow-hidden rounded-2xl border border-border bg-card py-1 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                  {[
                    { icon: <ImageIcon className="size-4" />, label: tr("스샷 첨부"), act: () => { setMenu(false); fileRef.current?.click(); } },
                    { icon: <Camera className="size-4" />, label: tr("사진 촬영"), act: () => { setMenu(false); cameraRef.current?.click(); } },
                    { icon: <Mic className="size-4" />, label: tr("음성 녹음"), act: startRecording },
                    { icon: <FileText className="size-4" />, label: tr("파일 첨부 · 문서·모든 파일"), act: () => { setMenu(false); docRef.current?.click(); } },
                  ].map((o) => (
                    <button key={o.label} onClick={o.act} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted">
                      {o.icon}{o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void attach(f); e.target.value = ""; }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void attach(f); e.target.value = ""; }} />
          <input ref={docRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onDocFile(f); e.target.value = ""; }} />
          <textarea value={text} onChange={(e) => setText(e.target.value)} onPaste={onPaste} rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}
            placeholder={tr("메모, 링크, 스샷을 던져 주세요 (붙여넣기 가능)")}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          {rec ? (
            <button aria-label={tr("녹음 취소")} onClick={() => stopRecording(true)}
              className="rounded-full bg-muted p-2.5 text-muted-foreground">
              <X className="size-5" />
            </button>
          ) : (listening || (!text.trim() && !img)) ? (
            <button aria-label={listening ? tr("받아쓰기 끝내기") : tr("말로 입력하기")} onClick={toggleDictation} disabled={!!pending}
              className={`rounded-full p-2.5 text-primary-foreground disabled:opacity-40 ${listening ? "bg-destructive animate-pulse" : "bg-primary"}`}>
              {listening ? <Square className="size-5" /> : <Mic className="size-5" />}
            </button>
          ) : (
            <button aria-label={tr("보내기")} onClick={() => void send()} disabled={!!pending}
              className="rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-40">
              <ArrowUp className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar() {
  return <img src={jungbiAvatar} alt={tr("톡비서")} width={32} height={32} loading="lazy" className="size-8 shrink-0 rounded-xl bg-primary object-cover" />;
}

function UserBubble({ text, imageUrl, fileUrl, origName }: { text: string; imageUrl?: string | undefined; fileUrl?: string | undefined; origName?: string | null }) {
  const [open, setOpen] = useState(false);
  const isDoc = text.startsWith("📄 ");
  const nl = text.indexOf("\n");
  const fileName = isDoc ? (nl > 0 ? text.slice(2, nl) : text.slice(2)).trim() : "";
  const body = isDoc ? (nl > 0 ? text.slice(nl + 1) : "") : text;
  const long = body.length > 300 || body.split("\n").length > 8;
  return (
    <div className="flex flex-col items-end gap-1">
      {imageUrl && <img src={imageUrl} alt={tr("보낸 스크린샷")} className="h-auto max-h-64 w-auto max-w-[70%] rounded-2xl object-contain shadow-sm" />}
      {isDoc ? (
        <div className="w-64 max-w-[78%] rounded-2xl rounded-tr-sm bg-bubble px-3.5 py-2.5 text-sm text-bubble-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{fileName}</p>
              <p className="text-[11px] opacity-70">{tr("문서 · {0}자", body.length.toLocaleString())}</p>
            </div>
          </div>
          {body && (
            <>
              {open && <p className="mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap break-words border-t border-current/10 pt-2 text-xs opacity-80">{body}</p>}
              <div className="mt-1.5 flex items-center justify-between">
                <button onClick={() => setOpen(!open)} className="text-[11px] font-medium underline opacity-70">{open ? tr("접기 ▲") : tr("내용 보기 ▼")}</button>
                {fileUrl && <button type="button" onClick={() => void downloadFile(fileUrl, origName)} className="text-[11px] font-semibold underline">{tr("📥 원본 받기")}</button>}
              </div>
            </>
          )}
        </div>
      ) : text && (
        <div className="max-w-[78%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-bubble px-3.5 py-2 text-sm text-bubble-foreground shadow-sm">
          <span className={long && !open ? "line-clamp-6" : ""}>{body}</span>
          {long && <button onClick={() => setOpen(!open)} className="mt-1 block text-[11px] font-medium underline opacity-70">{open ? tr("접기 ▲") : tr("... 더보기")}</button>}
        </div>
      )}
      {(isDoc ? body : text) && <CopyButton text={isDoc ? body : text} label={isDoc ? tr("원문 복사") : tr("복사")} />}
    </div>
  );
}

function LinkPreview({ note }: { note: Note }) {
  if (!note.link_url) return null;
  let host = note.link_url;
  try { host = new URL(note.link_url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
  return (
    <a href={note.link_url} target="_blank" rel="noreferrer" className="block overflow-hidden border-b border-border hover:bg-muted/50">
      {note.link_image && (
        <div className="relative">
          <img src={note.link_image} alt="" loading="lazy" className="h-36 w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          {/youtu\.?be/.test(host) && (
            <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-destructive text-lg text-primary-foreground shadow-lg">▶</span>
          )}
        </div>
      )}
      <div className="space-y-0.5 px-3.5 py-2">
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{note.link_title ?? host}</p>
        {note.link_description && <p className="line-clamp-2 text-xs text-muted-foreground">{note.link_description}</p>}
        <p className="text-[11px] text-muted-foreground">🔗 {host}</p>
      </div>
    </a>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{catEmoji(note.category)} {tr(note.category)}</span>
        <span className="text-[11px] text-muted-foreground">{fmtTime(note.created_at)}</span>
      </div>
      <LinkPreview note={note} />
      <div className="space-y-2 px-3.5 py-3">
        <p className="text-sm font-semibold leading-snug text-foreground">{note.summary}</p>
        {note.detected_date && (
          <p className="flex items-center gap-1.5 text-xs text-foreground"><CalendarDays className="size-3.5" />{fmtDate(note.detected_date)}</p>
        )}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">{note.tags.map((t) => <span key={t} className="text-xs text-muted-foreground">#{t}</span>)}</div>
        )}
      </div>
      {note.remind_at && (
        <div className="flex items-start gap-2 bg-primary/20 px-3.5 py-2 text-xs text-foreground">
          <Bell className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {note.reminded ? tr("✅ 알림을 전해드렸어요 ({0})", fmtDate(note.remind_at)) : tr("⏰ {0}에 잊지 않게 챙겨드릴게요", fmtDate(note.remind_at))}
            {note.remind_message ? <><br /><span className="text-muted-foreground">“{note.remind_message}”</span></> : null}
          </span>
        </div>
      )}
      <NoteActions note={note} />
    </div>
  );
}

function NoteActions({ note }: { note: Note }) {
  const { pins, toggle } = useContext(PinCtx);
  const pinned = pins.includes(note.id);
  return (
    <div className="flex items-center justify-end gap-1 border-t border-border px-2 py-1">
      <CopyButton text={noteCopyText(note)} label={tr("요약 복사")} />
      <button aria-label={pinned ? tr("고정 해제") : tr("상단 고정")} onClick={() => toggle(note.id)}
        className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] hover:bg-muted ${pinned ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
        <Pin className={`size-3 ${pinned ? "fill-primary" : ""}`} />{pinned ? tr("고정됨") : tr("고정")}
      </button>
    </div>
  );
}

function NoteThread({ note, imageUrl, audioUrl, fileUrl, onConfirm, onDiscard, onUpdate }: { note: Note; imageUrl: string | undefined; audioUrl: string | undefined; fileUrl?: string | undefined; onConfirm: () => void; onDiscard: () => void; onUpdate: (patch: { category: string; tags: string[] }) => void }) {
  return (
    <div id={`note-${note.id}`} className="space-y-2 animate-in fade-in slide-in-from-bottom-1">
      {audioUrl && (
        <div className="flex justify-end">
          <div className="w-64 max-w-[78%] rounded-2xl rounded-tr-sm bg-bubble p-2 shadow-sm">
            <p className="mb-1 px-1 text-[11px] font-medium text-bubble-foreground">{tr("🎙️ 음성 메모")}</p>
            <audio controls preload="none" src={audioUrl} className="h-9 w-full" />
          </div>
        </div>
      )}
      <UserBubble text={note.content} imageUrl={imageUrl} fileUrl={fileUrl} origName={note.file_name} />
      <div className="flex items-start gap-2">
        <Avatar />
        <div className="max-w-[82%] space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">{tr("톡비서")}</p>
          <div className="rounded-2xl rounded-tl-sm bg-card px-3.5 py-2 text-sm text-foreground shadow-sm">{note.secretary_reply}</div>
          <NoteCard note={note} />
          {!note.confirmed && <ConfirmBar note={note} onConfirm={onConfirm} onDiscard={onDiscard} onUpdate={onUpdate} />}
        </div>
      </div>
    </div>
  );
}

function ConfirmBar({ note, onConfirm, onDiscard, onUpdate }: { note: Note; onConfirm: () => void; onDiscard: () => void; onUpdate: (patch: { category: string; tags: string[] }) => void }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <NoteMetaEditor
        initialCategory={note.category}
        initialTags={note.tags}
        onSave={(patch) => { onUpdate(patch); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-card px-3.5 py-2 text-sm text-foreground shadow-sm">
      <span className="flex-1">{tr("이대로 저장할까요?")} <span className="text-[11px] text-muted-foreground">{tr("(\"그래\"라고 답해도 돼요)")}</span></span>
      <button aria-label={tr("저장")} onClick={onConfirm} className="rounded-full bg-primary p-1.5 text-primary-foreground"><Check className="size-4" /></button>
      <button aria-label={tr("수정")} onClick={() => setEditing(true)} className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"><Pencil className="size-4" /></button>
      <button aria-label={tr("버리기")} onClick={onDiscard} className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
    </div>
  );
}

function AnswerThread({ a, notes, urls, showConfirm, onConfirm, onDiscard, onUpdate }: { a: Answer; notes: Note[]; urls: Record<string, string>; showConfirm: boolean; onConfirm: (n: Note) => void; onDiscard: (n: Note) => void; onUpdate: (n: Note, patch: { category: string; tags: string[] }) => void }) {
  // 먼저 답하고, 카드가 많으면 물어본 뒤 펼친다 (Ask-First)
  const countQ = /몇\s*(개|건|번|가지)|개수|총\s*몇|모두\s*몇|전부\s*몇|얼마나\s*(던|저장|메모|있)|how many|何件|いくつ|何個/i.test(a.q);
  const many = notes.length > 2 || (countQ && notes.length > 0);
  const [open, setOpen] = useState(false);
  const shown = !many ? notes : open ? notes : [];
  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1">
      <UserBubble text={a.q} />
      <div className="flex items-start gap-2">
        <Avatar />
        <div className="max-w-[82%] space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">{tr("톡비서 · 🔍 찾아봤어요")}</p>
          <div className="rounded-2xl rounded-tl-sm bg-card px-3.5 py-2 text-sm text-foreground shadow-sm">
            {a.answer}
            {many && !open && <p className="mt-1 text-xs text-muted-foreground">{tr("메모 {0}건, 모두 보여드릴까요?", notes.length)}</p>}
          </div>
          {many && (
            <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm">
              {open ? tr("▲ 목록 접기") : tr("📋 메모 {0}건 모두 보기", notes.length)}
            </button>
          )}
          {shown.map((n) => (
            <div key={n.id} className="space-y-1">
              {n.image_path && urls[n.image_path] && <img src={urls[n.image_path]} alt={tr("저장된 스크린샷")} className="h-auto max-h-48 w-auto max-w-full rounded-2xl object-contain shadow-sm" />}
              <NoteCard note={n} />
              {showConfirm && !n.confirmed && <ConfirmBar note={n} onConfirm={() => onConfirm(n)} onDiscard={() => onDiscard(n)} onUpdate={(p) => onUpdate(n, p)} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
