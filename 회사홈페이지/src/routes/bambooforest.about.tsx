import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "대나무숲 속풀이 이용방법 및 소개 | YJ Studio";
const PAGE_DESC = "회원가입 없이, 저장 없이 답답한 마음을 털어놓고 태우는 익명 AI 속풀이 공간입니다.";

export const Route = createFileRoute("/bambooforest/about")({
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
  component: BambooForestAboutPage,
});

function BambooForestAboutPage() {
  return (
    <LegalPage title="대나무숲 속풀이 이용방법 및 소개">
      <p>
        회원가입 없이, 흔적 없이 답답한 마음을 털어놓고 태우는 익명 공간{" "}
        <a className="text-primary underline" href="https://bambooforest.app" target="_blank" rel="noopener noreferrer">
          bambooforest.app
        </a>
        을 소개합니다.
      </p>

      <section>
        <h2>1. 이용 방법</h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li><strong>마음껏 털어놓기:</strong> 누구에게도 말 못 한 분노, 억울함, 서운함을 입력창에 편하게 적습니다.</li>
          <li><strong>상대 고르고 태우기:</strong> &apos;무조건 내 편&apos; 또는 &apos;싹싹 비는 가상 상대&apos;를 고른 뒤 버튼을 누르면 부적 종이가 활활 타오릅니다.</li>
          <li><strong>속 시원한 답장 &amp; 소각 영수증:</strong> AI가 내 편에서 맞장구치거나 대신 사과해 주며, 작성한 원문은 처리 즉시 사라집니다. 속이 후련해졌다면 소각 영수증을 받아 저장하거나 공유할 수 있습니다.</li>
        </ol>
      </section>

      <section>
        <h2>2. 이용 횟수 및 비저장 원칙</h2>
        <p>하루 1회 무료이며, 5초 숨 고르기 휴식을 거치면 하루 최대 2회 더 외칠 수 있습니다. 입력하신 글은 데이터베이스에 전혀 저장하지 않습니다.</p>
      </section>

      <section>
        <h2>3. AI 응답 및 위기 지원 안내</h2>
        <p>대나무숲 속풀이의 답변은 감정 환기를 돕기 위한 AI 엔터테인먼트·참고용 콘텐츠이며, 전문적인 의학·심리·법률 상담을 대신하지 않습니다.</p>
        <p>극심한 우울감이나 위기 상황에 놓여 계시다면 자살예방 상담전화(109) 또는 정신건강 상담전화(1577-0199) 등 전문 기관의 도움을 받으시기 바랍니다.</p>
      </section>
    </LegalPage>
  );
}
