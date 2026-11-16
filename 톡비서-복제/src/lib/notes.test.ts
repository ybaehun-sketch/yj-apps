import { describe, expect, it } from "vitest";
import { normalizeAnalysis } from "./notes";

describe("normalizeAnalysis", () => {
  it("falls back to 기타 for unknown categories", () => {
    expect(normalizeAnalysis({ category: "여행" }, "x").category).toBe("기타");
  });

  it("defaults the reminder to 20:00 KST the evening before the event", () => {
    // Event: 2026-11-15 12:00 KST = 03:00Z
    const a = normalizeAnalysis({ has_date: true, detected_date: "2026-11-15T03:00:00Z", category: "일정" }, "x");
    expect(a.remind_at).toBe("2026-11-14T11:00:00.000Z"); // 20:00 KST on the 14th
  });

  it("drops dates when has_date is false", () => {
    const a = normalizeAnalysis({ has_date: false, detected_date: "2026-11-15T03:00:00Z" }, "x");
    expect(a.detected_date).toBeNull();
    expect(a.remind_at).toBeNull();
  });
});

import { isQuestion as _q, isYes as _y, parseOg as _og, firstUrl as _u } from "./notes";
describe("intent & link helpers", () => {
  it("treats questions as searches", () => {
    expect(_q("다음 수요일 누구 생일이지?")).toBe(true);
    expect(_q("러닝화 사진 찾아줘")).toBe(true);
    expect(_q("치과 언제였지")).toBe(true);
  });
  it("treats plain dumps as notes", () => {
    expect(_q("다음 주 금요일 저녁 7시 민수 생일 파티")).toBe(false);
    expect(_q("https://example.com/a?b=1")).toBe(false);
  });
  it("recognises confirmations", () => {
    expect(_y("그래")).toBe(true);
    expect(_y("응!")).toBe(true);
    expect(_y("저장해줘")).toBe(true);
    expect(_y("그래도 내일 해야지")).toBe(false);
  });
  it("parses OG tags", () => {
    const og = _og('<meta property="og:title" content="팩피 &amp; 파스타"><meta property="og:image" content="/i.jpg">', "https://a.com/x");
    expect(og.title).toBe("팩피 & 파스타");
    expect(og.image).toBe("https://a.com/i.jpg");
    expect(_u("보기 https://a.com/x 좋아")).toBe("https://a.com/x");
  });
});

import { normalizeAnalysis as na2, CUSTOM_CATEGORY_LIMIT } from "./notes";
describe("custom categories", () => {
  it("free 0, premium 10", () => { expect(CUSTOM_CATEGORY_LIMIT.free).toBe(0); expect(CUSTOM_CATEGORY_LIMIT.premium).toBe(10); });
  it("accepts user category", () => { expect(na2({ category: "학습" }, "x", -540, ["학습"]).category).toBe("학습"); });
  it("rejects unknown category", () => { expect(na2({ category: "학습" }, "x").category).toBe("기타"); });
});

import { isEdit, isChitchat, sanitizeEdit } from "./notes";
describe("multi-turn edit", () => {
  it("detects alarm edit requests", () => {
    expect(isEdit("알람은 화요일 오전 10시에 부탁해")).toBe(true);
    expect(isEdit("다음 주 동생 생일")).toBe(false);
  });
  it("detects chitchat", () => {
    expect(isChitchat("심심해")).toBe(true);
    expect(isChitchat("내일 3시 치과")).toBe(false);
  });
  it("sanitizes edits", () => {
    const e = sanitizeEdit({ remind_at: "2026-11-10T10:00:00+09:00", category: "없는것", tags_add: ["#가족"] }, ["생일"], ["일정"]);
    expect(e.remind_at).toBe("2026-11-10T01:00:00.000Z");
    expect(e.category).toBeUndefined();
    expect(e.tags).toEqual(["생일", "가족"]);
  });
});

import { offTopicKind } from "./notes";
describe("offTopicKind", () => {
  it("웹검색 요청", () => expect(offTopicKind("오늘 날씨 검색해서 저장해줘")).toBe("web"));
  it("표 작성 요청", () => expect(offTopicKind("이번주 일정 표로 만들어줘")).toBe("create"));
  it("잡담", () => expect(offTopicKind("심심해")).toBe("chat"));
  it("내 메모 검색은 통과", () => expect(offTopicKind("저장한 메모에서 맛집 찾아봐줘")).toBe(null));
  it("일정 메모는 통과", () => expect(offTopicKind("내일 3시 치과")).toBe(null));
});
describe("호칭·역할놀이 컷", () => {
  it("형이라고 해봐", () => expect(offTopicKind("나한테 형이라고 해봐")).toBe("chat"));
  it("일반 메모는 통과", () => expect(offTopicKind("내일 3시 치과 예약")).toBeNull());
});

describe("self/identity questions", () => {
  it("routes identity questions to self-intro", () => {
    expect(offTopicKind("너 이름이 뭐니?")).toBe("self");
    expect(offTopicKind("너 누구야?")).toBe("self");
    expect(offTopicKind("톡비서가 뭐야?")).toBe("self");
  });
  it("daily questions are chat", () => {
    expect(offTopicKind("오늘 뭐 먹을까?")).toBe("chat");
  });
  it("note searches stay search", () => {
    expect(offTopicKind("저장한 메모에서 동생 이름 뭐였지?")).toBeNull();
    expect(offTopicKind("성수동 파스타집 어디였지?")).toBeNull();
  });
});
