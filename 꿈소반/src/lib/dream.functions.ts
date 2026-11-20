import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { askOpenAIJson, OpenAIError } from "./openai-direct";

export type FirstReading = {
  keywords: string[];
  summary: string;
  traditional: string;
  psychological: string;
  hookQuestion: string;
  energy: number;
  talisman?: { head: string; body: string } | null;
};

export type DeepReading = {
  title: string;
  connection: string;
  prescription: string;
  advice: string[];
  energy: number;
};

const SYSTEM = `당신은 동양 전통 해몽과 융/프로이트 현대 심리학에 정통한 따뜻하고 신비로운 꿈 해석가입니다.
항상 한국어로, 부드럽고 공감하는 존댓말로 답하세요. 반드시 요청된 JSON 형식만 출력하세요.
"energy"는 꿈 에너지 게이지(0~100 정수)입니다. 의미없고 일상 잔상 같은 개꿈이면 5~40, 강렬한 길몽(돼지, 용, 불, 조상, 똥, 맑은 물, 큰 동물 등)이면 70~100으로 판정하세요. 41~69는 사용하지 마세요.`;

async function askJson<T>(user: string): Promise<T> {
  try {
    const text = await askOpenAIJson(SYSTEM + "\n반드시 JSON 객체로만 답하세요.", user);
    if (!text) throw new Error("empty");
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("dream ai error", e instanceof OpenAIError ? e.status : e);
    if (e instanceof OpenAIError && e.status === 429)
      throw new Error("지금 꿈 해석 요청이 많아요. 잠시 후 다시 시도해 주세요.");
    if (e instanceof OpenAIError && (e.status === 402 || e.status === 403))
      throw new Error("서비스 이용량이 일시적으로 소진되었어요. 잠시 후 다시 찾아주세요.");
    throw new Error("꿈의 암호를 읽는 중 안개가 끼었어요. 다시 시도해 주세요.");
  }
}

function clampEnergy(n: unknown) {
  let v = Math.round(Number(n));
  if (!Number.isFinite(v)) v = 30;
  v = Math.max(0, Math.min(100, v));
  if (v > 40 && v < 70) v = v < 55 ? 38 : 72;
  return v;
}

// Privacy: inputs are used only for this call and never stored or logged.
export const interpretDream = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ dream: z.string().trim().min(5).max(1500) }).parse(d))
  .handler(async ({ data }) => {
    const r = await askJson<FirstReading>(
      `다음 꿈을 해석해 주세요.\n꿈: """${data.dream}"""\n\nJSON 키: keywords(핵심 상징 키워드 정확히 3개 배열, 각 2~6자), summary(상징 요약 1~2문장), traditional(전통 해몽 관점 3~4문장), psychological(현대 심리학 관점 3~4문장), hookQuestion("이 꿈은 보통 ~ 때 자주 꿉니다. 혹시 최근 신경 쓰이는 일이나 고민이 있으셨나요?" 형식, 꿈에 맞게 앞부분 맞춤), energy(정수), talisman(액막이 부적 문구 객체: head는 "OO 꿈이라고 다 같은 OO 꿈이 아냐~"처럼 이 꿈의 구체적 장면을 살린 위트 있는 반말 한마디 25자 이내, body는 오늘 바로 할 수 있는 귀엽고 유쾌한 한 줄 액막이 처방 반말 30자 이내, 예: "따뜻한 물 한 잔 마시면 불안 액운 퇴산!").`,
    );
    const t = r.talisman as { head?: unknown; body?: unknown } | undefined;
    const talisman =
      t && t.head && t.body ? { head: String(t.head).slice(0, 40), body: String(t.body).slice(0, 50) } : null;
    return {
      talisman,
      keywords: (r.keywords ?? []).slice(0, 3).map(String),
      summary: String(r.summary ?? ""),
      traditional: String(r.traditional ?? ""),
      psychological: String(r.psychological ?? ""),
      hookQuestion: String(r.hookQuestion ?? ""),
      energy: clampEnergy(r.energy),
    } satisfies FirstReading;
  });

export const deepInterpret = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ dream: z.string().trim().min(5).max(1500), worry: z.string().trim().min(2).max(1500) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const r = await askJson<DeepReading>(
      `꿈의 상징과 현실 고민을 1:1로 엮어 심층 처방 해몽을 해 주세요.\n꿈: """${data.dream}"""\n현실 고민: """${data.worry}"""\n\nJSON 키: title(처방전 제목 한 줄, 15자 이내), connection(꿈의 각 상징이 고민의 어떤 부분을 비추는지 4~6문장), prescription(무의식이 보내는 처방 3~4문장), advice(오늘 실천할 작은 행동 3개 배열), energy(정수).`,
    );
    return {
      title: String(r.title ?? "무의식의 처방전"),
      connection: String(r.connection ?? ""),
      prescription: String(r.prescription ?? ""),
      advice: (r.advice ?? []).slice(0, 3).map(String),
      energy: clampEnergy(r.energy),
    } satisfies DeepReading;
  });
