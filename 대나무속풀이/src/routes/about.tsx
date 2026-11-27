import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const TITLE = "서비스 소개 — 대나무숲 속풀이";
const DESC = "회원가입 없이, 저장 없이 답답한 마음을 털어놓고 태우는 익명 AI 속풀이 공간입니다.";

export const Route = createFileRoute("/about")({
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
    links: [{ rel: "canonical", href: "https://bambooforest.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10 pb-16">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← 대나무숲 속풀이 홈으로
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-bold">대나무숲 속풀이 소개</h1>
        <p className="mt-2 text-muted-foreground">{DESC}</p>
      </div>

      <section className="space-y-3 rounded-3xl border border-border bg-card/70 p-6 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-serif text-lg font-bold text-foreground">원칙과 특징</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-foreground">완벽한 익명·비저장:</strong> 회원가입을 받지 않으며, 입력한 원문은 AI 답변 생성 직후 즉시 사라지고 데이터베이스나 기록에 남기지 않습니다.</li>
          <li><strong className="text-foreground">두 가지 맞춤 반응:</strong> 무조건 내 편을 들어주는 모드와, 속을 풀어주는 가상 상대의 사과 역할극 모드 중 선택할 수 있습니다.</li>
          <li><strong className="text-foreground">소각 영수증:</strong> 마음을 비워낸 뒤 소각 영수증 카드를 이미지로 저장하거나 공유할 수 있습니다.</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-3xl border border-border bg-card/70 p-6 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-serif text-lg font-bold text-foreground">AI 응답 및 위기 지원 안내</h2>
        <p>
          대나무숲 속풀이의 답변은 감정 환기를 돕기 위한 AI 엔터테인먼트·참고용 콘텐츠입니다. 전문적인 의학·심리·법률 상담을 대신하지 않습니다.
        </p>
        <p>
          극심한 우울감이나 위기 상황에 놓여 계시다면 자살예방 상담전화(109) 또는 정신건강 상담전화(1577-0199) 등 전문 기관의 도움을 받으시기 바랍니다.
        </p>
      </section>

      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link to="/">대나무숲에 외치러 가기</Link>
        </Button>
      </div>
    </main>
  );
}
