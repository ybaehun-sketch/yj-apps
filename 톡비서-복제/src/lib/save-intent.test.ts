import {expect,test} from "vitest";
import {offTopicKind,isQuestion} from "./notes";
test("x",()=>{
 expect(offTopicKind("오늘 날씨 추움이라고 저장해줘")).toBe(null);
 expect(isQuestion("오늘 날씨 추움이라고 저장해줘")).toBe(false);
 expect(offTopicKind("오늘 날씨 추움")).toBe(null);
 expect(offTopicKind("오늘 날씨 어때?")).toBe("web");
 expect(offTopicKind("오늘 날씨 검색해서 저장해줘")).toBe("web");
 expect(offTopicKind("나한테 형이라고 해봐")).toBe("chat");
});
