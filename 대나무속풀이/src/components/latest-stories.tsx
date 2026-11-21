import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { storiesQuery } from "@/lib/stories-query";

export function LatestStories() {
  const { data = [] } = useQuery(storiesQuery);
  const items = data.slice(0, 8);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="latest-stories" className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <h2 id="latest-stories" className="font-display text-2xl font-bold">속이 뻥 뚫리는 속풀이 칼럼</h2>
        <Link to="/story" className="text-sm text-primary hover:underline">전체 보기 →</Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((g) => (
          <li key={g.slug}>
            <Link to="/story/$slug" params={{ slug: g.slug }} className="flex h-full flex-col rounded-2xl border border-border bg-card/70 p-5 transition hover:border-primary">
              <h3 className="font-serif text-lg font-bold leading-snug">{g.title}</h3>
              {g.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{g.description}</p>}
              <p className="mt-auto pt-3 text-xs text-muted-foreground">{new Date(g.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
