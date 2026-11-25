import { describe, expect, it } from "vitest";
import { DAILY_AI_LIMIT, MAX_FILE_BYTES, QUOTA_BYTES, dailyLimitReason, uploadBlockReason } from "./storage-quota";

const MB = 1024 * 1024;
const now = new Date("2026-11-10T00:00:00Z");

describe("storage quota", () => {
  it("free users get 100MB", () => expect(QUOTA_BYTES.free).toBe(100 * MB));
  it("premium gets 20GB", () => {
    expect(QUOTA_BYTES.premium).toBe(20 * 1024 * MB);
  });
  it("free upload allowed within 7 days", () => expect(uploadBlockReason("free", "2026-11-05T00:00:00Z", 0, MB, now)).toBeNull());
  it("free upload blocked after 7 days", () => expect(uploadBlockReason("free", "2026-11-01T00:00:00Z", 0, MB, now)).not.toBeNull());
  it("free upload allowed after 7 days when trial check disabled", () => expect(uploadBlockReason("free", "2026-11-01T00:00:00Z", 0, MB, now, false)).toBeNull());
  it("free upload blocked over 100MB", () => expect(uploadBlockReason("free", "2026-11-09T00:00:00Z", 99.5 * MB, MB, now)).not.toBeNull());
  it("premium not limited by trial", () => expect(uploadBlockReason("premium", "2020-01-01T00:00:00Z", 0, MB, now)).toBeNull());
  it("per-file limit is 20MB for free and 50MB for premium", () => {
    expect(MAX_FILE_BYTES.free).toBe(20 * MB);
    expect(MAX_FILE_BYTES.premium).toBe(50 * MB);
    expect(uploadBlockReason("free", "2026-11-09T00:00:00Z", 0, 20 * MB, now)).toBeNull();
    expect(uploadBlockReason("free", "2026-11-09T00:00:00Z", 0, 21 * MB, now)).not.toBeNull();
    expect(uploadBlockReason("premium", "2026-11-09T00:00:00Z", 0, 50 * MB, now)).toBeNull();
    expect(uploadBlockReason("premium", "2026-11-09T00:00:00Z", 0, 51 * MB, now)).not.toBeNull();
  });
  it("daily AI limit is 20 for free and 50 for premium", () => {
    expect(DAILY_AI_LIMIT.free).toBe(20);
    expect(DAILY_AI_LIMIT.premium).toBe(50);
    expect(dailyLimitReason("free", 19)).toBeNull();
    expect(dailyLimitReason("free", 20)).not.toBeNull();
    expect(dailyLimitReason("premium", 49)).toBeNull();
    expect(dailyLimitReason("premium", 50)).not.toBeNull();
  });
});
