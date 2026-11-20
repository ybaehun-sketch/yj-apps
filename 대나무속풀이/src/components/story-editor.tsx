import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminDeleteStory, adminDraftStory, adminListStories, adminSaveStory, adminUploadStoryImage } from "@/lib/stories.functions";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StoryBody } from "@/components/story-body";
import { useEffect, useRef } from "react";

const empty = { id: undefined as string | undefined, slug: "", title: "", description: "", body: "", published: true };

const PROMPT_KEY = "story-ai-prompt";
const DEFAULT_PROMPT = `당신은 '대나무숲 속풀이'의 속풀이 칼럼 작가입니다.
- 독자: 직장 상사, 친구, 연인, 가족 때문에 속이 터져 "○○ 대처법"을 검색하는 20~40대
- 말투: 독자 편을 드는 다정하고 시원한 존댓말(~해요), 훈계·양비론 금지, 비속어 없음
- 구성: ## 소제목 4~5개 (공감 / 왜 이런 사람이 있는지 / 상황별 대처법 / 내 마음 지키는 법 / 오늘 해볼 일)
- 대처법은 - 목록으로 5개 이상, 문단은 2~3줄로 짧게, 분량 1,800~2,500자
- 검색 키워드를 문맥 속에 자연스럽게 3번 넣기
- 마지막은 "답답한 마음은 대나무숲에 외치고 태워 보세요"라는 부드러운 권유로 마무리`;

export function StoryEditor() {
  const list = useServerFn(adminListStories);
  const save = useServerFn(adminSaveStory);
  const del = useServerFn(adminDeleteStory);
  const draft = useServerFn(adminDraftStory);
  const qc = useQueryClient();
  const { data: stories = [] } = useQuery({ queryKey: ["admin-stories"], queryFn: () => list() });
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [topic, setTopic] = useState("");
  const [drafting, setDrafting] = useState(false);
  useEffect(() => { const s = localStorage.getItem(PROMPT_KEY); if (s) setPrompt(s); }, []);
  const savePrompt = (v: string) => { setPrompt(v); localStorage.setItem(PROMPT_KEY, v); };
  const upload = useServerFn(adminUploadStoryImage);
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
      const alt = window.prompt("사진 아래 보일 설명 (비워도 돼요)", "") || "";
      const pos = bodyRef.current?.selectionStart ?? f.body.length;
      const md = `\n\n![${alt.replace(/[[\]]/g, "")}](${url})\n\n`;
      setF((p) => ({ ...p, body: p.body.slice(0, pos) + md + p.body.slice(pos) }));
      toast.success("사진을 넣었어요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "사진을 올리지 못했어요.");
    } finally { setUploading(false); }
  };
  const set = (k: keyof typeof empty, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-stories"] }); qc.invalidateQueries({ queryKey: ["stories"] }); };

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
      <h2 className="font-serif text-xl">{f.id ? "글 고치기" : "새 글 쓰기"}</h2>
      <Input placeholder="제목 (예: 공 가로채는 직장 상사 대처법 총정리)" value={f.title} onChange={(e) => set("title", e.target.value)} />
      <div>
        <Input placeholder="주소 (예: boss-steals-credit)" value={f.slug} onChange={(e) => set("slug", e.target.value)} />
        <p className="mt-1 text-xs text-muted-foreground">/story/{f.slug || "주소"} · 영어 소문자, 숫자, 하이픈(-)만</p>
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
        <p className="mt-1 text-xs text-muted-foreground">## 소제목 · - 목록 · **굵게** · 빈 줄로 문단을 나눠요. 사진은 ![사진 설명](주소) 한 줄로 들어가요. 글 아래 "대나무숲에 외치기" 버튼은 자동으로 붙어요.</p>
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
            <p className="text-xs text-muted-foreground">/story/{f.slug || "주소"}</p>
            <h1 className="font-serif text-3xl font-bold leading-snug">{f.title || "제목 없음"}</h1>
            {f.description && <p className="text-sm text-muted-foreground">{f.description}</p>}
            <div className="mt-2 rounded-3xl border bg-card p-6"><StoryBody body={f.body} /></div>
            <section className="rounded-3xl border border-primary/30 bg-accent/40 p-6 text-center">
              <p className="font-serif text-lg font-bold">아직 속이 답답하신가요?</p>
              <p className="mt-1 text-sm text-muted-foreground">아무에게도 말 못 할 이야기, 대나무숲에 외치고 흔적 없이 태우세요.</p>
              <Button className="mt-4" tabIndex={-1}>🔥 대나무숲에 외치러 가기</Button>
            </section>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={busy || !f.title || !f.slug || !f.body} onClick={submit}>{f.id ? "수정 저장" : "발행하기"}</Button>
        {f.id && <Button variant="outline" onClick={() => setF(empty)}>새 글로</Button>}
      </div>

      <div className="pt-2">
        <h3 className="mb-2 text-sm font-medium">올린 글 {stories.length}개</h3>
        <ul className="space-y-2 text-sm">
          {stories.map((g) => (
            <li key={g.id} className="flex items-center gap-2 rounded-xl border p-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${g.published ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{g.published ? "공개" : "비공개"}</span>
                  <span className="truncate font-medium">{g.title}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(g.created_at).toLocaleDateString("ko-KR")} · <a href={`/story/${g.slug}`} target="_blank" rel="noreferrer" className="underline">글 보러 가기</a>
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
