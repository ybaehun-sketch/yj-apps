import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Send, Trash2, RefreshCw, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StudioAppBlock } from "@/lib/studio-blocks/registry";
import {
  hubDeleteRemotePost,
  hubGenerateBlogDraft,
  hubGetBlogFreshness,
  hubListRemotePosts,
  hubSaveRemotePost,
} from "@/lib/admin-hub.functions";

function formatElapsedBadge(lastPublishedAt: string | null | undefined, connected?: boolean) {
  if (!connected) return { text: "미연결", urgent: false };
  if (!lastPublishedAt) return { text: "발행 없음", urgent: true };
  const diffMs = Date.now() - new Date(lastPublishedAt).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return { text: "오늘", urgent: false };
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return { text: "방금", urgent: false };
  if (hours < 24) return { text: `${hours}시간 전`, urgent: false };
  const days = Math.floor(hours / 24);
  return { text: `${days}일 전`, urgent: days >= 5 };
}

interface Props {
  blogApps: Array<StudioAppBlock & { remoteConnected: boolean }>;
  geminiConfigured: boolean;
}

const emptyForm = {
  id: undefined as string | undefined,
  slug: "",
  title: "",
  description: "",
  body: "",
  published: true,
};

export function UnifiedBlogStudio({ blogApps, geminiConfigured }: Props) {
  const [selectedKey, setSelectedKey] = useState(blogApps[0]?.key ?? "uldongne");
  const activeApp = blogApps.find((a) => a.key === selectedKey) ?? blogApps[0];

  const listFn = useServerFn(hubListRemotePosts);
  const freshnessFn = useServerFn(hubGetBlogFreshness);
  const saveFn = useServerFn(hubSaveRemotePost);
  const deleteFn = useServerFn(hubDeleteRemotePost);
  const draftFn = useServerFn(hubGenerateBlogDraft);
  const qc = useQueryClient();

  const appKeys = blogApps.map((a) => a.key);
  const { data: freshness } = useQuery({
    queryKey: ["hub-blog-freshness", appKeys.join(",")],
    queryFn: () => freshnessFn({ data: { appKeys } }),
    enabled: appKeys.length > 0,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["hub-remote-posts", selectedKey],
    queryFn: () => listFn({ data: { appKey: selectedKey } }),
    enabled: Boolean(selectedKey),
  });

  const [form, setForm] = useState(emptyForm);
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState(activeApp?.defaultAiPrompt ?? "");
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    setForm(emptyForm);
    setTopic("");
    setPrompt(activeApp?.defaultAiPrompt ?? "");
  }, [selectedKey, activeApp?.defaultAiPrompt]);

  const isUldongne = selectedKey === "uldongne";

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("글쓰기 지침을 먼저 입력해 주세요.");
      return;
    }
    setDrafting(true);
    try {
      const res = await draftFn({ data: { appKey: selectedKey, prompt, topic } });
      setForm({
        id: undefined,
        slug: res.slug,
        title: res.title,
        description: res.description,
        body: res.body,
        published: true,
      });
      toast.success("AI 초안을 작성했어요. 내용을 다듬은 뒤 저장해 주세요.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "초안을 만들지 못했어요.");
    } finally {
      setDrafting(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("제목과 본문을 모두 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      await saveFn({
        data: {
          appKey: selectedKey,
          id: form.id,
          slug: form.slug || undefined,
          title: form.title,
          description: form.description || undefined,
          body: form.body,
          published: form.published,
        },
      });
      toast.success(form.published ? `${activeApp?.name}에 발행했어요.` : "임시 저장했어요.");
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["hub-remote-posts", selectedKey] });
      qc.invalidateQueries({ queryKey: ["hub-blog-freshness"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 글을 삭제(또는 숨김) 처리할까요?")) return;
    setBusy(true);
    try {
      await deleteFn({ data: { appKey: selectedKey, id } });
      toast.success("처리했어요.");
      if (form.id === id) setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["hub-remote-posts", selectedKey] });
      qc.invalidateQueries({ queryKey: ["hub-blog-freshness"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 앱 선택 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap gap-2">
          {blogApps.map((app) => {
            const active = app.key === selectedKey;
            const fInfo = freshness?.[app.key];
            const elapsed = formatElapsedBadge(fInfo?.lastPublishedAt, fInfo?.connected ?? app.remoteConnected);
            return (
              <button
                key={app.key}
                type="button"
                onClick={() => setSelectedKey(app.key)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <span>{app.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    active
                      ? "bg-white/20 text-white"
                      : elapsed.urgent
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {elapsed.text}
                </span>
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 연결 상태 안내 배너 */}
      {!data?.connected && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">{activeApp?.name} 창고 연결 열쇠가 아직 등록되지 않았어요.</p>
            <p className="mt-1 text-xs text-amber-800">
              서버 설정에 <code className="rounded bg-amber-100 px-1 py-0.5">REMOTE_{activeApp?.remoteEnvPrefix}_URL</code>과{" "}
              <code className="rounded bg-amber-100 px-1 py-0.5">REMOTE_{activeApp?.remoteEnvPrefix}_SERVICE_KEY</code>를 넣으면
              기존 {activeApp?.name} 글 목록을 바로 불러와 여기서 발행할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 울동네 순찰 요약 */}
      {isUldongne && data?.patrolSummary && (
        <div className="flex items-center gap-6 rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <span>
            전체 복지 수집처: <strong className="text-foreground">{data.patrolSummary.total}곳</strong>
          </span>
          <span>
            오류 수집처:{" "}
            <strong className={data.patrolSummary.errorCount > 0 ? "text-destructive" : "text-emerald-600"}>
              {data.patrolSummary.errorCount}곳
            </strong>
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 왼쪽: 글 작성/수정 및 AI 초안 */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {form.id ? "글 수정 및 발행" : isUldongne ? "울동네 초안 검수" : `${activeApp?.name} 새 글 작성`}
            </h3>
            {form.id && (
              <Button variant="ghost" size="sm" onClick={() => setForm(emptyForm)}>
                새 글로 초기화
              </Button>
            )}
          </div>

          {!isUldongne && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> AI 초안 자동 작성
                </span>
                <span className="text-xs text-muted-foreground">
                  {geminiConfigured ? "AI 연결 준비됨" : "AI 열쇠(GEMINI_API_KEY) 필요"}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="글 주제를 입력하세요 (예: 헤어진 연인 재회 꿈 해몽)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={drafting || !geminiConfigured}
                >
                  {drafting ? "작성 중..." : "초안 생성"}
                </Button>
              </div>
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">앱 맞춤 글쓰기 지침 보기/수정</summary>
                <Textarea
                  className="mt-2 min-h-[100px] text-xs"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </details>
            </div>
          )}

          <div className="space-y-3">
            {!isUldongne && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">주소 이름 (영어·하이픈)</label>
                  <Input
                    placeholder="example-post-slug"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">한 줄 요약</label>
                  <Input
                    placeholder="검색 화면에 보일 짧은 설명"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">제목</label>
              <Input
                placeholder="글 제목을 입력하세요"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">본문 내용</label>
              <Textarea
                className="min-h-[280px] font-sans text-sm leading-relaxed"
                placeholder="본문을 작성하거나 오른쪽 목록에서 기존 글을 선택하세요"
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                <span>저장 즉시 사이트에 공개 발행</span>
              </label>
              <Button onClick={handleSave} disabled={busy || !data?.connected}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {busy ? "저장 중..." : form.published ? "저장 및 발행" : "임시 저장"}
              </Button>
            </div>
          </div>
        </div>

        {/* 오른쪽: 기존 글/초안 목록 */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {isUldongne ? "블로그 초안 · 발행 목록" : "등록된 글 목록"}
            </h3>
            <span className="text-xs text-muted-foreground">{data?.items.length ?? 0}건</span>
          </div>

          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>}
            {!isLoading && (data?.items.length ?? 0) === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {data?.connected ? "등록된 글이 없습니다." : "연결 열쇠를 등록하면 글 목록이 나타납니다."}
              </p>
            )}
            {data?.items.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-3 transition-colors ${
                  form.id === item.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() =>
                      setForm({
                        id: item.id,
                        slug: item.slug ?? "",
                        title: item.title,
                        description: item.description ?? "",
                        body: item.body,
                        published: item.published,
                      })
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      {item.published ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      )}
                      <span className="line-clamp-1 text-sm font-medium">{item.title}</span>
                    </div>
                    {item.description && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
