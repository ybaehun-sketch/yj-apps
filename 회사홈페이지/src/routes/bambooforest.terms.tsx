import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "대나무숲 속풀이 이용약관 | YJ Studio";
const PAGE_DESC = "대나무숲 속풀이(bambooforest.app) 서비스 이용약관 및 AI 답변 면책 안내입니다.";

export const Route = createFileRoute("/bambooforest/terms")({
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
  component: BambooForestTermsPage,
});

function BambooForestTermsPage() {
  return (
    <LegalPage title="대나무숲 속풀이 이용약관">
      <p>
        본 약관은 와이제이 스튜디오가 운영하는 <strong>대나무숲 속풀이</strong>(
        <a className="text-primary underline" href="https://bambooforest.app" target="_blank" rel="noopener noreferrer">
          bambooforest.app
        </a>
        ) 서비스에 적용됩니다. (시행일: 2026년 11월)
      </p>

      <section>
        <h2>1. 서비스 목적</h2>
        <p>대나무숲 속풀이는 익명으로 감정을 털어놓고 AI의 맞장구와 위로를 받는 오락·감정 해소용 서비스입니다.</p>
      </section>

      <section>
        <h2>2. AI 답변 면책</h2>
        <p>
          AI 답변은 재미와 위로를 위한 것으로, 의료·법률·심리 상담 등 전문 서비스를 대신하지 않습니다.
          가상 상대의 사과는 허구의 역할극입니다.
        </p>
      </section>

      <section>
        <h2>3. 이용 제한</h2>
        <p>
          자동화 도구를 이용한 반복 요청, 타인을 해치려는 목적의 이용은 제한될 수 있습니다.
          무료 외치기는 하루 1회, 숨 고르기 충전은 하루 2회이며 연속 이용은 3초 간격입니다.
        </p>
      </section>

      <section>
        <h2>4. 위기 상황 안내</h2>
        <p>
          스스로를 해치고 싶은 마음이 든다면 자살예방상담전화 109 또는 정신건강위기상담전화 1577-0199로 언제든 연락하세요.
        </p>
      </section>

      <section>
        <h2>5. 약관 변경 및 운영자 정보</h2>
        <p>약관이 바뀌면 이 페이지에 공지합니다.</p>
        <p>서비스명: 대나무숲 속풀이 (bambooforest.app)</p>
        <p>운영: 와이제이 스튜디오 (YJ Studio)</p>
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
