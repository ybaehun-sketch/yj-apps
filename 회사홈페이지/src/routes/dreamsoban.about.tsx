import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "꿈소반 이용방법 및 소개 | YJ Studio";
const PAGE_DESC = "회원가입 없이 100% 익명으로 전통 해몽과 현대 심리학 시선으로 꿈을 풀어주는 AI 꿈해몽 서비스, 꿈소반을 소개합니다.";

export const Route = createFileRoute("/dreamsoban/about")({
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
  component: DreamsobanAboutPage,
});

function DreamsobanAboutPage() {
  return (
    <LegalPage title="꿈소반 이용방법 및 소개">
      <p>
        회원가입 없이 100% 익명으로 전통 해몽과 현대 심리학 시선으로 꿈을 풀어주는 AI 꿈해몽 서비스{" "}
        <a className="text-primary underline" href="https://dreamsoban.app" target="_blank" rel="noopener noreferrer">
          dreamsoban.app
        </a>
        을 소개합니다.
      </p>

      <section>
        <h2>1. 이용 방법</h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li><strong>꿈 적기:</strong> 기억나는 장면, 사람, 색깔, 감정을 편하게 적어 주세요. 뒤죽박죽이어도 괜찮아요.</li>
          <li><strong>꿈풀이 받기:</strong> 전통 해몽과 현대 심리학 두 시선으로 꿈의 핵심 상징을 풀어 드려요.</li>
          <li><strong>부적 또는 행운 번호:</strong> 꿈의 기운에 따라 내 꿈 맞춤 액막이 부적이나 행운 번호를 받아 저장하고 공유할 수 있어요.</li>
        </ol>
      </section>

      <section>
        <h2>2. 안심 원칙</h2>
        <p>회원가입 없이 100% 익명으로 이용하며, 꿈 내용은 서버에 저장하지 않아요. 하루 3번까지 무료로 이용할 수 있어요.</p>
      </section>

      <section>
        <h2>3. AI 꿈풀이 및 면책 안내</h2>
        <p>꿈소반의 모든 해몽과 부적·행운 번호는 인공지능(AI) 및 무작위 생성 기능을 활용한 가벼운 재미·성찰용 참고 콘텐츠입니다.</p>
        <p>전문적인 의학·심리·법률·재무 자문을 대신하지 않으며, 실제 복권 당첨이나 미래 예측을 보장하지 않습니다. 심리적으로 힘드시거나 위기 상황일 때는 자살예방 상담전화(109) 또는 정신건강 상담전화(1577-0199)에 연락해 주세요.</p>
      </section>
    </LegalPage>
  );
}
