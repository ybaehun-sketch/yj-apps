import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "꿈소반 개인정보처리방침 | YJ Studio";
const PAGE_DESC = "꿈소반(dreamsoban.app)의 무저장 원칙과 광고 쿠키 안내 등 개인정보처리방침입니다.";

export const Route = createFileRoute("/dreamsoban/privacy")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DreamsobanPrivacyPage,
});

function DreamsobanPrivacyPage() {
  return (
    <LegalPage title="꿈소반 개인정보처리방침">
      <p>
        본 방침은 와이제이 스튜디오가 운영하는 <strong>꿈소반</strong>(
        <a className="text-primary underline" href="https://dreamsoban.app" target="_blank" rel="noopener noreferrer">
          dreamsoban.app
        </a>
        ) 서비스의 개인정보 처리 기준을 안내합니다.
      </p>

      <section>
        <h2>1. 완벽한 무저장 원칙</h2>
        <p>
          입력하신 꿈과 고민은 AI 분석 요청에만 일시적으로 사용되며, 응답 직후 메모리에서 소멸됩니다.
          어떠한 데이터베이스나 로그에도 저장하지 않습니다.
        </p>
      </section>

      <section>
        <h2>2. 개인정보 미수집</h2>
        <p>꿈소반은 회원가입이 없으므로 이름, 연락처, 이메일 등 개인을 식별할 수 있는 정보를 수집하지 않습니다.</p>
      </section>

      <section>
        <h2>3. AI 분석 처리 안내</h2>
        <p>
          꿈 해몽 결과를 생성하기 위해 입력하신 텍스트는 암호화된 통신(HTTPS)을 통해 외부 AI 모델 제공사에 일시적으로 전달된 후 즉시 폐기되며,
          개인 식별 정보는 포함되지 않습니다.
        </p>
      </section>

      <section>
        <h2>4. 광고 쿠키 고지</h2>
        <p>
          본 사이트는 Google AdSense 등 제3자 광고 서비스를 사용할 수 있으며, 광고 사업자는 맞춤형 광고 제공을 위해 쿠키를 사용할 수 있습니다.
          이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>5. 개인정보 보호책임자 및 문의</h2>
        <p>
          책임자: 유배훈 (와이제이 스튜디오) · 문의:{" "}
          <a className="text-primary underline" href="mailto:contact@yjstudio.app">
            contact@yjstudio.app
          </a>{" "}
          /{" "}
          <a className="text-primary underline" href="mailto:ybaehun@gmail.com">
            ybaehun@gmail.com
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
