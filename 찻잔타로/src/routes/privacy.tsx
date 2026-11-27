import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const T = "개인정보처리방침 — 찻잔 타로";
const D = "찻잔 타로가 어떤 개인정보를 왜 모으고, 얼마나 보관하며, 어떻게 지우는지 안내해요.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage
      title="개인정보처리방침"
      updated="2026년 11월 27일"
      sections={[
        {
          title: "수집하는 정보",
          body: (
            <ul className="list-disc pl-5">
              <li>별도의 회원가입이나 로그인 없이 이용할 수 있어 이름·이메일·전화번호 등 개인을 직접 알아볼 수 있는 정보를 받지 않아요.</li>
              <li>상담 이용: 입력한 고민 내용, 뽑은 카드, 상담사와 나눈 대화 내용</li>
              <li>자동 수집: 하루 이용 횟수 확인용 임시 토큰, 접속 일시, 기기·브라우저 정보, 웹 광고 제공을 위한 쿠키 정보</li>
            </ul>
          ),
        },
        {
          title: "이용 목적",
          body: (
            <ul className="list-disc pl-5">
              <li>AI 타로 상담 답변 생성 및 대화 이어가기</li>
              <li>하루 무료 이용 횟수 관리 및 부정 이용 방지</li>
              <li>서비스 안정성 유지, 품질 개선 및 웹 광고 제공</li>
            </ul>
          ),
        },
        {
          title: "보관 기간과 파기",
          body: (
            <>
              <p>회원가입이 없는 상담 대화는 이용자의 브라우저·기기 안에 임시로 보관되며, 브라우저 데이터를 지우면 즉시 삭제돼요.</p>
              <p>서버 접속 기록은 관련 법령(통신비밀보호법)에 따라 3개월간 보관한 뒤 지체 없이 파기해요.</p>
            </>
          ),
        },
        {
          title: "처리 위탁과 국외 이전",
          body: (
            <>
              <p>서비스 운영을 위해 다음 업무를 외부에 맡겨요.</p>
              <ul className="list-disc pl-5">
                <li>웹 호스팅·보안: Cloudflare (미국 등 글로벌 엣지 서버)</li>
                <li>데이터 저장·관리: Supabase (국외 클라우드 서버)</li>
                <li>AI 답변 생성: Google Gemini 등 AI 모델 제공사 (미국 등 국외 서버)</li>
                <li>웹 광고 제공: Google AdSense (쿠키 기반 맞춤형/비맞춤형 광고)</li>
              </ul>
              <p>AI 답변을 만들 때 고민 내용과 뽑은 카드가 상담하는 순간 암호화된 통신(HTTPS)으로 국외 AI 서버에 전달돼요. 이용자를 알아볼 수 있는 개인정보는 함께 보내지 않으며, 전달된 내용은 각 제공사의 정책에 따라 짧게 보관된 뒤 지워져요. 원하지 않으시면 AI 상담을 이용하지 않으시면 되고, 이 경우 AI 답변은 받을 수 없어요.</p>
            </>
          ),
        },
        { title: "제3자 제공", body: <p>이용자의 동의가 있거나 법령에 따른 요청이 있는 경우를 빼고는 정보를 다른 곳에 제공하지 않아요.</p> },
        {
          title: "이용자의 권리",
          body: (
            <div className="space-y-1.5">
              <p>이용자는 언제든 브라우저 저장소와 쿠키를 삭제하거나, 광고 맞춤 설정을 끌 수 있어요.</p>
              <p>
                Google의 맞춤형 광고를 끄려면{" "}
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  Google 광고 설정
                </a>
                에서 변경할 수 있으며, Google의 쿠키 사용 방식은{" "}
                <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  Google 광고 정책 안내
                </a>
                에서 확인할 수 있어요. 문의가 있으시면 아래 메일로 연락해 주세요.
              </p>
            </div>
          ),
        },
        { title: "안전 조치", body: <p>모든 통신 구간은 암호화(HTTPS)하며, 무로그인 이용 횟수 검증 토큰은 서버 서명으로 안전하게 보호해요.</p> },
        { title: "만 14세 미만", body: <p>서비스는 만 14세 미만 아동을 대상으로 개인정보를 수집하지 않아요.</p> },
        { title: "개인정보 보호 문의", body: <p>운영: 와이제이 스튜디오 · 문의: contact@yjstudio.app</p> },
      ]}
    />
  ),
});
