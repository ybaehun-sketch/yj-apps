import { useMemo, useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shareNode } from "./share";

const CHARMS = [
  { emoji: "🐱", name: "냥냥 액막이부", line: "나쁜 기운은 솜방망이 꾹꾹이로 눌러 봉인했다냥" },
  { emoji: "🐯", name: "꼬마 백호 호치부", line: "어흥! 어젯밤 흉몽은 내가 한입에 씹어 삼켰다" },
  { emoji: "🐰", name: "달토끼 쿵덕 수호부", line: "잡념과 불안은 밤새 절구로 빻아 날려 보냈어요" },
  { emoji: "🐶", name: "멍멍 벽사 수호부", line: "잡귀와 잔걱정은 멍! 하고 쫓아냈으니 안심하세요" },
  { emoji: "🦁", name: "아기 해태 평온부", line: "마음속 응어리와 불길한 기운을 시원하게 삼켜드려요" },
];

const QUIPS: { keys: string[]; head: string; body: string }[] = [
  { keys: ["불", "화재", "연기"], head: "불이라고 다 같은 불꿈이 아냐~", body: "연기만 났다면 속앓이 청소 완료, 활활 탔다면 대박 조짐!" },
  { keys: ["이빨", "치아", "이가", "어금니"], head: "이 빠졌다고 다 흉몽인 줄 알았지?", body: "낡은 걱정 훌훌 털고 새판 짜는 리셋 신호야~" },
  { keys: ["뱀", "구렁이"], head: "뱀 나왔다고 겁먹지 마!", body: "날 물었으면 복덩이, 스쳐 갔으면 액땜 완료!" },
  { keys: ["쫓", "도망", "추락", "떨어"], head: "도망친 게 아니라 스트레스를 제친 거야!", body: "전속력으로 달린 만큼 멘탈은 리프레시 완료." },
  { keys: ["물", "바다", "강", "홍수"], head: "물이라고 다 같은 물꿈이 아냐~", body: "맑았으면 재물운 콸콸, 탁했으면 마음 정화 중!" },
  { keys: ["돈", "지갑", "금"], head: "돈 꿈 꿨다고 벌써 김칫국?", body: "마셔도 돼! 오늘은 기대감이 행운을 부르는 날~" },
  { keys: ["똥", "대변", "변"], head: "똥꿈이라고 더럽다 하지 마!", body: "묵은 걱정 시원하게 쏟아내고 복이 굴러들어 와~" },
  { keys: ["죽", "장례", "시체"], head: "죽는 꿈이라고 다 끝이 아냐~", body: "낡은 나를 보내고 새로 태어나는 재시작 꿈이야!" },
  { keys: ["시험", "수능", "지각"], head: "시험 꿈이라고 다시 수능 보는 거 아냐~", body: "요즘 잘하고 싶은 마음이 크다는 증거일 뿐!" },
];
const DEFAULT_QUIP = { head: "개꿈이라고 다 같은 개꿈이 아냐~", body: "뇌가 밤새 스트레스 분리수거한 완벽한 디톡스라구!" };

export function TalismanCard({
  keywords = [],
  quip,
}: {
  keywords?: string[];
  quip?: { head: string; body: string } | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const c = useMemo(() => CHARMS[Math.floor(Math.random() * CHARMS.length)] ?? CHARMS[0]!, []);
  const q = useMemo(() => {
    if (quip?.head && quip?.body) return quip;
    const text = keywords.join(" ");
    return QUIPS.find((x) => x.keys.some((k) => text.includes(k))) ?? DEFAULT_QUIP;
  }, [keywords, quip]);
  const date = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  return (
    <div className="animate-rise flex flex-col items-center gap-4">
      <div
        ref={ref}
        className="relative flex aspect-[9/16] w-full max-w-[280px] flex-col items-center justify-between overflow-hidden rounded-md border-[5px] border-seal bg-paper px-5 py-6 text-ink shadow-glow"
      >
        <div className="pointer-events-none absolute inset-2 rounded-sm border-2 border-seal/70" />
        <div className="pointer-events-none absolute inset-3.5 rounded-sm border border-dashed border-seal/50" />
        <span className="absolute left-4 top-4 text-sm text-seal">⚡</span>
        <span className="absolute right-4 top-4 text-sm text-seal">✦</span>
        <span className="absolute bottom-24 left-4 text-xs text-seal">✧</span>
        <span className="absolute bottom-24 right-4 text-sm text-seal">⚡</span>

        <div className="relative text-center">
          <p className="font-serif text-[11px] tracking-[0.35em] text-seal">急急如律令</p>
          <p className="mt-1 font-serif text-lg font-bold tracking-widest text-seal">勅令 · 惡夢退散</p>
        </div>

        <div className="relative flex flex-col items-center gap-2.5">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-seal/70 bg-seal/10">
            <span className="text-6xl">{c.emoji}</span>
          </div>
          <h3 className="font-serif text-lg font-bold">{c.name}</h3>
          <div className="h-px w-16 bg-seal/70" />
          <p className="text-center font-serif text-[15px] font-bold leading-snug text-seal">“{q.head}”</p>
          <p className="text-center font-serif text-[13px] leading-relaxed">{q.body}</p>
          <p className="text-center text-[11px] leading-relaxed opacity-75">{c.line}</p>
        </div>

        <div className="relative flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <span className="rotate-[-4deg] rounded-sm border-2 border-seal px-1.5 py-0.5 font-serif text-sm font-bold text-seal">夢 · 꿈소반</span>
            <span className="text-[10px] opacity-70">{date} 액막이</span>
          </div>
          <p className="font-serif text-xs font-bold tracking-wider">꿈해몽은 꿈소반</p>
        </div>
      </div>
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => shareNode(ref.current, "kkumsoban-talisman.png", "꿈소반에서 받은 오늘의 액막이 부적 🧧")}
      >
        <Download /> 부적 저장 · 공유하기
      </Button>
    </div>
  );
}
