import { describe, expect, it } from "vitest";
import { aiLangRule, trL } from "./i18n";

describe("i18n", () => {
  it("translates categories to English and Japanese", () => {
    expect(trL("en", "일정")).toBe("Schedule");
    expect(trL("ja", "할일")).toBe("やること");
  });
  it("keeps Korean and unknown keys as-is", () => {
    expect(trL("ko", "일정")).toBe("일정");
    expect(trL("en", "없는 문구")).toBe("없는 문구");
  });
  it("fills placeholders", () => {
    expect(trL("en", "총 {0}건", 3)).toBe("3 total");
  });
  it("adds an AI language rule only for non-Korean", () => {
    expect(aiLangRule("ko")).toBe("");
    expect(aiLangRule("ja")).toContain("Japanese");
  });
});
