import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminDeleteGuide, adminDraftGuide, adminListGuides, adminSaveGuide, adminUploadGuideImage } from "@/lib/guides.functions";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GuideBody } from "@/components/GuideBody";
import { useEffect, useRef } from "react";

const empty = { id: undefined as string | undefined, slug: "", title: "", description: "", body: "", published: true };

const PROMPT_KEY = "guide-ai-prompt";
const DEFAULT_PROMPT = `당신은 '꿈소반'의 따뜻하고 신비로운 꿈풀이 칼럼 작가입니다.
- 독자: 간밤의 꿈이 마음에 걸려 아침에 "○○ 꿈 해몽"을 검색하는 20~40대
- 말투: 다정하고 차분한 존댓말(~해요), 겁주지 않기
- 구성: ## 소제목 4~5개 (전통 해몽 의미 / 상황별 풀이 / 심리학적 해석(융·프로이트) / 길몽·흉몽 판단 / 오늘의 행동 팁)
- 상황별 풀이는 - 목록으로 5개 이상 (예: 누가, 어디서, 어떤 감정이었는지)
- 문단은 2~3줄로 짧게, 분량 1,800~2,500자
- 검색 키워드(예: "○○ 꿈 해몽", "○○ 꿈 의미")를 문맥 속에 자연스럽게 3번 넣기
- 마지막은 "내 꿈을 직접 AI로 풀어보세요"라는 부드러운 권유로 마무리`;

export function GuideEditor() {
  const list = useServerFn(adminListGuides);
  const save = useServerFn(adminSaveGuide);
  const del = useServerFn(adminDeleteGuide);
  const draft = useServerFn(adminDraftGuide);
  const qc = useQueryClient();
  const { data: guides = [] } = useQuery({ queryKey: ["admin-guides"], queryFn: () => list() });
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [topic, setTopic] = useState("");
  const [drafting, setDrafting] = useState(false);
  useEffect(() => { const s = localStorage.getItem(PROMPT_KEY); if (s) setPrompt(s); }, []);
  const savePrompt = (v: string) => { setPrompt(v); localStorage.setItem(PROMPT_KEY, v); };
  const upload = useServerFn(adminUploadGuideImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB 이하 사진만 올릴 수 있어요."); return; }
    setUploading(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      const { url } = await upload({ data: { base64: btoa(bin), type: file.type as "image/jpeg" } });
      const alt = (window.prompt("사진 아래 보일 설명 (비워도 돼요)", "")) || "";
      const pos = bodyRef.current?.selectionStart ?? f.body.length;
      const md = `\n\n![${alt.replace(/[[\]]/g, "")}](${url})\n\n`;
      setF((p) => ({ ...p, body: p.body.slice(0, pos) + md + p.body.slice(pos) }));
      toast.success("사진을 넣었어요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "사진을 올리지 못했어요.");
    } finally { setUploading(false); }
  };
  const set = (k: keyof typeof empty, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-guides"] }); qc.invalidateQueries({ queryKey: ["guides"] }); };

  const submit = async () => {
    setBusy(true);
    try {
      await save({ data: { ...f, slug: f.slug.trim().toLowerCase() } });
      toast.success(f.published ? "발행했어요." : "임시 저장했어요.");
      setF(empty); refresh();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      toast.error(m.includes("[") ? "주소(영어 소문자·숫자·하이픈), 제목, 본문을 확인해 주세요." : m || "저장 실패");
    } finally { setBusy(false); }
  };

  const generate = async () => {
    if (!prompt.trim()) { toast.error("글쓰기 지침을 먼저 적어 주세요."); return; }
    if ((f.title || f.body) && !confirm("지금 적힌 내용을 AI 초안으로 바꿀까요?")) return;
    setDrafting(true);
    try {
      const d = await draft({ data: { prompt, topic: topic.trim() || undefined } });
      setF({ ...empty, ...d, published: f.published });
      toast.success("초안을 채웠어요. 읽어보고 다듬은 뒤 발행해 주세요.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "초안을 만들지 못했어요.");
    } finally { setDrafting(false); }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="space-y-3 rounded-xl border border-primary/30 bg-accent/40 p-4">
        <h3 className="font-serif text-lg">✨ AI 글 작성 도우미</h3>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">글쓰기 지침 (자동 저장돼요 · 이미 올린 글 제목은 자동으로 피해요)</p>
          <Textarea rows={8} value={prompt} onChange={(e) => savePrompt(e.target.value)} />
          <button type="button" className="mt-1 text-xs underline text-muted-foreground" onClick={() => confirm("지침을 기본값으로 되돌릴까요?") && savePrompt(DEFAULT_PROMPT)}>기본 지침으로 되돌리기</button>
        </div>
        <Input placeholder="오늘의 주제 힌트 (비워두면 AI가 새 주제를 골라요)" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <Button className="w-full" variant="secondary" disabled={drafting} onClick={generate}>{drafting ? "초안 쓰는 중… (10~30초)" : "🪄 AI로 초안 채우기"}</Button>
      </div>
      <h2 className="font-serif text-xl">{f.id ? "글 고치기" : "새 이야기 쓰기"}</h2>
      <Input placeholder="제목 (예: 이가 빠지는 꿈 해몽, 상황별 의미 총정리)" value={f.title} onChange={(e) => set("title", e.target.value)} />
      <div>
        <Input placeholder="주소 (예: teeth-falling-out-dream)" value={f.slug} onChange={(e) => set("slug", e.target.value)} />
        <p className="mt-1 text-xs text-muted-foreground">/guide/{f.slug || "주소"} · 영어 소문자, 숫자, 하이픈(-)만</p>
      </div>
      <Input placeholder="검색 결과에 보일 한 줄 요약 (120자 안팎)" value={f.description} onChange={(e) => set("description", e.target.value)} />
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "사진 올리는 중…" : "📷 사진 넣기"}
          </Button>
          <span className="text-xs text-muted-foreground">커서가 있는 자리에 들어가요 · 5MB 이하</span>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onPickImage} />
        </div>
        <Textarea ref={bodyRef} rows={16} placeholder="본문을 붙여 넣어 주세요." value={f.body} onChange={(e) => set("body", e.target.value)} />
        <p className="mt-1 text-xs text-muted-foreground">## 소제목 · - 목록 · **굵게** · 빈 줄로 문단을 나눠요. 사진은 ![설명](주소) 한 줄로 들어가요. 글 아래 "내 꿈 풀기" 버튼은 자동으로 붙어요.</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} /> 바로 공개하기
        </label>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!f.title && !f.body}>미리보기</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-background">
            <DialogTitle className="sr-only">글 미리보기</DialogTitle>
            <p className="text-xs text-muted-foreground">/guide/{f.slug || "주소"}</p>
            <h1 className="font-serif text-3xl font-bold leading-snug">{f.title || "제목 없음"}</h1>
            {f.description && <p className="text-sm text-muted-foreground">{f.description}</p>}
            <div className="mt-2 rounded-3xl border bg-card p-6"><GuideBody body={f.body} /></div>
            <section className="rounded-3xl border border-primary/30 bg-accent/40 p-6 text-center">
              <p className="font-serif text-lg font-bold">내 꿈은 어떤 의미일까?</p>
              <p className="mt-1 text-sm text-muted-foreground">꿈 내용을 적으면 AI가 전통 해몽과 심리학으로 풀어드려요.</p>
              <Button className="mt-4" tabIndex={-1}>내 꿈 직접 풀기</Button>
            </section>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={busy || !f.title || !f.slug || !f.body} onClick={submit}>{f.id ? "수정 저장" : "발행하기"}</Button>
        {f.id && <Button variant="outline" onClick={() => setF(empty)}>새 글로</Button>}
      </div>

      <div className="pt-2">
        <h3 className="mb-2 text-sm font-medium">올린 글 {guides.length}개</h3>
        <ul className="space-y-2 text-sm">
          {guides.map((g) => (
            <li key={g.id} className="flex items-center gap-2 rounded-xl border p-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${g.published ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{g.published ? "공개" : "비공개"}</span>
                  <span className="truncate font-medium">{g.title}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(g.created_at).toLocaleDateString("ko-KR")} · <a href={`/guide/${g.slug}`} target="_blank" rel="noreferrer" className="underline">글 보러 가기</a>
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setF({ id: g.id, slug: g.slug, title: g.title, description: g.description, body: g.body, published: g.published }); window.scrollTo({ top: 0 }); }}>고치기</Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                if (!confirm(`'${g.title}' 글을 지울까요?`)) return;
                await del({ data: { id: g.id } }); toast("지웠어요."); refresh();
              }}>삭제</Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
