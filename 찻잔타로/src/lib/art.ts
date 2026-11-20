import sister from "@/assets/personas/sister.jpg";
import fact from "@/assets/personas/fact.jpg";
import witch from "@/assets/personas/witch.jpg";

// 카드 일러스트: 아직 그림이 없는 카드는 기호(emoji)로 표시된다.
const cardFiles = import.meta.glob("@/assets/cards/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const CARD_ART: Record<number, string> = {};
for (const [path, url] of Object.entries(cardFiles)) {
  const m = path.match(/(\d+)\.jpg$/);
  if (m) CARD_ART[Number(m[1])] = url;
}

export const cardArt = (id: number): string | undefined => CARD_ART[id];

export const PERSONA_ART: Record<string, string> = { sister, fact, witch };
