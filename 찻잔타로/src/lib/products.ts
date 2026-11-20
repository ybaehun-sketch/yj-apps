// 결제 상품 카탈로그 — 서버 검증도 이 가격을 기준으로 해요(클라이언트 금액은 믿지 않음).
export type Product = { id: string; name: string; price: number; desc: string; kind: "sub" | "leaves"; leaves?: number };

export const SUB: Product = { id: "sub", name: "티룸 멤버십", price: 7900, desc: "30일 · 매일 찻잎 1개 충전", kind: "sub" };
export const SUB_BONUS_LEAVES = 3; // 멤버십 시작 즉시 보너스 찻잎
export const PACKS: Product[] = [
  { id: "l1", name: "찻잎 1개", price: 1100, desc: "대화 4번 더하기", kind: "leaves", leaves: 1 },
  { id: "l5", name: "찻잎 5개", price: 3900, desc: "1개당 780원 · 29% 할인", kind: "leaves", leaves: 5 },
  { id: "l12", name: "찻잎 12개", price: 7900, desc: "1개당 658원 · 40% 할인", kind: "leaves", leaves: 12 },
];
export const PRODUCTS: Product[] = [SUB, ...PACKS];
export const findProduct = (id: string) => PRODUCTS.find((p) => p.id === id);

// 포트원 콘솔 > 결제 연동 에서 발급되는 공개 값(비밀 아님).
export const PORTONE_STORE_ID = "store-b291156f-0f1a-47f0-95e6-65b317be47fc";
// card: KG이니시스 테스트 채널 (심사 승인 후 실연동 채널 키로 교체)
export const PORTONE_CHANNELS: Record<string, string> = {
  kakao: "",
  toss: "",
  naver: "",
  card: "channel-key-32396044-dc94-4cf7-b2b1-44b2f9ca2b2e",
};
export const portoneReady = () => !!PORTONE_STORE_ID && Object.values(PORTONE_CHANNELS).some(Boolean);
