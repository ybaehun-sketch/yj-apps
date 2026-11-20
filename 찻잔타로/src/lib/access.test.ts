import { describe, it, expect } from "vitest";
import { DAILY_ADS, DAILY_READINGS, MAX_TURNS_PER_READING, isAdminEmail, kstDayStartISO } from "./access";

describe("비용 방어선", () => {
  it("운영자 계정만 관리자", () => {
    expect(isAdminEmail("ybaehun@gmail.com")).toBe(true);
    expect(isAdminEmail("someone@gmail.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
  it("하루 상담 1회, 광고 3회, 상담당 최대 5턴", () => {
    expect(DAILY_READINGS).toBe(1);
    expect(DAILY_ADS).toBe(3);
    expect(MAX_TURNS_PER_READING).toBe(5);
  });
  it("한국 자정 기준으로 하루가 바뀜", () => {
    expect(kstDayStartISO(new Date("2026-10-26T14:59:00Z"))).toBe("2026-10-25T15:00:00.000Z");
    expect(kstDayStartISO(new Date("2026-10-26T15:00:00Z"))).toBe("2026-10-26T15:00:00.000Z");
  });
});

import { DAILY_READINGS as DR, DAILY_READING_ADS as DRA } from "./access";
import { describe as d2, it as i2, expect as e2 } from "vitest";
d2("하루 새 상담 규칙", () => {
  i2("무료 새 상담은 하루 1번", () => e2(DR).toBe(1));
  i2("광고로 여는 새 상담은 하루 2번까지", () => e2(DRA).toBe(2));
});
