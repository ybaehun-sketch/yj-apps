import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getGuide } from "@/lib/guides.functions";
import { GuideBody } from "@/components/GuideBody";
import { Button } from "@/components/ui/button";

const q = (slug: string) => queryOptions({ queryKey: ["guide", slug], queryFn: () => getGuide({ data: { slug } }) });

export const Route = createFileRoute("/guide/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.slug)),
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "찾을 수 없는 글 — 꿈소반" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.title} — 꿈소반`;
    const d = loaderData.description || loaderData.body.slice(0, 120);
    return {
      meta: [
        { title: t }, { name: "description", content: d },
        { property: "og:title", content: t }, { property: "og:description", content: d },
        { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: `https://dreamsoban.app/guide/${params.slug}` }],
    };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-md p-10 text-center">
      <p className="mb-4">찾으시는 글이 없어요.</p>
      <Link to="/guide" className="underline">꿈해몽 사전으로</Link>
    </main>
  ),
  component: GuidePage,
});

function GuidePage() {
  const { slug } = Route.useParams();
  const { data: g } = useSuspenseQuery(q(slug));
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/guide" className="text-sm text-muted-foreground hover:text-foreground">← 꿈해몽 사전</Link>
      <article className="mt-4">
        <h1 className="font-serif text-3xl font-bold leading-snug">{g.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{new Date(g.created_at).toLocaleDateString("ko-KR")}</p>
        <div className="glass mt-8 rounded-3xl p-6"><GuideBody body={g.body} /></div>
      </article>
      <section className="glass mt-8 rounded-3xl p-6 text-center">
        <p className="font-serif text-lg font-bold">내 꿈은 어떤 의미일까?</p>
        <p className="mt-1 text-base text-muted-foreground">꿈 내용을 적으면 AI가 전통 해몽과 심리학으로 풀어드려요.</p>
        <Button asChild className="mt-4"><Link to="/">🌙 내 꿈 직접 풀기</Link></Button>
      </section>
    </main>
  );
}
