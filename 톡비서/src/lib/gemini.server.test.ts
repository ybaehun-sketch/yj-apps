import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GEMINI_MODELS,
  callGemini,
  checkGeminiHealth,
  getCandidateModels,
  getGeminiApiKey,
  isQuotaError,
  resetGeminiCooldowns,
} from "./gemini.server";

const createMock = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    interactions = { create: createMock };
  },
}));

describe("gemini.server failover & key resolution", () => {
  const origGemini = process.env["GEMINI_API_KEY"];
  const origGoogle = process.env["GOOGLE_API_KEY"];
  const origModels = process.env["GEMINI_MODELS"];

  afterEach(() => {
    resetGeminiCooldowns();
    createMock.mockReset();
    if (origGemini === undefined) delete process.env["GEMINI_API_KEY"];
    else process.env["GEMINI_API_KEY"] = origGemini;
    if (origGoogle === undefined) delete process.env["GOOGLE_API_KEY"];
    else process.env["GOOGLE_API_KEY"] = origGoogle;
    if (origModels === undefined) delete process.env["GEMINI_MODELS"];
    else process.env["GEMINI_MODELS"] = origModels;
  });

  it("prefers explicit env key over local fallback key", () => {
    process.env["GEMINI_API_KEY"] = "env-priority-key";
    expect(getGeminiApiKey()).toBe("env-priority-key");
  });

  it("detects 429 and quota errors", () => {
    expect(isQuotaError({ status: 429 })).toBe(true);
    expect(isQuotaError(new Error("Rate limit exceeded"))).toBe(true);
    expect(isQuotaError(new Error("RESOURCE_EXHAUSTED"))).toBe(true);
    expect(isQuotaError(new Error("Network error"))).toBe(false);
  });

  it("switches to backup model on quota error and cools down the blocked primary model", async () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    createMock
      .mockRejectedValueOnce(Object.assign(new Error("429 Rate limit exceeded"), { status: 429 }))
      .mockResolvedValueOnce({ output_text: "예비 모델 응답 성공" });

    const out = await callGemini({ input: "테스트" });
    expect(out).toBe("예비 모델 응답 성공");
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock.mock.calls[0]?.[0]?.model).toBe(GEMINI_MODELS[0]);
    expect(createMock.mock.calls[1]?.[0]?.model).toBe(GEMINI_MODELS[1]);

    // Subsequent call prioritizes healthy backup models ahead of cooled-down primary
    const ordered = getCandidateModels();
    expect(ordered[0]).toBe(GEMINI_MODELS[1]);
    expect(ordered[ordered.length - 1]).toBe(GEMINI_MODELS[0]);
  });

  it("falls through to the 3rd verified backup if the first two fail", async () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    createMock
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockResolvedValueOnce({ output_text: "" })
      .mockResolvedValueOnce({ outputs: [{ type: "text", text: "3차 모델 응답" }] });

    const out = await callGemini({ input: "테스트" });
    expect(out).toBe("3차 모델 응답");
    expect(createMock.mock.calls.map((c) => c[0]?.model)).toEqual([...GEMINI_MODELS]);
  });

  it("uses centrally configured GEMINI_MODELS env var when provided", async () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    process.env["GEMINI_MODELS"] = "custom-model-a, custom-model-b";
    createMock
      .mockRejectedValueOnce(new Error("fail a"))
      .mockResolvedValueOnce({ output_text: "커스텀 B 응답" });

    const out = await callGemini({ input: "테스트" });
    expect(out).toBe("커스텀 B 응답");
    expect(createMock.mock.calls.map((c) => c[0]?.model)).toEqual(["custom-model-a", "custom-model-b"]);
  });

  it("reports healthy or degraded status via checkGeminiHealth", async () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    createMock
      .mockRejectedValueOnce(new Error("primary down"))
      .mockResolvedValueOnce({ output_text: "OK" });

    const health = await checkGeminiHealth();
    expect(health.ok).toBe(true);
    expect(health.primaryModel).toBe(GEMINI_MODELS[0]);
    expect(health.activeModel).toBe(GEMINI_MODELS[1]);
    expect(health.failedModels).toEqual([GEMINI_MODELS[0]]);
  });

  it("falls back to OpenAI when all Gemini models fail and notifies control center", async () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    process.env["OPENAI_API_KEY"] = "sk-test-openai";
    process.env["CONTROL_CENTER_ALERT_URL"] = "https://control.example.com/api/alerts/ingest";
    process.env["CONTROL_CENTER_ALERT_TOKEN"] = "secret-token";

    createMock
      .mockRejectedValueOnce(Object.assign(new Error("429 quota exceeded"), { status: 429 }))
      .mockRejectedValueOnce(Object.assign(new Error("429 quota exceeded"), { status: 429 }))
      .mockRejectedValueOnce(Object.assign(new Error("429 quota exceeded"), { status: 429 }));

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const target = String(url);
      if (target.includes("api.openai.com/v1/chat/completions")) {
        return new Response(
          JSON.stringify({ choices: [{ message: { content: '{"summary":"백업 정리 완료"}' } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (target.includes("control.example.com")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    try {
      const out = await callGemini({ input: "내일 3시 미팅" });
      expect(out).toBe('{"summary":"백업 정리 완료"}');

      await new Promise((r) => setTimeout(r, 10));
      const alertCall = fetchSpy.mock.calls.find((c) => String(c[0]).includes("control.example.com"));
      expect(alertCall).toBeTruthy();
      const alertBody = JSON.parse(String((alertCall?.[1] as RequestInit | undefined)?.body ?? "{}")) as {
        severity?: string;
        appKey?: string;
        message?: string;
      };
      expect(alertBody.appKey).toBe("tokbiseo");
      expect(alertBody.severity).toBe("warning");
      expect(alertBody.message).toContain("할당량 또는 잔액 소진");
    } finally {
      fetchSpy.mockRestore();
      delete process.env["OPENAI_API_KEY"];
      delete process.env["CONTROL_CENTER_ALERT_URL"];
      delete process.env["CONTROL_CENTER_ALERT_TOKEN"];
    }
  });
});
