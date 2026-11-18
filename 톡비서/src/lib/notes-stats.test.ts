import { describe, expect, it } from "vitest";
import { buildCompactSearchDocs, tryAnswerStatsLocally, type SearchRow } from "./notes-stats";

const NOW = Date.parse("2026-11-18T04:00:00Z"); // KST 2026-11-18 13:00
const TZ = -540;

const rows: SearchRow[] = [
  { id: "1", created_at: "2026-11-18T02:00:00Z", kind: "image", content: "", summary: "아이 사진", category: "기타", detected_date: null, tags: ["아이"], link_title: null },
  { id: "2", created_at: "2026-11-15T05:00:00Z", kind: "image", content: "", summary: "캘린더 스샷", category: "일정", detected_date: null, tags: ["달력"], link_title: null },
  { id: "3", created_at: "2026-11-10T05:00:00Z", kind: "text", content: "드론 매뉴얼 본문 ".repeat(40), summary: "드론 설명서", category: "공부", detected_date: null, tags: ["드론"], link_title: null, file_name: "drone.pdf" },
  { id: "4", created_at: "2026-10-20T05:00:00Z", kind: "image", content: "", summary: "지난달 스샷", category: "기타", detected_date: null, tags: [], link_title: null },
];

describe("notes-stats", () => {
  it("counts this month screenshots locally without AI", () => {
    const res = tryAnswerStatsLocally("이번 달에 올린 스샷은 몇개야?", rows, TZ, "ko", NOW);
    expect(res).not.toBeNull();
    expect(res?.answer).toContain("2건");
    expect(res?.noteIds).toEqual(["1", "2"]);
  });

  it("counts documents locally", () => {
    const res = tryAnswerStatsLocally("이번 달 문서 몇개 있어?", rows, TZ, "ko", NOW);
    expect(res?.answer).toContain("1건");
    expect(res?.noteIds).toEqual(["3"]);
  });

  it("returns null for topic search questions so AI handles them", () => {
    expect(tryAnswerStatsLocally("드론 설명서 어디에 있어?", rows, TZ, "ko", NOW)).toBeNull();
    expect(tryAnswerStatsLocally("자격증 관련 메모 보여줘", rows, TZ, "ko", NOW)).toBeNull();
  });

  it("compacts docs and only keeps body text for keyword-matched rows", () => {
    const docs = buildCompactSearchDocs("드론 매뉴얼 찾아줘", rows);
    expect(docs).toHaveLength(4);
    const drone = docs.find((d) => d.id === "3");
    expect(drone?.text).toBeDefined();
    expect((drone?.text ?? "").length).toBeLessThanOrEqual(160);
    const img = docs.find((d) => d.id === "1");
    expect(img?.text).toBeUndefined();
  });
});
