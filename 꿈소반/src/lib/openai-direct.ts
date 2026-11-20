// Calls OpenAI Responses API with the owner's key (server secret OPENAI_API_KEY).
export class OpenAIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function askOpenAIJson(instructions: string, user: string, maxTokens = 4000): Promise<string> {
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
