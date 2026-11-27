import { createFileRoute, Link } from "@tanstack/react-router";

const T = "이용약관 — 꿈소반";
const D = "꿈소반 AI 꿈해몽 서비스 이용약관 및 면책 안내입니다.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://dreamsoban.app/terms" }],
  }),
  component: TermsPage,
});

const TERMS = [
  ["제1조 목적", "본 약관은 와이제이 스튜디오(이하 '운영사')가 제공하는 꿈소반(dreamsoban.app) 서비스의 이용 조건과 책임을 규정합니다."],
  ["제2조 서비스 성격 및 면책", "꿈소반의 해몽 결과, 액막이 부적, 행운 번호 추천은 AI 및 무작위 생성에 기반한 가벼운 재미·자기 성찰 참고용입니다. 의학·심리·법률·투자·사행성 판단을 대신하거나 미래를 보장하지 않으며, 이를 근거로 한 결정의 책임은 이용자 본인에게 있습니다."],
  ["제3조 위기 상황 안내", "정서적 어려움이나 위기 상황에 놓인 경우 전문 기관(자살예방 상담전화 109, 정신건강 상담전화 1577-0199)의 도움을 받으시기 바랍니다."],
  ["제4조 이용 제한", "안정적인 운영을 위해 하루 무료 이용 횟수가 제한되며, 비정상적인 자동화 요청이나 서비스 방해 행위는 차단될 수 있습니다."],
  ["제5조 약관 변경 및 문의", "약관 변경 시 본 페이지에 고지하며, 문의는 contact@yjstudio.app으로 연락해 주세요."],
] as const;

function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← 꿈소반 홈으로</Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">이용약관</h1>
      <p className="mt-1 text-xs text-muted-foreground">시행일 2026년 11월 27일</p>
      <dl className="glass mt-8 space-y-6 rounded-3xl p-6 text-sm leading-relaxed">
        {TERMS.map(([heading, body]) => (
          <div key={heading}>
            <dt className="font-semibold text-foreground">{heading}</dt>
            <dd className="mt-1.5 text-muted-foreground">{body}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
