import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "문의하기 — 대나무숲 속풀이";
const DESC = "대나무숲 속풀이 운영팀(와이제이 스튜디오) 연락처 및 문의 안내입니다.";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://bambooforest.app/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10 pb-16">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← 대나무숲 속풀이 홈으로
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-bold">문의하기</h1>
        <p className="mt-2 text-muted-foreground">
          서비스 이용 중 오류 제보, 개선 의견, 제휴 문의가 있으시면 아래 이메일로 연락해 주세요.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-6 text-sm leading-relaxed">
        <h2 className="font-serif text-lg font-bold">운영 및 문의처</h2>
        <dl className="space-y-2.5 text-muted-foreground">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-28 shrink-0 font-semibold text-foreground">운영사</dt>
            <dd>와이제이 스튜디오 (YJ Studio)</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-28 shrink-0 font-semibold text-foreground">이메일 문의</dt>
            <dd>
              <a href="mailto:contact@yjstudio.app" className="font-medium text-primary underline underline-offset-4">
                contact@yjstudio.app
              </a>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-28 shrink-0 font-semibold text-foreground">운영 사이트</dt>
            <dd>https://bambooforest.app</dd>
          </div>
        </dl>
        <p className="pt-2 text-xs text-muted-foreground">
          접수된 문의는 영업일 기준 1~2일 이내에 확인 후 답변드립니다.
        </p>
      </section>
    </main>
  );
}
