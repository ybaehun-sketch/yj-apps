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
          와이제이스튜디오(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 철저히 준수하며, <strong>오답정복</strong> 이용자의 프라이버시를 최우선으로 보호합니다.
        </p>
        
        <h3>1. 개인정보 수집 여부 및 기기 내 로컬 저장 원칙</h3>
        <p>
          <strong>오답정복은 별도의 회원가입이나 계정 생성 없이 전 기능을 바로 이용하실 수 있습니다.</strong>
        </p>
        <ul>
          <li><strong>학습 데이터 로컬 보관:</strong> 이용자가 앱에 등록하는 오답 문제 사진, 정답 사진, 메모, 과목 분류 및 복습 기록은 회사의 외부 서버로 전송되지 않으며, 오직 이용자의 기기(로컬 브라우저 저장소)에만 안전하게 암호화 보관됩니다.</li>
          <li><strong>회원 정보 미수집:</strong> 이름, 전화번호, 주민등록번호 등 식별 가능한 개인정보를 일체 수집하거나 요구하지 않습니다.</li>
          <li><strong>기기 정보:</strong> 서비스 안정성 개선 및 화면 비율 최적화를 위해 브라우저 종류 및 화면 해상도 등의 비식별 기술 정보가 일시적으로 참조될 수 있으나 영구 저장되지 않습니다.</li>
        </ul>

        <h3>2. 개인정보의 제3자 제공 및 위탁</h3>
        <p>
          회사는 이용자의 개인정보나 학습 사진 데이터를 외부에 제공하거나 위탁하지 않습니다. 모든 오답 데이터는 이용자의 기기 내부에서만 처리됩니다.
        </p>

        <h3>3. 데이터의 파기 및 이용자 권리</h3>
        <p>
          이용자는 앱 내에서 언제든지 개별 오답 문제를 삭제하거나 과목을 비울 수 있으며, 앱 또는 브라우저 데이터를 초기화할 경우 모든 학습 기록은 기기에서 즉시 영구 삭제됩니다.
        </p>

        <h3>4. 개인정보 보호책임자 및 문의처</h3>
        <p>
          서비스 이용 및 개인정보 보호와 관련된 모든 문의는 아래 전용 창구로 접수해 주시면 성심껏 안내해 드립니다.
        </p>
        <ul>
          <li><strong>책임자:</strong> 와이제이스튜디오 개인정보 보호팀</li>
          <li><strong>문의 이메일:</strong> <a className="text-primary underline" href="mailto:contact@yjstudio.app">contact@yjstudio.app</a></li>
        </ul>
      </section>
    </LegalPage>
  );
}
