import { describe, expect, it } from "vitest";
import { createReceipt, detectsCrisis, fallbackResult, HOTLINES, ventSchema } from "@/lib/forest";

describe("Forest response rules", () => {
  it.each(["comfort", "sharp", "apology"])("accepts persona %s and rejects unknown modes", (persona) => {
    expect(ventSchema.parse({ text: "오늘 속상했어요", persona }).persona).toBe(persona);
    expect(ventSchema.safeParse({ text: "오늘 속상했어요", persona: "hostile" }).success).toBe(false);
  });
  it("uses the two required official hotlines", () => {
    expect(HOTLINES.map((line) => line.number)).toEqual(["109", "1577-0199"]);
  });
  it.each(["comfort", "sharp", "apology"] as const)("overrides %s during a crisis, even on AI failure", (persona) => {
    const crisis = detectsCrisis("오늘 밤에 한강 가서 뛰어내릴 거야");
    expect(crisis).toBe(true);
    const result = fallbackResult(persona, crisis);
    expect(result.crisis).toBe(true);
    expect(result.reply).toContain("109");
    expect(result.reply).toContain("1577-0199");
    expect(result.reply).not.toContain("1393");
  });
  it("does not flag a routine complaint as a crisis", () => {
    expect(detectsCrisis("상사가 내 공을 가로채서 화가 나요")).toBe(false);
  });
  it.each(["김 부장 진짜 죽여버리고 싶다", "아 진짜 죽고 싶다", "회사 다니기 너무 살기 싫다", "배고파 죽겠다"])("treats idiomatic venting '%s' as anger, not crisis", (text) => {
    expect(detectsCrisis(text)).toBe(false);
  });
  it.each(["내일 자살할 거야", "수면제 모아뒀어 오늘 다 먹을 거야", "유서 써놨어"])("flags a concrete plan '%s' as crisis", (text) => {
    expect(detectsCrisis(text)).toBe(true);
  });
  it("creates receipt metadata from time and a ticket only, not user input", () => {
    const receipt = createReceipt(new Date("2026-10-30T02:07:00Z"), "12345678-abcd-1234-abcd-123456789012");
    expect(receipt).toEqual({ burnedAt: "2026-10-30T02:07:00.000Z", ticket: "BR-12345678ABCD" });
    expect(Object.keys(receipt)).toEqual(["burnedAt", "ticket"]);
  });
});