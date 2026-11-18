import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/translations";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { lang } = useLanguage();
  const t = translations[lang].legal;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-display text-lg font-bold">YJ <span className="text-primary">Studio</span></Link>
        <LanguageSwitcher />
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.effectiveDate}</p>
        <div className="mt-10 space-y-8 leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
