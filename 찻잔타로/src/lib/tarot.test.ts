import { describe, it, expect } from "vitest";
import { cardById, cardLabel, labelCardNames } from "./tarot";

const LOVERS = [{ id: 6, position: "현재 · 지금의 나" }];

describe("카드는 항상 '이름' 카드 형태로 부른다", () => {
  it("연인 카드는 따옴표와 '카드'를 붙여 쓴다", () => {
    expect(cardLabel(cardById(6))).toBe("'연인' 카드");
    expect(cardLabel(cardById(18))).toBe("'달' 카드");
  });

  it("애인 얘기처럼 읽히는 '현재의 연인'을 카드 이름으로 고친다", () => {
    expect(labelCardNames("현재의 연인이 자꾸 걸려요", LOVERS)).toBe("현재의 '연인' 카드가 자꾸 걸려요");
    expect(labelCardNames("연인은 좀 답답하네", LOVERS)).toBe("'연인' 카드는 좀 답답하네");
    expect(labelCardNames("연인을 붙잡고 싶구나", LOVERS)).toBe("'연인' 카드를 붙잡고 싶구나");
    expect(labelCardNames("지금의 연인", LOVERS)).toBe("지금의 '연인' 카드");
  });

  it("이미 '이름' 카드 형태로 쓴 글은 그대로 둔다", () => {
    expect(labelCardNames("'연인' 카드가 보여요", LOVERS)).toBe("'연인' 카드가 보여요");
    expect(labelCardNames("“연인” 카드네요", LOVERS)).toBe("“연인” 카드네요");
    expect(labelCardNames("연인 카드라고 생각해", LOVERS)).toBe("연인 카드라고 생각해");
  });

  it("더 긴 말의 일부나 어미가 붙은 말은 망가뜨리지 않는다", () => {
    expect(labelCardNames("연인들끼리는 재밌어요", LOVERS)).toBe("연인들끼리는 재밌어요");
    expect(labelCardNames("내 연인이야", LOVERS)).toBe("내 연인이야");
  });

  it("뽑지 않은 카드는 건드리지 않는다", () => {
    expect(labelCardNames("달이 예쁜 밤이었어", LOVERS)).toBe("달이 예쁜 밤이었어");
  });

  it("이름에 조사가 붙은 카드도 자연스럽게 고친다", () => {
    expect(labelCardNames("매달린 사람이 보여요", [{ id: 12, position: "과거 · 지나온 마음" }])).toBe(
      "'매달린 사람' 카드가 보여요",
    );
    expect(labelCardNames("매달린 사람이야", [{ id: 18, position: "현재 · 지금의 나" }])).toBe("매달린 사람이야");
  });

  it("'버틸 힘'처럼 꾸며 주는 말 뒤의 일반 낱말은 카드로 바꾸지 않는다", () => {
    const STRENGTH = [{ id: 8, position: "미래 · 다가올 흐름" }];
    expect(labelCardNames("차분히 버틸 힘을 비추니", STRENGTH)).toBe("차분히 버틸 힘을 비추니");
    expect(labelCardNames("힘은 용기를 뜻해", STRENGTH)).toBe("'힘' 카드는 용기를 뜻해");
  });

  it("세미콜론은 마침표로 바꾼다", () => {
    expect(labelCardNames("서류를 보여주렴; 그 서류엔", [])).toBe("서류를 보여주렴. 그 서류엔");
  });
});
