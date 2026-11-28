import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

export type Section = { title: string; body: ReactNode };

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: Section[] }) {
  const { t, lang } = useI18n();
  const notice = t("legalNotice");
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t("legalBack")}</Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">{t("legalEffective")} {updated}</p>
      {notice && <p className="mt-2 text-xs text-muted-foreground/80">{notice}</p>}
      <div className="mt-8 space-y-7 rounded-3xl border bg-card p-6 text-sm leading-relaxed shadow-warm">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="mb-2 font-serif text-base font-bold">{t("legalArticle", { n: i + 1 })} {s.title}</h2>
            <div className="space-y-1.5 text-muted-foreground">{s.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}

export function LegalLinks() {
  const { t } = useI18n();
  return (
    <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
      <Link to="/about" className="underline-offset-2 hover:underline">{t("legalAbout")}</Link>
      <span aria-hidden>·</span>
      <Link to="/guide" className="underline-offset-2 hover:underline">{t("legalGuides")}</Link>
      <span aria-hidden>·</span>
      <Link to="/contact" className="underline-offset-2 hover:underline">{t("legalContact")}</Link>
      <span aria-hidden>·</span>
      <Link to="/terms" className="underline-offset-2 hover:underline">{t("legalTerms")}</Link>
      <span aria-hidden>·</span>
      <Link to="/privacy" className="font-semibold underline-offset-2 hover:underline">{t("legalPrivacy")}</Link>
    </p>
  );
}
