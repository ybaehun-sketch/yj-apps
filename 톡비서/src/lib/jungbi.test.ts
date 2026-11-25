import { describe, it, expect } from "vitest";
import { PLANS, parseRule, classify } from "./jungbi";

describe("jungbi rules", () => {
  it("plan prices", () => {
    expect(PLANS.map((p) => p.price)).toEqual(["0원", "3,900원/월", "39,000원/년"]);
  });
  it("custom rule nike -> gear", () => {
    const r = parseRule("앞으로 나이키 관련은 [운동 장비]로 분류해줘");
    expect(r).toEqual({ keyword: "나이키", category: "gear" });
    expect(classify("나이키 페가수스 세일", "text", [r!])).toBe("gear");
  });
});
