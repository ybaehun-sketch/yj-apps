import { createFileRoute, Link } from "@tanstack/react-router";
import { listGuides } from "@/lib/guides.functions";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { DAILY_LIMIT, getUsedToday, recordUse } from "@/lib/daily-limit";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { interpretDream, type FirstReading } from "@/lib/dream.functions";
import { sfx } from "@/lib/sfx";
import { StarField } from "@/components/dream/StarField";
import { AdModal } from "@/components/dream/AdModal";
import { EnergyGauge } from "@/components/dream/EnergyGauge";
import { TalismanCard } from "@/components/dream/TalismanCard";
import { LottoScratch } from "@/components/dream/LottoScratch";
import { Footer } from "@/components/dream/Footer";

const TITLE = "꿈소반 — AI 심층 꿈풀이 · 무의식이 보낸 꿈의 암호 해독";
const DESC = "회원가입 없이 100% 무료·익명. 전통 해몽과 현대 심리학으로 어젯밤 꿈을 풀고, 부적과 위트 있는 한 줄 처방까지.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => (await listGuides()).slice(0, 4),
  component: Index,
});

const TAROT_URL = "https://teacuptarot.com";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass animate-rise rounded-3xl p-5 sm:p-7 ${className}`}>{children}</section>;
}

function Index() {
  const interpret = useServerFn(interpretDream);
  const guides = Route.useLoaderData();

  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState<"first" | null>(null);
  const [first, setFirst] = useState<FirstReading | null>(null);
  const [gaugeOn, setGaugeOn] = useState(false);
  const [gaugeDone, setGaugeDone] = useState(false);
  const [ad, setAd] = useState<null | "reward">(null);
  const [reward, setReward] = useState(false);
  const [used, setUsed] = useState(0);
  useEffect(() => { setUsed(getUsedToday()); }, []);
  const exhausted = used >= DAILY_LIMIT;
  const firstRef = useRef<HTMLDivElement>(null);

  // Energy is fixed by the first reading so the reward type never flips later.
  const energy = first?.energy ?? 0;
  const isLucky = energy >= 70;

  const scrollTo = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);

  async function onDecode() {
    sfx.tap();
    if (getUsedToday() >= DAILY_LIMIT) { setUsed(DAILY_LIMIT); return; }
    if (dream.trim().length < 5) { toast("꿈 내용을 조금 더 들려주세요 🌙"); return; }
    setLoading("first");
    setFirst(null); setGaugeOn(false); setGaugeDone(false); setReward(false);
    try {
      const r = await interpret({ data: { dream } });
      setUsed(recordUse());
      setFirst(r);
      sfx.chime();
      scrollTo("first");
      setTimeout(() => setGaugeOn(true), 400);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  const midZone = energy > 40 && energy < 70;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <StarField />
      <Toaster position="top-center" />
      <main className="relative z-10 mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-14">
        {/* Hero */}
        <header className="animate-rise text-center">
          <p className="mb-4 text-xs tracking-[0.35em] text-moon">꿈소반 · AI 심층 꿈풀이</p>
          <h1 className="font-serif text-[1.7rem] leading-snug sm:text-4xl">
            어젯밤 꾼 복잡하고 이상한 꿈,
            <br />
            <span className="text-moon-gradient">무의식이 당신에게 보낸 암호</span>입니다.
          </h1>
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-border bg-background/40 px-4 py-2 text-xs text-muted-foreground">
            <span>🔒 회원가입 없음</span>·<span>꿈 내용 저장되지 않음</span>·<span>100% 익명</span>
          </div>
        </header>

        {/* Step 1 input */}
        <Section>
          <label htmlFor="dream" className="mb-3 block font-serif text-lg">🌙 어떤 꿈을 꾸셨나요?</label>
          <Textarea
            id="dream"
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            maxLength={1500}
            placeholder="뒤죽박죽이어도 괜찮아요. 기억나는 장면, 사람, 색깔, 감정을 편하게 적어주세요.&#10;예) 돌아가신 할머니가 커다란 돼지를 안고 우리 집 대문으로 들어오셨는데 갑자기 물이 차올랐어요..."
            className="min-h-44 resize-none rounded-2xl border-border bg-background/40 text-base leading-relaxed md:text-base"
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">{dream.length}/1500</div>
          {exhausted ? (
            <div className="mt-3 rounded-2xl border border-moon/40 bg-moon/10 p-5 text-center">
              <p className="font-serif text-lg">오늘 준비된 세 번의 꿈소반이 모두 차려졌어요 🌙</p>
              <p className="mt-2 text-sm text-muted-foreground">오늘 밤 새로운 꿈을 꾸고, 내일 아침 다시 찾아주세요.</p>
              <a href="/guide" className="mt-4 inline-block rounded-full border border-border px-5 py-2 text-sm hover:bg-background/40">📖 꿈해몽 사전 읽으러 가기</a>
            </div>
          ) : (
            <Button
              onClick={onDecode}
              disabled={loading === "first"}
              className="mt-3 h-14 w-full rounded-2xl bg-moon-gradient font-serif text-lg text-primary-foreground shadow-glow hover:opacity-90"
            >
              {loading === "first" ? (<><Loader2 className="animate-spin" /> 무의식의 암호를 해독하는 중...</>) : "🔮 꿈 암호 해독하기"}
            </Button>
          )}
          <p className="mt-2 text-center text-xs text-muted-foreground">오늘 남은 꿈풀이 {Math.max(0, DAILY_LIMIT - used)} / {DAILY_LIMIT}회</p>
        </Section>

        {/* Step 1 result */}
        {first && (
          <div id="first" className="scroll-mt-6">
            <Section>
              <div ref={firstRef}>
                <h2 className="mb-3 font-serif text-2xl">🔮 꿈의 핵심 상징</h2>
                <div className="mb-4 flex flex-wrap gap-2">
                  {first.keywords.map((k) => (
                    <span key={k} className="rounded-full border border-moon/50 bg-moon/10 px-3.5 py-1 text-base text-moon">#{k}</span>
                  ))}
                </div>
                <p className="text-[17px] leading-[1.85] text-muted-foreground sm:text-lg">{first.summary}</p>
                <h2 className="mb-2 mt-7 font-serif text-2xl">📜 전통 해몽</h2>
                <p className="text-[17px] leading-[1.85] sm:text-lg">{first.traditional}</p>
                <h2 className="mb-2 mt-7 font-serif text-2xl">🧠 현대 심리학 해석</h2>
                <p className="text-[17px] leading-[1.85] sm:text-lg">{first.psychological}</p>
              </div>
            </Section>
          </div>
        )}

        {/* Step 2 gauge + viral reward */}
        {gaugeOn && (
          <Section>
            <div id="gauge" className="scroll-mt-6">
              <h2 className="mb-4 text-center font-serif text-2xl">✨ 이 꿈의 에너지는?</h2>
              <EnergyGauge value={energy} onSettled={() => { setGaugeDone(true); sfx.chime(); }} />
              {gaugeDone && (
                <div className="animate-rise mt-6 text-center">
                  {isLucky ? (
                    <p className="font-serif text-xl leading-relaxed">🔥 <b className="text-lucky">조상님이 점지한 엄청난 길몽!</b><br />이 꿈의 행운 기운을 담은 이번 주 맞춤 로또 번호 6자리를 드려요.</p>
                  ) : (
                    <p className="font-serif text-xl leading-relaxed">🌪️ {midZone ? "잔잔한 일상 꿈이에요." : <b className="text-calm">뇌 용량 정리 중 발생한 순도 100% 개꿈!</b>}<br />나쁜 기운을 날려버릴 오늘의 귀여운 멘탈 액막이 부적 카드를 드려요.</p>
                  )}
                  {!reward ? (
                    <Button onClick={() => { sfx.tap(); setAd("reward"); }} className="mt-5 h-13 rounded-full bg-moon-gradient px-7 py-3 text-base text-primary-foreground shadow-glow">
                      {isLucky ? "📺 광고 시청 후 복권 긁기" : "📺 광고 시청 후 부적 카드 받기"}
                    </Button>
                  ) : (
                    <div className="mt-6">
                      {isLucky ? <LottoScratch /> : <TalismanCard keywords={first?.keywords ?? []} quip={first?.talisman ?? null} />}
                      <p className="mt-3 text-sm text-muted-foreground">
                        {isLucky ? "👯 이번 주 같이 살 친구에게 번호를 공유해 보세요" : "🧧 저장하고 공유해보세요. 혹시 알아요? 정말 액운을 막아줄지도..^^"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Tarot funnel CTA */}
        {reward && (
          <a
            href={TAROT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sfx.tap()}
            className="bg-tarot animate-rise group block rounded-3xl border border-moon/30 p-6 shadow-glow transition-transform hover:-translate-y-1 sm:p-8"
          >
            <h2 className="font-serif text-2xl leading-snug">🌙 왜 이런 꿈을 꿨을까요?</h2>
            <p className="mt-3 text-[17px] leading-[1.85] text-muted-foreground sm:text-lg">
              꿈은 현실의 문제를 반영하는 경우가 대부분입니다. 혹시 마음속에 걸리는 사람이나 문제가 있나요?
              <br />
              <b className="text-moon">찻잔 타로</b>에서 깊은 마음속 문제를 풀어봐요.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <span className="font-serif text-2xl">☕ 찻잔 타로</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-moon-gradient px-4 py-2 text-sm text-primary-foreground">
                속마음 풀러 가기 <ExternalLink className="h-4 w-4" />
              </span>
            </div>
          </a>
        )}

        {guides.length > 0 && (
          <section className="animate-rise">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-serif text-xl">📖 자주 찾는 꿈해몽 칼럼</h2>
              <Link to="/guide" className="text-sm text-muted-foreground hover:text-foreground">전체 보기 →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {guides.map((g) => (
                <Link key={g.slug} to="/guide/$slug" params={{ slug: g.slug }} className="glass rounded-2xl p-4 transition-colors hover:bg-background/40">
                  <p className="font-serif leading-snug">{g.title}</p>
                  {g.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <AdModal
        open={ad === "reward"}
        message={isLucky ? "꿈의 행운 기운을 숫자로 모으는 중입니다..." : "나쁜 기운을 막아줄 부적을 그리는 중입니다..."}
        onDone={() => { setAd(null); setReward(true); sfx.reward(); setTimeout(() => document.getElementById("gauge")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200); }}
      />
    </div>
  );
}
