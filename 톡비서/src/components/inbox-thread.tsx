import { createContext, useContext, useState } from "react";
import jungbiAvatar from "@/assets/jungbi-avatar.png";
import { CategoryIcon } from "@/components/category-icon";
import { NoteMetaEditor } from "@/components/inbox-extras";
import { IconButton, MaterialSymbol } from "@/components/ui/material-symbol";
import type { Tables } from "@/integrations/supabase/types";
import { downloadFile } from "@/lib/doc-text";
import { locale, t as tr } from "@/lib/i18n";
import { noteSourceKind } from "@/lib/notes";

export type Note = Tables<"notes">;
export type Answer = { id: string; q: string; answer: string; noteIds: string[]; at: string };

export const PinCtx = createContext<{ pins: string[]; toggle: (id: string) => void }>({ pins: [], toggle: () => {} });
export const ZoomCtx = createContext<(url: string) => void>(() => {});

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(locale(), { month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" });

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(locale(), { hour: "numeric", minute: "2-digit" });

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export function noteCopyText(n: Note) {
  return [n.summary, n.detected_date ? fmtDate(n.detected_date) : "", n.tags.length ? n.tags.map((t) => `#${t}`).join(" ") : "", n.link_url ?? ""].filter(Boolean).join("\n");
}

export function PinnedBar({ notes }: { notes: Note[] }) {
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

export function CopyButton({ text, label = tr("복사") }: { text: string; label?: string }) {
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

export function Avatar() {
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

export function UserBubble({ text, imageUrl, fileUrl, origName }: { text: string; imageUrl?: string | undefined; fileUrl?: string | undefined; origName?: string | null }) {
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
          className="h-auto max-h-64 w-auto max-w-[70%] cursor-zoom-in rounded-2xl border border-amber-300 object-contain shadow-xs dark:border-amber-600/60"
        />
      )}
      {isDoc ? (
        <div className="w-64 max-w-[80%] rounded-2xl rounded-tr-sm border border-amber-300 bg-amber-50/85 px-3.5 py-2.5 text-sm text-foreground shadow-xs dark:border-amber-600/60 dark:bg-amber-950/35">
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
        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm border border-amber-300 bg-amber-50/85 px-4 py-2.5 text-[15px] leading-relaxed text-foreground shadow-xs dark:border-amber-600/60 dark:bg-amber-950/35">
          <span className={long && !open ? "line-clamp-6" : ""}>{body}</span>
          {long && <button type="button" onClick={() => setOpen(!open)} className="mt-1 block text-xs font-medium underline opacity-80">{open ? tr("접기 ▲") : tr("... 더보기")}</button>}
        </div>
      )}
      {(isDoc ? body : text) && <CopyButton text={isDoc ? body : text} label={isDoc ? tr("원문 복사") : tr("복사")} />}
    </div>
  );
}

function LinkPreview({ note }: { note: Note }) {
  if (!note.link_url) return null;
  const host = (() => { try { return new URL(note.link_url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  return (
    <a href={note.link_url} target="_blank" rel="noreferrer" className="block border-b border-border/60 bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
      <div className="flex gap-2.5">
        {note.link_image && <img src={note.link_image} alt={note.link_title ?? "preview"} className="size-14 shrink-0 rounded-xl object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <MaterialSymbol name="link" size={13} weight={350} />
            <span className="truncate">{host}</span>
          </p>
          <p className="truncate text-xs font-semibold text-foreground">{note.link_title || note.link_url}</p>
          {note.link_description && <p className="line-clamp-2 text-[11px] text-muted-foreground">{note.link_description}</p>}
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
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
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

export function NoteCard({ note, onUpdate, onDelete }: { note: Note; onUpdate?: ((patch: { category: string; tags: string[] }) => void) | undefined; onDelete?: (() => void) | undefined }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const src = noteSourceKind(note);
  return (
    <div className="relative rounded-2xl border border-[var(--secretary-card-border)] bg-[var(--secretary-bubble)] shadow-xs">
      {/* 카드 상단: 주제 + 자료 종류 배지 + 작성 시간 + 우측 상단 더보기(⋮) 메뉴 */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--secretary-border)] px-3.5 py-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-foreground dark:bg-black/25">
            <CategoryIcon name={note.category} className="size-3.5" />
            <span>{tr(note.category)}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <MaterialSymbol name={src.icon} size={12} weight={350} />
            <span>{tr(src.label)}</span>
          </span>
        </div>
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
              <span key={t} className="rounded-md bg-white/75 px-1.5 py-0.5 text-xs text-muted-foreground dark:bg-black/25">
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

export function NoteThread({ note, imageUrl, audioUrl, fileUrl, highlighted, retrying, onRetry, onConfirm, onDiscard, onUpdate }: { note: Note; imageUrl: string | undefined; audioUrl: string | undefined; fileUrl?: string | undefined; highlighted?: boolean; retrying?: boolean | undefined; onRetry?: (() => void) | undefined; onConfirm: () => void; onDiscard: () => void; onUpdate: (patch: { category: string; tags: string[] }) => void }) {
  return (
    <div
      id={`note-${note.id}`}
      className={`space-y-2 animate-in fade-in slide-in-from-bottom-1 rounded-2xl transition-all duration-300 ${
        highlighted ? "bg-primary/10 p-2 -m-2 ring-2 ring-primary/50" : ""
      }`}
    >
      {audioUrl && (
        <div className="flex justify-end">
          <div className="w-64 max-w-[78%] rounded-2xl rounded-tr-sm border border-amber-300 bg-amber-50/85 p-2.5 text-foreground shadow-xs dark:border-amber-600/60 dark:bg-amber-950/35">
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
          <div className="rounded-2xl rounded-tl-sm border border-[var(--secretary-border)] bg-[var(--secretary-bubble)] px-4 py-2.5 text-[15.5px] leading-[1.6] text-foreground shadow-xs">
            {retrying ? tr("다시 정리하고 있어요...") : note.secretary_reply}
          </div>
          <NoteCard note={note} onUpdate={onUpdate} onDelete={onDiscard} />
          {!note.confirmed && <ConfirmBar note={note} retrying={retrying} onRetry={onRetry} onConfirm={onConfirm} onDiscard={onDiscard} onUpdate={onUpdate} />}
        </div>
      </div>
    </div>
  );
}

export function ConfirmBar({ note, retrying, onRetry, onConfirm, onDiscard, onUpdate }: { note: Note; retrying?: boolean | undefined; onRetry?: (() => void) | undefined; onConfirm: () => void; onDiscard: () => void; onUpdate: (patch: { category: string; tags: string[] }) => void }) {
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
        {onRetry && (
          <IconButton ariaLabel={tr("다시 정리")} onClick={onRetry} disabled={Boolean(retrying)} className="h-8 w-8 min-h-[34px] min-w-[34px] bg-card text-primary hover:bg-primary/10 disabled:opacity-50">
            <MaterialSymbol name="refresh" size={18} weight={400} className={retrying ? "animate-spin" : ""} />
          </IconButton>
        )}
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

export function AnswerThread({ a, notes, urls, showConfirm, onConfirm, onDiscard, onUpdate }: { a: Answer; notes: Note[]; urls: Record<string, string>; showConfirm: boolean; onConfirm: (n: Note) => void; onDiscard: (n: Note) => void; onUpdate: (n: Note, patch: { category: string; tags: string[] }) => void }) {
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
          <div className="rounded-3xl rounded-tl-sm border border-[var(--secretary-border)] bg-[var(--secretary-bubble)] p-4 text-[15.5px] leading-[1.6] text-foreground shadow-xs">
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
                    className="h-auto max-h-48 w-auto max-w-full cursor-zoom-in rounded-2xl border border-amber-300 object-contain shadow-xs dark:border-amber-600/60"
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
