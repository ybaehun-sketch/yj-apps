import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";
import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/translations";

export const Route = createFileRoute("/tokbiseo")({
  head: () => ({
    meta: [
      { title: "톡비서 — 이용방법 · 약관 · 개인정보처리방침 | YJ Studio" },
      { name: "description", content: "던지기만 하면 AI가 알아서 정리하는 나만의 기억 비서, 톡비서의 이용방법, 이용약관 및 개인정보처리방침입니다." },
      { property: "og:title", content: "톡비서 안내 | YJ Studio" },
      { property: "og:description", content: "톡비서 이용방법, 서비스 이용약관 및 개인정보처리방침 안내." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TokbiseoPage,
});

function TokbiseoPage() {
  const { lang } = useLanguage();
  const tb = translations[lang].tokbiseo;

  const sectionLinks = [
    { href: "#guide", label: tb.tabs.guide },
    { href: "#terms", label: tb.tabs.terms },
    { href: "#privacy", label: tb.tabs.privacy },
  ];

  return (
    <LegalPage title={tb.pageTitle}>
      <p>
        {tb.introPrefix}
        <strong>{tb.introStrong}</strong>
        {tb.introSuffix}
      </p>

      <nav aria-label={tb.navAria} className="flex flex-wrap gap-2">
        {sectionLinks.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <section id="guide" className="scroll-mt-20 space-y-4 border-t border-border pt-8">
        <h2>{tb.guideHeading}</h2>
        <p>{tb.guideIntro}</p>
        <ul>
          {tb.guideSteps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong> {step.body}
            </li>
          ))}
        </ul>
      </section>

      <section id="terms" className="scroll-mt-20 space-y-4 border-t border-border pt-8">
        <h2>{tb.termsHeading}</h2>
        {tb.termsArticles.map((art) => (
          <p key={art.title}>
            <strong>{art.title}</strong>
            <br />
            {art.body}
          </p>
        ))}
      </section>

      <section id="privacy" className="scroll-mt-20 space-y-4 border-t border-border pt-8">
        <h2>{tb.privacyHeading}</h2>
        <PrivacyPolicyContent serviceName={tb.privacyServiceName} includeAiNotice headingLevel="h3" />
      </section>
    </LegalPage>
  );
}
