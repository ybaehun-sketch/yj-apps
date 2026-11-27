import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "꿈소반 개인정보처리방침 | YJ Studio";
const PAGE_DESC = "꿈소반(dreamsoban.app)의 익명·비저장 원칙과 개인정보 및 쿠키 처리 방침 안내입니다.";

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
        ) 서비스의 개인정보 처리 기준을 안내합니다. (시행일: 2026년 11월 27일)
      </p>

      <section>
        <h2>1. 수집하지 않는 정보 및 비저장 원칙</h2>
        <p>꿈소반은 회원가입을 받지 않으며 이름·이메일·전화번호 등 개인을 식별할 수 있는 정보를 수집하지 않습니다. 입력하신 꿈 내용은 AI 해몽 생성에만 일회성으로 사용되며 서버 데이터베이스에 저장되지 않습니다.</p>
      </section>

      <section>
        <h2>2. 기기 내 임시 저장 및 광고 쿠키</h2>
        <p>하루 이용 횟수 확인을 위해 이용자의 브라우저 저장소에만 횟수 정보가 임시 기록됩니다. 또한 웹 광고 제공을 위해 Google AdSense가 쿠키를 사용할 수 있습니다.</p>
      </section>

      <section>
        <h2>3. 처리 위탁 및 국외 이전</h2>
        <p>안정적인 서비스 제공을 위해 웹 호스팅(Cloudflare) 및 AI 해몽 생성(Google Gemini / OpenAI) 과정에서 입력 내용이 암호화(HTTPS)되어 국외 서버로 일시 전달될 수 있습니다. 개인을 식별하는 정보는 함께 전송하지 않습니다.</p>
      </section>

      <section>
        <h2>4. 이용자의 권리 및 광고 맞춤 설정</h2>
        <p>
          이용자는 언제든 브라우저 설정에서 저장 데이터와 쿠키를 삭제할 수 있습니다. Google의 맞춤형 광고를 원치 않으시면{" "}
          <a className="text-primary underline" href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
            Google 광고 설정
          </a>
          에서 해제할 수 있으며, 쿠키 사용 방식은{" "}
          <a className="text-primary underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google 광고 정책 안내
          </a>
          에서 확인할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>5. 개인정보 보호 문의</h2>
        <p>
          운영사: 와이제이 스튜디오 (YJ Studio) · 이메일:{" "}
          <a className="text-primary underline" href="mailto:contact@yjstudio.app">
            contact@yjstudio.app
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
