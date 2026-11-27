import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "찻잔타로 이용방법 및 소개 | YJ Studio";
const PAGE_DESC = "따뜻한 차 한 잔 앞에서 마음을 털어놓는 AI 대화형 타로 상담 서비스, 찻잔 타로 이용방법을 안내합니다.";

export const Route = createFileRoute("/teacuptarot/about")({
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
  component: TeacupTarotAboutPage,
});

function TeacupTarotAboutPage() {
  return (
    <LegalPage title="찻잔타로 이용방법 및 소개">
      <p>
        복잡한 하루 끝에 따뜻한 차 한 잔을 마주하듯, 마음을 편히 내려놓을 수 있는 대화형 타로 공간{" "}
        <a className="text-primary underline" href="https://teacuptarot.com" target="_blank" rel="noopener noreferrer">
          teacuptarot.com
        </a>
        을 소개합니다.
      </p>

      <section>
        <h2>1. 이용 방법</h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li><strong>고민 적기:</strong> 지금 마음을 무겁게 하는 이야기나 궁금한 선택지를 편하게 적습니다.</li>
          <li><strong>상담사·카드 3장 고르기:</strong> 원하는 대화 분위기의 상담사를 고르고 직감으로 3장의 카드를 뽑습니다.</li>
          <li><strong>대화 나누기 &amp; 마음 처방전:</strong> 카드 풀이를 바탕으로 대화를 이어가고, 상담이 끝나면 한 줄 마음 처방전 카드를 받아 간직할 수 있습니다.</li>
        </ol>
      </section>

      <section>
        <h2>2. 함께하는 세 명의 AI 상담사</h2>
        <ul>
          <li><strong>다정한 언니:</strong> 따뜻하고 공감 어린 시선으로 이야기를 들어주는 상담사</li>
          <li><strong>신비로운 마녀:</strong> 카드의 상징과 직관을 깊이 있게 짚어주는 상담사</li>
          <li><strong>냉철한 팩트폭격러:</strong> 감정에 치우치지 않고 현실적인 방향을 짚어주는 상담사</li>
        </ul>
      </section>

      <section>
        <h2>3. AI 상담 및 면책 안내</h2>
        <p>찻잔 타로의 모든 카드 해석과 대화는 인공지능(AI)이 생성하는 가벼운 성찰·엔터테인먼트용 참고 콘텐츠입니다.</p>
        <p>전문적인 의학·심리·법률·투자 자문을 대신하지 않으며, 위기 상황이거나 전문적인 도움이 필요하실 때는 보건복지상담센터(129) 또는 자살예방 상담전화(109) 등 전문 기관의 도움을 받으시길 권장합니다.</p>
      </section>
    </LegalPage>
  );
}
