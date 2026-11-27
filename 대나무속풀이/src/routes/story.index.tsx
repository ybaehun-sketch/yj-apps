import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { storiesQuery as q } from "@/lib/stories-query";
const T = "속풀이 칼럼 — 대나무숲 속풀이";
const D = "얄미운 상사, 서운한 친구, 답답한 가족… 속 터지는 상황별 대처법과 내 마음 지키는 법을 읽어보세요.";

export const Route = createFileRoute("/story/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://bambooforest.app/story" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: StoryList,
});

function StoryList() {
  const { data } = useSuspenseQuery(q);
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 pb-12">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← 대나무숲에 외치러 가기</Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">🎋 속풀이 칼럼</h1>
      <p className="mt-2 text-base text-muted-foreground">{D}</p>
      <ul className="mt-8 space-y-3">
        {data.length === 0 && (
          <li className="rounded-2xl border border-border bg-card/70 p-6 text-sm text-muted-foreground">
            아직 등록된 칼럼이 없어요. <Link to="/" className="font-semibold text-primary underline underline-offset-4">대나무숲 홈</Link>에서 답답한 마음을 바로 털어놓아 보세요.
          </li>
        )}
        {data.map((g) => (
          <li key={g.slug}>
            <Link to="/story/$slug" params={{ slug: g.slug }} className="block rounded-2xl border border-border bg-card/70 p-5 transition hover:border-primary">
              <h2 className="font-serif text-lg font-bold">{g.title}</h2>
              {g.description && <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{new Date(g.created_at).toLocaleDateString("ko-KR")}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
