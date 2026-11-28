// AI 호출: 제미나이(GEMINI_API_KEY) 1순위 + 예비 모델 자동 전환, 제미나이 열쇠가 없으면 OPENAI_API_KEY로 보조 호출.
// Never log request bodies or the key.
export const OPENAI_MODEL = "gpt-5.4-mini";
const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"] as const;

async function askGeminiJson(key: string, instructions: string, input: string): Promise<string> {
  let lastStatus = 500;
  for (const model of GEMINI_MODELS) {
    let res: Response;
    try {
      res = await fetch(`https://tokbiseo-gemini-proxy.ybaehun.workers.dev/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instructions }] },
          contents: [{ role: "user", parts: [{ text: `${input}\n(Respond in json.)` }] }],
          generationConfig: { maxOutputTokens: 4000, responseMimeType: "application/json" },
        }),
      });
    } catch (e) {
      console.error("Gemini fetch error", model, e);
      continue;
    }
    if (!res.ok) {
      lastStatus = res.status;
      console.error("Gemini error", model, res.status);
      if (res.status === 429 || res.status >= 500) continue;
      break;
    }
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
    if (text) return text;
  }
  throw new Error(`Gemini status ${lastStatus}`);
}

export async function openaiJson(instructions: string, input: string): Promise<string> {
  const geminiKey = (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"])?.trim();
  if (geminiKey) return askGeminiJson(geminiKey, instructions, input);

  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("GEMINI_API_KEY or OPENAI_API_KEY missing");
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions,
      input: `${input}\n(Respond in json.)`,
      store: false,
      text: { format: { type: "json_object" } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI status ${res.status}`);
  const json = (await res.json()) as {
    output?: { type: string; content?: { type: string; text?: string }[] }[];
  };
  let out = "";
  for (const item of json.output ?? []) {
    if (item.type !== "message") continue;
    for (const c of item.content ?? []) {
      if (c.type === "refusal") throw new Error("refusal");
      if (c.type === "output_text" && c.text) out += c.text;
    }
  }
  return out;
}
