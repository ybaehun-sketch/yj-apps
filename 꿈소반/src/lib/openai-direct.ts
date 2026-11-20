// AI 호출: 제미나이(GEMINI_API_KEY) 1순위 + 예비 모델 자동 전환, 제미나이 열쇠가 없으면 OPENAI_API_KEY로 보조 호출.
// 다른 파일이 쓰는 이름(askOpenAIJson, OpenAIError)은 그대로 유지합니다.
export class OpenAIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"] as const;

async function askGeminiJson(key: string, instructions: string, user: string, maxTokens: number): Promise<string> {
  let lastStatus = 500;
  for (const model of GEMINI_MODELS) {
    let res: Response;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instructions }] },
          contents: [{ role: "user", parts: [{ text: `${user}\n(JSON으로 답해 주세요.)` }] }],
          generationConfig: { maxOutputTokens: Math.max(maxTokens, 800) + 1500, responseMimeType: "application/json" },
        }),
      });
    } catch (e) {
      console.error("Gemini fetch error", model, e);
      continue;
    }
    if (!res.ok) {
      lastStatus = res.status;
      console.error("Gemini error", model, res.status, (await res.text()).slice(0, 500));
      if (res.status === 429 || res.status >= 500) continue;
      break;
    }
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
    if (text) return text;
  }
  throw new OpenAIError(lastStatus, "gemini failed");
}

export async function askOpenAIJson(instructions: string, user: string, maxTokens = 4000): Promise<string> {
  const geminiKey = (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"])?.trim();
  if (geminiKey) return askGeminiJson(geminiKey, instructions, user, maxTokens);

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new OpenAIError(500, "missing key");
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      instructions,
      reasoning: { effort: "low" },
      max_output_tokens: maxTokens,
      text: { format: { type: "json_object" } },
      input: [{ role: "user", content: `${user}\n(JSON으로 답해 주세요.)` }],
    }),
  });
  if (!res.ok) {
    console.error("OpenAI error", res.status, (await res.text()).slice(0, 500));
    throw new OpenAIError(res.status, "openai failed");
  }
  const json = (await res.json()) as { output?: { content?: { type: string; text?: string }[] }[] };
  return (json.output ?? [])
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
}
