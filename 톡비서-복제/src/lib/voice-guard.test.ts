import { describe, it, expect } from "vitest";
import { isSilenceHallucination } from "./voice-guard";
describe("무음 환각 필터", () => {
  it("고맙습니다만 나오면 버린다", () => expect(isSilenceHallucination("고맙습니다.")).toBe(true));
  it("시청해 주셔서 감사합니다도 버린다", () => expect(isSilenceHallucination("시청해 주셔서 감사합니다")).toBe(true));
  it("실제 내용은 통과", () => expect(isSilenceHallucination("내일 회의 고맙습니다 전달하기")).toBe(false));
});
