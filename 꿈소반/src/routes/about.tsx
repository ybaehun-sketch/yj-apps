import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const T = "서비스 소개 — 꿈소반";
const D = "회원가입 없이 100% 익명으로 전통 해몽과 현대 심리학 시선으로 꿈을 풀어주는 AI 꿈해몽 서비스, 꿈소반을 소개합니다.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://dreamsoban.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← 꿈소반 홈으로</Link>
        <h1 className="mt-4 font-serif text-3xl font-bold">꿈소반 소개</h1>
        <p className="mt-2 text-muted-foreground">{D}</p>
      </div>

      <section className="glass space-y-3 rounded-3xl p-6 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-serif text-lg font-bold text-foreground">꿈소반의 특징</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-foreground">전통 해몽 + 현대 심리학:</strong> 동양의 전통 꿈풀이 상징과 현대 심리학적 무의식 해석을 함께 들려드립니다.</li>
          <li><strong className="text-foreground">완벽한 익명·비저장:</strong> 회원가입이 없으며 입력하신 꿈 내용은 해석 직후 사라지고 서버에 저장하지 않습니다.</li>
          <li><strong className="text-foreground">부적 &amp; 행운 번호 카드:</strong> 꿈의 분위기에 맞는 재미있는 액막이 부적이나 무작위 행운 번호 카드를 소장할 수 있습니다.</li>
        </ul>
      </section>

      <section className="glass space-y-2 rounded-3xl p-6 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-serif text-lg font-bold text-foreground">AI 꿈풀이 및 면책 안내</h2>
        <p>
          꿈소반의 모든 해몽과 부적·행운 번호는 인공지능(AI) 및 무작위 생성 기능을 활용한 가벼운 재미·성찰용 참고 콘텐츠입니다.
        </p>
        <p>
          전문적인 의학·심리·법률·재무 자문을 대신하지 않으며, 실제 복권 당첨이나 미래 예측을 보장하지 않습니다. 심리적으로 힘드시거나 위기 상황일 때는 자살예방 상담전화(109) 또는 정신건강 상담전화(1577-0199)에 연락해 주세요.
        </p>
      </section>

      <div className="flex justify-center">
        <Button asChild size="lg" className="rounded-full bg-moon-gradient text-primary-foreground">
          <Link to="/">내 꿈 풀러 가기</Link>
        </Button>
      </div>
    </main>
  );
}
