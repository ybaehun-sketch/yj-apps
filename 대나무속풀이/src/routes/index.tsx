import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { ventToForest, type VentResult } from "@/lib/vent.functions";
import { PERSONAS, HOTLINES, createReceipt, detectsCrisis, fallbackResult, type Persona, type Receipt } from "@/lib/forest";
import { AD_MAX_PER_DAY, COOLDOWN_MS, adsLeft, check, consume, loadQuota, saveQuota, watchAd, type Quota } from "@/lib/quota";
import { BurnReceipt } from "@/components/burn-receipt";
import { LatestStories } from "@/components/latest-stories";
import { HomeGuideFaq } from "@/components/home-guide-faq";
import { storiesQuery } from "@/lib/stories-query";
import { PaperBurn } from "@/components/paper-burn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SoundToggle } from "@/components/sound-toggle";
import { sfx } from "@/lib/sound";
import { Copy, Download, Share2, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "대나무숲 속풀이 — 임금님 귀는 당나귀 귀!" },
      { name: "description", content: "말 못 할 분노와 억울함을 익명으로 외치고 태우세요. 저장 없이 AI가 무조건 내 편을 들어줍니다." },
      { property: "og:title", content: "대나무숲 속풀이 — 임금님 귀는 당나귀 귀!" },
      { property: "og:description", content: "회원가입 없음 · 저장되지 않음 · 완벽한 익명. 소리 지르고 태우고 사이다 처방 받기." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bambooforest.app/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storiesQuery).catch(() => []),
  component: Index,
});

type Phase = "input" | "burning" | "result";

const SNS = [
  { id: "instagram", label: "인스타그램", icon: "📸" },
  { id: "kakao", label: "카카오", icon: "💬" },
  { id: "x", label: "X", icon: "✖️" },
  { id: "facebook", label: "페이스북", icon: "📘" },
  { id: "threads", label: "스레드", icon: "🧵" },
  { id: "band", label: "밴드", icon: "🟢" },
  { id: "copy", label: "링크 복사", icon: "🔗" },
] as const;

function Index() {
  const vent = useServerFn(ventToForest);
  const [persona, setPersona] = useState<Persona>("comfort");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [exporting, setExporting] = useState(false);
  const submitting = useRef(false);
  const [text, setText] = useState("");
  const [burnText, setBurnText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [result, setResult] = useState<VentResult | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [satisfied, setSatisfied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState<number | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => { setQuota(loadQuota(Date.now())); setNow(Date.now()); }, []);
  const cooldownLeft = quota && quota.used > 0 ? Math.max(0, Math.ceil((quota.lastAt + COOLDOWN_MS - now) / 1000)) : 0;
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  async function submit() {
    if (submitting.current) return;
    if (text.trim().length < 2) {
      toast("한 마디라도 외쳐주세요 🎋");
      return;
    }
    const t = Date.now();
    const q0 = loadQuota(t);
    const c = check(q0, t);
    if (!c.ok) {
      if (c.reason === "cooldown") toast(`연기가 가라앉는 중이에요. ${Math.ceil(c.waitMs / 1000)}초 뒤에 외쳐주세요`);
      else setChargeOpen(true);
      return;
    }
    const q1 = consume(q0, t);
    saveQuota(q1); setQuota(q1); setNow(t);
    submitting.current = true;
    const payload = { text, persona };
    const crisis = detectsCrisis(text);
    setBurnText(text);
    setText(""); // 원문 즉시 소멸
    setPhase("burning");
    sfx.burn();
    const minWait = new Promise((r) => setTimeout(r, 5600));
    try {
      const res = await vent({ data: payload });
      payload.text = "";
      setReceipt(createReceipt());
      await minWait;
      setBurnText("");
      setResult(res);
      setPhase("result");
      sfx.chime();
    } catch {
      payload.text = "";
      await minWait;
      setBurnText("");
      setResult(fallbackResult(persona, crisis));
      setReceipt(createReceipt());
      setPhase("result");
      sfx.chime();
    } finally {
      setBurnText("");
      payload.text = "";
      submitting.current = false;
    }
  }

  async function makePng() {
    if (!cardRef.current) return null;
    await document.fonts.ready;
    return toPng(cardRef.current, { pixelRatio: 3, cacheBust: true, style: { margin: "0" } });
  }
  async function download() {
    const url = await makePng();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "대나무숲속풀이-소각영수증.png";
    a.click();
  }
  async function copyImg() {
    try {
      const url = await makePng();
      if (!url) return;
      const blob = await (await fetch(url)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast("처방전 이미지를 복사했어요");
    } catch {
      toast("복사가 지원되지 않아요. 저장하기를 이용해 주세요");
    }
  }
  async function shareTo(sns: (typeof SNS)[number]) {
    const site = window.location.origin;
    const msg = `🔥 분노 소각 완료! "${result?.prescription ?? ""}" — 대나무숲 속풀이에서 나도 태우기`;
    const url = await makePng();
    if (!url) return;
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], "대나무숲속풀이-소각영수증.png", { type: "image/png" });
    if (sns.id !== "copy" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "분노 소각 영수증", text: `${msg} ${site}` });
        setShareOpen(false);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    if (sns.id === "copy") {
      await navigator.clipboard.writeText(`${msg} ${site}`);
      toast("링크를 복사했어요");
      setShareOpen(false);
      return;
    }
    await download();
    const e = encodeURIComponent;
    const links: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?text=${e(msg)}&url=${e(site)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(site)}`,
      threads: `https://www.threads.net/intent/post?text=${e(`${msg} ${site}`)}`,
      band: `https://band.us/plugin/share?body=${e(`${msg} ${site}`)}&route=${e(site)}`,
      kakao: `https://story.kakao.com/share?url=${e(site)}`,
      instagram: "https://www.instagram.com/",
    };
    window.open(links[sns.id], "_blank", "noopener,noreferrer");
    toast(`영수증 이미지를 저장했어요. ${sns.label}에 올려주세요`);
    setShareOpen(false);
  }
  async function exportImage(action: () => Promise<void>) {
    if (exporting) return;
    setExporting(true);
    try { await action(); } catch { toast("이미지를 만들지 못했어요. 다시 시도해 주세요"); }
    finally { setExporting(false); }
  }
  function reset() {
    setResult(null);
    setReceipt(null);
    setSatisfied(false);
    setText("");
    setBurnText("");
    setPhase("input");
    window.scrollTo({ top: 0 });
  }
  function again() {
    const q = loadQuota(Date.now());
    const c = check(q, Date.now());
    if (c.ok || c.reason === "cooldown") reset();
    else setChargeOpen(true);
  }
  function startAd() {
    setAdCountdown(5);
    const id = setInterval(() => {
      setAdCountdown((n) => {
        if (n === null || n <= 1) {
          clearInterval(id);
          const q = watchAd(loadQuota(Date.now()));
          saveQuota(q); setQuota(q);
          setChargeOpen(false);
          toast("1회 충전 완료! 다시 외쳐보세요 🎋");
          reset();
          return null;
        }
        return n - 1;
      });
    }, 1000);
  }
  const leftAds = quota ? adsLeft(quota) : AD_MAX_PER_DAY;
  // 영수증 단계의 전용 타로 안내가 나올 때는 하단 공용 타로 카드를 가려 중복을 막는다.
  const showStageTarot = satisfied && !result?.crisis;

  return (
    <>
    <main className="forest-bg relative min-h-screen overflow-hidden pb-12 text-foreground">
      <div className="bamboo-layer" aria-hidden />
      <div className="moon" aria-hidden />
      <div className="absolute right-4 top-4 z-20"><SoundToggle /></div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">영수증 퍼가기</DialogTitle>
            <DialogDescription>어디에 자랑할까요? 휴대폰에서는 영수증 이미지가 바로 첨부돼요.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {SNS.map((s) => (
              <Button key={s.id} variant="outline" disabled={exporting} onClick={() => exportImage(() => shareTo(s))} className="h-auto flex-col gap-1 py-3 text-xs">
                <span className="text-2xl" aria-hidden>{s.icon}</span>{s.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={chargeOpen} onOpenChange={(o) => adCountdown === null && setChargeOpen(o)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{leftAds > 0 ? "대나무숲에 한 번 더 외치려면?" : "오늘의 숲은 여기까지예요"}</DialogTitle>
            <DialogDescription>{leftAds > 0 ? "5초간 숨을 고른 뒤 한 번 더 외칠 수 있어요." : "오늘 외칠 수 있는 횟수를 모두 썼어요. 내일 다시 만나요 🌙"}</DialogDescription>
          </DialogHeader>
          {adCountdown !== null ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 py-10">
              <p className="text-xs text-muted-foreground">잠시 숨 고르기</p>
              <p className="font-display text-4xl font-bold text-primary">{adCountdown}</p>
              <p className="text-sm text-muted-foreground">심호흡이 끝나면 1회 충전돼요</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {leftAds > 0 && (
                <Button onClick={startAd} className="fire-btn h-auto flex-col gap-1 py-4 text-ember-foreground">
                  <span className="font-semibold">🌿 5초 숨 고르고 1회 충전</span>
                  <span className="text-xs opacity-90">오늘 {leftAds}회 남음</span>
                </Button>
              )}
              <a href="https://teacuptarot.com" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-center text-sm transition hover:bg-accent/20">
                <span className="block font-semibold">🍵 그 사람의 진짜 속마음이 궁금하다면</span>
                <span className="text-xs text-muted-foreground">찻잔 타로에서 들여다보기 →</span>
              </a>
              <p className="text-center text-[11px] text-muted-foreground">원활한 숲 정화를 위해 연속 외치기는 3초 간격으로 가능해요.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-8 px-5 py-14">
        <header className="text-center">
          <p className="font-display text-sm tracking-[0.3em] text-primary">대나무숲 속풀이</p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-tight text-glow sm:text-5xl">
            임금님 귀는<br />당나귀 귀!
          </h1>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            아무에게도 말 못 할 분노, 억울함, 흑역사.<br />
            대나무숲에 던져버리고 흔적 없이 태우세요.
          </p>
          <span className="red-pen mt-5 inline-block px-1 text-sm font-semibold text-foreground">
            🔒 회원가입 없음 · 저장되지 않음 · 완벽한 익명
          </span>
        </header>

        {phase === "input" && (
          <section className="flex flex-col gap-4">
            <div role="group" aria-label="AI 응답 모드" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PERSONAS.map((mode) => (
                <Button key={mode.id} variant={persona === mode.id ? "default" : "outline"} onClick={() => { sfx.tap(); setPersona(mode.id); }} aria-pressed={persona === mode.id} className="h-auto min-h-14 whitespace-normal break-keep px-3 py-3 text-base font-semibold leading-relaxed">
                  {mode.label}
                </Button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 2000))}
              rows={7}
              aria-label="대나무숲에 털어놓을 이야기"
              placeholder={"오늘 하루 너무 답답하고 억울한 일이 있었어요...\n아무에게도 못 한 이야기, 여기에 다 털어놓고 태워버리세요."}
              wrap="soft"
              className="block w-full min-w-0 max-w-full resize-none overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-2xl border border-border bg-card/70 p-5 leading-relaxed backdrop-blur placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              onClick={submit}
              disabled={cooldownLeft > 0}
              className="fire-btn h-auto whitespace-normal rounded-2xl px-6 py-4 text-lg font-bold text-ember-foreground transition active:scale-[0.98]"
            >
              {cooldownLeft > 0 ? `🌫️ 연기가 가라앉는 중... ${cooldownLeft}초` : "🔥 대나무숲에 소리 지르고 태우기"}
            </Button>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              ※ AI가 생성하는 가벼운 감정 해소용 답변이며 의학·심리·법률 상담을 대신하지 않습니다. 위기 시 109 · 1577-0199
            </p>
          </section>
        )}

        {phase === "burning" && (
          <section className="flex flex-col items-center gap-6 py-6">
            <PaperBurn text={burnText} />
            <p role="status" className="text-center text-sm leading-relaxed text-ember-glow">마음을 담은 종이를 천천히 태워요.<br />남은 재는 바람에 날려 보내는 중...</p>
          </section>
        )}

        {phase === "result" && result && (
          <section className="flex animate-in fade-in slide-in-from-bottom-4 flex-col gap-6 duration-700">
            <p className="text-center text-xs text-muted-foreground">당신의 원문은 이미 재가 되어 사라졌어요. 어디에도 남지 않습니다.</p>
            <div className="rounded-2xl border border-primary/30 bg-card/70 p-6 backdrop-blur">
              <p className="mb-2 text-sm text-primary">🎋 대나무숲의 맞장구</p>
              <p className="whitespace-pre-wrap text-lg leading-relaxed">{result.reply}</p>
              {persona === "apology" && !result.crisis && <p className="mt-4 text-xs text-muted-foreground">※ 가상 상대의 역할극이며, 실제 상대의 사과나 속마음이 아닙니다.</p>}
            </div>
            {result.crisis && <aside role="alert" className="border-l-2 border-primary bg-primary/10 p-4">
              <p className="mb-3 font-semibold">지금은 당신의 안전이 먼저예요</p>
              <div className="flex flex-col gap-2">{HOTLINES.map((line) => <Button key={line.number} asChild variant="outline" className="h-auto whitespace-normal py-3"><a href={`tel:${line.number}`}>{line.label} {line.number}</a></Button>)}</div>
              <p className="mt-3 text-sm text-muted-foreground">당장 위험하다면 112 또는 119에 연락해 주세요.</p>
            </aside>}
            {!satisfied && !result.crisis && (
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-5 text-center backdrop-blur">
                <p className="font-display text-lg font-bold">속은 좀 풀리셨나요?</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button variant="outline" onClick={again} className="h-auto flex-col gap-1 whitespace-normal py-4 text-base"><span>아직 답답해요</span><span className="text-sm text-muted-foreground">한 번 더 외치기</span></Button>
                  <Button variant="outline" onClick={() => { sfx.chime(); setSatisfied(true); }} className="h-auto flex-col gap-1 whitespace-normal py-4 text-base"><span>속이 후련해요</span><span className="text-sm text-muted-foreground">소각 영수증 받기</span></Button>
                </div>
              </div>
            )}

            {(satisfied || result.crisis) && receipt && <>
              <BurnReceipt ref={cardRef} result={result} receipt={receipt} />
              <div className="grid grid-cols-3 gap-2">
                <Button disabled={exporting} onClick={() => setShareOpen(true)} className="h-auto flex-col px-1 py-3 sm:flex-row"><Share2 />공유하기</Button>
                <Button disabled={exporting} variant="outline" onClick={() => exportImage(copyImg)} className="h-auto flex-col px-1 py-3 sm:flex-row"><Copy />이미지 복사</Button>
                <Button disabled={exporting} variant="outline" onClick={() => exportImage(download)} className="h-auto flex-col px-1 py-3 sm:flex-row"><Download />저장하기</Button>
              </div>
              <Button variant="link" onClick={again} className="text-sm text-muted-foreground">한 번 더 외치기</Button>
            </>}

            {satisfied && !result.crisis && <div className="mt-4 border-t border-accent/40 px-2 py-7 text-center">
              <div className="text-3xl">🍵</div>
              <p className="font-display mt-2 text-xl font-bold">심호흡 세 번 하셨나요?</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                속은 비워냈으니, 이제 그 사람의 진짜 속마음과 앞으로의 운을 들여다볼 시간입니다.
              </p>
              <Button asChild className="mt-5 h-auto whitespace-normal bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent/90"><a
                href="https://teacuptarot.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                찻잔 타로에서 내 운 흐름 보기 <ArrowUpRight />
              </a></Button>
            </div>}
          </section>
        )}
        {phase !== "burning" && !showStageTarot && (
          <a
            href="https://teacuptarot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-card/60 p-4 backdrop-blur transition hover:border-accent"
          >
            <span className="text-3xl" aria-hidden>🍵</span>
            <span className="flex-1 text-sm leading-relaxed">
              <span className="block font-semibold">화가 좀 풀리셨다면,</span>
              <span className="text-muted-foreground">찻잔 타로에서 그 사람의 진짜 속마음을 들여다보세요</span>
            </span>
            <ArrowUpRight className="size-5 shrink-0 text-accent" />
          </a>
        )}
        <LatestStories />
        <HomeGuideFaq />
      </div>
    </main>
    </>
  );
}
