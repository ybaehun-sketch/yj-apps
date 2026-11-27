import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listGuides } from "@/lib/guides.functions";

const q = queryOptions({ queryKey: ["guides"], queryFn: () => listGuides() });
const T = "꿈해몽 사전 — 꿈소반";
const D = "이가 빠지는 꿈, 돼지꿈, 뱀꿈… 간밤의 꿈이 마음에 걸린다면 전통 해몽과 심리학으로 풀어낸 꿈풀이 글을 읽어보세요.";

export const Route = createFileRoute("/guide/")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://dreamsoban.app/guide" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: GuideList,
});

function GuideList() {
  const { data } = useSuspenseQuery(q);
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← 내 꿈 풀러 가기</Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">🌙 꿈해몽 사전</h1>
      <p className="mt-2 text-base text-muted-foreground">{D}</p>
      <ul className="mt-8 space-y-3">
        {data.length === 0 && (
          <li className="glass rounded-2xl p-6 text-sm text-muted-foreground">
            아직 등록된 칼럼이 없어요. <Link to="/" className="font-semibold text-moon underline underline-offset-4">꿈소반 홈</Link>에서 내 꿈을 직접 풀어보세요.
          </li>
        )}
        {data.map((g) => (
          <li key={g.slug}>
            <Link to="/guide/$slug" params={{ slug: g.slug }} className="glass block rounded-2xl p-5 transition hover:border-primary">
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
