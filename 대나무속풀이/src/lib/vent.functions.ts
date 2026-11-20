import { createServerFn } from "@tanstack/react-start";
import { crisisResult, detectsCrisis, fallbackResult, resultSchema, ventSchema, type VentResult } from "./forest";
export type { VentResult } from "./forest";

export const ventToForest = createServerFn({ method: "POST" })
  .inputValidator((d) => ventSchema.parse(d))
  .handler(async ({ data }): Promise<VentResult> => {
    const crisis = detectsCrisis(data.text);
    try {
      if (crisis) return crisisResult();
      const { openaiJson } = await import("./openai.server");
      const { forestInstructions } = await import("./forest-prompts.server");
      let out: string;
      try {
        out = await openaiJson(forestInstructions(data.persona), `Return JSON. 카테고리: ${data.category ?? "없음"}\n하소연:\n${data.text}`);
      } catch (e) {
        if (e instanceof Error && e.message === "refusal") return { reply: "이 요청에는 안전하게 답하기 어려워요. 폭력이나 모욕 대신 속상한 마음에 함께할게요.", title: "안전한 쉼", prescription: "잠시 숨을 고르고 나를 지킬 시간", crisis: false };
        throw e;
      }
      const parsed = resultSchema.parse(JSON.parse(out));
      return parsed.crisis ? crisisResult() : parsed;
    } catch {
      // Never log a gateway error or input: errors may contain sensitive request data.
      return fallbackResult(data.persona, crisis);
    } finally {
      data.text = "";
    }
  });
