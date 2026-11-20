import { z } from "zod";

export const PERSONAS = [
  { id: "comfort", label: "☕ 무조건 내 편" },
  { id: "apology", label: "🙇‍♂️ 싹싹 비는 가상 상대" },
] as const;
// "sharp" stays valid server-side for compatibility but is no longer offered in the UI.
export type Persona = "comfort" | "sharp" | "apology";
export const ventSchema = z.object({
  category: z.string().max(30).optional(),
  persona: z.enum(["comfort", "sharp", "apology"]).default("comfort"),
  text: z.string().trim().min(2).max(2000),
});
export const resultSchema = z.object({
  reply: z.string().trim().min(1),
  title: z.string().trim().min(1).max(20),
  prescription: z.string().trim().min(1).max(80),
  crisis: z.boolean(),
});
export type VentResult = z.infer<typeof resultSchema>;
export const HOTLINES = [
  { label: "자살예방 상담전화", number: "109" },
  { label: "정신건강 상담전화", number: "1577-0199" },
] as const;

// Only concrete plans (when / how) trigger the hotline. Idiomatic venting such as
// "죽고 싶다", "살기 싫다", "죽여버리고 싶다" is treated as ordinary anger.
const CRISIS_METHOD = /유서|번개탄|수면제.{0,10}(모아|먹|삼키)|약.{0,6}(모아\s*(뒀|놨|두었)|한꺼번에\s*먹)|투신|(옥상|다리|한강).{0,12}뛰어\s*내[리릴린려]|목을\s*매|손목.{0,6}긋|극단적\s*선택.{0,8}(하겠|할\s*거|할게|하려)/;
const CRISIS_PLAN = /(오늘|내일|이번\s*주|주말|밤에|새벽|지금\s*바로|곧).{0,20}(자살|죽을\s*(거|게|생각)|죽겠다고|목숨.{0,6}끊|생을\s*마감)|자살\s*(할\s*(거|게|계획)|하겠|하려고|계획)|목숨.{0,6}끊(을\s*거|겠|으려)|i('m| am)?\s*going to kill myself|suicide (plan|note)/i;
export function detectsCrisis(text: string) {
  return CRISIS_METHOD.test(text) || CRISIS_PLAN.test(text);
}
export function crisisResult(): VentResult {
  return {
    reply: "지금 정말 버티기 힘든 마음이 느껴져요. 당신의 안전이 가장 중요해요. 혼자 견디지 말고 믿을 수 있는 사람에게 지금 함께 있어 달라고 부탁해 주세요. 자살예방 상담전화 109 또는 정신건강 상담전화 1577-0199로 연락해 주세요. 당장 자신이나 다른 사람이 위험하다면 112 또는 119에 연락해 주세요.",
    title: "지금은 안전 먼저",
    prescription: "지금은 혼자 버티지 않아도 괜찮아요",
    crisis: true,
  };
}
export function fallbackResult(persona: Persona, crisis = false): VentResult {
  if (crisis) return crisisResult();
  const replies: Record<Persona, string> = {
    comfort: "마음이 많이 지쳤겠어요. 여기서는 속상한 마음을 작게 만들 필요 없어요. 오늘 애쓴 당신에게 따뜻한 쉼이 닿기를 바라요.",
    sharp: "타인의 무례는 당신의 가치가 아니라 그 사람의 태도를 설명합니다. 책임을 떠넘기는 건 능력이 아니라 회피죠. 당신이 그 부족함까지 떠안을 이유는 없어요.",
    apology: "제 태도가 당신에게 상처를 줬습니다. 변명으로 제 잘못을 덮으려 했던 점도 진심으로 사과합니다. 당신이 느낀 억울함을 이제야 돌아봅니다.",
  };
  return { reply: replies[persona], title: "마음의 빈자리", prescription: "남의 무례까지 내 짐으로 들지 말 것", crisis: false };
}
export function createReceipt(now = new Date(), ticket = crypto.randomUUID()) {
  return { burnedAt: now.toISOString(), ticket: `BR-${ticket.replaceAll("-", "").slice(0, 12).toUpperCase()}` };
}
export type Receipt = ReturnType<typeof createReceipt>;