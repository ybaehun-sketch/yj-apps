import { createFileRoute, Link } from "@tanstack/react-router";
import { BUSINESS } from "@/lib/business";

const T = "문의하기 — 찻잔 타로";
const D = "찻잔 타로 운영팀(와이제이 스튜디오) 연락처 및 이용 문의 안내입니다.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← 찻잔 타로로 돌아가기</Link>
        <h1 className="mt-4 font-serif text-3xl font-bold">문의하기</h1>
        <p className="mt-2 text-muted-foreground">
          서비스 이용 중 불편한 점, 오류 제보, 제안 사항이 있으시면 언제든 편하게 연락해 주세요.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border bg-card p-6 text-sm leading-relaxed shadow-warm">
        <h2 className="font-serif text-lg font-bold">운영 및 문의처</h2>
        <dl className="space-y-2.5 text-muted-foreground">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-28 shrink-0 font-semibold text-foreground">운영사</dt>
            <dd>{BUSINESS.name}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-28 shrink-0 font-semibold text-foreground">이메일 문의</dt>
            <dd>
              <a href={`mailto:${BUSINESS.email}`} className="font-medium text-primary underline underline-offset-4">
                {BUSINESS.email}
              </a>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-28 shrink-0 font-semibold text-foreground">운영 사이트</dt>
            <dd>https://teacuptarot.com</dd>
          </div>
        </dl>
        <p className="pt-2 text-xs text-muted-foreground">
          보내주신 문의는 영업일 기준 1~2일 이내에 확인 후 답변드립니다.
        </p>
      </section>
    </main>
  );
}
