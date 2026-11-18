import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";
import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/translations";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "개인정보처리방침 | YJ Studio" },
      { name: "description", content: "와이제이스튜디오(YJ Studio)의 개인정보처리방침입니다." },
      { property: "og:title", content: "개인정보처리방침 | YJ Studio" },
      { property: "og:description", content: "와이제이스튜디오 서비스의 개인정보 수집·이용·보관 정책." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang } = useLanguage();
  const t = translations[lang].legal;

  return (
    <LegalPage title={t.privacyTitle}>
      <PrivacyPolicyContent includeAiNotice />
    </LegalPage>
  );
}
