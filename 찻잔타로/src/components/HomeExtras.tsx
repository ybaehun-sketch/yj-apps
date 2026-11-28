import { Link } from "@tanstack/react-router";
import { AD_ONLY_MODE } from "@/lib/access";
import { useI18n } from "@/lib/i18n";

// 애드센스 심사용 탐색/콘텐츠 노출 영역 — 승인 후 필요시 이 파일 사용처만 지우면 원복됩니다.
export function SiteNav() {
  const { t } = useI18n();
  return (
    <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
      <Link to="/" className="font-serif text-lg font-bold">🍵 {t("brandTitle")}</Link>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground font-semibold" }}>{t("home")}</Link>
        <Link to="/guide" activeProps={{ className: "text-foreground font-semibold" }}>{t("navGuide")}</Link>
        {!AD_ONLY_MODE && (
          <Link to="/membership" activeProps={{ className: "text-foreground font-semibold" }}>{t("navMembership")}</Link>
        )}
      </div>
    </nav>
  );
}

type G = { slug: string; title: string; description: string | null; created_at: string };

export function LatestGuides({ guides }: { guides: G[] }) {
  const { t, lang } = useI18n();
  if (!guides.length) return null;
  const locale = lang === "ja" ? "ja-JP" : lang === "zh-TW" ? "zh-TW" : lang === "en" ? "en-US" : "ko-KR";
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold">{t("guidesTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("guidesSubtitle")}</p>
        </div>
        <Link to="/guide" className="shrink-0 text-sm text-primary hover:underline">{t("guidesViewAll")}</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {guides.slice(0, 8).map((g) => (
          <Link key={g.slug} to="/guide/$slug" params={{ slug: g.slug }}
            className="block rounded-2xl border bg-card p-5 shadow-warm hover:border-primary">
            <h3 className="font-serif text-lg font-bold leading-snug">{g.title}</h3>
            {g.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{new Date(g.created_at).toLocaleDateString(locale)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
