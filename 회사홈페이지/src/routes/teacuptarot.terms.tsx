import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "찻잔타로 이용약관 | YJ Studio";
const PAGE_DESC = "찻잔 타로 AI 상담 서비스의 이용 조건과 이용 제한 기준을 안내해요.";

export const Route = createFileRoute("/teacuptarot/terms")({
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
  component: TeacupTarotTermsPage,
});

function TeacupTarotTermsPage() {
  return (
    <LegalPage title="찻잔타로 이용약관">
      <p>
        본 약관은 와이제이 스튜디오가 운영하는 <strong>찻잔 타로</strong>(
        <a className="text-primary underline" href="https://teacuptarot.com" target="_blank" rel="noopener noreferrer">
          teacuptarot.com
        </a>
        ) 서비스에 적용됩니다. (시행일: 2026년 11월 27일)
      </p>

      <section>
        <h2>1. 목적</h2>
        <p>이 약관은 찻잔 타로(이하 &quot;서비스&quot;)를 이용하는 조건과 절차, 이용자와 운영자의 권리·의무를 정해요.</p>
      </section>

      <section>
        <h2>2. 서비스의 성격</h2>
        <p>서비스의 모든 상담은 인공지능(AI) 상담사와 나누는 대화예요. 타로 카드를 매개로 마음을 돌아보고 위로를 얻기 위한 오락·참고용 콘텐츠예요.</p>
        <p>AI의 답변은 사실과 다르거나 부정확할 수 있으며, 미래를 예언하거나 결과를 보장하지 않아요.</p>
      </section>

      <section>
        <h2>3. 전문 조언의 제한</h2>
        <p>서비스는 의료·건강, 법률, 투자·금융 등 전문 자격과 법적 책임이 따르는 영역의 진단, 판단, 자문을 제공하지 않으며 이를 대신할 수 없어요.</p>
        <p>이용자가 상담 내용을 근거로 내린 결정의 책임은 이용자에게 있어요. 위급한 상황에서는 119, 자살예방상담 109 등 전문 기관에 바로 연락해 주세요.</p>
      </section>

      <section>
        <h2>4. 이용 방법</h2>
        <p>서비스는 만 14세 이상 누구나 별도의 회원가입 없이 무료로 이용할 수 있어요.</p>
        <p>하루 무료 상담 횟수와 대화 이어가기 횟수는 원활한 서비스 운영을 위해 정해져 있으며, 운영 상황에 따라 바뀔 수 있어요.</p>
      </section>

      <section>
        <h2>5. 이용 제한</h2>
        <p>다음의 경우 경고 없이 상담 이용이 제한될 수 있어요.</p>
        <ul>
          <li>의료·법률·투자 등 전문 자문을 반복해서 요구하는 경우</li>
          <li>욕설, 혐오, 성적인 내용 등 부적절한 대화를 이어가는 경우</li>
          <li>타인의 개인정보나 사생활을 알아내려는 목적으로 이용하는 경우</li>
          <li>범죄나 자해를 조장하는 내용을 입력하는 경우</li>
          <li>자동화 도구 사용 등으로 서비스 운영을 방해하는 경우</li>
        </ul>
      </section>

      <section>
        <h2>6. 콘텐츠의 권리</h2>
        <p>찻잔 타로의 상담 문구, 카드 해설, 가이드 글, 디자인 등 서비스 안의 저작물에 대한 권리는 운영자에게 있어요.</p>
        <p>운영자의 동의 없이 콘텐츠를 복제·배포하거나, 자동화 도구로 수집하거나, 다른 인공지능의 학습 자료로 쓰는 것은 허용되지 않아요.</p>
      </section>

      <section>
        <h2>7. 건강한 이용</h2>
        <p>찻잔 타로는 마음을 잠시 들여다보고 쉬어가는 공간이에요. 결과에 지나치게 기대기보다 하나의 조언으로 가볍게 참고해 주세요.</p>
        <p>깊은 우울감이나 위기를 겪고 계시다면 보건복지상담센터 129, 자살예방상담 109 등 전문 기관에 꼭 도움을 요청해 주세요.</p>
      </section>

      <section>
        <h2>8. 서비스의 변경·중단 및 면책</h2>
        <p>운영자는 점검, 장애, 운영상 필요에 따라 서비스의 일부 또는 전부를 바꾸거나 중단할 수 있으며, 가능한 한 미리 알려드려요.</p>
        <p>운영자는 천재지변, 외부 AI·호스팅 서비스 장애 등 운영자의 책임이 없는 사유로 생긴 손해에 대해 책임지지 않아요. 또한 AI 답변을 근거로 한 이용자의 결정과 그 결과에 대해서도 책임지지 않아요.</p>
      </section>

      <section>
        <h2>9. 분쟁 해결 및 운영자 정보</h2>
        <p>서비스 이용과 관련한 분쟁은 대한민국 법을 따르며, 관할 법원은 민사소송법에 따라 정해요.</p>
        <p>서비스명: 찻잔 타로 (teacuptarot.com) · 운영: 와이제이 스튜디오</p>
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
