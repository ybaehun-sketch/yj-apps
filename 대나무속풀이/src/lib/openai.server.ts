// Server-only: calls OpenAI with the project's stored OPENAI_API_KEY.
// Never log request bodies or the key; requests are not stored by OpenAI (store: false).
export const OPENAI_MODEL = "gpt-5.4-mini";

export async function openaiJson(instructions: string, input: string): Promise<string> {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY missing");
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
