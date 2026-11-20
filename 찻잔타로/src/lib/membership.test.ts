import { describe, it, expect } from "vitest";
import { turnsLeft, FREE_TURNS, LEAF_TURNS, AD_TURNS, extraAfterGrant } from "./membership";
import { findProduct } from "./products";
describe("대화 턴 제한", () => {
  it("상담당 무료 2턴", () => { expect(FREE_TURNS).toBe(2); expect(turnsLeft(2, 0)).toBe(0); expect(turnsLeft(1, 0)).toBe(1); });
  it("광고 1번 = 1턴", () => { expect(AD_TURNS).toBe(1); });
  it("찻잎 1개 = 4턴, 1100원", () => { expect(LEAF_TURNS).toBe(4); expect(findProduct("l1")?.price).toBe(1100); });
  it("이미 5번 대화한 뒤 광고를 보면 1번 남는다", () => { expect(turnsLeft(5, extraAfterGrant(0, 5, AD_TURNS))).toBe(1); });
  it("찻잎을 쓰면 지금부터 4번 남는다", () => { expect(turnsLeft(5, extraAfterGrant(0, 5, LEAF_TURNS))).toBe(4); });
});

describe("티룸 멤버십 매일 찻잎", () => {
  it("멤버십이면 하루에 찻잎 1개만 지급된다", async () => {
    const { setMembership, getMembership, syncWallet } = await import("./membership");
    setMembership({ premium: true, leaves: 3 });
    await syncWallet();
    await syncWallet();
    expect(getMembership().leaves).toBe(4);
  });
  it("멤버십이 아니면 지급되지 않는다", async () => {
    const { setMembership, getMembership, syncWallet } = await import("./membership");
    setMembership({ premium: false, leaves: 0 });
    await syncWallet();
    expect(getMembership().leaves).toBe(0);
  });
});
