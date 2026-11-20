import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getStory } from "@/lib/stories.functions";
import { StoryBody } from "@/components/story-body";
import { Button } from "@/components/ui/button";

const q = (slug: string) => queryOptions({ queryKey: ["story", slug], queryFn: () => getStory({ data: { slug } }) });

export const Route = createFileRoute("/story/$slug")({
  staticData: { sitemap: true },
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "찾을 수 없는 글 — 대나무숲 속풀이" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.title} — 대나무숲 속풀이`;
    const d = loaderData.description || loaderData.body.slice(0, 120);
    return {
      meta: [
        { title: t }, { name: "description", content: d },
        { property: "og:title", content: t }, { property: "og:description", content: d },
        { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-md p-10 text-center">
      <p className="mb-4">찾으시는 글이 없어요.</p>
      <Link to="/story" className="underline">속풀이 칼럼으로</Link>
    </main>
  ),
  component: StoryPage,
});

function StoryPage() {
  const { slug } = Route.useParams();
  const { data: g } = useSuspenseQuery(q(slug));
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 pb-32">
      <Link to="/story" className="text-sm text-muted-foreground hover:text-foreground">← 속풀이 칼럼</Link>
      <article className="mt-4">
        <h1 className="font-serif text-3xl font-bold leading-snug">{g.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{new Date(g.created_at).toLocaleDateString("ko-KR")}</p>
        <div className="mt-8 rounded-3xl border border-border bg-card/70 p-6"><StoryBody body={g.body} /></div>
      </article>
      <section className="mt-8 rounded-3xl border border-primary/40 bg-card/70 p-6 text-center">
        <p className="font-serif text-lg font-bold">아직 속이 답답하신가요?</p>
        <p className="mt-1 text-base text-muted-foreground">아무에게도 말 못 할 이야기, 대나무숲에 외치고 흔적 없이 태우세요.</p>
        <Button asChild className="mt-4"><Link to="/">🔥 대나무숲에 외치러 가기</Link></Button>
      </section>
      <section className="mt-4 rounded-3xl border border-accent/50 bg-card/70 p-6 text-center">
        <p className="font-serif text-lg font-bold">마음 속 깊은 곳의 소리를 들어보세요</p>
        <p className="mt-1 text-base text-muted-foreground">복잡한 감정을 털어냈다면, 달빛 아래 따뜻한 차 한 잔과 함께 나의 운을 점쳐보세요.</p>
        <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90"><a href="https://teacuptarot.com" target="_blank" rel="noopener noreferrer">🍵 찻잔 타로 보러 가기</a></Button>
      </section>
    </main>
  );
}
