import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "개인정보처리방침 — 톡비서" },
      {
        name: "description",
        content: "톡비서 서비스의 개인정보처리방침 및 계정·데이터 삭제 안내입니다.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-background px-6 py-10 text-foreground">
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">톡비서 개인정보처리방침</h1>
          <p className="mt-1 text-xs text-muted-foreground">시행일: 2026년 11월 17일 · 운영: YJ Studio</p>
        </div>
        <Link
          to="/login"
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          앱으로 돌아가기
        </Link>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="mb-2 text-base font-bold">1. 수집하는 개인정보 항목</h2>
          <p>
            톡비서는 원활한 AI 메모 정리 및 개인 보관함 제공을 위해 최소한의 정보만을 수집합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>회원가입 및 로그인 정보: 이메일 주소, Google 로그인 시 기본 프로필 식별 정보</li>
            <li>서비스 이용 데이터: 사용자가 직접 입력한 메모, 일정, 웹 링크, 업로드한 스크린샷 이미지</li>
            <li>자동 생성 기록: 서비스 안정성 및 오류 진단을 위한 최소한의 접속 기록</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">2. 개인정보의 이용 목적</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>사용자 식별 및 로그인 세션 유지</li>
            <li>메모·링크·이미지의 AI 자동 요약, 분류, 일정 추출 및 검색 기능 제공</li>
            <li>서비스 오류 대응 및 고객 문의 응대</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">3. 외부 위탁 및 AI 처리 안내</h2>
          <p>
            톡비서는 데이터 보관 및 인증을 위해 Supabase 클라우드 인프라를 사용하며, 사용자가 요청한 메모·이미지
            분석을 위해 Google Gemini API로 해당 콘텐츠를 전송하여 요약·분류 결과를 생성합니다. 수집된 정보는
            제3자에게 판매하거나 광고 목적으로 제공하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">4. 보유 기간 및 보안</h2>
          <p>
            회원의 개인정보 및 보관 데이터는 회원 탈퇴 또는 삭제 요청 시 지체 없이 파기합니다. 모든 통신은
            HTTPS 암호화 구간을 통해 안전하게 전송됩니다.
          </p>
        </section>

        <section id="delete">
          <h2 className="mb-2 text-base font-bold">5. 계정 및 데이터 삭제 요청 방법</h2>
          <p>
            사용자는 앱 내에서 개별 메모·이미지를 즉시 삭제할 수 있으며, 전체 계정 및 보관 데이터의 완전한 삭제를
            원하실 경우 아래 문의처로 가입 이메일 주소를 함께 보내주시면 확인 후 지체 없이 삭제 처리해 드립니다.
          </p>
          <div className="mt-3 rounded-xl bg-muted/60 p-4 text-xs">
            <p>
              <strong>운영자:</strong> YJ Studio
            </p>
            <p className="mt-1">
              <strong>문의 및 삭제 요청 이메일:</strong>{" "}
              <a href="mailto:ceo@yjstudio.app" className="underline">
                ceo@yjstudio.app
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
