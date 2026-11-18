import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Menu, Sparkles, X, ListChecks, Moon, Coffee, Trees } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { ContactForm } from "@/components/ContactForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/translations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YJ Studio — Empowering Daily Life with Smart Software" },
      { name: "description", content: "와이제이스튜디오: 톡비서, 찻잔타로, 꿈소반, 대나무숲 속풀이 등 일상을 위한 웹·앱 서비스를 만드는 소프트웨어 스튜디오." },
      { property: "og:title", content: "YJ Studio — Empowering Daily Life with Smart Software" },
      { property: "og:description", content: "웹과 모바일로 삶을 더 편리하고 윤택하게 만드는 디지털 서비스 스튜디오." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();
  const t = translations[lang];

  const nav = [
    { href: "#about", label: t.nav.about },
    { href: "#products", label: t.nav.products },
    { href: "#contact", label: t.nav.contact },
  ];

  const products = [
    {
      icon: ListChecks,
      tag: t.products.items.tokbiseo.tag,
      name: t.products.items.tokbiseo.name,
      to: "/tokbiseo" as const,
      url: undefined as string | undefined,
      desc: t.products.items.tokbiseo.desc,
      quickLinks: [
        { hash: "terms", label: t.products.items.tokbiseo.quickLinks.terms },
        { hash: "privacy", label: t.products.items.tokbiseo.quickLinks.privacy },
        { hash: "guide", label: t.products.items.tokbiseo.quickLinks.guide },
      ],
    },
    { icon: Coffee, tag: t.products.items.tarot.tag, name: t.products.items.tarot.name, to: undefined, url: "https://teacuptarot.com", desc: t.products.items.tarot.desc, quickLinks: undefined },
    { icon: Moon, tag: t.products.items.dream.tag, name: t.products.items.dream.name, to: undefined, url: "https://dreamsoban.app", desc: t.products.items.dream.desc, quickLinks: undefined },
    { icon: Trees, tag: t.products.items.bamboo.tag, name: t.products.items.bamboo.name, to: undefined, url: "https://bambooforest.app", desc: t.products.items.bamboo.desc, quickLinks: undefined },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="font-display text-xl font-bold">YJ <span className="text-primary">Studio</span></a>
          <div className="flex items-center gap-4 md:gap-8">
            <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
              <LanguageSwitcher />
              {nav.map((n) => <a key={n.href} href={n.href} className="hover:text-foreground">{n.label}</a>)}
            </nav>
            <div className="md:hidden">
              <LanguageSwitcher />
            </div>
            <button className="md:hidden" aria-label={t.nav.menuAria} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-4 border-t border-border px-6 py-4 md:hidden">
            {nav.map((n) => <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>)}
          </nav>
        )}
      </header>

      <section className="relative overflow-hidden" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-6xl px-6 py-24 text-center md:py-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-accent shadow-xs"><Sparkles className="h-3 w-3" /> {t.hero.badge}</span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {t.hero.titlePrefix}<span className="text-primary">{t.hero.titleAccent}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{t.hero.description}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#products" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground shadow-sm transition hover:opacity-90">{t.hero.primaryCta} <ArrowRight className="h-4 w-4" /></a>
            <a href="#contact" className="rounded-full border border-border bg-card px-7 py-3 font-medium shadow-xs transition hover:bg-secondary">{t.hero.secondaryCta}</a>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">{t.about.eyebrow}</p>
        <div className="mt-4 grid gap-10 md:grid-cols-2">
          <h2 className="font-display text-3xl font-bold md:text-4xl">{t.about.headline}</h2>
          <p className="text-muted-foreground">{t.about.body}</p>
        </div>
      </section>

      <section id="products" className="scroll-mt-20 border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{t.products.eyebrow}</p>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">{t.products.title}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {products.map((p) => (
              <article key={p.name} className="group rounded-2xl border border-border bg-card p-8 shadow-xs transition hover:-translate-y-1 hover:border-primary hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><p.icon /></span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{p.tag}</span>
                </div>
                {p.to ? (
                  <Link to={p.to} className="mt-6 block">
                    <h3 className="text-xl font-bold group-hover:text-primary">{p.name}</h3>
                    <p className="mt-2 text-muted-foreground">{p.desc}</p>
                  </Link>
                ) : (
                  <>
                    <h3 className="mt-6 text-xl font-bold">{p.name}</h3>
                    <p className="mt-2 text-muted-foreground">{p.desc}</p>
                  </>
                )}
                {p.to && p.quickLinks ? (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {p.quickLinks.map((ql) => (
                      <Link
                        key={ql.hash}
                        to={p.to}
                        hash={ql.hash}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        {ql.label} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                ) : p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">{p.url.replace("https://", "")} <ArrowRight className="h-4 w-4" /></a>
                ) : (
                  <span className="mt-6 inline-block text-sm text-muted-foreground">Coming soon</span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-24">
        <div className="rounded-3xl border border-border p-10 text-center md:p-16" style={{ backgroundImage: "var(--gradient-hero)" }}>
          <h2 className="font-display text-3xl font-bold md:text-5xl">{t.contact.title}</h2>
          <p className="mt-4 text-muted-foreground">{t.contact.subtitle}</p>
          <ContactForm />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
