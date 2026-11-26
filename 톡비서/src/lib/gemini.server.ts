import { GoogleGenAI } from "@google/genai";
import { classifyAiFailureReason, reportAiIncident } from "./ai-incident.server";

export const GEMINI_MODEL = "gemini-3.5-flash-lite";
export const GEMINI_FALLBACK_MODEL = "gemini-flash-lite-latest";
export const GEMINI_EMERGENCY_MODEL = "gemini-3.8-flash";
export const OPENAI_BACKUP_MODEL = "gpt-4o-mini";
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

export function getOpenAiApiKey(): string | undefined {
  return process.env["OPENAI_API_KEY"]?.trim() || undefined;
}

export function hasAnyAiKey(): boolean {
  return Boolean(getGeminiApiKey() || getOpenAiApiKey());
}

interface ProxyBinding {
  fetch: typeof fetch;
}

async function getGeminiProxyBinding(): Promise<ProxyBinding | null> {
  const fromGlobal = (globalThis as { __GEMINI_PROXY__?: ProxyBinding }).__GEMINI_PROXY__;
  if (fromGlobal && typeof fromGlobal.fetch === "function") {
    return fromGlobal;
  }
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

function decodeBase64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function transcribeAudioWithOpenAi(
  apiKey: string,
  part: { data: string; mime_type: string },
  timeoutMs: number,
): Promise<string> {
  const ext = part.mime_type.includes("mp4") || part.mime_type.includes("m4a")
    ? "m4a"
    : part.mime_type.includes("wav")
      ? "wav"
      : part.mime_type.includes("mpeg") || part.mime_type.includes("mp3")
        ? "mp3"
        : "webm";
  const form = new FormData();
  const bytes = decodeBase64ToBytes(part.data);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  form.append("file", new Blob([copy.buffer], { type: part.mime_type }), `voice.${ext}`);
  form.append("model", "whisper-1");

  const res = await withTimeout(
    fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    }),
    timeoutMs,
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`OpenAI Whisper HTTP ${res.status}: ${body.slice(0, 300)}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const data = (await res.json()) as { text?: string };
  const text = data.text?.trim();
  if (!text) throw new Error("OpenAI Whisper empty transcription");
  return text;
}

async function callOpenAiFallback(
  apiKey: string,
  opts: {
    instructions?: string;
    input: string | GeminiInputPart[];
    maxOutputTokens?: number;
    json?: boolean;
  },
  timeoutMs: number,
): Promise<string> {
  const parts: GeminiInputPart[] =
    typeof opts.input === "string" ? [{ type: "text", text: opts.input }] : opts.input;

  const audioParts = parts.filter((p): p is { type: "audio"; data: string; mime_type: string } => p.type === "audio");
  const imageParts = parts.filter((p): p is { type: "image"; data: string; mime_type: string } => p.type === "image");
  const textParts = parts.filter((p): p is { type: "text"; text: string } => p.type === "text");

  const transcripts: string[] = [];
  for (const audio of audioParts) {
    transcripts.push(await transcribeAudioWithOpenAi(apiKey, audio, timeoutMs));
  }
  if (audioParts.length > 0 && imageParts.length === 0 && opts.json === false) {
    return transcripts.join("\n");
  }

  type OpenAiContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };
  const content: OpenAiContentPart[] = [];
  for (const t of textParts) {
    content.push({ type: "text", text: t.text });
  }
  if (transcripts.length > 0) {
    content.push({ type: "text", text: `[음성 받아쓰기]\n${transcripts.join("\n")}` });
  }
  for (const img of imageParts) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${img.mime_type};base64,${img.data}` },
    });
  }

  const messages: Array<{ role: "system" | "user"; content: string | OpenAiContentPart[] }> = [];
  if (opts.instructions?.trim()) {
    messages.push({ role: "system", content: opts.instructions });
  }
  messages.push({
    role: "user",
    content: content.length === 1 && content[0]?.type === "text" ? content[0].text : content,
  });

  const payload: Record<string, unknown> = {
    model: OPENAI_BACKUP_MODEL,
    messages,
    max_tokens: Math.max(opts.maxOutputTokens ?? 1200, 1200),
    ...(opts.json === false ? {} : { response_format: { type: "json_object" } }),
  };

  const res = await withTimeout(
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    }),
    timeoutMs,
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`OpenAI HTTP ${res.status}: ${body.slice(0, 300)}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const out = data.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("OpenAI empty output");
  return out;
}

/**
 * Call Gemini Interactions API with optional multimodal parts and return text output.
 * Automatically fails over across verified backup Gemini models, then OpenAI backup if configured,
 * and reports diagnosed incidents to the company control center.
 */
export async function callGemini(opts: {
  instructions?: string;
  input: string | GeminiInputPart[];
  maxOutputTokens?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  const openAiKey = getOpenAiApiKey();
  if (!apiKey && !openAiKey) return null;

  const hasMedia = Array.isArray(opts.input) && opts.input.some((p) => p.type === "image" || p.type === "audio");
  const timeoutMs = opts.timeoutMs ?? (hasMedia ? MEDIA_CALL_TIMEOUT_MS : CALL_TIMEOUT_MS);

  let lastGeminiError: unknown = apiKey ? null : new Error("GEMINI_API_KEY missing");
  if (apiKey) {
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
        lastGeminiError = new Error(`gemini empty output (${model})`);
        console.warn("gemini empty output", { viaProxy: !!proxy, model, keys: Object.keys(out ?? {}) });
      } catch (e) {
        lastGeminiError = e;
        if (isQuotaError(e)) {
          modelCooldownUntil.set(model, Date.now() + QUOTA_COOLDOWN_MS);
        }
        console.error(`gemini call failed (${model})`, e);
      }
    }
  }

  const primaryDiagnosis = classifyAiFailureReason(lastGeminiError);
  if (openAiKey) {
    try {
      const backupText = await callOpenAiFallback(openAiKey, opts, timeoutMs);
      console.log("openai fallback ok", { hasMedia, primaryCause: primaryDiagnosis.code });
      void reportAiIncident({
        severity: "warning",
        dedupeKey: `gemini-failover:${primaryDiagnosis.code}`,
        title: "주 AI(Gemini) 장애 → 예비 AI(OpenAI) 자동 전환",
        message: [
          `추정 원인: ${primaryDiagnosis.label}`,
          `권장 조치: ${primaryDiagnosis.actionHint}`,
          "현재는 예비 AI(OpenAI)가 대신 메모를 정상 처리하고 있습니다.",
        ].join("\n"),
      });
      return backupText;
    } catch (backupErr) {
      const backupDiagnosis = classifyAiFailureReason(backupErr);
      console.error("openai fallback failed", backupErr);
      void reportAiIncident({
        severity: "critical",
        dedupeKey: `ai-total-outage:${primaryDiagnosis.code}:${backupDiagnosis.code}`,
        title: "톡비서 AI 전면 중단 (원문만 보관됨)",
        message: [
          `주 AI(Gemini) 원인: ${primaryDiagnosis.label}`,
          `예비 AI(OpenAI) 원인: ${backupDiagnosis.label}`,
          `권장 조치: ${primaryDiagnosis.actionHint}`,
        ].join("\n"),
      });
      return null;
    }
  }

  void reportAiIncident({
    severity: "critical",
    dedupeKey: `ai-outage:${primaryDiagnosis.code}`,
    title: "톡비서 AI 중단 (원문만 보관됨)",
    message: [
      `주 AI(Gemini) 원인: ${primaryDiagnosis.label}`,
      "예비 AI(OpenAI): 미설정",
      `권장 조치: ${primaryDiagnosis.actionHint}`,
    ].join("\n"),
  });
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
