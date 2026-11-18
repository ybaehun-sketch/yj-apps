import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { dailyLimitReason, uploadBlockReason, sumUsage, type Usage } from "@/lib/storage-quota";
import { NoteMetaEditor, NotesCalendar, PaymentModal, useCustomCategories, usePrefs } from "@/components/inbox-extras";
import { CategoryIcon } from "@/components/category-icon";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { agentTurn, analyzeAndSaveNote, askNotes, editFromChat, routeIntent, transcribeVoice } from "@/lib/notes.functions";
import { OFFTOPIC_REPLY, offTopicKind, isChitchat, isEdit, isQuestion, isYes } from "@/lib/notes";
import { isSilenceHallucination } from "@/lib/voice-guard";
import { blobToDataUrl, compressToWebp } from "@/lib/image-compress";
import { blobToBase64, compressFileForStorage, downloadFile, extractDocText } from "@/lib/doc-text";
import jungbiAvatar from "@/assets/jungbi-avatar.png";
import { deleteAccount } from "@/lib/account.functions";
import { t as tr, locale, getLang, useLang } from "@/lib/i18n";
import { requestNotificationPermission, useReminders } from "@/lib/reminders";
import { MaterialSymbol, IconButton } from "@/components/ui/material-symbol";
import { NavigationDrawer } from "@/components/navigation-drawer";
import { SplashScreen } from "@/components/splash-screen";
import { CategoryManagerModal } from "@/components/category-manager-modal";

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
const LOADERS = ["비서가 서류함을 뒤지는 중...", "스샷 속 글자를 읽는 중...", "날짜를 챙기는 중..."];
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
const ZoomCtx = createContext<(url: string) => void>(() => {});
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
  return [n.summary, n.detected_date ? fmtDate(n.detected_date) : "", n.tags.length ? n.tags.map((t) => `#${t}`).join(" ") : "", n.link_url ?? ""].filter(Boolean).join("\n");
}

function PinnedBar({ notes }: { notes: Note[] }) {
  const { pins, toggle } = useContext(PinCtx);
  const [open, setOpen] = useState(false);
  const list = pins.map((id) => notes.find((n) => n.id === id)).filter((n): n is Note => !!n);
  if (!list.length) return null;
  const shown = open ? list : list.slice(0, 1);
  return (
    <div className="border-b border-border/60 bg-muted/40 px-3.5 py-2 text-xs backdrop-blur-xs">
      {shown.map((n) => (
        <div key={n.id} className="flex items-center gap-2 py-1 text-sm text-foreground">
          <MaterialSymbol name="keep" size={17} weight={400} fill className="text-primary shrink-0" />
          <button
            type="button"
            className="inline-flex min-w-0 flex-1 items-center gap-1.5 truncate text-left font-semibold"
            onClick={() => document.getElementById(`note-${n.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            <CategoryIcon name={n.category} className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{n.summary}</span>
          </button>
          <IconButton ariaLabel={tr("고정 해제")} onClick={() => toggle(n.id)} className="h-7 w-7 min-h-[30px] min-w-[30px] text-muted-foreground">
            <MaterialSymbol name="close" size={16} weight={350} />
          </IconButton>
        </div>
      ))}
      {list.length > 1 && (
        <button type="button" onClick={() => setOpen(!open)} className="w-full pt-1 text-center text-[11px] font-medium text-muted-foreground hover:text-foreground">
          {open ? tr("접기 ▲") : tr("고정 {0}개 모두 보기 ▼", list.length)}
        </button>
      )}
    </div>
  );
}

function CopyButton({ text, label = tr("복사") }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => { if (await copyText(text)) { setDone(true); setTimeout(() => setDone(false), 1500); } }}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
    >
      <MaterialSymbol name={done ? "check" : "content_copy"} size={14} weight={350} />
      <span>{done ? tr("복사됨") : label}</span>
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
  const dailyErr = () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const ms = start.getTime();
    const todayCount = notes.filter((n) => Date.parse(n.created_at) >= ms).length + answers.filter((a) => Date.parse(a.at) >= ms).length;
    const r = dailyLimitReason(prefs.plan, todayCount);
    return r ? tr(r) : null;
  };

  const [view, setView] = useState<"stream" | "calendar">("stream");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const cancelRef = useRef(false);
  const recStartRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomImg) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomImg(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomImg]);

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
    const id = setInterval(() => setLoaderIdx((i) => (i + 1) % LOADERS.length), 1800);
    return () => clearInterval(id);
  }, [pending]);

  const [clipUrl, setClipUrl] = useState<string | null>(null);
  useEffect(() => {
    const checkClip = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        if (!navigator.clipboard?.readText) return;
        const txt = (await navigator.clipboard.readText()).trim();
        if (/^https?:\/\/[^\s]+$/.test(txt)) {
          const last = sessionStorage.getItem("jungbi.lastClip");
          if (last !== txt) setClipUrl(txt);
        }
      } catch { /* clipboard permission rejected */ }
    };
    void checkClip();
    const onVis = () => { if (document.visibilityState === "visible") void checkClip(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRef = useRef<any>(null);

  function toggleDictation() {
    if (listening) { speechRef.current?.stop(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { setErr(tr("이 브라우저는 말로 입력을 지원하지 않아요. + 메뉴의 음성 녹음을 써 주세요")); return; }
    const r = new SR();
    r.lang = locale(); r.interimResults = true; r.continuous = true;
    const base = text ? text.trimEnd() + " " : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      setText(base + s);
    };
    r.onerror = (e: { error?: string }) => { if (e.error === "not-allowed") setErr(tr("마이크 권한을 허용해 주세요")); };
    r.onend = () => { setListening(false); speechRef.current = null; };
    speechRef.current = r;
    setErr(null); setListening(true);
    r.start();
  }

  const attach = async (file: File) => {
    const q = quotaErr(file.size);
    if (q) { setErr(q); return; }
    try {
      const blob = await compressToWebp(file);
      const preview = await blobToDataUrl(blob);
      setImg({ blob, preview });
      setErr(null);
    } catch {
      setErr(tr("이미지를 불러오지 못했어요"));
    }
  };

  async function onDocFile(f: File) {
    setMenu(false);
    try {
      if (f.type.startsWith("image/")) { await attach(f); return; }
      const [packed, doc] = await Promise.all([compressFileForStorage(f), extractDocText(f)]);
      const q = quotaErr(packed.blob.size);
      if (q) { setErr(q); return; }
      const dErr = dailyErr();
      if (dErr) { setErr(dErr); return; }
      const { data: s } = await supabase.auth.getSession();
      const filePath = `${s.session?.user.id ?? LOCAL_USER_ID}/doc-${crypto.randomUUID()}.${packed.ext}`;
      const up = await supabase.storage.from("shots").upload(filePath, packed.blob, { contentType: packed.contentType });
      if (up.error) { setErr(tr("원본 파일을 보관하지 못했어요")); return; }
      if (!doc.readable) setErr(tr("본문 글자를 읽을 수 없는 파일이라 원본 파일만 안전하게 보관했어요"));
      const docText = doc.readable ? doc.text : `📄 ${f.name}\n${tr("내용을 읽을 수 없는 파일 형식이라 원본 파일만 보관했어요.")}`;
      await send({ text: docText, filePath, fileName: f.name });
    } catch { setErr(tr("문서를 읽지 못했어요")); }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      const f = item.getAsFile();
      if (f) { e.preventDefault(); void attach(f); }
    }
  };

  const [clearAsk, setClearAsk] = useState<string | null>(null);
  async function clearChat() {
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user.id;
    if (!uid) return;
    await supabase.from("notes").update({ confirmed: true }).eq("user_id", uid).eq("confirmed", false);
    const a = await supabase.from("chat_answers").delete().eq("user_id", uid);
    if (a.error) { setErr(tr("채팅창을 비우지 못했어요")); return; }
    try { localStorage.setItem(CLEAR_KEY, new Date().toISOString()); localStorage.removeItem(PIN_KEY); } catch { /* ignore */ }
    window.location.reload();
  }

  async function send(opts?: { text: string; image?: { blob: Blob; preview: string }; kind?: "voice"; audioPath?: string; filePath?: string; fileName?: string }) {
    const t = (opts?.text ?? text).trim();
    const current = opts?.image ?? (opts ? null : img);
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
        } catch { setErr(tr("찾다가 문제가 생겼어요. 다시 물어봐 주세요")); setText(t); }
        finally { setPending(null); }
        return;
      }
    }
    if (current) { const q = quotaErr(current.blob.size); if (q) { setErr(q); return; } }
    const dErr = dailyErr();
    if (dErr) { setErr(dErr); return; }
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
      setErr(tr("앗, 정리하다 문제가 생겼어요. 다시 던져 주세요"));
      if (!opts) setText(t);
    } finally {
      setPending(null);
    }
  }

  const confirmNote = async (id: string) => {
    await supabase.from("notes").update({ confirmed: true }).eq("id", id);
    await qc.invalidateQueries({ queryKey: ["notes"] });
    if (prefs.alarm) void requestNotificationPermission();
  };

  async function discardNote(n: Note) {
    const files = [n.image_path, n.audio_path, n.file_path].filter((p): p is string => !!p);
    if (files.length) await supabase.storage.from("shots").remove(files);
    const { error } = await supabase.from("notes").delete().eq("id", n.id);
    if (error) { setErr(tr("지우지 못했어요")); return; }
    const q = n.content?.trim() || (n.image_path ? tr("스샷") : n.audio_path ? tr("음성 메모") : n.file_name ? n.file_name : tr("메모"));
    await supabase.from("chat_answers").insert({ question: q, answer: tr("삭제된 메모예요"), note_ids: [], created_at: n.created_at });
    await qc.invalidateQueries({ queryKey: ["notes"] });
    await qc.invalidateQueries({ queryKey: ["chat_answers"] });
    await qc.invalidateQueries({ queryKey: ["usage"] });
  }

  const updateNote = async (id: string, patch: { category: string; tags: string[] }) => {
    await supabase.from("notes").update(patch).eq("id", id);
    await qc.invalidateQueries({ queryKey: ["notes"] });
  };

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
    } catch { setErr(tr("마이크 권한을 허용해 주세요")); }
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
    setPending({ text: tr("음성 메모 듣는 중..."), preview: null });
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
        setErr(tr("녹음된 말이 없어요. 다시 말씀해 주세요"));
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
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (f.type.startsWith("image/")) void attach(f);
    else void onDocFile(f);
  }

  // Left swipe gesture to open drawer from left screen edge
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleContainerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    touchStartXRef.current = e.touches[0].clientX - rect.left;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleContainerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = touchStartXRef.current;
    const diffX = (e.touches[0].clientX - rect.left) - startX;
    const diffY = Math.abs(e.touches[0].clientY - touchStartYRef.current);

    // Left screen edge swipe right to open
    if (startX < 36 && diffX > 45 && diffY < 60) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      setIsDrawerOpen(true);
    }
  };

  const handleContainerTouchEnd = () => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  return (
    <div className="flex min-h-dvh w-full justify-center bg-muted/40">
      <div
        onTouchStart={handleContainerTouchStart}
        onTouchMove={handleContainerTouchMove}
        onTouchEnd={handleContainerTouchEnd}
        className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background shadow-2xl md:border-x md:border-border/60"
        onDragEnter={(e) => { if (e.dataTransfer.types.includes("Files")) { dragDepth.current += 1; setDragging(true); } }}
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
        onDragLeave={() => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (dragDepth.current === 0) setDragging(false); }}
        onDrop={(e) => { dragDepth.current = 0; onDropFiles(e); }}
      >
      {/* 0.5초 스플래시 스크린 */}
      <SplashScreen duration={500} />

      {/* 파일 드래그 앤 드롭 표시 */}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-50 rounded-2xl ring-2 ring-inset ring-primary/60 backdrop-blur-xs">
          <div className="absolute inset-x-0 bottom-24 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-lg">
              <MaterialSymbol name="folder_open" size={18} weight={350} className="text-primary" />
              <span>{tr("여기에 놓으면 바로 정리해요")}</span>
            </div>
          </div>
        </div>
      )}

      {/* 좌측 슬라이드 서랍 (Navigation Drawer) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        usage={usage}
        email={user.email}
        joinedAt={user.created}
        prefs={prefs}
        setPrefs={setPrefs}
        notesCount={savedNotes.length}
        onOpenCategories={() => setIsCatModalOpen(true)}
        onOpenBilling={() => {
          setIsDrawerOpen(false);
          setIsBillingOpen(true);
        }}
        onLogout={async () => {
          await supabase.auth.signOut();
          nav({ to: "/login" });
        }}
        onDeleteAccount={async () => {
          await deleteAccount();
          Object.keys(localStorage).filter((k) => k.startsWith("jungbi.")).forEach((k) => localStorage.removeItem(k));
          await supabase.auth.signOut().catch(() => {});
          nav({ to: "/login" });
        }}
      />

      {/* 카테고리 관리 모달 */}
      <CategoryManagerModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        plan={prefs.plan}
        onUpgrade={() => {
          setIsCatModalOpen(false);
          setIsBillingOpen(true);
        }}
      />

      {/* 정기 구독 안내 / 결제 모달 */}
      {isBillingOpen && (
        <PaymentModal
          onClose={() => setIsBillingOpen(false)}
          onPaid={(plan) => setPrefs({ ...prefs, plan })}
        />
      )}

      <ZoomCtx.Provider value={(u) => { setZoomed(false); setZoomImg(u); }}>
      <PinCtx.Provider value={pinState}>

      {/* 상단 헤더: 구글 제미나이풍 3단 구조 (좌: 메뉴 | 중: [채팅 | 캘린더] 토글 | 우: 검색) */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-3">
          {/* 왼쪽: 두 줄(=) 메뉴 아이콘 */}
          <IconButton
            ariaLabel={tr("메뉴 열기")}
            onClick={() => setIsDrawerOpen(true)}
            className="h-10 w-10 text-foreground/85 hover:text-foreground hover:bg-muted/80"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="text-foreground/85"
            >
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </svg>
          </IconButton>

          {/* 중앙: [채팅 | 캘린더] 세그먼트 토글 (스카이블루 포인트) */}
          <div className="flex items-center rounded-full bg-muted/70 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setView("stream")}
              className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all ${
                view === "stream"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MaterialSymbol name="chat_bubble" size={16} weight={view === "stream" ? 400 : 300} />
              <span>{tr("채팅")}</span>
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all ${
                view === "calendar"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MaterialSymbol name="calendar_month" size={16} weight={view === "calendar" ? 400 : 300} />
              <span>{tr("캘린더")}</span>
            </button>
          </div>

          {/* 오른쪽: 중앙 정렬 균형용 여백 */}
          <div className="h-10 w-10" aria-hidden="true" />
        </div>
      </header>

      {/* 일정 미리 알림 바 */}
      {activeAlarms.length > 0 && (
        <div className="space-y-1.5 border-b border-border/60 bg-primary/10 px-3.5 py-2">
          {activeAlarms.map((alarm) => (
            <div key={alarm.id} className="flex items-start gap-2.5 rounded-2xl bg-card px-3.5 py-2.5 shadow-xs ring-1 ring-primary/30">
              <MaterialSymbol name="notifications_active" size={18} weight={400} className="mt-0.5 text-primary shrink-0 animate-bounce" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">{tr("톡비서 알림")}</p>
                <p className="text-xs text-foreground/90">{alarm.remind_message || alarm.summary}</p>
              </div>
              <IconButton
                ariaLabel={tr("알림 닫기")}
                onClick={() => dismissAlarm(alarm.id)}
                className="h-7 w-7 min-h-[30px] min-w-[30px] text-muted-foreground hover:text-foreground"
              >
                <MaterialSymbol name="close" size={16} weight={350} />
              </IconButton>
            </div>
          ))}
        </div>
      )}

      {/* 상단 고정 바 */}
      {view === "stream" && <PinnedBar notes={savedNotes} />}

      {/* 본문 메인 뷰: 채팅 스트림 또는 캘린더 */}
      {view === "calendar" ? (
        <NotesCalendar
          notes={savedNotes}
          urls={data?.urls ?? {}}
          onUpdate={(id, p) => void updateNote(id, p)}
          onDelete={(n) => void discardNote(n)}
          onZoom={(u) => { setZoomed(false); setZoomImg(u); }}
        />
      ) : (
        <main
          onScroll={(e) => {
            const el = e.currentTarget;
            const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
            stickBottomRef.current = dist < 100;
            setShowScrollBtn(dist > 160);
          }}
          onLoadCapture={() => {
            if (stickBottomRef.current) scrollToBottom("auto");
          }}
          className="relative flex-1 space-y-4 overflow-y-auto px-3.5 py-4"
        >
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <MaterialSymbol name="progress_activity" size={18} weight={350} className="animate-spin text-primary" />
              <span>{tr("서류함 여는 중...")}</span>
            </div>
          )}

          {!isLoading && notes.length === 0 && !pending && (
            <div className="mx-auto mt-8 max-w-sm rounded-3xl border border-border/70 bg-card/80 p-6 text-center text-sm text-foreground shadow-xs backdrop-blur-xs">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MaterialSymbol name="inventory_2" size={26} weight={350} />
              </div>
              <p className="mt-3 font-bold text-base">{tr("톡비서 서류함이 비어 있어요")}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {tr("스크린샷, 영수증, 메모, 링크를 편하게 던져 주세요. 날짜와 중요한 할 일까지 알아서 똑똑하게 정리해 드릴게요.")}
              </p>
              <p className="mt-5 text-xs font-semibold text-muted-foreground">{tr("눌러서 바로 체험해 보세요")}</p>
              <div className="mt-2.5 flex flex-col gap-2">
                {[
                  { icon: "event", text: tr("내일 오전 10시 회의 9시에 알려줘") },
                  { icon: "shopping_cart", text: tr("장보기: 우유, 계란, 커피") },
                  { icon: "image_search", text: tr("이번 달 저장한 스샷 보여줘") },
                ].map((ex) => (
                  <button
                    key={ex.text}
                    type="button"
                    onClick={() => void send({ text: ex.text })}
                    className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-left text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-98"
                  >
                    <MaterialSymbol name={ex.icon} size={18} weight={350} className="text-muted-foreground" />
                    <span className="truncate">{ex.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const lastRef: Record<string, string> = {};
            for (const it of stream) {
              if (it.t === "note") lastRef[it.n.id] = `n:${it.n.id}`;
              else for (const id of it.a.noteIds) lastRef[id] = `a:${it.a.id}`;
            }
            return stream.map((it) =>
              it.t === "note" ? (
                <NoteThread
                  key={it.n.id}
                  note={lastRef[it.n.id] === `n:${it.n.id}` ? it.n : { ...it.n, confirmed: true }}
                  imageUrl={it.n.image_path ? data?.urls[it.n.image_path] : undefined}
                  audioUrl={it.n.audio_path ? data?.urls[it.n.audio_path] : undefined}
                  fileUrl={it.n.file_path ? data?.urls[it.n.file_path] : undefined}
                  onConfirm={() => void confirmNote(it.n.id)}
                  onDiscard={() => void discardNote(it.n)}
                  onUpdate={(p) => void updateNote(it.n.id, p)}
                />
              ) : (
                <AnswerThread
                  key={it.a.id}
                  a={it.a}
                  notes={notes
                    .filter((n) => (it.a.noteIds.includes(n.id) && lastRef[n.id] === `a:${it.a.id}` ? true : it.a.noteIds.includes(n.id)))
                    .sort((x, y) => it.a.noteIds.indexOf(x.id) - it.a.noteIds.indexOf(y.id))}
                  urls={data?.urls ?? {}}
                  showConfirm={it.a.noteIds.some((id) => lastRef[id] === `a:${it.a.id}`)}
                  onConfirm={(n) => void confirmNote(n.id)}
                  onDiscard={(n) => void discardNote(n)}
                  onUpdate={(n, p) => void updateNote(n.id, p)}
                />
              ),
            );
          })()}

          {clearAsk && (
            <div className="space-y-2">
              <UserBubble text={clearAsk} />
              <div className="flex items-start gap-2.5">
                <Avatar />
                <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-sm border border-border/80 bg-card p-3 text-sm text-foreground shadow-xs">
                  <div>
                    <p className="font-semibold">{tr("채팅창을 지금 모두 비울까요?")}</p>
                    <p className="text-xs text-muted-foreground">{tr("저장된 메모와 캘린더 기록은 그대로 안전하게 남아요")}</p>
                  </div>
                  <IconButton ariaLabel={tr("비우기")} onClick={() => { setClearAsk(null); void clearChat(); }} className="h-8 w-8 bg-primary text-primary-foreground hover:opacity-90">
                    <MaterialSymbol name="check" size={18} weight={400} />
                  </IconButton>
                  <IconButton ariaLabel={tr("취소")} onClick={() => setClearAsk(null)} className="h-8 w-8 bg-muted text-muted-foreground hover:text-foreground">
                    <MaterialSymbol name="close" size={18} weight={350} />
                  </IconButton>
                </div>
              </div>
            </div>
          )}

          {pending && (
            <div className="space-y-2">
              <UserBubble text={pending.text} imageUrl={pending.preview ?? undefined} />
              <div className="flex items-start gap-2.5">
                <Avatar />
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border/50 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-xs animate-pulse">
                  <MaterialSymbol name="auto_awesome" size={16} weight={400} className="text-primary animate-spin" />
                  <span>{tr(LOADERS[loaderIdx]!)}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />

          {showScrollBtn && (
            <IconButton
              ariaLabel={tr("맨 아래로")}
              onClick={() => { stickBottomRef.current = true; scrollToBottom("smooth"); }}
              className="sticky bottom-2 float-right z-10 h-10 w-10 border border-border/80 bg-card text-foreground shadow-lg hover:bg-muted"
            >
              <MaterialSymbol name="arrow_downward" size={20} weight={400} />
            </IconButton>
          )}
        </main>
      )}

      </PinCtx.Provider>
      </ZoomCtx.Provider>

      {/* 이미지 확대 미리보기 모달 */}
      {zoomImg && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs" onClick={() => setZoomImg(null)}>
          <div className="fixed right-4 top-4 z-10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <IconButton ariaLabel={zoomed ? tr("축소") : tr("확대")} onClick={() => setZoomed((z) => !z)} className="bg-white/15 text-white hover:bg-white/25">
              <MaterialSymbol name={zoomed ? "zoom_out" : "zoom_in"} size={22} weight={350} />
            </IconButton>
            <IconButton ariaLabel={tr("닫기")} onClick={() => setZoomImg(null)} className="bg-white/15 text-white hover:bg-white/25">
              <MaterialSymbol name="close" size={22} weight={350} />
            </IconButton>
          </div>
          <div onClick={(e) => e.stopPropagation()} className={zoomed ? "max-h-[92dvh] max-w-[95vw] overflow-auto rounded-2xl" : "flex max-h-[90dvh] max-w-[94vw] items-center justify-center"}>
            <img
              src={zoomImg}
              alt={tr("원본")}
              onClick={() => setZoomed((z) => !z)}
              className={zoomed ? "h-auto w-auto max-w-none cursor-zoom-out rounded-2xl object-contain" : "max-h-[90dvh] max-w-[95vw] cursor-zoom-in rounded-2xl object-contain"}
            />
          </div>
        </div>
      )}

      {/* 하단 입력창 및 플로팅 알약 Dock */}
      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl px-3">
          {err && <p className="mb-1.5 px-3 text-xs text-destructive">{err}</p>}

          {/* 클립보드 링크 제안 배너 */}
          {clipUrl && (
            <div className="mb-2 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs text-foreground">
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1 font-semibold">
                  <MaterialSymbol name="link" size={16} weight={350} className="text-primary" />
                  {tr("복사한 링크를 바로 정리할까요?")}
                </p>
                <p className="truncate text-xs text-muted-foreground">{clipUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => { const u = clipUrl; setClipUrl(null); void send({ text: u }); }}
                className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:opacity-90"
              >
                {tr("바로 던지기")}
              </button>
              <IconButton ariaLabel={tr("닫기")} onClick={() => setClipUrl(null)} className="h-7 w-7 min-h-[28px] min-w-[28px]">
                <MaterialSymbol name="close" size={16} weight={350} />
              </IconButton>
            </div>
          )}

          {/* 첨부 이미지 미리보기 */}
          {img && (
            <div className="relative mb-2 inline-block">
              <img src={img.preview} alt={tr("첨부 미리보기")} className="h-20 rounded-xl object-cover shadow-sm ring-1 ring-border" />
              <button
                type="button"
                aria-label={tr("첨부 취소")}
                onClick={() => setImg(null)}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow-md"
              >
                <MaterialSymbol name="close" size={14} weight={400} />
              </button>
            </div>
          )}

          {/* 녹음 진행 바 */}
          {rec && (
            <div className="mb-2 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-3.5 py-2 text-xs font-medium text-destructive">
              <span className="size-2 animate-pulse rounded-full bg-destructive" />
              <span>{tr("녹음 중")} {Math.floor(recSec / 60)}:{String(recSec % 60).padStart(2, "0")} / 1:00</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-destructive/20">
                <div className="h-full bg-destructive transition-all" style={{ width: `${(recSec / MAX_REC_SEC) * 100}%` }} />
              </div>
              <button type="button" onClick={() => stopRecording(true)} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted">
                {tr("취소")}
              </button>
              <button type="button" onClick={() => stopRecording()} className="flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-white shadow-2xs">
                {tr("완료")}
              </button>
            </div>
          )}

          {/* 플로팅 알약(Pill) 형태 입력 바 */}
          <div className="relative flex items-center gap-1 rounded-full border border-border/80 bg-card/95 px-2 py-1.5 shadow-md backdrop-blur-md">
            {/* 왼쪽: + (첨부 메뉴) */}
            <div className="relative flex items-center">
              <IconButton
                ariaLabel={tr("첨부 메뉴")}
                onClick={() => setMenu((m) => !m)}
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                <MaterialSymbol
                  name="add"
                  size={22}
                  weight={350}
                  className={`transition-transform duration-200 ${menu ? "rotate-45" : ""}`}
                />
              </IconButton>

              {menu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                  <div className="absolute bottom-12 left-0 z-50 w-56 overflow-hidden rounded-2xl border border-border/80 bg-card p-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                    {[
                      { icon: "image", label: tr("스샷 첨부"), act: () => { setMenu(false); fileRef.current?.click(); } },
                      { icon: "photo_camera", label: tr("사진 촬영"), act: () => { setMenu(false); cameraRef.current?.click(); } },
                      { icon: "mic", label: tr("음성 녹음"), act: () => { setMenu(false); startRecording(); } },
                      { icon: "description", label: tr("문서 · 모든 파일 첨부"), act: () => { setMenu(false); docRef.current?.click(); } },
                    ].map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        onClick={o.act}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground/80">
                          <MaterialSymbol name={o.icon} size={18} weight={350} />
                        </span>
                        <span>{o.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void attach(f); e.target.value = ""; }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void attach(f); e.target.value = ""; }} />
            <input ref={docRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onDocFile(f); e.target.value = ""; }} />

            {/* 중앙: 텍스트 입력창 */}
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={onPaste}
              rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}
              placeholder={tr("메모, 링크, 스샷을 던져 주세요")}
              className="max-h-28 min-h-[38px] flex-1 resize-none bg-transparent py-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
            />

            {/* 오른쪽: 마이크 또는 전송(↑) 버튼 */}
            {rec ? (
              <IconButton ariaLabel={tr("녹음 취소")} onClick={() => stopRecording(true)} className="h-10 w-10 text-muted-foreground">
                <MaterialSymbol name="close" size={20} weight={350} />
              </IconButton>
            ) : text.trim() || img ? (
              <button
                type="button"
                aria-label={tr("보내기")}
                onClick={() => void send()}
                disabled={!!pending}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs transition-transform active:scale-95 disabled:opacity-40 hover:opacity-90"
              >
                <MaterialSymbol name="arrow_upward" size={20} weight={400} />
              </button>
            ) : (
              <IconButton
                ariaLabel={listening ? tr("받아쓰기 끝내기") : tr("말로 입력하기")}
                onClick={toggleDictation}
                disabled={!!pending}
                className={`h-10 w-10 shrink-0 ${listening ? "bg-destructive text-white animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
              >
                <MaterialSymbol name={listening ? "stop" : "mic"} size={22} weight={350} />
              </IconButton>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <img
      src={jungbiAvatar}
      alt={tr("톡비서")}
      width={32}
      height={32}
      className="mt-0.5 size-8 shrink-0 rounded-xl object-cover shadow-2xs"
    />
  );
}

function UserBubble({ text, imageUrl, fileUrl, origName }: { text: string; imageUrl?: string | undefined; fileUrl?: string | undefined; origName?: string | null }) {
  const [open, setOpen] = useState(false);
  const zoom = useContext(ZoomCtx);
  const isDoc = text.startsWith("📄 ");
  const nl = text.indexOf("\n");
  const fileName = isDoc ? (nl > 0 ? text.slice(2, nl) : text.slice(2)).trim() : "";
  const body = isDoc ? (nl > 0 ? text.slice(nl + 1) : "") : text;
  const long = body.length > 300 || body.split("\n").length > 8;
  return (
    <div className="flex flex-col items-end gap-1">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={tr("보낸 스크린샷")}
          onClick={() => zoom(imageUrl)}
          className="h-auto max-h-64 w-auto max-w-[70%] cursor-zoom-in rounded-2xl object-contain shadow-xs"
        />
      )}
      {isDoc ? (
        <div className="w-64 max-w-[80%] rounded-2xl rounded-tr-sm border border-primary/20 bg-bubble px-3.5 py-2.5 text-sm text-foreground shadow-xs">
          <div className="flex items-center gap-2">
            <MaterialSymbol name="description" size={24} weight={350} className="shrink-0 opacity-80" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{fileName}</p>
              <p className="text-[11px] opacity-70">{tr("문서 · {0}자", body.length.toLocaleString())}</p>
            </div>
          </div>
          {body && (
            <>
              {open && <p className="mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap break-words border-t border-current/10 pt-2 text-xs opacity-80">{body}</p>}
              <div className="mt-2 flex items-center justify-between">
                <button type="button" onClick={() => setOpen(!open)} className="text-xs font-medium underline opacity-80">{open ? tr("접기 ▲") : tr("내용 보기 ▼")}</button>
                {fileUrl && (
                  <button type="button" onClick={() => void downloadFile(fileUrl, origName)} className="inline-flex items-center gap-1 text-xs font-semibold underline">
                    <MaterialSymbol name="download" size={14} weight={400} />
                    <span>{tr("원본 받기")}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : text && (
        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm border border-primary/20 bg-bubble px-4 py-2.5 text-[15px] leading-relaxed text-foreground shadow-xs">
          <span className={long && !open ? "line-clamp-6" : ""}>{body}</span>
          {long && <button type="button" onClick={() => setOpen(!open)} className="mt-1 block text-xs font-medium underline opacity-80">{open ? tr("접기 ▲") : tr("... 더보기")}</button>}
        </div>
      )}
      {(isDoc ? body : text) && <CopyButton text={isDoc ? body : text} label={isDoc ? tr("원문 복사") : tr("복사")} />}
    </div>
  );
}

function LinkPreview({ note }: { note: Note }) {
  const meta = note.link_meta as { title?: string; description?: string; image?: string; site?: string } | null;
  if (!note.link_url) return null;
  const host = (() => { try { return new URL(note.link_url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  return (
    <a href={note.link_url} target="_blank" rel="noreferrer" className="block border-b border-border/60 bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
      <div className="flex gap-2.5">
        {meta?.image && <img src={meta.image} alt={meta.title ?? "preview"} className="size-14 shrink-0 rounded-xl object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <MaterialSymbol name="link" size={13} weight={350} />
            <span className="truncate">{meta?.site || host}</span>
          </p>
          <p className="truncate text-xs font-semibold text-foreground">{meta?.title || note.link_url}</p>
          {meta?.description && <p className="line-clamp-2 text-[11px] text-muted-foreground">{meta.description}</p>}
        </div>
      </div>
    </a>
  );
}

function NoteMenu({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { pins, toggle } = useContext(PinCtx);
  const pinned = pins.includes(note.id);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(noteCopyText(note));
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 800);
  };

  return (
    <div className="relative">
      <IconButton
        ariaLabel={tr("더보기")}
        onClick={() => setOpen((v) => !v)}
        className="h-7 w-7 min-h-[30px] min-w-[30px] text-muted-foreground hover:text-foreground"
      >
        <MaterialSymbol name="more_vert" size={18} weight={350} />
      </IconButton>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-36 overflow-hidden rounded-2xl border border-border/80 bg-card p-1 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <MaterialSymbol name={copied ? "check" : "content_copy"} size={16} weight={350} />
              <span>{copied ? tr("복사됨!") : tr("요약 복사")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                toggle(note.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <MaterialSymbol name={pinned ? "keep_off" : "keep"} size={16} weight={350} fill={pinned} />
              <span>{pinned ? tr("고정 해제") : tr("상단 고정")}</span>
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <MaterialSymbol name="edit" size={16} weight={350} />
                <span>{tr("수정")}</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <MaterialSymbol name="delete" size={16} weight={350} />
                <span>{tr("삭제")}</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NoteCard({ note, onUpdate, onDelete }: { note: Note; onUpdate?: (patch: { category: string; tags: string[] }) => void; onDelete?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="relative rounded-2xl border border-border/70 bg-card shadow-xs">
      {/* 카드 상단: 카테고리 배지 + 작성 시간 + 우측 상단 더보기(⋮) 메뉴 */}
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3.5 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-semibold text-foreground">
          <CategoryIcon name={note.category} className="size-3.5" />
          <span>{tr(note.category)}</span>
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">{fmtTime(note.created_at)}</span>
          <NoteMenu
            note={note}
            onEdit={note.confirmed && onUpdate ? () => { setEditing(true); setDeleting(false); } : undefined}
            onDelete={note.confirmed && onDelete ? () => { setDeleting(true); setEditing(false); } : undefined}
          />
        </div>
      </div>

      <LinkPreview note={note} />

      {/* 요약 본문 및 태그 */}
      <div className="space-y-2 px-3.5 py-3">
        <p className="text-[15px] font-semibold leading-snug text-foreground">{note.summary}</p>
        {note.detected_date && (
          <p className="flex items-center gap-1.5 text-xs text-foreground/80">
            <MaterialSymbol name="calendar_today" size={14} weight={350} className="text-muted-foreground" />
            <span>{fmtDate(note.detected_date)}</span>
          </p>
        )}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.map((t) => (
              <span key={t} className="rounded-md bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 알림 배너 */}
      {note.remind_at && (
        <div className="flex items-start gap-2 bg-primary/10 px-3.5 py-2 text-xs text-foreground">
          <MaterialSymbol
            name={note.reminded ? "notifications_active" : "notifications"}
            size={16}
            weight={350}
            className="mt-0.5 text-primary shrink-0"
          />
          <span>
            {note.reminded ? tr("알림을 전해드렸어요 ({0})", fmtDate(note.remind_at)) : tr("{0}에 잊지 않게 챙겨드릴게요", fmtDate(note.remind_at))}
            {note.remind_message ? <><br /><span className="text-muted-foreground">“{note.remind_message}”</span></> : null}
          </span>
        </div>
      )}

      {/* 수정 에디터 */}
      {editing && onUpdate && (
        <div className="border-t border-border/60">
          <NoteMetaEditor initialCategory={note.category} initialTags={note.tags} onSave={(p) => { onUpdate(p); setEditing(false); }} onCancel={() => setEditing(false)} />
        </div>
      )}

      {/* 삭제 확인 창 */}
      {deleting && onDelete && (
        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-destructive/10 px-3.5 py-2 text-xs">
          <span className="font-medium text-destructive">{tr("삭제할까요?")}</span>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setDeleting(false)} className="rounded-full bg-card px-3 py-1 font-medium text-muted-foreground hover:bg-muted">{tr("취소")}</button>
            <button type="button" onClick={() => { onDelete(); setDeleting(false); }} className="rounded-full bg-destructive px-3 py-1 font-semibold text-white shadow-2xs">{tr("삭제")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AnswerActions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tr("톡비서 답변"),
          text: text,
        });
      } catch { /* user cancelled */ }
    } else {
      await handleCopy();
    }
  };

  return (
    <div className="flex items-center gap-1 pt-1 text-muted-foreground/80">
      <IconButton ariaLabel={tr("복사")} onClick={handleCopy} className="h-7 w-7 min-h-[30px] min-w-[30px] text-muted-foreground hover:text-foreground">
        <MaterialSymbol name={copied ? "check" : "content_copy"} size={16} weight={350} />
      </IconButton>
      <IconButton ariaLabel={tr("공유")} onClick={handleShare} className="h-7 w-7 min-h-[30px] min-w-[30px] text-muted-foreground hover:text-foreground">
        <MaterialSymbol name="share" size={16} weight={350} />
      </IconButton>
    </div>
  );
}

function NoteThread({ note, imageUrl, audioUrl, fileUrl, onConfirm, onDiscard, onUpdate }: { note: Note; imageUrl: string | undefined; audioUrl: string | undefined; fileUrl?: string | undefined; onConfirm: () => void; onDiscard: () => void; onUpdate: (patch: { category: string; tags: string[] }) => void }) {
  return (
    <div id={`note-${note.id}`} className="space-y-2 animate-in fade-in slide-in-from-bottom-1">
      {audioUrl && (
        <div className="flex justify-end">
          <div className="w-64 max-w-[78%] rounded-2xl rounded-tr-sm border border-primary/20 bg-bubble p-2.5 text-foreground shadow-xs">
            <p className="mb-1 inline-flex items-center gap-1 px-1 text-xs font-medium text-foreground/85">
              <MaterialSymbol name="mic" size={15} weight={350} />
              {tr("음성 메모")}
            </p>
            <audio controls preload="none" src={audioUrl} className="h-9 w-full" />
          </div>
        </div>
      )}
      <UserBubble text={note.content} imageUrl={imageUrl} fileUrl={fileUrl} origName={note.file_name} />
      <div className="flex items-start gap-2.5">
        <Avatar />
        <div className="w-full max-w-[92%] space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{tr("톡비서")}</p>
          <div className="rounded-2xl rounded-tl-sm border border-border/50 bg-card/85 px-4 py-2.5 text-[15.5px] leading-[1.6] text-foreground shadow-xs">
            {note.secretary_reply}
          </div>
          <NoteCard note={note} onUpdate={onUpdate} onDelete={onDiscard} />
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
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-3.5 py-2">
      <span className="text-xs font-semibold text-foreground">{tr("이대로 서류함에 보관할까요?")}</span>
      <div className="flex items-center gap-1.5">
        <IconButton ariaLabel={tr("보관")} onClick={onConfirm} className="h-8 w-8 min-h-[34px] min-w-[34px] bg-primary text-primary-foreground hover:opacity-90">
          <MaterialSymbol name="check" size={18} weight={400} />
        </IconButton>
        <IconButton ariaLabel={tr("수정")} onClick={() => setEditing(true)} className="h-8 w-8 min-h-[34px] min-w-[34px] bg-card text-muted-foreground hover:text-foreground">
          <MaterialSymbol name="edit" size={18} weight={350} />
        </IconButton>
        <IconButton ariaLabel={tr("버리기")} onClick={onDiscard} className="h-8 w-8 min-h-[34px] min-w-[34px] bg-card text-muted-foreground hover:text-destructive">
          <MaterialSymbol name="delete" size={18} weight={350} />
        </IconButton>
      </div>
    </div>
  );
}

function AnswerThread({ a, notes, urls, showConfirm, onConfirm, onDiscard, onUpdate }: { a: Answer; notes: Note[]; urls: Record<string, string>; showConfirm: boolean; onConfirm: (n: Note) => void; onDiscard: (n: Note) => void; onUpdate: (n: Note, patch: { category: string; tags: string[] }) => void }) {
  const zoom = useContext(ZoomCtx);
  const countQ = /몇\s*(개|건|번|가지)|개수|총\s*몇|모두\s*몇|전부\s*몇|얼마나\s*(던|저장|메모|있)|how many|何件|いくつ|何個/i.test(a.q);
  const many = notes.length > 2 || (countQ && notes.length > 0);
  const [open, setOpen] = useState(false);
  const shown = !many ? notes : open ? notes : [];
  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1">
      <UserBubble text={a.q} />
      <div className="flex items-start gap-2.5">
        <Avatar />
        <div className="w-full max-w-[92%] space-y-2">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <MaterialSymbol name="auto_awesome" size={15} weight={400} className="text-primary" />
            <span>{tr("톡비서")}</span>
          </p>
          <div className="rounded-3xl rounded-tl-sm border border-border/50 bg-card/85 p-4 text-[15.5px] leading-[1.6] text-foreground shadow-xs">
            <div className="space-y-3.5 whitespace-pre-wrap break-words">{a.answer}</div>
            {many && !open && (
              <p className="mt-3 text-xs text-muted-foreground">
                {tr("메모 {0}건, 모두 보여드릴까요?", notes.length)}
              </p>
            )}
          </div>
          <AnswerActions text={a.answer} />
          {many && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/90 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-2xs hover:bg-muted"
            >
              <MaterialSymbol name={open ? "expand_less" : "format_list_bulleted"} size={16} weight={350} />
              <span>{open ? tr("목록 접기") : tr("메모 {0}건 모두 보기", notes.length)}</span>
            </button>
          )}
          {shown.map((n) => {
            const imgUrl = n.image_path ? urls[n.image_path] : undefined;
            return (
              <div key={n.id} className="space-y-1 pt-1">
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt={tr("저장된 스크린샷")}
                    onClick={() => zoom(imgUrl)}
                    className="h-auto max-h-48 w-auto max-w-full cursor-zoom-in rounded-2xl object-contain shadow-xs"
                  />
                )}
                <NoteCard note={n} onUpdate={(p) => onUpdate(n, p)} onDelete={() => onDiscard(n)} />
                {showConfirm && !n.confirmed && (
                  <ConfirmBar note={n} onConfirm={() => onConfirm(n)} onDiscard={() => onDiscard(n)} onUpdate={(p) => onUpdate(n, p)} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
