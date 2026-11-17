import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.5-flash-lite";
export const GEMINI_FALLBACK_MODEL = "gemini-3.1-flash-lite";

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
  const models = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL];
  for (const model of models) {
    try {
      const interaction = await withTimeout(
        ai.interactions.create({
          model,
          system_instruction: opts.instructions,
          input: opts.input,
          store: false,
          generation_config: {
            max_output_tokens: Math.max(opts.maxOutputTokens ?? 2048, 2048),
            thinking_level: "low",
          },
        }),
        CALL_TIMEOUT_MS,
      );
      const out = (interaction as { output_text?: string; outputs?: Array<{ type?: string; text?: string }> });
      if (typeof out.output_text === "string" && out.output_text.trim()) {
        return out.output_text;
      }
      const fallback = (out.outputs ?? [])
        .filter((o) => o.type === "text" && typeof o.text === "string")
        .map((o) => o.text)
        .join("");
      if (fallback) return fallback;
    } catch (e) {
      console.error(`gemini call failed (${model})`, e);
    }
  }
  return null;
}

const CALL_TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
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
