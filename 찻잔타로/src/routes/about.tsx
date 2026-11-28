import { createFileRoute, Link } from "@tanstack/react-router";
import { PERSONAS } from "@/lib/tarot";
import { PersonaAvatar } from "@/components/TarotCardView";
import { Button } from "@/components/ui/button";
import { useI18n, usePersonaText } from "@/lib/i18n";

const T = "서비스 소개 — 찻잔 타로";
const D = "따뜻한 차 한 잔 앞에서 마음을 털어놓는 AI 대화형 타로 상담 서비스, 찻잔 타로를 소개합니다.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  const personaText = usePersonaText();

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t("legalBack")}</Link>
        <h1 className="mt-4 font-serif text-3xl font-bold">{t("aboutTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("aboutIntro")}</p>
      </div>

      <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-warm">
        <h2 className="font-serif text-xl font-bold">{t("aboutHowTitle")}</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li><strong className="text-foreground">{t("aboutStep1Label")}</strong> {t("aboutStep1")}</li>
          <li><strong className="text-foreground">{t("aboutStep2Label")}</strong> {t("aboutStep2")}</li>
          <li><strong className="text-foreground">{t("aboutStep3Label")}</strong> {t("aboutStep3")}</li>
        </ol>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-warm">
        <h2 className="font-serif text-xl font-bold">{t("aboutPersonasTitle")}</h2>
        <div className="space-y-3">
          {Object.values(PERSONAS).map((p) => {
            const pt = personaText(p.id);
            return (
              <div key={p.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/50 p-4">
                <PersonaAvatar id={p.id} emoji={p.emoji} className="size-12 shrink-0 text-2xl" />
                <div>
                  <p className="font-serif font-bold">{pt.name} <span className="text-xs font-normal text-muted-foreground">· {pt.title}</span></p>
                  <p className="mt-1 text-sm text-muted-foreground">{pt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2 rounded-3xl border bg-card p-6 text-sm leading-relaxed text-muted-foreground shadow-warm">
        <h2 className="font-serif text-lg font-bold text-foreground">{t("aboutDiscTitle")}</h2>
        <p>{t("aboutDisc1")}</p>
        <p>{t("aboutDisc2")}</p>
      </section>

      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link to="/">{t("aboutCta")}</Link>
        </Button>
      </div>
    </main>
  );
}
