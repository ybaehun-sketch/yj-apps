import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.5-flash-lite";
export const GEMINI_FALLBACK_MODEL = "gemini-flash-lite-latest";
export const GEMINI_EMERGENCY_MODEL = "gemini-3.8-flash";
export const GEMINI_MODELS = [
  GEMINI_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_EMERGENCY_MODEL,
] as const;

/**
 * Resolve the ordered model list from `GEMINI_MODELS` env var (comma-separated)
 * so models can be swapped centrally without redeploying the app.
 */
export function getConfiguredModels(): string[] {
  const raw = process.env["GEMINI_MODELS"]?.trim();
  if (!raw) return [...GEMINI_MODELS];
  const parsed = raw.split(",").map((m) => m.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : [...GEMINI_MODELS];
}

const QUOTA_COOLDOWN_MS = 20_000;
const modelCooldownUntil = new Map<string, number>();

export function getGeminiApiKey(): string | undefined {
  return (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"])?.trim() || undefined;
}

interface ProxyBinding {
  fetch: typeof fetch;
}

async function getGeminiProxyBinding(): Promise<ProxyBinding | null> {
  try {
    const cfMod = ["cloudflare", "workers"].join(":");
    const mod = await import(/* @vite-ignore */ cfMod);
    const binding = (mod as { env?: { GEMINI_PROXY?: ProxyBinding } }).env?.GEMINI_PROXY;
    return binding && typeof binding.fetch === "function" ? binding : null;
  } catch {
    return null;
  }
}

type InteractionResponse = {
  output_text?: string;
  outputs?: Array<{ type?: string; text?: string }>;
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
};

function extractInteractionText(out: InteractionResponse | null | undefined): string | null {
  if (!out) return null;
  if (typeof out.output_text === "string" && out.output_text.trim()) {
    return out.output_text;
  }
  const fromOutputs = (out.outputs ?? [])
    .filter((o) => o.type === "text" && typeof o.text === "string")
    .map((o) => o.text)
    .join("");
  if (fromOutputs.trim()) return fromOutputs;
  const fromSteps = (out.steps ?? [])
    .filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("");
  return fromSteps.trim() ? fromSteps : null;
}

async function createInteractionViaProxy(
  proxy: ProxyBinding,
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<InteractionResponse> {
  const res = await proxy.fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Gemini proxy HTTP ${res.status}: ${body.slice(0, 300)}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as InteractionResponse;
}

export function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  if (status === 429) return true;
  const msg = String((error as { message?: unknown }).message ?? error);
  return /\b429\b|rate.?limit|quota|resource.?exhausted/i.test(msg);
}

/**
 * Return candidate models ordered with healthy (non-cooled-down) models first.
 */
export function getCandidateModels(now = Date.now()): string[] {
  const healthy: string[] = [];
  const cooled: Array<{ model: string; until: number }> = [];
  for (const model of getConfiguredModels()) {
    const until = modelCooldownUntil.get(model) ?? 0;
    if (until <= now) {
      modelCooldownUntil.delete(model);
      healthy.push(model);
    } else {
      cooled.push({ model, until });
    }
  }
  cooled.sort((a, b) => a.until - b.until);
  return [...healthy, ...cooled.map((c) => c.model)];
}

/** Clear cached model cooldowns (intended for tests). */
export function resetGeminiCooldowns(): void {
  modelCooldownUntil.clear();
}

export type GeminiInputPart =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mime_type: string }
  | { type: "audio"; data: string; mime_type: string };

/**
 * Call Gemini Interactions API with optional multimodal parts and return text output.
 * Automatically fails over across verified backup models and cools down quota-limited models.
 */
export async function callGemini(opts: {
  instructions?: string;
  input: string | GeminiInputPart[];
  maxOutputTokens?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const hasMedia = Array.isArray(opts.input) && opts.input.some((p) => p.type === "image" || p.type === "audio");
  const timeoutMs = opts.timeoutMs ?? (hasMedia ? MEDIA_CALL_TIMEOUT_MS : CALL_TIMEOUT_MS);

  const proxy = await getGeminiProxyBinding();
  const ai = proxy ? null : new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  const models = getCandidateModels();
  for (const model of models) {
    try {
      const payload = {
        model,
        system_instruction: opts.instructions,
        input: opts.input,
        store: false,
        generation_config: {
          max_output_tokens: Math.max(opts.maxOutputTokens ?? 2048, 2048),
          thinking_level: "low",
        },
      };
      const interaction = await withTimeout(
        proxy ? createInteractionViaProxy(proxy, apiKey, payload) : ai!.interactions.create(payload),
        timeoutMs,
      );
      const out = interaction as InteractionResponse;
      const text = extractInteractionText(out);
      if (text) {
        console.log("gemini ok", { viaProxy: !!proxy, model, hasMedia });
        return text;
      }
      console.warn("gemini empty output", { viaProxy: !!proxy, model, keys: Object.keys(out ?? {}) });
    } catch (e) {
      if (isQuotaError(e)) {
        modelCooldownUntil.set(model, Date.now() + QUOTA_COOLDOWN_MS);
      }
      console.error(`gemini call failed (${model})`, e);
    }
  }
  return null;
}

export async function checkGeminiHealth(): Promise<{
  ok: boolean;
  activeModel: string | null;
  primaryModel: string | null;
  failedModels: string[];
}> {
  const apiKey = getGeminiApiKey();
  const models = getCandidateModels();
  const primaryModel = models[0] ?? null;
  if (!apiKey) {
    return { ok: false, activeModel: null, primaryModel, failedModels: models };
  }
  const proxy = await getGeminiProxyBinding();
  const ai = proxy ? null : new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  const failedModels: string[] = [];
  for (const model of models) {
    try {
      const payload = {
        model,
        input: "Reply with OK",
        store: false,
        generation_config: { max_output_tokens: 16, thinking_level: "low" },
      };
      const interaction = await withTimeout(
        proxy ? createInteractionViaProxy(proxy, apiKey, payload) : ai!.interactions.create(payload),
        CALL_TIMEOUT_MS,
      );
      const text = extractInteractionText(interaction as InteractionResponse)?.trim();
      if (text) {
        return { ok: true, activeModel: model, primaryModel, failedModels };
      }
      failedModels.push(model);
    } catch (e) {
      failedModels.push(model);
      console.error(`gemini health check failed (${model})`, e);
    }
  }
  return { ok: false, activeModel: null, primaryModel, failedModels };
}

const CALL_TIMEOUT_MS = 15_000;
const MEDIA_CALL_TIMEOUT_MS = 25_000;

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
