import { createFileRoute, Link } from "@tanstack/react-router";
import { PERSONAS } from "@/lib/tarot";
import { PersonaAvatar } from "@/components/TarotCardView";
import { Button } from "@/components/ui/button";

const T = "서비스 소개 — 찻잔 타로";
const D = "따뜻한 차 한 잔 앞에서 마음을 털어놓는 AI 대화형 타로 상담 서비스, 찻잔 타로를 소개합니다.";

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
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← 찻잔 타로로 돌아가기</Link>
        <h1 className="mt-4 font-serif text-3xl font-bold">찻잔 타로 소개</h1>
        <p className="mt-2 text-muted-foreground">
          복잡한 하루 끝에 따뜻한 차 한 잔을 마주하듯, 마음을 편히 내려놓을 수 있는 대화형 타로 공간입니다.
        </p>
      </div>

      <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-warm">
        <h2 className="font-serif text-xl font-bold">이용 방법</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li><strong className="text-foreground">고민 적기:</strong> 지금 마음을 무겁게 하는 이야기나 궁금한 선택지를 편하게 적습니다.</li>
          <li><strong className="text-foreground">상담사·카드 3장 고르기:</strong> 원하는 대화 분위기의 상담사를 고르고 직감으로 3장의 카드를 뽑습니다.</li>
          <li><strong className="text-foreground">대화 나누기 &amp; 마음 처방전:</strong> 카드 풀이를 바탕으로 대화를 이어가고, 상담이 끝나면 한 줄 마음 처방전 카드를 받아 간직할 수 있습니다.</li>
        </ol>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-warm">
        <h2 className="font-serif text-xl font-bold">함께하는 세 명의 AI 상담사</h2>
        <div className="space-y-3">
          {Object.values(PERSONAS).map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/50 p-4">
              <PersonaAvatar id={p.id} emoji={p.emoji} className="size-12 shrink-0 text-2xl" />
              <div>
                <p className="font-serif font-bold">{p.name} <span className="text-xs font-normal text-muted-foreground">· {p.title}</span></p>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-3xl border bg-card p-6 text-sm leading-relaxed text-muted-foreground shadow-warm">
        <h2 className="font-serif text-lg font-bold text-foreground">AI 상담 및 면책 안내</h2>
        <p>
          찻잔 타로의 모든 카드 해석과 대화는 인공지능(AI)이 생성하는 가벼운 성찰·엔터테인먼트용 참고 콘텐츠입니다.
        </p>
        <p>
          전문적인 의학·심리·법률·투자 자문을 대신하지 않으며, 위기 상황이거나 전문적인 도움이 필요하실 때는 보건복지상담센터(129) 또는 자살예방 상담전화(109) 등 전문 기관의 도움을 받으시길 권장합니다.
        </p>
      </section>

      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link to="/">타로 상담 시작하기</Link>
        </Button>
      </div>
    </main>
  );
}
