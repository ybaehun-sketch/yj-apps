import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "꿈소반 이용약관 | YJ Studio";
const PAGE_DESC = "꿈소반(dreamsoban.app) AI 꿈해몽 서비스 이용약관 및 면책 안내입니다.";

export const Route = createFileRoute("/dreamsoban/terms")({
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
  component: DreamsobanTermsPage,
});

function DreamsobanTermsPage() {
  return (
    <LegalPage title="꿈소반 이용약관">
      <p>
        본 약관은 와이제이 스튜디오가 운영하는 <strong>꿈소반</strong>(
        <a className="text-primary underline" href="https://dreamsoban.app" target="_blank" rel="noopener noreferrer">
          dreamsoban.app
        </a>
        ) 서비스에 적용됩니다. (시행일: 2026년 11월 27일)
      </p>

      <section>
        <h2>1. 목적</h2>
        <p>본 약관은 와이제이 스튜디오(이하 &apos;운영사&apos;)가 제공하는 꿈소반(dreamsoban.app) 서비스의 이용 조건과 책임을 규정합니다.</p>
      </section>

      <section>
        <h2>2. 서비스 성격 및 면책</h2>
        <p>꿈소반의 해몽 결과, 액막이 부적, 행운 번호 추천은 AI 및 무작위 생성에 기반한 가벼운 재미·자기 성찰 참고용입니다.</p>
        <p>의학·심리·법률·투자·사행성 판단을 대신하거나 미래를 보장하지 않으며, 이를 근거로 한 결정의 책임은 이용자 본인에게 있습니다.</p>
      </section>

      <section>
        <h2>3. 위기 상황 안내</h2>
        <p>정서적 어려움이나 위기 상황에 놓인 경우 전문 기관(자살예방 상담전화 109, 정신건강 상담전화 1577-0199)의 도움을 받으시기 바랍니다.</p>
      </section>

      <section>
        <h2>4. 이용 제한</h2>
        <p>안정적인 운영을 위해 하루 무료 이용 횟수가 제한되며, 비정상적인 자동화 요청이나 서비스 방해 행위는 차단될 수 있습니다.</p>
      </section>

      <section>
        <h2>5. 약관 변경 및 운영자 정보</h2>
        <p>약관 변경 시 본 페이지에 고지합니다.</p>
        <p>서비스명: 꿈소반 (dreamsoban.app) · 운영: 와이제이 스튜디오 (YJ Studio)</p>
        <p>
          문의:{" "}
          <a className="text-primary underline" href="mailto:contact@yjstudio.app">
            contact@yjstudio.app
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
