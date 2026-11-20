import { describe, expect, it } from "vitest";
import { check, consume, fresh, normalize, watchAd } from "@/lib/quota";

const T = Date.UTC(2026, 9, 30, 3, 0, 0);

describe("이용 한도", () => {
  it("첫 1회는 무료, 2회째는 충전 필요", () => {
    let q = fresh(T);
    expect(check(q, T).ok).toBe(true);
    q = consume(q, T);
    expect(check(q, T + 20_000)).toEqual({ ok: false, reason: "need-charge" });
  });

  it("광고는 하루 최대 2회", () => {
    let q = watchAd(watchAd(watchAd(fresh(T))));
    expect(q.adsWatched).toBe(2);
    expect(q.adCredits).toBe(2);
  });

  it("3초 쿨다운", () => {
    let q = watchAd(consume(fresh(T), T));
    expect(check(q, T + 2_000).ok).toBe(false);
    expect(check(q, T + 3_000).ok).toBe(true);
  });

  it("횟수 소진 시 쿨다운 중이어도 바로 충전 안내", () => {
    const q = consume(fresh(T), T);
    expect(check(q, T + 1_000)).toEqual({ ok: false, reason: "need-charge" });
  });

  it("무료 1회 + 광고 2회 = 하루 최대 3회, 이후 소진", () => {
    let q = consume(fresh(T), T);
    q = consume(watchAd(q), T + 20_000);
    q = consume(watchAd(q), T + 40_000);
    expect(check(q, T + 60_000)).toEqual({ ok: false, reason: "daily-cap" });
  });

  it("다음 날이면 초기화", () => {
    const q = watchAd(consume(fresh(T), T));
    expect(normalize(q, T + 86_400_000).used).toBe(0);
    expect(normalize(q, T + 86_400_000).adsWatched).toBe(0);
  });
});
