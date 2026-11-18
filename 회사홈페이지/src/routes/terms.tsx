import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/translations";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "이용약관 | YJ Studio" },
      { name: "description", content: "와이제이스튜디오(YJ Studio) 서비스 이용약관입니다." },
      { property: "og:title", content: "이용약관 | YJ Studio" },
      { property: "og:description", content: "와이제이스튜디오가 제공하는 웹·앱 서비스의 이용 조건." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { lang } = useLanguage();
  const t = translations[lang].legal;

  return (
    <LegalPage title={t.termsTitle}>
      {t.termsSections.map((sec) => (
        <section key={sec.title}>
          <h2>{sec.title}</h2>
          <p>{sec.body}</p>
        </section>
      ))}
      <p>{t.termsContact}</p>
    </LegalPage>
  );
}
