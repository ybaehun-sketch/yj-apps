import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-4-hydrogen";

export function getGeminiApiKey(): string | undefined {
  return process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"];
}

export type GeminiInputPart =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mime_type: string }
  | { type: "audio"; data: string; mime_type: string };

/**
 * Call Gemini Interactions API with optional multimodal parts and return text output.
 */
export async function callGemini(opts: {
  instructions?: string;
  input: string | GeminiInputPart[];
  maxOutputTokens?: number;
  json?: boolean;
}): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  try {
    const interaction = await ai.interactions.create({
      model: GEMINI_MODEL,
      system_instruction: opts.instructions,
      input: opts.input,
      store: false,
      generation_config: {
        max_output_tokens: Math.max(opts.maxOutputTokens ?? 2048, 2048),
      },
    });
    const out = (interaction as { output_text?: string; outputs?: Array<{ type?: string; text?: string }> });
    if (typeof out.output_text === "string" && out.output_text.trim()) {
      return out.output_text;
    }
    const fallback = (out.outputs ?? [])
      .filter((o) => o.type === "text" && typeof o.text === "string")
      .map((o) => o.text)
      .join("");
    return fallback || null;
  } catch (e) {
    console.error("gemini call failed", e);
    return null;
  }
}

/**
 * Extract and parse a JSON object from model output (handling optional markdown code fences).
 */
export function parseGeminiJson<T = Record<string, unknown>>(raw: string | null): T | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Split a base64 data URL into raw base64 data and MIME type.
 */
export function parseDataUrl(dataUrl: string): { data: string; mime_type: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match?.[1] || !match[2]) return null;
  return { mime_type: match[1], data: match[2] };
}
