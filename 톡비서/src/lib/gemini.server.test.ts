import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GEMINI_MODELS,
  callGemini,
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

  afterEach(() => {
    resetGeminiCooldowns();
    createMock.mockReset();
    if (origGemini === undefined) delete process.env["GEMINI_API_KEY"];
    else process.env["GEMINI_API_KEY"] = origGemini;
    if (origGoogle === undefined) delete process.env["GOOGLE_API_KEY"];
    else process.env["GOOGLE_API_KEY"] = origGoogle;
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
});
