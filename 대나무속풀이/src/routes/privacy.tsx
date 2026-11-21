import { createFileRoute, Link } from "@tanstack/react-router";
import { PRIVACY_ITEMS } from "@/lib/legal";

const TITLE = "개인정보처리방침 — 대나무숲 속풀이";
const DESC = "대나무숲 속풀이의 비저장 익명 원칙과 개인정보처리방침 안내입니다.";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 pb-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← 대나무숲 속풀이 홈으로
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted-foreground">{DESC}</p>

      <dl className="mt-8 flex flex-col gap-6 rounded-3xl border border-border bg-card/70 p-6 text-sm leading-relaxed">
        {PRIVACY_ITEMS.map(([heading, body]) => (
          <div key={heading}>
            <dt className="font-semibold text-primary">{heading}</dt>
            <dd className="mt-1.5 text-muted-foreground">{body}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>시행일: 2026년 11월</span>
        <Link to="/terms" className="text-primary hover:underline">
          이용약관 보기 →
        </Link>
      </div>
    </main>
  );
}
