import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "대나무숲 속풀이 개인정보처리방침 | YJ Studio";
const PAGE_DESC = "대나무숲 속풀이(bambooforest.app)의 비저장 익명 원칙과 개인정보처리방침 안내입니다.";

export const Route = createFileRoute("/bambooforest/privacy")({
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
  component: BambooForestPrivacyPage,
});

function BambooForestPrivacyPage() {
  return (
    <LegalPage title="대나무숲 속풀이 개인정보처리방침">
      <p>
        본 방침은 와이제이 스튜디오가 운영하는 <strong>대나무숲 속풀이</strong>(
        <a className="text-primary underline" href="https://bambooforest.app" target="_blank" rel="noopener noreferrer">
          bambooforest.app
        </a>
        ) 서비스의 개인정보 처리 기준을 안내합니다.
      </p>

      <section>
        <h2>1. 수집하지 않는 정보</h2>
        <p>회원가입이 없으며 이름, 연락처, 이메일 등 개인을 알아볼 수 있는 정보를 받지 않습니다.</p>
      </section>

      <section>
        <h2>2. 작성하신 글</h2>
        <p>입력한 글은 AI 답변을 만드는 데 한 번만 쓰이고 즉시 사라집니다. 서버에 저장하거나 기록하지 않습니다.</p>
      </section>

      <section>
        <h2>3. 기기에 남는 정보</h2>
        <p>
          오늘 사용 횟수, 대기 시간, 소리 설정 같은 숫자만 사용자 기기(브라우저)에 보관됩니다.
          브라우저 데이터를 지우면 함께 삭제됩니다.
        </p>
      </section>

      <section>
        <h2>4. 광고 및 쿠키</h2>
        <p>
          구글 애드센스 등 광고 사업자가 쿠키를 사용해 광고를 보여줄 수 있습니다.
          브라우저 설정이나 구글 광고 설정에서 맞춤 광고를 끌 수 있습니다.
        </p>
      </section>

      <section>
        <h2>5. AI 처리</h2>
        <p>답변 생성을 위해 글이 AI 제공사에 전달되며, 저장하지 않는 방식으로 요청합니다.</p>
      </section>

      <section>
        <h2>6. 운영 및 문의</h2>
        <p>
          서비스 운영: 와이제이 스튜디오 (YJ Studio) · 문의:{" "}
          <a className="text-primary underline" href="mailto:ceo@yjstudio.app">
            ceo@yjstudio.app
          </a>{" "}
          /{" "}
          <a className="text-primary underline" href="mailto:contact@yjstudio.app">
            contact@yjstudio.app
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
