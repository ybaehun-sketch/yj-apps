import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PersonaId } from "./tarot";

export type SupportedLang = "ko" | "en" | "ja" | "zh-TW";

export const LANG_LABELS: Record<SupportedLang, { label: string; flag: string }> = {
  ko: { label: "한국어", flag: "🇰🇷" },
  en: { label: "English", flag: "🇺🇸" },
  ja: { label: "日本語", flag: "🇯🇵" },
  "zh-TW": { label: "繁體中文", flag: "🇹🇼" },
};

const ko = {
  // 상단 메뉴
  brandTitle: "찻잔 타로",
  soundOn: "소리 켜기",
  soundOff: "소리 끄기",
  navAbout: "소개",
  navGuide: "타로 이야기",
  navMembership: "멤버십",
  navLogin: "로그인",
  backExit: "상담 나가기",
  backConcern: "고민 작성으로",
  backPrev: "이전으로",
  home: "홈",

  // 첫 화면
  heroTitle1: "따뜻한 차 한 잔 앞에서,",
  heroTitle2: "오늘의 마음을 꺼내 보세요",
  heroSubtitle: "당신의 이야기와 3장의 카드로 나누는 1:1 타로 상담",

  dailyBadge: "TODAY'S FREE TAROT",
  dailyTitle: "오늘의 행운 타로",
  dailyDesc: "하루에 한 장, 마음을 가다듬고 카드를 눌러 오늘의 메시지를 받아보세요.",
  dailyNextNotice: "내일 또 새로운 카드가 기다리고 있어요 ☕",
  dailyAriaLabel: "오늘의 카드 뽑기",

  consultTitle: "깊은 고민 상담 시작하기",
  consultDesc: "구체적으로 적을수록 카드가 더 또렷하게 이야기해 줘요.",
  consultPlaceholder: "예) 3년 다닌 회사를 그만두고 하고 싶던 공부를 시작해도 될지 고민이에요. 모아둔 돈은 조금 있지만 불안해요…",
  consultButton: "상담사 고르러 가기",
  consultDisclaimer: "※ AI 타로 상담은 가벼운 성찰과 재미를 위한 참고용이며, 의학·법률·투자 자문을 대신하지 않습니다.",

  infoTitle: "🍵 찻잔 타로 이용 안내",
  infoSubtitle: "별도 회원가입이나 결제 없이 누구나 무료로 타로 상담을 이용하실 수 있어요.",
  infoStep1Title: "1. 고민 적고 카드 3장 뽑기",
  infoStep1Desc: "고민을 적은 뒤 원하는 AI 상담사를 고르고 직감으로 3장의 카드를 선택해요",
  infoStep2Title: "2. 매일 무료 새 상담",
  infoStep2Desc: "하루 1회 무료로 새로운 타로 상담을 이용하실 수 있어요",
  infoStep3Title: "3. 대화 나누기 & 마음 처방전",
  infoStep3Desc: "상담당 2번 무료 대화 후 나만의 한 줄 마음 처방전 무료 발급",
  freeBadge: "무료",

  faqTitle: "자주 묻는 질문",
  faqQ1: "Q. 회원가입이나 로그인이 필요한가요?",
  faqA1: "아니요, 별도의 가입 절차 없이 바로 고민을 적고 카드를 뽑아 상담을 시작할 수 있어요.",
  faqQ2: "Q. 상담 내용은 다른 사람에게 공개되나요?",
  faqA2: "모든 상담은 1:1 비공개로 진행되며, 이용자 기기에만 임시 저장되어 언제든 브라우저에서 지울 수 있어요.",
  faqQ3: "Q. 타로 결과를 그대로 믿어도 되나요?",
  faqA3: "찻잔 타로는 마음을 정리하고 스스로를 돌아보는 AI 엔터테인먼트 서비스입니다. 중요한 의학·법률·투자 결정은 반드시 전문가와 상의해 주세요.",

  // 하단 · 약관
  footerStudioName: "와이제이 스튜디오",
  footerDisclaimer: "본 서비스의 AI 타로 해석은 재미와 성찰을 위한 참고용이며 의학·법률·투자 조언이 아닙니다.",
  footerInquiry: "문의",
  legalAbout: "서비스 소개",
  legalGuides: "마음 찻집 이야기",
  legalContact: "문의하기",
  legalTerms: "이용약관",
  legalPrivacy: "개인정보처리방침",
  legalBack: "← 찻잔 타로로 돌아가기",
  legalEffective: "시행일",
  legalArticle: "제{n}조",
  legalNotice: "",

  // 블로그 목록
  guidesTitle: "마음 찻집 이야기",
  guidesSubtitle: "타로 카드의 의미와 연애·일·관계 고민에 건네는 따뜻한 글",
  guidesViewAll: "전체 보기 →",
  guideListDesc: "잠 못 드는 밤, 혼자 끙끙대던 연애·일·관계 고민에 따뜻한 차 한잔 같은 글을 건네요.",
  guideEmpty: "첫 이야기를 우리는 중이에요.",

  toastShortConcern: "고민을 조금만 더 자세히 들려주세요 🍵",
  toastLoginPrompt: "로그인하면 매일 1장 무료 행운 타로를 볼 수 있어요 🍵",

  // 상담사
  personaSisterName: "옆집 언니",
  personaSisterTitle: "슬리퍼 끌고 놀러 가는 옆집 언니",
  personaSisterDesc: "\"왔어? 차 한잔 하고 가.\" 편하게 털어놓고 내 편 들어주는 상담",
  personaFactName: "츤데레 오빠",
  personaFactTitle: "무심한 척 제일 챙겨주는 오빠",
  personaFactDesc: "\"또 혼자 끙끙댔냐.\" 툭 던지는 팩트, 끝까지 챙겨주는 현실 조언",
  personaWitchName: "달빛 마녀",
  personaWitchTitle: "신비롭고 영적인 마녀",
  personaWitchDesc: "별과 달의 언어로 운명의 흐름을 속삭여 드려요",

  // 상담사 고르기 · 카드 뽑기
  newTitle: "어떤 상담사와 이야기할까요?",
  newConcernLabel: "나의 고민",
  newConcernPlaceholder: "고민을 적어주세요",
  toastPickPersona: "상담사를 먼저 골라주세요",
  toastConcernMin: "고민을 5자 이상 적어주세요",
  goDrawButton: "카드 뽑으러 가기",
  unlockOpened: "새 상담이 열렸어요 🍵",
  freeUsedAd: "오늘의 무료 상담은 이미 썼어요 · 짧은 광고를 보고 새 상담을 열 수 있어요",
  freeUsedWeb: "오늘의 무료 상담은 이미 썼어요 · 내일 다시 이용할 수 있어요 🍵",
  freeUsedLeaf: "오늘의 무료 상담은 이미 썼어요 · 광고나 찻잎으로 새 상담을 열 수 있어요",
  gateTitle: "오늘의 무료 찻잔을 이미 비웠어요 🍵",
  gateDesc: "오늘 준비된 상담을 모두 마쳤어요. 내일 새로운 마음으로 다시 만나요.",
  gateLeafCharge: "🌿 찻잎 충전하러 가기",
  gateLeafUse: "🌿 찻잎 1개로 새 상담 열기 (보유 {n}개)",
  gateAd: "📺 짧은 광고 보고 새 상담 열기 (오늘 {n}번)",
  gateWeb: "🍵 차 한 잔 우리며 새 상담 열기 (오늘 {n}번)",
  gateLater: "내일 다시 올게요",
  toastLeafUnlock: "찻잎 1개로 새 상담을 열어요 🌿",
  toastLeafUnlockDesc: "상담이 시작될 때 찻잎이 쓰여요",
  rePickPersona: "← 상담사 다시 고르기",
  drawTitle: "마음이 끌리는 카드 3장을 골라주세요",
  drawDesc: "고민을 떠올리며 천천히 숨을 고르고, 직감을 믿어보세요.",
  spreadHint: "22장이 펼쳐져 있어요 · 옆으로 밀며 마음이 가는 카드를 골라주세요",
  shuffleButton: "🔀 카드 다시 섞기",
  readingBusy: "{name}가 카드를 읽고 있어요…",
  startWithCards: "이 카드로 상담 시작하기",
  redraw: "다시 뽑기",
  pastReadings: "지난 상담 보기",
  startError: "상담을 시작하지 못했어요.",
  cardAria: "카드 {n}",
  cardBackAlt: "타로 카드 뒷면",
  posPast: "지나온 마음",
  posPresent: "지금의 나",
  posFuture: "다가올 흐름",

  // 차 우리기(광고) 창
  adSr: "차 한 잔 우리는 중",
  adBrewTitle: "따뜻한 차를 새로 우리는 중이에요",
  adWaitNative: "광고가 끝나면 바로 대화를 이어가실 수 있어요",
  adWaitWeb: "잠시만 기다리시면 대화를 이어가실 수 있어요",
  adChecking: "광고 확인 중…",
  adBrewing: "차 한 잔 우리는 중… {n}초",
  adContinue: "대화 이어가기 🍵",
  adLeafLink: "찻잎 충전하고 바로 대화하기",

  // 소개 페이지
  aboutTitle: "찻잔 타로 소개",
  aboutIntro: "복잡한 하루 끝에 따뜻한 차 한 잔을 마주하듯, 마음을 편히 내려놓을 수 있는 대화형 타로 공간입니다.",
  aboutHowTitle: "이용 방법",
  aboutStep1Label: "고민 적기:",
  aboutStep1: "지금 마음을 무겁게 하는 이야기나 궁금한 선택지를 편하게 적습니다.",
  aboutStep2Label: "상담사·카드 3장 고르기:",
  aboutStep2: "원하는 대화 분위기의 상담사를 고르고 직감으로 3장의 카드를 뽑습니다.",
  aboutStep3Label: "대화 나누기 & 마음 처방전:",
  aboutStep3: "카드 풀이를 바탕으로 대화를 이어가고, 상담이 끝나면 한 줄 마음 처방전 카드를 받아 간직할 수 있습니다.",
  aboutPersonasTitle: "함께하는 세 명의 AI 상담사",
  aboutDiscTitle: "AI 상담 및 면책 안내",
  aboutDisc1: "찻잔 타로의 모든 카드 해석과 대화는 인공지능(AI)이 생성하는 가벼운 성찰·엔터테인먼트용 참고 콘텐츠입니다.",
  aboutDisc2: "전문적인 의학·심리·법률·투자 자문을 대신하지 않으며, 위기 상황이거나 전문적인 도움이 필요하실 때는 보건복지상담센터(129) 또는 자살예방 상담전화(109) 등 전문 기관의 도움을 받으시길 권장합니다.",
  aboutCta: "타로 상담 시작하기",

  // 문의 페이지
  contactTitle: "문의하기",
  contactIntro: "서비스 이용 중 불편한 점, 오류 제보, 제안 사항이 있으시면 언제든 편하게 연락해 주세요.",
  contactSection: "운영 및 문의처",
  contactOperator: "운영사",
  contactEmail: "이메일 문의",
  contactSite: "운영 사이트",
  contactReply: "보내주신 문의는 영업일 기준 1~2일 이내에 확인 후 답변드립니다.",

  // 브라우저 탭 제목
  titleHome: "찻잔 타로 — 오늘의 행운 카드와 따뜻한 고민 상담",
  titleGuide: "마음 찻집 이야기 — 찻잔 타로",
  titleAbout: "서비스 소개 — 찻잔 타로",
  titleContact: "문의하기 — 찻잔 타로",
  titleTerms: "이용약관 — 찻잔 타로",
  titlePrivacy: "개인정보처리방침 — 찻잔 타로",
  titleNew: "새 상담 — 찻잔 타로",
  titleReading: "타로 상담 중 — 찻잔 타로",

  // 상담 채팅방 & 마음 처방전
  finishReading: "상담 마치기",
  turnsLeftMsg: "남은 대화 {n}회 🍵",
  freeLimitReached: "오늘 무료 한도를 모두 사용했습니다.",
  outOfTeaTitle: "준비된 대화를 모두 마쳤어요 ☕",
  outOfTeaDesc: "상담 마치기를 눌러 오늘의 한 줄 마음 처방전을 받아보세요.",
  watchAdMoreTurns: "📺 짧은 광고 보고 {n}번 더 대화하기",
  watchWebMoreTurns: "🍵 차 한 잔 우리며 {n}번 더 대화하기",
  useLeafMoreTurns: "🌿 찻잎 충전하고 {n}번 더 대화하기",
  chatPlaceholder: "{name}에게 이야기하기…",
  sendButton: "보내기",
  typingSister: "옆집 언니가 따뜻한 차를 우리며 답장을 쓰고 있어",
  typingFact: "츤데레 오빠가 무심한 척 답장 쓰는 중",
  typingWitch: "달빛 마녀가 별의 속삭임을 받아 적고 있소",
  typingFallback: "생각을 적고 있어요…",
  rxTitle: "오늘의 마음 처방전",
  rxBadge: "✦ TODAY'S PRESCRIPTION ✦",
  rxWriting: "처방전을 쓰는 중…",
  rxReaderLabel: "COUNSELOR",
  rxVisitLink: "찻잔타로 방문하기",
  rxSaveImage: "이미지 저장",
  rxShare: "공유하기",
  rxCopy: "복사하기",
  rxError: "처방전을 만들지 못했어요.",
  rxImgError: "이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
  rxSaved: "처방전 이미지를 저장했어요.",
  rxSavedAndCopied: "이미지를 저장하고 공유 문구를 복사했어요.",
  rxLinkCopied: "링크를 복사했어요.",
  rxCopyFail: "복사하지 못했어요. 주소를 길게 눌러 복사해 주세요.",
  rxAdLimit: "오늘 볼 수 있는 광고를 모두 봤어요. 내일 다시 만나요 🍵",
  rxWebLimit: "오늘 열 수 있는 추가 대화를 모두 썼어요. 내일 다시 만나요 🍵",
  rxTurnsAdded: "대화 {n}번이 추가됐어요 🍵",
  rxAdTurnLimit: "오늘 광고로 받을 수 있는 대화를 모두 썼어요.",
  rxWebTurnLimit: "오늘 추가로 받을 수 있는 대화를 모두 썼어요.",
  chatTimeout: "답장이 늦어지고 있어요. 연결을 확인하고 다시 보내 볼까요?",
  chatNetErr: "인터넷 연결이 잠시 불안정해요. 다시 보내 볼까요?",
  retry: "다시 시도",
};

export type TranslationKey = keyof typeof ko;
type Dict = Record<TranslationKey, string>;

const en: Dict = {
  brandTitle: "Teacup Tarot",
  soundOn: "Sound on",
  soundOff: "Sound off",
  navAbout: "About",
  navGuide: "Stories",
  navMembership: "Membership",
  navLogin: "Log in",
  backExit: "Leave reading",
  backConcern: "Back to my question",
  backPrev: "Back",
  home: "Home",

  heroTitle1: "Over a warm cup of tea,",
  heroTitle2: "tell us what's on your mind",
  heroSubtitle: "Your story, three cards, and a one-on-one tarot chat",

  dailyBadge: "TODAY'S FREE TAROT",
  dailyTitle: "Your Daily Tarot Card",
  dailyDesc: "One card a day. Take a breath, tap the card, and see what today has to say.",
  dailyNextNotice: "Come back tomorrow for a new card ☕",
  dailyAriaLabel: "Draw today's card",

  consultTitle: "Start a Tarot Reading",
  consultDesc: "The more detail you share, the clearer the cards can speak.",
  consultPlaceholder: "e.g. I've been at my job for 3 years and I'm thinking about quitting to study something I've always wanted to. I have a little saved up, but I'm nervous...",
  consultButton: "Pick Your Reader",
  consultDisclaimer: "※ AI tarot readings are for fun and self-reflection. They are not medical, legal, or financial advice.",

  infoTitle: "🍵 How Teacup Tarot Works",
  infoSubtitle: "No sign-up, no payment. Anyone can get a free tarot reading.",
  infoStep1Title: "1. Write it down & draw 3 cards",
  infoStep1Desc: "Share what's on your mind, pick a reader, and choose 3 cards by feel.",
  infoStep2Title: "2. A free reading every day",
  infoStep2Desc: "Enjoy 1 free tarot reading every day.",
  infoStep3Title: "3. Chat & closing note",
  infoStep3Desc: "2 free replies per reading, plus a free one-line note to keep.",
  freeBadge: "Free",

  faqTitle: "FAQ",
  faqQ1: "Q. Do I need an account?",
  faqA1: "Nope. Just write down your question, draw your cards, and start.",
  faqQ2: "Q. Can anyone else see my reading?",
  faqA2: "No. Every reading is private and saved only on your own device. You can clear it from your browser anytime.",
  faqQ3: "Q. Should I take the results literally?",
  faqA3: "Teacup Tarot is for entertainment and a bit of self-reflection. For medical, legal, or money decisions, please talk to a professional.",

  footerStudioName: "YJ Studio",
  footerDisclaimer: "Readings are generated by AI for fun and self-reflection, not professional advice.",
  footerInquiry: "Contact",
  legalAbout: "About",
  legalGuides: "Teahouse Stories",
  legalContact: "Contact",
  legalTerms: "Terms of Service",
  legalPrivacy: "Privacy Policy",
  legalBack: "← Back to Teacup Tarot",
  legalEffective: "Effective",
  legalArticle: "{n}.",
  legalNotice: "This translation is provided for convenience. If anything differs, the Korean version applies.",

  guidesTitle: "Teahouse Stories",
  guidesSubtitle: "Tarot card meanings, plus short reads on love, work, and relationships",
  guidesViewAll: "See all →",
  guideListDesc: "For the nights you can't sleep: short reads on love, work, and the people in your life.",
  guideEmpty: "The first story is still brewing.",

  toastShortConcern: "Tell us a little more 🍵",
  toastLoginPrompt: "Log in to draw a free card every day 🍵",

  personaSisterName: "Big Sis Next Door",
  personaSisterTitle: "Drops by in slippers, always on your side",
  personaSisterDesc: "\"Hey, come in. Have some tea.\" Vent all you want. She's in your corner.",
  personaFactName: "Blunt Big Bro",
  personaFactTitle: "Acts like he doesn't care, but always shows up",
  personaFactDesc: "\"Stewing over it alone again?\" Straight talk and practical advice, start to finish.",
  personaWitchName: "Moonlight Witch",
  personaWitchTitle: "Mysterious and spiritual",
  personaWitchDesc: "Reads the flow of fate through the moon and stars.",

  newTitle: "Who would you like to talk to?",
  newConcernLabel: "Your question",
  newConcernPlaceholder: "Write what's on your mind",
  toastPickPersona: "Pick a reader first",
  toastConcernMin: "Please write a little more (at least 5 characters)",
  goDrawButton: "Draw my cards",
  unlockOpened: "A new reading is ready 🍵",
  freeUsedAd: "You've used today's free reading · Watch a short ad to open a new one",
  freeUsedWeb: "You've used today's free reading · Come back tomorrow 🍵",
  freeUsedLeaf: "You've used today's free reading · Use an ad or a tea leaf to open a new one",
  gateTitle: "Today's free cup is empty 🍵",
  gateDesc: "You've completed today's reading. See you tomorrow with a fresh cup.",
  gateLeafCharge: "🌿 Get tea leaves",
  gateLeafUse: "🌿 Use 1 tea leaf for a new reading (you have {n})",
  gateAd: "📺 Watch a short ad for a new reading ({n} left today)",
  gateWeb: "🍵 Brew a cup for a new reading ({n} left today)",
  gateLater: "I'll come back tomorrow",
  toastLeafUnlock: "Opening a new reading with 1 tea leaf 🌿",
  toastLeafUnlockDesc: "The leaf is used when the reading starts",
  rePickPersona: "← Choose a different reader",
  drawTitle: "Choose 3 cards that call to you",
  drawDesc: "Keep your question in mind, breathe slowly, and trust your gut.",
  spreadHint: "22 cards are spread out · Swipe sideways and pick the ones that feel right",
  shuffleButton: "🔀 Shuffle again",
  readingBusy: "{name} is reading your cards…",
  startWithCards: "Start with these cards",
  redraw: "Draw again",
  pastReadings: "Past readings",
  startError: "Couldn't start the reading.",
  cardAria: "Card {n}",
  cardBackAlt: "Back of a tarot card",
  posPast: "Where you've been",
  posPresent: "Where you are",
  posFuture: "Where you're headed",

  adSr: "Brewing tea",
  adBrewTitle: "Brewing a fresh cup of tea",
  adWaitNative: "You can keep going once the ad ends",
  adWaitWeb: "Just a moment and you can keep going",
  adChecking: "Checking the ad…",
  adBrewing: "Brewing… {n}s",
  adContinue: "Keep going 🍵",
  adLeafLink: "Get tea leaves and continue now",

  aboutTitle: "About Teacup Tarot",
  aboutIntro: "Like sitting down with a warm cup of tea after a long day, this is a place to set your worries down and talk them through with tarot.",
  aboutHowTitle: "How it works",
  aboutStep1Label: "Write it down:",
  aboutStep1: "Share what's weighing on you, or a choice you're stuck on.",
  aboutStep2Label: "Pick a reader and 3 cards:",
  aboutStep2: "Choose the reader whose vibe fits, then draw 3 cards by feel.",
  aboutStep3Label: "Talk it through & keep a note:",
  aboutStep3: "Chat about what the cards show. When you're done, you get a one-line note to keep.",
  aboutPersonasTitle: "Meet the three AI readers",
  aboutDiscTitle: "About AI readings",
  aboutDisc1: "All card readings and replies on Teacup Tarot are written by AI, for light self-reflection and entertainment.",
  aboutDisc2: "They don't replace medical, mental health, legal, or financial advice. If you're in crisis or need real help, please contact local emergency services or a crisis line in your area.",
  aboutCta: "Start a reading",

  contactTitle: "Contact",
  contactIntro: "Something not working, a bug to report, or an idea? We'd love to hear from you.",
  contactSection: "Who we are",
  contactOperator: "Run by",
  contactEmail: "Email",
  contactSite: "Website",
  contactReply: "We usually reply within 1–2 business days.",

  titleHome: "Teacup Tarot | Free Daily Tarot Card & AI Tarot Reading",
  titleGuide: "Teahouse Stories | Teacup Tarot",
  titleAbout: "About | Teacup Tarot",
  titleContact: "Contact | Teacup Tarot",
  titleTerms: "Terms of Service | Teacup Tarot",
  titlePrivacy: "Privacy Policy | Teacup Tarot",
  titleNew: "New Reading | Teacup Tarot",
  titleReading: "Reading | Teacup Tarot",

  finishReading: "End reading",
  turnsLeftMsg: "{n} replies left 🍵",
  freeLimitReached: "You've used all of your free limit for today.",
  outOfTeaTitle: "That's all for this reading ☕",
  outOfTeaDesc: "Tap End reading to get your free one-line takeaway note.",
  watchAdMoreTurns: "📺 Watch a short ad for {n} more replies",
  watchWebMoreTurns: "🍵 Brew a cup for {n} more replies",
  useLeafMoreTurns: "🌿 Get tea leaves for {n} more replies",
  chatPlaceholder: "Talk to {name}…",
  sendButton: "Send",
  typingSister: "She's pouring tea and writing back…",
  typingFact: "He's acting chill while typing your reply…",
  typingWitch: "The Moonlight Witch is listening to the stars…",
  typingFallback: "Thinking…",
  rxTitle: "Today's Takeaway",
  rxBadge: "✦ TODAY'S TAKEAWAY ✦",
  rxWriting: "Writing your note…",
  rxReaderLabel: "READER",
  rxVisitLink: "Visit Teacup Tarot",
  rxSaveImage: "Save image",
  rxShare: "Share",
  rxCopy: "Copy",
  rxError: "Couldn't create your note.",
  rxImgError: "Couldn't create the image. Please try again.",
  rxSaved: "Saved the image.",
  rxSavedAndCopied: "Saved image & copied share text.",
  rxLinkCopied: "Link copied.",
  rxCopyFail: "Couldn't copy. Please copy the link manually.",
  rxAdLimit: "You've reached today's ad limit. See you tomorrow 🍵",
  rxWebLimit: "You've reached today's extra reply limit. See you tomorrow 🍵",
  rxTurnsAdded: "Added {n} more replies 🍵",
  rxAdTurnLimit: "You've used all ad replies for today.",
  rxWebTurnLimit: "You've used all extra replies for today.",
  chatTimeout: "Reply is taking a while. Check your connection and try again?",
  chatNetErr: "Connection looks unstable. Try sending again?",
  retry: "Retry",
};

const ja: Dict = {
  brandTitle: "ティーカップタロット",
  soundOn: "サウンドオン",
  soundOff: "サウンドオフ",
  navAbout: "紹介",
  navGuide: "コラム",
  navMembership: "メンバーシップ",
  navLogin: "ログイン",
  backExit: "占いを終える",
  backConcern: "相談内容を書き直す",
  backPrev: "戻る",
  home: "ホーム",

  heroTitle1: "温かいお茶を片手に、",
  heroTitle2: "今日の気持ちを話してみませんか",
  heroSubtitle: "3枚のカードと一緒に、1対1でじっくり占うタロット",

  dailyBadge: "TODAY'S FREE TAROT",
  dailyTitle: "今日のラッキータロット",
  dailyDesc: "1日1枚。深呼吸してカードをタップし、今日のメッセージを受け取ってください。",
  dailyNextNotice: "明日はまた新しいカードが待っています ☕",
  dailyAriaLabel: "今日のカードを引く",

  consultTitle: "じっくりタロットで相談する",
  consultDesc: "詳しく書くほど、カードがはっきり答えてくれます。",
  consultPlaceholder: "例）3年勤めた会社を辞めて、ずっと学びたかった勉強を始めようか迷っています。少し貯金はあるけれど、やっぱり不安で…",
  consultButton: "タロットリーダーを選ぶ",
  consultDisclaimer: "※ AIタロットは気持ちの整理と楽しみのためのものです。医療・法律・投資の専門的な判断の代わりにはなりません。",

  infoTitle: "🍵 ティーカップタロットの使い方",
  infoSubtitle: "会員登録も支払いも不要。どなたでも無料で占えます。",
  infoStep1Title: "1. 悩みを書いて3枚引く",
  infoStep1Desc: "悩みを書いたら、好きなタロットリーダーを選んで、直感で3枚のカードを引きます。",
  infoStep2Title: "2. 毎日1回、無料で占える",
  infoStep2Desc: "毎日1回、無料で新しいタロット占いを楽しめます。",
  infoStep3Title: "3. チャット & 心の処方箋",
  infoStep3Desc: "1回の占いにつき2回まで無料でやり取りでき、最後にひと言の処方箋が無料で届きます。",
  freeBadge: "無料",

  faqTitle: "よくある質問",
  faqQ1: "Q. 会員登録やログインは必要ですか？",
  faqA1: "いいえ。登録なしで、すぐに悩みを書いてカードを引けます。",
  faqQ2: "Q. 相談内容がほかの人に見られることはありますか？",
  faqA2: "ありません。やり取りはすべて非公開で、お使いのスマホやブラウザにだけ一時保存されます。いつでも消せます。",
  faqQ3: "Q. 結果をそのまま信じていいですか？",
  faqA3: "ティーカップタロットは、自分と向き合うきっかけを楽しむエンタメサービスです。医療・法律・お金に関わる大事な決断は、専門家に相談してください。",

  footerStudioName: "YJスタジオ",
  footerDisclaimer: "AIによるタロットの解釈は、楽しみと気持ちの整理のための参考です。専門的なアドバイスではありません。",
  footerInquiry: "お問い合わせ",
  legalAbout: "サービス紹介",
  legalGuides: "こころ茶屋コラム",
  legalContact: "お問い合わせ",
  legalTerms: "利用規約",
  legalPrivacy: "プライバシーポリシー",
  legalBack: "← ティーカップタロットに戻る",
  legalEffective: "施行日",
  legalArticle: "第{n}条",
  legalNotice: "この翻訳は参考用です。内容に違いがある場合は、韓国語版が優先されます。",

  guidesTitle: "こころ茶屋コラム",
  guidesSubtitle: "タロットカードの意味や、恋愛・仕事・人間関係の悩みにそっと寄り添う読みもの",
  guidesViewAll: "すべて見る →",
  guideListDesc: "眠れない夜に。恋愛・仕事・人間関係のモヤモヤに、温かいお茶のような読みものを。",
  guideEmpty: "最初のコラムを準備中です。",

  toastShortConcern: "悩みをもう少し詳しく教えてください 🍵",
  toastLoginPrompt: "ログインすると、毎日1枚無料でラッキータロットが引けます 🍵",

  personaSisterName: "お隣のお姉さん",
  personaSisterTitle: "サンダルで遊びに行ける、お隣のお姉さん",
  personaSisterDesc: "「あ、来たの？お茶でも飲んでいきなよ」気楽に話せて、いつでも味方になってくれる相談相手。",
  personaFactName: "ツンデレお兄さん",
  personaFactTitle: "そっけないふりして、一番気にかけてくれるお兄さん",
  personaFactDesc: "「また一人で抱え込んでたのか」ズバッと本音を言いつつ、最後まで付き合ってくれる現実派。",
  personaWitchName: "月あかりの魔女",
  personaWitchTitle: "神秘的でスピリチュアルな魔女",
  personaWitchDesc: "星と月の言葉で、運命の流れをそっとささやきます。",

  newTitle: "どのタロットリーダーと話しますか？",
  newConcernLabel: "相談したいこと",
  newConcernPlaceholder: "悩みを書いてください",
  toastPickPersona: "先にタロットリーダーを選んでください",
  toastConcernMin: "悩みを5文字以上で書いてください",
  goDrawButton: "カードを引きに行く",
  unlockOpened: "新しい占いが開きました 🍵",
  freeUsedAd: "今日の無料分は使い切りました · 短い広告を見ると新しく占えます",
  freeUsedWeb: "今日の無料分は使い切りました · また明日お越しください 🍵",
  freeUsedLeaf: "今日の無料分は使い切りました · 広告か茶葉で新しく占えます",
  gateTitle: "今日の無料のお茶は飲み終わりました 🍵",
  gateDesc: "本日の占いは終了しました。また明日、新しい気持ちでお会いしましょう。",
  gateLeafCharge: "🌿 茶葉をチャージする",
  gateLeafUse: "🌿 茶葉1つで新しく占う（残り{n}個）",
  gateAd: "📺 短い広告を見て新しく占う（今日あと{n}回）",
  gateWeb: "🍵 お茶を淹れて新しく占う（今日あと{n}回）",
  gateLater: "また明日来ます",
  toastLeafUnlock: "茶葉1つで新しい占いを開きます 🌿",
  toastLeafUnlockDesc: "茶葉は占いが始まるときに使われます",
  rePickPersona: "← タロットリーダーを選び直す",
  drawTitle: "惹かれるカードを3枚選んでください",
  drawDesc: "悩みを思い浮かべながらゆっくり呼吸して、直感を信じてみて。",
  spreadHint: "22枚のカードが並んでいます · 横にスワイプして、気になるカードを選んでください",
  shuffleButton: "🔀 カードを切り直す",
  readingBusy: "{name}がカードを読んでいます…",
  startWithCards: "このカードで占いを始める",
  redraw: "引き直す",
  pastReadings: "これまでの占い",
  startError: "占いを始められませんでした。",
  cardAria: "カード {n}",
  cardBackAlt: "タロットカードの裏面",
  posPast: "これまでの気持ち",
  posPresent: "今のわたし",
  posFuture: "これからの流れ",

  adSr: "お茶を淹れています",
  adBrewTitle: "新しいお茶を淹れています",
  adWaitNative: "広告が終わったら、すぐに続きを話せます",
  adWaitWeb: "少し待つと、続きを話せます",
  adChecking: "広告を確認中…",
  adBrewing: "お茶を淹れています… {n}秒",
  adContinue: "続きを話す 🍵",
  adLeafLink: "茶葉をチャージしてすぐに話す",

  aboutTitle: "ティーカップタロットについて",
  aboutIntro: "忙しい一日の終わりに温かいお茶を前にするように、肩の力を抜いて話せるタロットの場所です。",
  aboutHowTitle: "使い方",
  aboutStep1Label: "悩みを書く：",
  aboutStep1: "いま気になっていることや、迷っている選択を気軽に書きます。",
  aboutStep2Label: "リーダーとカード3枚を選ぶ：",
  aboutStep2: "話したい雰囲気に合うタロットリーダーを選び、直感で3枚のカードを引きます。",
  aboutStep3Label: "やり取り & 心の処方箋：",
  aboutStep3: "カードの読み解きをもとに話を続け、最後にひと言の処方箋カードを受け取れます。",
  aboutPersonasTitle: "3人のAIタロットリーダー",
  aboutDiscTitle: "AIによる占いについて",
  aboutDisc1: "ティーカップタロットのカードの解釈や会話は、すべてAIが作成したものです。自分を見つめ直すきっかけと、楽しみのための参考としてお使いください。",
  aboutDisc2: "医療・心のケア・法律・投資の専門的なアドバイスの代わりにはなりません。つらいときや助けが必要なときは、119番や「いのちの電話」など専門の窓口に相談してください。",
  aboutCta: "タロットを始める",

  contactTitle: "お問い合わせ",
  contactIntro: "使いにくい点や不具合、ご提案などがあれば、お気軽にご連絡ください。",
  contactSection: "運営・お問い合わせ先",
  contactOperator: "運営",
  contactEmail: "メール",
  contactSite: "サイト",
  contactReply: "いただいたお問い合わせには、通常1〜2営業日以内にお返事します。",

  titleHome: "ティーカップタロット｜今日のラッキーカードとAIタロット",
  titleGuide: "こころ茶屋コラム｜ティーカップタロット",
  titleAbout: "サービス紹介｜ティーカップタロット",
  titleContact: "お問い合わせ｜ティーカップタロット",
  titleTerms: "利用規約｜ティーカップタロット",
  titlePrivacy: "プライバシーポリシー｜ティーカップタロット",
  titleNew: "新しい占い｜ティーカップタロット",
  titleReading: "占い中｜ティーカップタロット",

  finishReading: "占いを終える",
  turnsLeftMsg: "残り{n}回やり取りできます 🍵",
  freeLimitReached: "本日の無料利用枠をすべて使い切りました。",
  outOfTeaTitle: "今日のやり取りはここまでです ☕",
  outOfTeaDesc: "「占いを終える」を押して、今日の心の処方箋を受け取ってください。",
  watchAdMoreTurns: "📺 短い広告を見てあと{n}回話す",
  watchWebMoreTurns: "🍵 お茶を淹れてあと{n}回話す",
  useLeafMoreTurns: "🌿 茶葉をチャージしてあと{n}回話す",
  chatPlaceholder: "{name}に話しかける…",
  sendButton: "送信",
  typingSister: "お姉さんがお茶を淹れながら返信を書いています…",
  typingFact: "お兄さんがそっけない顔で返信を書いています…",
  typingWitch: "月あかりの魔女が星のささやきを書き留めています…",
  typingFallback: "考えています…",
  rxTitle: "今日の心の処方箋",
  rxBadge: "✦ TODAY'S PRESCRIPTION ✦",
  rxWriting: "処方箋を書いています…",
  rxReaderLabel: "READER",
  rxVisitLink: "サイトを見る",
  rxSaveImage: "画像を保存",
  rxShare: "シェアする",
  rxCopy: "コピー",
  rxError: "処方箋を作れませんでした。",
  rxImgError: "画像を作れませんでした。少し経ってからもう一度お試しください。",
  rxSaved: "画像を保存しました。",
  rxSavedAndCopied: "画像を保存し、シェア用テキストをコピーしました。",
  rxLinkCopied: "リンクをコピーしました。",
  rxCopyFail: "コピーできませんでした。URLを長押ししてコピーしてください。",
  rxAdLimit: "本日の広告上限に達しました。また明日お会いしましょう 🍵",
  rxWebLimit: "本日の追加チャット上限に達しました。また明日お会いしましょう 🍵",
  rxTurnsAdded: "やり取りが{n}回追加されました 🍵",
  rxAdTurnLimit: "本日広告で増やせる回数をすべて使い切りました。",
  rxWebTurnLimit: "本日追加できる回数をすべて使い切りました。",
  chatTimeout: "返信が遅れています。接続を確認してもう一度送ってみますか？",
  chatNetErr: "通信が不安定なようです。もう一度送ってみますか？",
  retry: "再試行",
};

const zhTW: Dict = {
  brandTitle: "茶盞塔羅",
  soundOn: "開啟音效",
  soundOff: "關閉音效",
  navAbout: "關於",
  navGuide: "塔羅專欄",
  navMembership: "會員方案",
  navLogin: "登入",
  backExit: "結束占卜",
  backConcern: "回去修改問題",
  backPrev: "返回",
  home: "首頁",

  heroTitle1: "泡一杯熱茶，",
  heroTitle2: "說說你今天的心事",
  heroSubtitle: "你的故事加上三張牌，一對一的塔羅談心時間",

  dailyBadge: "TODAY'S FREE TAROT",
  dailyTitle: "今日幸運塔羅",
  dailyDesc: "一天一張。深呼吸，輕觸牌面，看看今天想對你說什麼。",
  dailyNextNotice: "明天還有新的牌等著你 ☕",
  dailyAriaLabel: "抽今日的牌",

  consultTitle: "開始塔羅占卜",
  consultDesc: "寫得越具體，牌就能說得越清楚。",
  consultPlaceholder: "例：我在現在的公司做了三年，想辭職去讀一直想學的東西。雖然存了一點錢，但還是很不安…",
  consultButton: "選擇塔羅師",
  consultDisclaimer: "※ AI塔羅僅供娛樂與自我覺察參考，不能取代醫療、法律或投資等專業建議。",

  infoTitle: "🍵 茶盞塔羅怎麼玩",
  infoSubtitle: "不用註冊、不用付費，任何人都能免費占卜。",
  infoStep1Title: "1. 寫下煩惱，抽三張牌",
  infoStep1Desc: "寫下心事後，選一位喜歡的塔羅師，憑直覺抽出三張牌。",
  infoStep2Title: "2. 每天免費占卜",
  infoStep2Desc: "每天享有1次免費完整塔羅占卜。",
  infoStep3Title: "3. 對話與心情處方籤",
  infoStep3Desc: "每次占卜可免費對話兩次，結束後免費送你一句專屬處方籤。",
  freeBadge: "免費",

  faqTitle: "常見問題",
  faqQ1: "Q. 需要註冊或登入嗎？",
  faqA1: "不用，直接寫下煩惱、抽牌就能開始。",
  faqQ2: "Q. 我的占卜內容會被別人看到嗎？",
  faqA2: "不會。所有對話都是一對一私密進行，只暫存在你的手機或瀏覽器裡，隨時都能清除。",
  faqQ3: "Q. 塔羅結果可以全信嗎？",
  faqA3: "茶盞塔羅是陪你整理思緒的娛樂服務。醫療、法律、金錢相關的重大決定，請務必諮詢專業人士。",

  footerStudioName: "YJ Studio",
  footerDisclaimer: "AI塔羅解讀僅供娛樂與自我覺察參考，並非專業建議。",
  footerInquiry: "聯絡我們",
  legalAbout: "關於我們",
  legalGuides: "心靈茶舍專欄",
  legalContact: "聯絡我們",
  legalTerms: "服務條款",
  legalPrivacy: "隱私權政策",
  legalBack: "← 回到茶盞塔羅",
  legalEffective: "生效日期",
  legalArticle: "第{n}條",
  legalNotice: "本譯文僅供參考，如內容有出入，以韓文版為準。",

  guidesTitle: "心靈茶舍專欄",
  guidesSubtitle: "塔羅牌義，以及戀愛、工作、人際關係的暖心短文",
  guidesViewAll: "看全部 →",
  guideListDesc: "睡不著的夜裡，給為戀愛、工作、人際關係煩惱的你，一杯熱茶般的文章。",
  guideEmpty: "第一篇文章還在泡茶中。",

  toastShortConcern: "再多說一點你的心事吧 🍵",
  toastLoginPrompt: "登入後每天都能免費抽一張幸運塔羅 🍵",

  personaSisterName: "鄰家姐姐",
  personaSisterTitle: "穿著拖鞋就來找你的鄰家姐姐",
  personaSisterDesc: "「來啦？喝杯茶再走。」放心說出來，她永遠站在你這邊。",
  personaFactName: "傲嬌哥哥",
  personaFactTitle: "嘴上冷淡，其實最照顧你的哥哥",
  personaFactDesc: "「又一個人在那邊胡思亂想了？」直接戳破盲點，陪你到最後的務實建議。",
  personaWitchName: "月光女巫",
  personaWitchTitle: "神祕又有靈性的女巫",
  personaWitchDesc: "用星星與月亮的語言，輕聲訴說命運的走向。",

  newTitle: "想跟哪位塔羅師聊聊？",
  newConcernLabel: "我的煩惱",
  newConcernPlaceholder: "寫下你的煩惱",
  toastPickPersona: "請先選一位塔羅師",
  toastConcernMin: "煩惱請至少寫5個字",
  goDrawButton: "去抽牌",
  unlockOpened: "新的占卜開啟了 🍵",
  freeUsedAd: "今天的免費占卜已經用完了 · 看一段短廣告就能再占一次",
  freeUsedWeb: "今天的免費占卜已經用完了 · 明天再來吧 🍵",
  freeUsedLeaf: "今天的免費占卜已經用完了 · 可用廣告或茶葉開啟新的占卜",
  gateTitle: "今天的免費茶已經喝完了 🍵",
  gateDesc: "今天的占卜已經結束囉，明天再以全新的心情相見吧。",
  gateLeafCharge: "🌿 去儲值茶葉",
  gateLeafUse: "🌿 用1片茶葉開啟新占卜（剩{n}片）",
  gateAd: "📺 看短廣告開啟新占卜（今天還有{n}次）",
  gateWeb: "🍵 泡杯茶開啟新占卜（今天還有{n}次）",
  gateLater: "明天再來",
  toastLeafUnlock: "用1片茶葉開啟新的占卜 🌿",
  toastLeafUnlockDesc: "占卜開始時才會扣茶葉",
  rePickPersona: "← 重新選擇塔羅師",
  drawTitle: "選出三張吸引你的牌",
  drawDesc: "想著你的煩惱，慢慢呼吸，相信你的直覺。",
  spreadHint: "22張牌已經攤開 · 左右滑動，選出有感覺的牌",
  shuffleButton: "🔀 重新洗牌",
  readingBusy: "{name}正在解讀你的牌…",
  startWithCards: "用這三張牌開始占卜",
  redraw: "重新抽牌",
  pastReadings: "過去的占卜",
  startError: "無法開始占卜。",
  cardAria: "第{n}張牌",
  cardBackAlt: "塔羅牌背面",
  posPast: "過往的心",
  posPresent: "現在的我",
  posFuture: "未來的走向",

  adSr: "正在泡茶",
  adBrewTitle: "正在泡一壺新的茶",
  adWaitNative: "廣告結束後就能繼續聊",
  adWaitWeb: "稍等一下就能繼續聊",
  adChecking: "確認廣告中…",
  adBrewing: "泡茶中… {n}秒",
  adContinue: "繼續聊 🍵",
  adLeafLink: "儲值茶葉，馬上繼續聊",

  aboutTitle: "關於茶盞塔羅",
  aboutIntro: "就像忙碌一天後面對一杯熱茶，這裡是能讓你放下心事、好好聊聊的塔羅空間。",
  aboutHowTitle: "使用方式",
  aboutStep1Label: "寫下煩惱：",
  aboutStep1: "輕鬆寫下讓你心煩的事，或正在猶豫的選擇。",
  aboutStep2Label: "選塔羅師、抽三張牌：",
  aboutStep2: "選一位聊天氛圍適合你的塔羅師，再憑直覺抽出三張牌。",
  aboutStep3Label: "聊聊 & 心情處方籤：",
  aboutStep3: "根據牌面繼續聊下去，結束時還能收到一句專屬的心情處方籤。",
  aboutPersonasTitle: "三位AI塔羅師",
  aboutDiscTitle: "關於AI占卜",
  aboutDisc1: "茶盞塔羅的所有牌義解讀與對話皆由AI生成，僅供輕鬆的自我覺察與娛樂參考。",
  aboutDisc2: "不能取代醫療、心理、法律或投資等專業建議。如果正面臨危機或需要協助，請撥打當地緊急電話（台灣 110／119、香港 999），或聯絡心理支持專線（台灣安心專線 1925、香港撒瑪利亞防止自殺會）。",
  aboutCta: "開始塔羅占卜",

  contactTitle: "聯絡我們",
  contactIntro: "使用上有任何不便、想回報問題或有建議，都歡迎隨時跟我們聯絡。",
  contactSection: "營運與聯絡資訊",
  contactOperator: "營運單位",
  contactEmail: "電子郵件",
  contactSite: "網站",
  contactReply: "收到來信後，我們通常會在1～2個工作天內回覆。",

  titleHome: "茶盞塔羅｜今日幸運牌與AI塔羅占卜",
  titleGuide: "心靈茶舍專欄｜茶盞塔羅",
  titleAbout: "關於我們｜茶盞塔羅",
  titleContact: "聯絡我們｜茶盞塔羅",
  titleTerms: "服務條款｜茶盞塔羅",
  titlePrivacy: "隱私權政策｜茶盞塔羅",
  titleNew: "新的占卜｜茶盞塔羅",
  titleReading: "占卜中｜茶盞塔羅",

  finishReading: "結束占卜",
  turnsLeftMsg: "還可對話 {n} 次 🍵",
  freeLimitReached: "今天的免費額度已全部使用完畢。",
  outOfTeaTitle: "這次的對話已經告一段落 ☕",
  outOfTeaDesc: "點擊「結束占卜」，領取免費的專屬心情處方籤吧。",
  watchAdMoreTurns: "📺 看短廣告再聊 {n} 次",
  watchWebMoreTurns: "🍵 泡杯茶再聊 {n} 次",
  useLeafMoreTurns: "🌿 儲值茶葉再聊 {n} 次",
  chatPlaceholder: "跟 {name} 說點什麼…",
  sendButton: "送出",
  typingSister: "鄰家姐姐正一邊泡茶一邊回覆你…",
  typingFact: "哥哥正一臉淡定地打字回覆…",
  typingWitch: "月光女巫正在記下星辰的低語…",
  typingFallback: "正在整理思緒…",
  rxTitle: "今日心情處方籤",
  rxBadge: "✦ 今日心情處方籤 ✦",
  rxWriting: "正在寫處方籤…",
  rxReaderLabel: "塔羅師",
  rxVisitLink: "造訪茶盞塔羅",
  rxSaveImage: "儲存圖片",
  rxShare: "分享",
  rxCopy: "複製",
  rxError: "無法生成處方籤。",
  rxImgError: "無法製作圖片，請稍後再試。",
  rxSaved: "已儲存處方籤圖片。",
  rxSavedAndCopied: "已儲存圖片並複製分享文字。",
  rxLinkCopied: "已複製連結。",
  rxCopyFail: "無法複製，請長按網址手動複製。",
  rxAdLimit: "今天的廣告次數已達上限，明天再見 🍵",
  rxWebLimit: "今天的追加對話次數已達上限，明天再見 🍵",
  rxTurnsAdded: "已增加 {n} 次對話 🍵",
  rxAdTurnLimit: "今天透過廣告獲得的對話次數已用完。",
  rxWebTurnLimit: "今天可追加的對話次數已用完。",
  chatTimeout: "回覆有點慢，請確認網路後再試一次？",
  chatNetErr: "網路連線似乎不穩，再試一次嗎？",
  retry: "重試",
};

export const TRANSLATIONS: Record<SupportedLang, Dict> = { ko, en, ja, "zh-TW": zhTW };

type Vars = Record<string, string | number>;

function translate(lang: SupportedLang, key: TranslationKey, vars?: Vars): string {
  let s = TRANSLATIONS[lang]?.[key] ?? ko[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

interface I18nContextType {
  lang: SupportedLang;
  setLang: (lang: SupportedLang) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const SUPPORTED: SupportedLang[] = ["ko", "en", "ja", "zh-TW"];

function detectBrowserLang(): SupportedLang {
  if (typeof window === "undefined") return "ko";
  const saved = localStorage.getItem("teacup-lang") as SupportedLang | null;
  if (saved && SUPPORTED.includes(saved)) return saved;
  const navLang = (navigator.language || navigator.languages?.[0] || "").toLowerCase();
  if (navLang.startsWith("ko")) return "ko";
  if (navLang.startsWith("ja")) return "ja";
  if (navLang.startsWith("zh")) return "zh-TW";
  return "en";
}

/**
 * 페이지가 열리기 전에 실행되는 짧은 안내문 — 외국어 사용자에게 한국어가 잠깐 비치는 현상을 막는다.
 * detectBrowserLang과 같은 규칙을 써야 한다.
 */
export const LANG_BOOT_SCRIPT = `(function(){try{var a=["ko","en","ja","zh-TW"];var l=localStorage.getItem("teacup-lang");if(a.indexOf(l)<0){var n=(navigator.language||"").toLowerCase();l=n.indexOf("ko")===0?"ko":n.indexOf("ja")===0?"ja":n.indexOf("zh")===0?"zh-TW":"en";}if(l!=="ko"){var d=document.documentElement;d.lang=l;d.classList.add("i18n-pending");setTimeout(function(){d.classList.remove("i18n-pending")},1500);}}catch(e){}})();`;
export const LANG_BOOT_STYLE = "html.i18n-pending body{visibility:hidden}";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>("ko");

  useEffect(() => {
    const initial = detectBrowserLang();
    setLangState(initial);
    document.documentElement.lang = initial;
    // 번역된 화면이 그려진 다음 가림막을 걷는다
    requestAnimationFrame(() =>
      requestAnimationFrame(() => document.documentElement.classList.remove("i18n-pending")),
    );
  }, []);

  const setLang = (next: SupportedLang) => {
    setLangState(next);
    localStorage.setItem("teacup-lang", next);
    document.documentElement.lang = next;
  };

  const t = (key: TranslationKey, vars?: Vars) => translate(lang, key, vars);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return { lang: "ko", setLang: () => {}, t: (key, vars) => translate("ko", key, vars) };
  }
  return ctx;
}

const PERSONA_KEYS: Record<PersonaId, [TranslationKey, TranslationKey, TranslationKey]> = {
  sister: ["personaSisterName", "personaSisterTitle", "personaSisterDesc"],
  fact: ["personaFactName", "personaFactTitle", "personaFactDesc"],
  witch: ["personaWitchName", "personaWitchTitle", "personaWitchDesc"],
};

/** 상담사 이름·한 줄 소개·설명을 지금 언어로 돌려준다 (AI에게 보내는 성격 설정은 그대로) */
export function usePersonaText() {
  const { t } = useI18n();
  return (id: PersonaId) => {
    const [n, ti, d] = PERSONA_KEYS[id] ?? PERSONA_KEYS.sister;
    return { name: t(n), title: t(ti), desc: t(d) };
  };
}

export function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="언어 변경 / Change language"
        className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-2.5 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
      >
        <span>{LANG_LABELS[lang].flag}</span>
        <span className="hidden sm:inline">{LANG_LABELS[lang].label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-32 origin-top-right rounded-xl border border-border bg-popover p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            {SUPPORTED.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  lang === l ? "bg-primary/10 font-bold text-primary" : "text-popover-foreground hover:bg-accent"
                }`}
              >
                <span>{LANG_LABELS[l].flag}</span>
                <span>{LANG_LABELS[l].label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
