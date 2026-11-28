import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listGuides } from "@/lib/guides.functions";
import { useI18n } from "@/lib/i18n";

const q = queryOptions({ queryKey: ["guides"], queryFn: () => listGuides() });
const T = "마음 찻집 이야기 — 찻잔 타로";
const D = "잠 못 드는 밤, 혼자 끙끙대던 연애·일·관계 고민에 따뜻한 차 한잔 같은 글을 건네요.";

export const Route = createFileRoute("/guide/")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: GuideList,
});

function GuideList() {
  const { data } = useSuspenseQuery(q);
  const { t, lang } = useI18n();
  const locale = lang === "ja" ? "ja-JP" : lang === "zh-TW" ? "zh-TW" : lang === "en" ? "en-US" : "ko-KR";

  return (
    <main className="mx-auto max-w-[840px] px-5 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t("legalBack")}</Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">{t("guidesTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("guideListDesc")}</p>
      <ul className="mt-8 space-y-3">
        {data.length === 0 && <li className="text-sm text-muted-foreground">{t("guideEmpty")}</li>}
        {data.map((g) => (
          <li key={g.slug}>
            <Link to="/guide/$slug" params={{ slug: g.slug }} className="block rounded-2xl border bg-card p-5 shadow-warm hover:border-primary">
              <h2 className="font-serif text-lg font-bold">{g.title}</h2>
              {g.description && <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{new Date(g.created_at).toLocaleDateString(locale)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
