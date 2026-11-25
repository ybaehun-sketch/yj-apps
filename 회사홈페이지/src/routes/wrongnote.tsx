import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/translations";

export const Route = createFileRoute("/wrongnote")({
  head: () => ({
    meta: [
      { title: "오답정복 — 이용방법 · 약관 · 개인정보처리방침 | YJ Studio" },
      { name: "description", content: "3초 등록, 쓱-지우개, 가림막 복습까지 한 번에! 수험생을 위한 가장 단순하고 확실한 오답노트, 오답정복의 이용방법, 이용약관 및 개인정보처리방침입니다." },
      { property: "og:title", content: "오답정복 안내 | YJ Studio" },
      { property: "og:description", content: "오답정복 이용방법, 서비스 이용약관 및 개인정보처리방침 안내." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WrongNotePage,
});

function WrongNotePage() {
  const { lang } = useLanguage();
  const wn = translations[lang].wrongnote || translations.ko.wrongnote!;

  const sectionLinks = [
    { href: "#guide", label: wn.tabs.guide },
    { href: "#terms", label: wn.tabs.terms },
    { href: "#privacy", label: wn.tabs.privacy },
  ];

  return (
    <LegalPage title={wn.pageTitle}>
      <p>
        {wn.introPrefix}
        <strong>{wn.introStrong}</strong>
        {wn.introSuffix}
      </p>

      <nav aria-label={wn.navAria} className="flex flex-wrap gap-2">
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

      {/* 이용방법 안내 */}
      <section id="guide" className="scroll-mt-20 space-y-4 border-t border-border pt-8">
        <h2>{wn.guideHeading}</h2>
        <p>{wn.guideIntro}</p>
        <ul className="space-y-3">
          {wn.guideSteps.map((step) => (
            <li key={step.title} className="leading-relaxed">
              <strong>{step.title}</strong> {step.body}
            </li>
          ))}
        </ul>
      </section>

      {/* 이용약관 */}
      <section id="terms" className="scroll-mt-20 space-y-4 border-t border-border pt-8">
        <h2>{wn.termsHeading}</h2>
        {wn.termsArticles.map((art) => (
          <p key={art.title} className="leading-relaxed">
            <strong>{art.title}</strong>
            <br />
            {art.body}
          </p>
        ))}
      </section>

      {/* 개인정보처리방침 (로컬 저장소 원칙 중심 명시) */}
      <section id="privacy" className="scroll-mt-20 space-y-4 border-t border-border pt-8">
        <h2>{wn.privacyHeading}</h2>
        <p>
          {wn.privacyContent.introPrefix}
          <strong>{wn.privacyContent.introStrong}</strong>
          {wn.privacyContent.introSuffix}
        </p>

        <h3>{wn.privacyContent.s1Title}</h3>
        <p>
          <strong>{wn.privacyContent.s1Highlight}</strong>
        </p>
        <ul>
          {wn.privacyContent.s1Items.map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong> {item.body}
            </li>
          ))}
        </ul>

        <h3>{wn.privacyContent.s2Title}</h3>
        <p>{wn.privacyContent.s2Body}</p>

        <h3>{wn.privacyContent.s3Title}</h3>
        <p>{wn.privacyContent.s3Body}</p>

        <h3>{wn.privacyContent.s4Title}</h3>
        <p>{wn.privacyContent.s4Body}</p>
        <ul>
          <li>
            <strong>{wn.privacyContent.s4ManagerLabel}</strong> {wn.privacyContent.s4ManagerValue}
          </li>
          <li>
            <strong>{wn.privacyContent.s4EmailLabel}</strong>{" "}
            <a className="text-primary underline" href="mailto:contact@yjstudio.app">
              contact@yjstudio.app
            </a>
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
