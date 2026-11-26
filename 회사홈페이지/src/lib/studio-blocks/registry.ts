export type AppPlatform = "android" | "web" | "hybrid";

export type BlockFeatureKey =
  | "visitors"
  | "ai"
  | "blog"
  | "playstore"
  | "payments"
  | "special";

export type BlogAdapterKind =
  | "guides" // 찻잔타로 (guides)
  | "dream_guides" // 꿈소반 (dream_guides)
  | "bamboo_stories" // 대나무속풀이 (bamboo_stories)
  | "welfare_posts"; // 울동네 (welfare_posts)

export interface StudioAppBlock {
  key: string;
  name: string;
  tagline: string;
  platform: AppPlatform;
  publicUrl?: string;
  adminUrl?: string;
  playStorePackage?: string;
  /** 원격 저장소 환경 변수 접두사 (예: TEACUPTAROT -> REMOTE_TEACUPTAROT_URL, REMOTE_TEACUPTAROT_SERVICE_KEY) */
  remoteEnvPrefix?: string;
  blogAdapter?: BlogAdapterKind;
  specialFeatureLabel?: string;
  features: Record<BlockFeatureKey, boolean>;
  defaultAiPrompt?: string;
  launchChecklist: {
    adsCleaned: boolean;
    legalReady: boolean;
  };
}

/**
 * YJ 스튜디오 레고 블록식 앱 명세서
 * 새 앱을 만들면 이 목록에 블록 1개만 추가(또는 관제센터 UI에서 추가)하면 대시보드와 작업실에 자동 편입됩니다.
 */
export const STUDIO_APP_BLOCKS: StudioAppBlock[] = [
  {
    key: "uldongne",
    name: "울동네",
    tagline: "우리 동네 복지 혜택 알림 & 블로그",
    platform: "hybrid",
    publicUrl: "https://wooldongne.com",
    adminUrl: "https://wooldongne.com/admin",
    remoteEnvPrefix: "ULDONGNE",
    blogAdapter: "welfare_posts",
    specialFeatureLabel: "복지 순찰 현황",
    features: {
      visitors: true,
      ai: true,
      blog: true,
      playstore: false,
      payments: false,
      special: true,
    },
    launchChecklist: {
      adsCleaned: false,
      legalReady: true,
    },
  },
  {
    key: "teacuptarot",
    name: "찻잔타로",
    tagline: "따뜻한 AI 타로 심리 상담",
    platform: "web",
    publicUrl: "https://teacuptarot.com",
    adminUrl: "https://teacuptarot.com/admin",
    remoteEnvPrefix: "TEACUPTAROT",
    blogAdapter: "guides",
    specialFeatureLabel: "회원·찻잎 관리",
    features: {
      visitors: true,
      ai: true,
      blog: true,
      playstore: false,
      payments: true,
      special: true,
    },
    defaultAiPrompt: `당신은 '찻잔 타로'의 따뜻한 연애 심리 칼럼 작가입니다.
- 독자: 연애·재회·짝사랑 고민으로 밤에 검색하는 20~30대
- 말투: 아늑한 찻집에서 옆집 언니가 다정하게 이야기하듯, 존댓말(~해요)
- 구성: ## 소제목 3~4개, 문단은 2~3줄로 짧게, 실천 체크리스트 1개 포함
- 분량: 본문 1,800~2,500자`,
    launchChecklist: {
      adsCleaned: true,
      legalReady: true,
    },
  },
  {
    key: "dreamsoban",
    name: "꿈소반",
    tagline: "간밤의 꿈을 풀어주는 AI 꿈해몽",
    platform: "web",
    publicUrl: "https://dreamsoban.app",
    adminUrl: "https://dreamsoban.app/admin",
    remoteEnvPrefix: "DREAMSOBAN",
    blogAdapter: "dream_guides",
    features: {
      visitors: true,
      ai: true,
      blog: true,
      playstore: false,
      payments: false,
      special: false,
    },
    defaultAiPrompt: `당신은 '꿈소반'의 따뜻하고 신비로운 꿈풀이 칼럼 작가입니다.
- 독자: 간밤의 꿈이 마음에 걸려 아침에 "○○ 꿈 해몽"을 검색하는 20~40대
- 말투: 다정하고 차분한 존댓말(~해요), 겁주지 않기
- 구성: ## 소제목 4~5개 (전통 해몽 / 상황별 풀이 / 심리 해석 / 길몽·흉몽 / 오늘의 팁)
- 분량: 1,800~2,500자`,
    launchChecklist: {
      adsCleaned: true,
      legalReady: true,
    },
  },
  {
    key: "bambooforest",
    name: "대나무속풀이",
    tagline: "마음속 고민을 비우는 속풀이 공간",
    platform: "web",
    publicUrl: "https://bambooforest.app",
    adminUrl: "https://bambooforest.app/admin",
    remoteEnvPrefix: "BAMBOOFOREST",
    blogAdapter: "bamboo_stories",
    features: {
      visitors: true,
      ai: true,
      blog: true,
      playstore: false,
      payments: false,
      special: false,
    },
    defaultAiPrompt: `당신은 '대나무숲 속풀이'의 속풀이 칼럼 작가입니다.
- 독자: 직장, 친구, 연인, 가족 때문에 속이 답답해 대처법을 검색하는 20~40대
- 말투: 독자 편을 드는 다정하고 시원한 존댓말(~해요), 훈계·비속어 금지
- 구성: ## 소제목 4~5개 (공감 / 원인 / 상황별 대처법 / 마음 지키기 / 오늘 해볼 일)
- 분량: 1,800~2,500자`,
    launchChecklist: {
      adsCleaned: true,
      legalReady: true,
    },
  },
  {
    key: "tokbiseo",
    name: "톡비서",
    tagline: "똑똑한 일상·일정 관리 AI 비서",
    platform: "android",
    playStorePackage: "app.yjstudio.tokbiseo",
    publicUrl: "https://play.google.com/store/apps/details?id=app.yjstudio.tokbiseo",
    features: {
      visitors: true,
      ai: true,
      blog: false,
      playstore: true,
      payments: true,
      special: false,
    },
    launchChecklist: {
      adsCleaned: true,
      legalReady: true,
    },
  },
  {
    key: "wrongnote",
    name: "오답정복",
    tagline: "3초 등록 · 쓱-지우개 · 가림막 복습 오답노트",
    platform: "android",
    playStorePackage: "app.yjstudio.wrongnote",
    publicUrl: "https://play.google.com/store/apps/details?id=app.yjstudio.wrongnote",
    features: {
      visitors: true,
      ai: true,
      blog: false,
      playstore: true,
      payments: true,
      special: false,
    },
    launchChecklist: {
      adsCleaned: true,
      legalReady: true,
    },
  },
  {
    key: "hangul",
    name: "한글다마고치",
    tagline: "재미있게 익히는 한글 학습 캐릭터",
    platform: "hybrid",
    features: {
      visitors: true,
      ai: false,
      blog: false,
      playstore: false,
      payments: false,
      special: false,
    },
    launchChecklist: {
      adsCleaned: false,
      legalReady: false,
    },
  },
  {
    key: "running",
    name: "러닝 크루 올인원",
    tagline: "함께 달리는 러닝 크루 기록·일정 관리",
    platform: "hybrid",
    features: {
      visitors: true,
      ai: false,
      blog: false,
      playstore: false,
      payments: false,
      special: false,
    },
    launchChecklist: {
      adsCleaned: false,
      legalReady: false,
    },
  },
];
