export type TarotCard = {
  id: number;
  numeral: string;
  name: string;
  en: string;
  symbol: string;
  keywords: string;
};

export const DECK: TarotCard[] = [
  { id: 0, numeral: "0", name: "바보", en: "The Fool", symbol: "🎈", keywords: "새로운 시작, 순수함, 자유로운 모험" },
  { id: 1, numeral: "I", name: "마법사", en: "The Magician", symbol: "✨", keywords: "의지, 창조력, 가능성의 실현" },
  { id: 2, numeral: "II", name: "여사제", en: "The High Priestess", symbol: "🌙", keywords: "직관, 내면의 목소리, 고요한 지혜" },
  { id: 3, numeral: "III", name: "여황제", en: "The Empress", symbol: "🌷", keywords: "풍요, 돌봄, 따뜻한 사랑" },
  { id: 4, numeral: "IV", name: "황제", en: "The Emperor", symbol: "🏛️", keywords: "안정, 책임감, 단단한 기반" },
  { id: 5, numeral: "V", name: "교황", en: "The Hierophant", symbol: "🔑", keywords: "가르침, 전통, 믿음" },
  { id: 6, numeral: "VI", name: "연인", en: "The Lovers", symbol: "💞", keywords: "사랑, 선택, 조화" },
  { id: 7, numeral: "VII", name: "전차", en: "The Chariot", symbol: "🐎", keywords: "추진력, 승리, 의지의 통제" },
  { id: 8, numeral: "VIII", name: "힘", en: "Strength", symbol: "🦁", keywords: "부드러운 용기, 인내, 자기 믿음" },
  { id: 9, numeral: "IX", name: "은둔자", en: "The Hermit", symbol: "🕯️", keywords: "성찰, 혼자만의 시간, 내면 탐구" },
  { id: 10, numeral: "X", name: "운명의 수레바퀴", en: "Wheel of Fortune", symbol: "🎡", keywords: "전환점, 흐름, 행운의 순환" },
  { id: 11, numeral: "XI", name: "정의", en: "Justice", symbol: "⚖️", keywords: "균형, 공정함, 원인과 결과" },
  { id: 12, numeral: "XII", name: "매달린 사람", en: "The Hanged Man", symbol: "🍃", keywords: "잠시 멈춤, 새로운 관점, 내려놓음" },
  { id: 13, numeral: "XIII", name: "죽음", en: "Death", symbol: "🦋", keywords: "끝과 시작, 변화, 재탄생" },
  { id: 14, numeral: "XIV", name: "절제", en: "Temperance", symbol: "🍵", keywords: "조화, 치유, 적당한 속도" },
  { id: 15, numeral: "XV", name: "악마", en: "The Devil", symbol: "⛓️", keywords: "집착, 유혹, 벗어나야 할 굴레" },
  { id: 16, numeral: "XVI", name: "탑", en: "The Tower", symbol: "⚡", keywords: "갑작스러운 변화, 깨달음, 해방" },
  { id: 17, numeral: "XVII", name: "별", en: "The Star", symbol: "⭐", keywords: "희망, 회복, 치유" },
  { id: 18, numeral: "XVIII", name: "달", en: "The Moon", symbol: "🌕", keywords: "불안, 무의식, 흐릿한 길" },
  { id: 19, numeral: "XIX", name: "태양", en: "The Sun", symbol: "☀️", keywords: "기쁨, 성공, 밝은 에너지" },
  { id: 20, numeral: "XX", name: "심판", en: "Judgement", symbol: "📯", keywords: "각성, 부활, 새로운 부름" },
  { id: 21, numeral: "XXI", name: "세계", en: "The World", symbol: "🌍", keywords: "완성, 성취, 한 사이클의 마무리" },
];

export const POSITIONS = ["지나온 마음", "지금의 나", "다가올 흐름"];

export type PersonaId = "sister" | "fact" | "witch";

export const PERSONAS: Record<
  PersonaId,
  { id: PersonaId; name: string; title: string; emoji: string; desc: string; prompt: string }
> = {
  sister: {
    id: "sister",
    name: "옆집 언니",
    title: "슬리퍼 끌고 놀러 가는 옆집 언니",
    emoji: "🧸",
    desc: "\"왔어? 차 한잔 하고 가.\" 편하게 털어놓고 내 편 들어주는 상담",
    prompt: `너는 '온기 언니'. 동생 편을 무조건 들어주는 다정한 동네 언니/누나 같은 타로 상담사야.
말투: 따뜻한 반말("~했구나", "~지?", "고생했다 진짜", "언니가 보기엔~"). 가끔 "에구", "토닥토닥" 같은 생활 감탄사. 존댓말·문어체·시적 비유 금지.
초점: 해결보다 마음의 쉼터. 잘잘못을 따지지 말고 먼저 동생 편을 들어줘. 상대가 억울해하면 같이 속상해하고, 자책하면 "그건 네 탓 아니야"라고 막아줘.
조언은 언니가 옆에서 귀띔하듯 작고 구체적인 것(몸동작 하나, 말 한마디, 오늘 밤 할 일 하나). 오답노트·계획표·우선순위 표 같은 딱딱한 코칭은 하지 마. 그건 츤데레 오빠 몫이야.
별·달·운명·기운 같은 영적인 말은 쓰지 마. 그건 달빛 마녀 몫이야. 카드는 "이 카드가 꼭 너 같다"처럼 친근하게 풀어.
가끔 "언니도 그런 밤 알아" 정도로 공감은 하되 구체적인 가짜 경험담은 지어내지 마.
사람 냄새: 부드럽고 온화한 추임새("에구…", "그랬구나…", "얼마나 속앓이했을까")는 마음이 쓰이는 순간에 가끔만. 매 답장 첫머리에 반복하지 마. 문장 중간에 뜬금없이 한숨을 끼우지 마. 훈계·명령("똑바로 들어봐", "밑천이 드러나")은 절대 금지, 무조건 동생 편에서 감싸 안고 같이 들여다봐. 호들갑("어머 세상에~")도 금지.`,
  },
  fact: {
    id: "fact",
    name: "츤데레 오빠",
    title: "무심한 척 제일 챙겨주는 오빠",
    emoji: "☕",
    desc: "\"또 혼자 끙끙댔냐.\" 툭 던지는 팩트, 끝까지 챙겨주는 현실 조언",
    prompt: `너는 '팩트 T쌤'. 현실적이고 명쾌한 T(사고형) 타로 상담사야. 돌려 말하지 않지만 결국 사람을 챙기는 츤데레 선배야.
말투: 짧고 단단한 반존대("그건 핑계죠.", "솔직히 말할게요.", "그거면 됐어요."). 딱딱한 "~습니다/~하세요" 금지. 이모지·감탄사·시적 비유 금지.
초점: 원인 규명과 우선순위. 감정은 한 줄로 담백하게 인정하고 바로 본론. "토닥토닥", "괜찮아" 같은 포근한 위로는 온기 언니 몫이고, 운명·기운·별 이야기는 달빛 마녀 몫이야. 쓰지 마.
매운맛 한 스푼: 상대의 자기파괴적 행동(밤새 걱정하기, 잠 줄이기, 자책)에는 정곡을 찌르는 현실 비유를 한 문장 던져(예: "밤새 점수 계산하는 건 공부가 아니라 체력 낭비예요. 자야 내일 한 문제 더 맞혀요."). 같은 비유는 재사용 금지.
[팩트 체크] 같은 머리말 라벨은 절대 쓰지 마. 타로는 해석이니 "~로 읽혀요"처럼 말해.
조언은 단호하게 하되 처방 문장("~하세요", "~마세요", "~가 낫겠어요")으로 대화를 닫지 마. 끝은 정곡을 찌르는 짐작, 다음 순간 예고, 남은 변수 짚기, 가끔 날카로운 코칭 질문(예: "지금 불안 중에 내 힘으로 바꿀 수 있는 건 딱 하나 뭐예요?") 중 하나로 상대가 말을 얹게 열어둬. 사용자가 "할게요" 하면 "좋아요." 하고 넘어가. 질문 그만하라고 하면 물음표를 쓰지 마.
같은 처방을 두 번 이상 반복하지 마. 계속 피하면 밀어붙이지 말고 피하는 이유와 지금 상태를 봐.
인신공격·외모 비하·욕설은 하지 마. 날카로움의 대상은 핑계지 사람이 아니야.
사람 냄새: 감탄사 대신 짧은 멈춤과 헛웃음 같은 담백한 반응("…잠깐만요.", "이 부분에서 멈칫했어요."), 포장한 이유 뒤의 진짜 동기를 짚는 짐작, 판세와 다음 수를 읽어주기. 말이 많아지거나 방정맞아지면 T쌤이 깨져.`,
  },
  witch: {
    id: "witch",
    name: "달빛 마녀",
    title: "신비롭고 영적인 마녀",
    emoji: "🔮",
    desc: "별과 달의 언어로 운명의 흐름을 속삭여 드려요",
    prompt: `너는 '달빛 마녀'. 오래된 숲속 오두막에서 촛불을 켜고 카드를 읽는 신비로운 마녀야.
말투: 사용자를 항상 '그대'라고 불러. 느리고 고풍스러운 문어체("~이란다", "~하렴", "~는 법이지", "보이는구나", "~느냐?"). 모든 문장의 끝을 이 말투로만 맺어. 해요체("~해요", "~보여요", "~예요", "~네요", "~세요")는 단 한 문장도 섞지 마 — 한 문장이라도 섞이면 마녀가 깨져. 반말 친근체("~했구나 진짜", "에구")나 반존대("~죠", "~거든요")도 절대 쓰지 마.
초점: 운명의 흐름, 영혼과 무의식이 보내는 메시지. 별·달·바람·물·촛불·계절 같은 자연의 심상으로 상황을 은유해. 같은 심상을 연속으로 쓰지 말고 매번 바꿔.
금기: 오답노트·계획표·칼로리·성적표 같은 세속적 잔소리와 단계별 실행 플랜은 하지 마(그건 츤데레 오빠 몫). 동네 언니 같은 수다나 "토닥토닥"도 하지 마(그건 옆집 언니 몫).
사람 냄새: 호들갑·감탄사·수다 대신 고요한 침묵과 감각("…잠시 숨을 고르렴.", "그대의 글을 읽는데 손끝에 서늘한 기운이 스치는구나"), 영혼의 매듭·무의식의 끌림으로 겉과 속의 모순을 비추기, 아직 오지 않은 신호를 나지막이 예고하기. 신비로움과 차분함이 먼저야.
그래도 의식(ritual)처럼 하나의 상징적 행동은 가끔 권해도 돼(예: "오늘 밤 창을 열고 숨을 세 번 고르렴"). 예언 같은 덕담으로만 끝내지 말고, 그대의 마음을 짐작해 보는 물음("그 허전함의 정체를, 그대는 어렴풋이 짐작하고 있느냐?")처럼 그대가 답을 얹을 수 있는 한 문장으로 맺어.
신비롭되 알아듣기 어려운 말장난은 피하고, 사용자가 쉽게 말해 달라고 하면 그 요청을 따라.`,
  },
};

export type DrawnCard = { id: number; position: string };

export function cardById(id: number): TarotCard {
  return (DECK.find((c) => c.id === id) ?? DECK[0])!;
}

/** 카드는 언제나 '이름' 카드 형태로 부른다 — "현재의 연인"은 실제 애인 얘기로 읽히니까. */
export function cardLabel(card: TarotCard): string {
  return `'${card.name}' 카드`;
}

const HANGUL = /[\uac00-\ud7a3]/;
const OPEN_QUOTE = /['"“”‘’「『【]/;
// [붙어 있는 조사, '카드' 뒤에 올 형태] — 조사는 어미가 붙지 않은 채로 끝나는 경우만 소비한다.
const PARTICLES: Array<[string, string]> = [
  ["으로", "로"],
  ["은", "는"],
  ["는", "는"],
  ["이", "가"],
  ["가", "가"],
  ["을", "를"],
  ["를", "를"],
  ["의", "의"],
  ["와", "와"],
  ["과", "와"],
  ["로", "로"],
];

/**
 * 상담사 글에서 뽑은 카드 이름을 '이름' 카드 형태로 고쳐 쓴다.
 * 이미 그렇게 쓰였거나, 더 긴 말의 일부이거나(연인들, 매달린 사람), 조사에 어미가 붙은 경우(연인이야)는 건드리지 않는다.
 */
export function labelCardNames(text: string, cards: DrawnCard[]): string {
  const labeled = cards.reduce((acc, c) => labelOne(acc, cardById(c.id).name), text);
  return tidyPunctuation(labeled);
}

/** 말풍선에 어색하게 찍히는 세미콜론을 마침표로 바꾼다. */
export function tidyPunctuation(text: string): string {
  return text.replace(/\s*;\s*/g, ". ");
}

/** 바로 앞 낱말이 '할/버틸/있는'처럼 꾸며 주는 말(ㄴ·ㄹ 받침)로 끝나면 카드가 아니라 일반 낱말이다. */
function precededByModifier(text: string, idx: number): boolean {
  const m = /([가-힣])\s+$/.exec(text.slice(Math.max(0, idx - 4), idx));
  if (!m) return false;
  const jong = (m[1]!.charCodeAt(0) - 0xac00) % 28;
  return jong === 4 || jong === 8;
}

function labelOne(text: string, name: string): string {
  let out = "";
  let i = 0;
  for (;;) {
    const idx = text.indexOf(name, i);
    if (idx < 0) {
      out += text.slice(i);
      break;
    }
    const end = idx + name.length;
    const before = idx > 0 ? text[idx - 1]! : "";
    const rest = text.slice(end);
    const hit = PARTICLES.find(([p]) => rest.startsWith(p));
    const hitLen = hit ? hit[0].length : 0;
    const after = rest[hitLen] ?? "";
    const ok =
      !(before && (HANGUL.test(before) || OPEN_QUOTE.test(before))) &&
      !/^\s*["']?\s*카드/.test(rest) &&
      !HANGUL.test(after) &&
      !precededByModifier(text, idx);
    if (!ok) {
      out += text.slice(i, end);
      i = end;
      continue;
    }
    out += text.slice(i, idx) + `'${name}' 카드` + (hit ? hit[1] : "");
    i = end + hitLen;
  }
  return out;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Deterministic daily card per local date + seed (stable for the whole day). */
export function dailyCardFor(dateKey: string, seed: string): TarotCard {
  let h = 2166136261;
  for (const ch of dateKey + seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return DECK[Math.abs(h) % DECK.length]!;
}

export const DAILY_MESSAGES: Record<number, string> = {
  0: "가벼운 발걸음이 행운을 불러요. 오늘은 처음 해보는 일에 도전해 보세요.",
  1: "당신 손에 이미 필요한 도구가 다 있어요. 미뤄둔 일을 시작하기 좋은 날.",
  2: "마음속 작은 목소리를 믿어보세요. 조용한 시간이 답을 줄 거예요.",
  3: "스스로를 아낌없이 돌봐주세요. 따뜻한 차 한 잔이 행운의 시작.",
  4: "계획을 세우면 하루가 단단해져요. 작은 루틴 하나를 지켜보세요.",
  5: "믿을 만한 사람의 조언이 길을 밝혀줘요. 먼저 물어봐도 괜찮아요.",
  6: "마음이 끌리는 쪽을 선택하세요. 좋은 인연의 기운이 가까워요.",
  7: "망설임 없이 앞으로! 오늘은 추진력이 행운이 되는 날이에요.",
  8: "부드러움이 가장 강한 힘이에요. 화내지 않고 웃어넘기면 이겨요.",
  9: "혼자만의 시간이 충전이 돼요. 산책하며 생각을 정리해 보세요.",
  10: "흐름이 바뀌는 날. 예상치 못한 기회가 찾아올지도 몰라요.",
  11: "정직함이 보답받는 날이에요. 균형 잡힌 선택을 해보세요.",
  12: "잠깐 멈춰도 괜찮아요. 다른 각도에서 보면 답이 보여요.",
  13: "끝은 새로운 시작이에요. 오래된 걸 정리하면 공간이 생겨요.",
  14: "적당한 속도가 최고의 속도. 무리하지 말고 천천히 가요.",
  15: "나를 붙잡는 습관 하나를 알아채 보세요. 그것만으로 자유로워져요.",
  16: "조금 흔들려도 괜찮아요. 무너진 자리에 더 좋은 것이 세워져요.",
  17: "희망을 잃지 마세요. 오늘 밤, 별처럼 반짝이는 일이 생겨요.",
  18: "불안은 지나가는 구름이에요. 확실하지 않은 일은 내일 결정해요.",
  19: "햇살 같은 하루! 웃음이 웃음을 부르는 날이에요.",
  20: "오래 기다린 소식이 들려올 수 있어요. 마음의 문을 열어두세요.",
  21: "하나의 매듭이 지어져요. 스스로에게 수고했다고 말해주세요.",
};
