import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const PAGE_TITLE = "꿈소반 이용약관 | YJ Studio";
const PAGE_DESC = "꿈소반(dreamsoban.app) AI 꿈 해몽 및 길운 가이드 서비스의 이용약관입니다.";

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
        ) 서비스에 적용됩니다.
      </p>

      <section>
        <h2>1. 서비스의 성격</h2>
        <p>본 서비스는 회원가입 없이 무료로 제공되는 AI 기반 꿈 해석 엔터테인먼트 서비스입니다.</p>
        <p>해몽 결과, 부적 카드, 행운 번호는 재미와 정서적 위로를 위한 참고용이며 의학·법률·재정적 판단의 근거가 될 수 없습니다.</p>
      </section>

      <section>
        <h2>2. 광고 및 서비스 변경</h2>
        <p>서비스 운영을 위해 Google AdSense 등 제3자 광고가 노출될 수 있으며, 서비스 내용은 운영 상황에 따라 사전 고지 없이 변경되거나 중단될 수 있습니다.</p>
      </section>

      <section>
        <h2>3. 이용자의 의무 및 콘텐츠 권리</h2>
        <p>이용자는 서비스를 정상적인 용도로만 이용해야 하며, 자동화 도구를 이용한 과도한 요청 등 서비스 운영을 방해하는 행위를 해서는 안 됩니다.</p>
        <p>꿈소반이 제공하는 해몽 가이드, 부적 카드 이미지, 디자인 등 서비스 내 저작물에 대한 권리는 와이제이 스튜디오에 있습니다.</p>
      </section>

      <section>
        <h2>4. 면책 및 준거법</h2>
        <p>운영자는 천재지변, 외부 AI·네트워크 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않으며, 해몽 결과를 바탕으로 한 이용자의 선택과 행동에 대해 법적 책임을 지지 않습니다.</p>
        <p>본 약관은 대한민국 법령에 따릅니다.</p>
      </section>

      <section>
        <h2>5. 운영자 정보 및 문의</h2>
        <p>서비스명: 꿈소반 (dreamsoban.app)</p>
        <p>운영: 와이제이 스튜디오 (대표 KETSIRI IRATDA)</p>
        <p>
          문의:{" "}
          <a className="text-primary underline" href="mailto:contact@yjstudio.app">
            contact@yjstudio.app
          </a>{" "}
          /{" "}
          <a className="text-primary underline" href="mailto:ybaehun@gmail.com">
            ybaehun@gmail.com
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
