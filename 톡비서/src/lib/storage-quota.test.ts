import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, QUOTA_BYTES, uploadBlockReason } from "./storage-quota";

const MB = 1024 * 1024;
const now = new Date("2026-11-10T00:00:00Z");

describe("storage quota", () => {
  it("free users get 100MB", () => expect(QUOTA_BYTES.free).toBe(100 * MB));
  it("premium gets 10GB, lifetime 30GB", () => {
    expect(QUOTA_BYTES.premium).toBe(10 * 1024 * MB);
    expect(QUOTA_BYTES.lifetime).toBe(30 * 1024 * MB);
  });
  it("free upload allowed within 7 days", () => expect(uploadBlockReason("free", "2026-11-05T00:00:00Z", 0, MB, now)).toBeNull());
  it("free upload blocked after 7 days", () => expect(uploadBlockReason("free", "2026-11-01T00:00:00Z", 0, MB, now)).not.toBeNull());
  it("free upload blocked over 100MB", () => expect(uploadBlockReason("free", "2026-11-09T00:00:00Z", 99.5 * MB, MB, now)).not.toBeNull());
  it("premium not limited by trial", () => expect(uploadBlockReason("premium", "2020-01-01T00:00:00Z", 0, MB, now)).toBeNull());
  it("per-file limit is 20MB", () => {
    expect(MAX_FILE_BYTES).toBe(20 * MB);
    expect(uploadBlockReason("free", "2026-11-09T00:00:00Z", 0, 20 * MB, now)).toBeNull();
    expect(uploadBlockReason("free", "2026-11-09T00:00:00Z", 0, 21 * MB, now)).not.toBeNull();
  });
});
