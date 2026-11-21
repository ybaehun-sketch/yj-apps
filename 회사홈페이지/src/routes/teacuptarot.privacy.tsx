import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "찻잔타로 개인정보처리방침 | YJ Studio";
const PAGE_DESC = "찻잔 타로가 어떤 개인정보를 왜 모으고, 얼마나 보관하며, 어떻게 지우는지 안내해요.";

export const Route = createFileRoute("/teacuptarot/privacy")({
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
  component: TeacupTarotPrivacyPage,
});

function TeacupTarotPrivacyPage() {
  return (
    <LegalPage title="찻잔타로 개인정보처리방침">
      <p>
        본 방침은 와이제이 스튜디오가 운영하는 <strong>찻잔 타로</strong>(
        <a className="text-primary underline" href="https://teacuptarot.com" target="_blank" rel="noopener noreferrer">
          teacuptarot.com
        </a>
        ) 서비스의 개인정보 처리 기준을 안내합니다.
      </p>

      <section>
        <h2>1. 수집하는 개인정보</h2>
        <ul>
          <li>회원가입: 이메일 주소, (구글 가입 시) 이름과 프로필 정보</li>
          <li>상담 이용: 고민 내용, 뽑은 카드, 상담사와 나눈 대화 기록</li>
          <li>결제: 주문 번호, 상품, 결제 금액과 일시 (카드 번호 등은 결제대행사가 처리하며 저장하지 않아요)</li>
          <li>자동 수집: 이용 횟수 기록, 접속 일시, 기기·브라우저 정보</li>
        </ul>
      </section>

      <section>
        <h2>2. 이용 목적</h2>
        <ul>
          <li>로그인과 본인 확인, 상담 기록 보관</li>
          <li>AI 상담 답변 생성</li>
          <li>유료 상품 결제와 환불 처리</li>
          <li>이용 횟수 관리, 부정 이용 방지, 서비스 개선</li>
        </ul>
      </section>

      <section>
        <h2>3. 보관 기간과 파기</h2>
        <p>회원 탈퇴 시 개인정보와 상담 기록은 지체 없이 지워요. 상담 기록은 상담 목록에서 직접 지울 수도 있어요.</p>
        <p>단, 법령에 따라 결제·환불 기록은 5년(전자상거래법), 접속 기록은 3개월(통신비밀보호법) 동안 보관한 뒤 지워요.</p>
      </section>

      <section>
        <h2>4. 처리 위탁과 국외 이전</h2>
        <p>서비스 운영을 위해 다음 업무를 외부에 맡겨요.</p>
        <ul>
          <li>클라우드 호스팅·데이터 보관: Lovable Cloud</li>
          <li>AI 답변 생성: Google·OpenAI 등 AI 모델 제공사 (미국 등 국외 서버)</li>
          <li>결제 처리: 포트원 및 각 결제대행사</li>
        </ul>
        <p>
          AI 답변을 만들 때 고민 내용과 뽑은 카드가 상담하는 순간 암호화된 통신(HTTPS)으로 국외 AI 서버에 전달돼요.
          이메일 등 회원을 알아볼 수 있는 정보는 함께 보내지 않아요. 전달된 내용은 각 제공사의 정책에 따라 짧게 보관된 뒤 지워져요.
          원하지 않으시면 AI 상담을 이용하지 않으시면 되고, 이 경우 AI 답변은 받을 수 없어요.
        </p>
      </section>

      <section>
        <h2>5. 제3자 제공</h2>
        <p>이용자의 동의가 있거나 법령에 따른 요청이 있는 경우를 빼고는 개인정보를 다른 곳에 제공하지 않아요.</p>
      </section>

      <section>
        <h2>6. 이용자의 권리</h2>
        <p>이용자는 언제든 자신의 개인정보를 확인·수정·삭제하거나 처리를 멈춰 달라고 요청할 수 있어요. 아래 문의처로 연락해 주시면 지체 없이 처리해 드려요.</p>
      </section>

      <section>
        <h2>7. 안전 조치 및 만 14세 미만</h2>
        <p>개인정보는 접근 권한을 본인으로 제한해 보관하며, 통신 구간은 암호화(HTTPS)해요.</p>
        <p>서비스는 만 14세 미만 아동의 가입을 받지 않아요.</p>
      </section>

      <section>
        <h2>8. 개인정보 보호책임자</h2>
        <p>
          책임자: 유배훈 (와이제이 스튜디오) · 문의:{" "}
          <a className="text-primary underline" href="mailto:ybaehun@gmail.com">
            ybaehun@gmail.com
          </a>{" "}
          /{" "}
          <a className="text-primary underline" href="mailto:contact@yjstudio.app">
            contact@yjstudio.app
          </a>{" "}
          · 010-8373-1055
        </p>
      </section>
    </LegalPage>
  );
}
