/* ==========================================================================
   한글 다마고치 - 말랑이의 방 (app.js)
   3~6세 유아 맞춤형 4대 욕구 학습 보상 시스템 & 방 안 자율 배회(AI)
   ========================================================================== */

// --- 1. 유아 친화형 효과음 합성기 (Web Audio API) ---
class ToddlerSoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.isMuted = false;
    this.bgmTimer = null;
    this.currentVoice = null;
    this.voiceCache = {};
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.isMuted) {
      if (this.ctx.state === 'running') this.ctx.suspend();
      return;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 콩콩콩 발걸음 점프음 (Hop)
  playHop() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 젤리 찌그러짐/통통 튀는 소리 (Boing)
  playBoing() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.22);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // 간지럼 타는 꺄르륵 소리
  playTickle() {
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.09, 0.18].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540 + idx * 110, now + offset);
      osc.frequency.exponentialRampToValueAtTime(860 + idx * 110, now + offset + 0.07);

      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });
  }

  // 계속 만져서 삐지고 화난 소리
  playGrumpy() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(135, now + 0.24);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 냠냠 맘마 먹는 소리
  playNom() {
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.08, 0.16].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380 + idx * 70, now + offset);
      osc.frequency.exponentialRampToValueAtTime(200, now + offset + 0.07);

      gain.gain.setValueAtTime(0.22, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });
  }

  // 뽀송뽀송 비누방울
  playBubble() {
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.06, 0.12].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700 + idx * 160, now + offset);
      osc.frequency.exponentialRampToValueAtTime(1400 + idx * 160, now + offset + 0.05);

      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.05);
    });
  }

  // 맑은 정답 벨소리 (딩동댕 실로폰)
  playSuccess() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.22, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }

  // 따뜻한 팡파르 (보물상자 오픈음)
  playFanfare() {
    this.init();
    const chords = [
      { f: 523.25, t: 0 },
      { f: 659.25, t: 0.12 },
      { f: 783.99, t: 0.24 },
      { f: 1046.50, t: 0.36 },
      { f: 1318.51, t: 0.52 }
    ];
    const now = this.ctx.currentTime;
    chords.forEach(c => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, now + c.t);
      gain.gain.setValueAtTime(0.25, now + c.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + c.t);
      osc.stop(now + c.t + 0.45);
    });
  }

  // 부드러운 오답 뿡 소리 (놀라지 않는 톤)
  playWrong() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.2);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // 장난감 뾱뾱이 (Squeak)
  playSqueak() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1300, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 아삭아삭 사과 씹는 소리 (단일 아삭)
  playCrunch() {
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.06].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420 - idx * 80, now + offset);
      osc.frequency.exponentialRampToValueAtTime(140, now + offset + 0.05);

      gain.gain.setValueAtTime(0.16, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.05);
    });
  }

  // 시원한 헹굼 물줄기 소리 (Splash)
  playSplash() {
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.08, 0.16, 0.24].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950 - idx * 120, now + offset);
      osc.frequency.exponentialRampToValueAtTime(450, now + offset + 0.08);

      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });
  }

  // 통! 통! 공 튕기는 소리 (Bounce Kick)
  playBounceKick() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 상시 흐르는 아주 조용하고 잔잔한 오르골/힐링 배경음악
  startAmbientBGM() {
    if (!this.enabled || this.bgmTimer) return;
    this.init();
    if (!this.ctx) return;

    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 261.63, 329.63, 440.00], // Fmaj7
      [196.00, 293.66, 392.00, 440.00]  // G6
    ];
    let barIdx = 0;

    const playBar = () => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      const notes = chords[barIdx % chords.length];
      barIdx += 1;
      const now = this.ctx.currentTime;

      // 1) 아주 은은한 따뜻한 배경 화음
      notes.slice(0, 2).forEach((freq) => {
        const pad = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        pad.type = 'sine';
        pad.frequency.setValueAtTime(freq, now);
        padGain.gain.setValueAtTime(0.0001, now);
        padGain.gain.linearRampToValueAtTime(0.018, now + 0.8);
        padGain.gain.exponentialRampToValueAtTime(0.0005, now + 3.0);
        pad.connect(padGain);
        padGain.connect(this.ctx.destination);
        pad.start(now);
        pad.stop(now + 3.05);
      });

      // 2) 잔잔한 오르골 아르페지오 음표
      notes.forEach((freq, i) => {
        const t = now + i * 0.65;
        const bell = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(freq * 2, t);
        bellGain.gain.setValueAtTime(0.0001, t);
        bellGain.gain.linearRampToValueAtTime(0.022, t + 0.04);
        bellGain.gain.exponentialRampToValueAtTime(0.0004, t + 1.4);
        bell.connect(bellGain);
        bellGain.connect(this.ctx.destination);
        bell.start(t);
        bell.stop(t + 1.45);
      });
    };

    if (this.ctx.state === 'running') {
      playBar();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        if (this.enabled && !this.isMuted && this.bgmTimer) {
          playBar();
        }
      }).catch(() => {});
    }
    this.bgmTimer = setInterval(playBar, 2800);
  }

  stopAmbientBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.currentVoice) {
      this.currentVoice.pause();
      this.currentVoice.currentTime = 0;
    }
  }

  // 말랑이 전용 캐릭터 목소리 재생
  playVoice(key) {
    if (!this.enabled || this.isMuted || !key) return;
    try {
      if (this.currentVoice) {
        this.currentVoice.pause();
        this.currentVoice.currentTime = 0;
      }
      if (!this.voiceCache[key]) {
        const audio = new Audio(`assets/voice/${key}.mp3`);
        audio.volume = 0.9;
        this.voiceCache[key] = audio;
      }
      const voice = this.voiceCache[key];
      voice.currentTime = 0;
      this.currentVoice = voice;
      voice.play().catch(() => {});
    } catch (e) {
      // 자동 재생 제한 시 조용히 무시
    }
  }
}

const sfx = new ToddlerSoundFX();

// 첫 사용자 상호작용 시 잔잔한 배경음악 자동 시작
['pointerdown', 'keydown'].forEach((evtName) => {
  window.addEventListener(evtName, () => {
    if (sfx.enabled) sfx.startAmbientBGM();
  }, { once: true, passive: true });
});

// --- 2. 다마고치 상태 모델 (4대 욕구 & 인벤토리 연동) ---
const gameState = {
  name: "말랑이",
  level: 1,
  exp: 0,
  maxExp: 100,

  // 4대 케어 보상 인벤토리 (학습을 완료해야 채워지는 시스템)
  food: 0,          // 🍎 하루치 맘마
  soaps: 0,         // 🧼 뽀송 비누
  toys: 0,          // ⚽ 신나는 공
  stars: 10,        // ⭐ 배움 별 포인트

  // 4대 욕구 게이지 (0~100)
  hunger: 65,
  clean: 75,
  energy: 85,
  fun: 75,

  // 하루 3회 먹이 & 부모 설정 시간 기반 케어 제한
  dailyFeedCount: 0,
  maxDailyFeed: 3,
  lastFeedAtSec: -9999,
  lastCareActionAtSec: -9999,
  lastHungerPingSlot: 0,

  // 학습 및 수면 상태
  studyStep: 0,             // 3문항 퀴즈 세트 진행도 (0~3)
  dailyStudyDone: false,    // 오늘 한글 공부 완주 여부
  sleepUnlocked: false,     // 재우기 활성화 여부
  isSleeping: false,

  // 방 안 자율 위치 (퍼센트 기준: x 15~85%, y: 바닥 위)
  pos: { x: 50, y: 35 },
  facingRight: true,
  isMoving: false,
  isActionPlaying: false,   // 3초대 케어 모션 연출 진행 중 여부
};

// --- 3. 3~6세 유아용 퀴즈 데이터베이스 ---
const toddlerQuizzes = [
  {
    emoji: "🍎",
    wordDisplay: "? 과",
    correct: "ㅅ",
    options: ["ㅅ", "ㄱ", "ㅁ"],
    hint: "새콤달콤 빨간 사과! 첫 글자는?"
  },
  {
    emoji: "🍌",
    wordDisplay: "? 나 나",
    correct: "ㅂ",
    options: ["ㅂ", "ㄴ", "ㄹ"],
    hint: "달콤하고 길쭉한 노란 바나나!"
  },
  {
    emoji: "🦋",
    wordDisplay: "? 비",
    correct: "ㄴ",
    options: ["ㄴ", "ㄷ", "ㅈ"],
    hint: "꽃밭에서 팔랑팔랑 나비!"
  },
  {
    emoji: "🐿️",
    wordDisplay: "? 람 쥐",
    correct: "ㄷ",
    options: ["ㄷ", "ㅅ", "ㅂ"],
    hint: "도토리 볼에 쏙 넣은 다람쥐!"
  },
  {
    emoji: "🦁",
    wordDisplay: "? 자",
    correct: "ㅅ",
    options: ["ㅅ", "ㅁ", "ㅇ"],
    hint: "어흥~ 멋진 동물의 왕 사자!"
  },
  {
    emoji: "🚗",
    wordDisplay: "? 동 차",
    correct: "ㅈ",
    options: ["ㅈ", "ㅂ", "ㄱ"],
    hint: "부릉부릉 달려라 자동차!"
  },
  {
    emoji: "🍇",
    wordDisplay: "? 도",
    correct: "ㅍ",
    options: ["ㅍ", "ㅎ", "ㄴ"],
    hint: "보라색 알알이 포도 송이!"
  },
  {
    emoji: "🦛",
    wordDisplay: "? 마",
    correct: "ㅎ",
    options: ["ㅎ", "ㅇ", "ㄷ"],
    hint: "입이 쩌억~ 커다란 하마!"
  }
];

let currentQuiz = null;
let roamTimer = null;
let autoSleepTimer = null; // 방치 시 자동 수면 타이머

// --- 4. DOM 캐싱 ---
const dom = {
  petTitle: document.getElementById('pet-title'),
  starCount: document.getElementById('star-count'),

  room: document.getElementById('room'),
  nightOverlay: document.getElementById('night-overlay'),
  skyBody: document.getElementById('sky-body'),
  cozyBed: document.getElementById('cozy-bed'),
  roamStage: document.getElementById('roam-stage'),
  speechBubble: document.getElementById('speech-bubble'),
  bubbleText: document.getElementById('bubble-text'),
  slime: document.getElementById('slime'),
  eyes: document.getElementById('eyes'),
  mouth: document.getElementById('mouth'),
  crown: document.getElementById('crown'),
  sleepZzz: document.getElementById('sleep-zzz'),
  fxLayer: document.getElementById('fx-layer'),
  tapRipple: document.getElementById('tap-ripple'),

  // 모션 전용 소품
  propApple: document.getElementById('prop-apple'),
  propSoap: document.getElementById('prop-soap'),
  propFoam: document.getElementById('prop-foam'),
  propShower: document.getElementById('prop-shower'),
  propBall: document.getElementById('prop-ball'),
  cheekLeft: document.getElementById('cheek-left'),
  cheekRight: document.getElementById('cheek-right'),
  cleanSparkle: document.getElementById('clean-sparkle'),

  // 4대 상태별 시각 소품 (배고픔·꾀재재·심심·졸림)
  dirtySpots: document.getElementById('dirty-spots'),
  hungryRumble: document.getElementById('hungry-rumble'),
  boredSigh: document.getElementById('bored-sigh'),
  sleepySnot: document.getElementById('sleepy-snot'),

  // 하단 게이지 아이템 (클릭 시 상태 미리보기 지원)
  statusHunger: document.getElementById('status-hunger'),
  statusClean: document.getElementById('status-clean'),
  statusEnergy: document.getElementById('status-energy'),
  statusFun: document.getElementById('status-fun'),

  // 아이소메트릭 가구 & 채워짐 컨테이너
  furnFoodbowl: document.getElementById('furn-foodbowl'),
  bowlContents: document.getElementById('bowl-contents'),
  bowlCountBadge: document.getElementById('bowl-count-badge'),

  furnWashstand: document.getElementById('furn-washstand'),
  washContents: document.getElementById('wash-contents'),
  washCountBadge: document.getElementById('wash-count-badge'),

  furnToychest: document.getElementById('furn-toychest'),
  chestContents: document.getElementById('chest-contents'),
  chestCountBadge: document.getElementById('chest-count-badge'),

  barHunger: document.getElementById('bar-hunger'),
  barClean: document.getElementById('bar-clean'),
  barEnergy: document.getElementById('bar-energy'),
  barFun: document.getElementById('bar-fun'),

  // 퀴즈 모달
  quizModal: document.getElementById('quiz-modal'),
  btnCloseQuiz: document.getElementById('btn-close-quiz'),
  quizEmoji: document.getElementById('quiz-emoji'),
  quizWord: document.getElementById('quiz-word'),
  quizHint: document.getElementById('quiz-hint'),
  quizOptions: document.getElementById('quiz-options'),
  quizResult: document.getElementById('quiz-result'),

  // 보상 상자 모달
  rewardBoxModal: document.getElementById('reward-box-modal'),
  btnClaimReward: document.getElementById('btn-claim-reward'),

  // 취침 오버레이
  sleepOverlay: document.getElementById('sleep-overlay'),
  btnWakeUp: document.getElementById('btn-wake-up'),

  toast: document.getElementById('toast'),
};

// --- 5. 슬라임 위치 및 렌더링 갱신 ---
function updateSlimePosition() {
  const stage = dom.roamStage;
  const stageW = stage.clientWidth || 360;
  const stageH = stage.clientHeight || 420;

  // x, y 좌표를 픽셀로 변환
  const px = (gameState.pos.x / 100) * stageW;
  const py = stageH - (gameState.pos.y / 100) * stageH;

  dom.slime.style.left = `${px}px`;
  dom.slime.style.top = `${py}px`;

  // 슬라임 좌우 바라보는 방향 (Flip)
  const flip = gameState.facingRight ? 1 : -1;
  dom.slime.style.transform = `translate(-50%, -100%) scaleX(${flip})`;

  // 말풍선은 글자가 뒤집히면 안 되므로 정상 방향 유지하며 슬라임 머리 위 추적
  dom.speechBubble.style.left = `${px}px`;
  dom.speechBubble.style.top = `${py - 95}px`;
}

function updateUI() {
  // 상단 바
  dom.starCount.textContent = gameState.stars;

  // 유아용 하트 바 게이지 반영
  dom.barHunger.style.width = `${Math.max(0, Math.min(100, gameState.hunger))}%`;
  dom.barClean.style.width = `${Math.max(0, Math.min(100, gameState.clean))}%`;
  dom.barEnergy.style.width = `${Math.max(0, Math.min(100, gameState.energy))}%`;
  dom.barFun.style.width = `${Math.max(0, Math.min(100, gameState.fun))}%`;

  if (gameState.level >= 2) {
    dom.crown.style.display = "block";
    dom.petTitle.textContent = `왕관 ${gameState.name} 👑`;
  } else {
    dom.crown.style.display = "none";
    dom.petTitle.textContent = gameState.name;
  }

  // 방 안의 4대 가구 채워짐 시각화 갱신!
  renderFurnitureContents();

  // 캐릭터의 4대 상태별(배고픔·꾀재재·심심·졸림) 표정 및 몸짓 갱신!
  updateMoodVisuals();

  updateBubbleText();
}

// 4대 욕구 상태에 따라 캐릭터의 표정·몸짓·얼룩·소품 모션을 실시간으로 전환
function updateMoodVisuals() {
  if (!dom.slime) return;

  // 기존 상태 클래스 및 소품 초기화
  dom.slime.classList.remove('state-hungry', 'state-dirty', 'state-bored', 'state-sleepy');
  if (dom.dirtySpots) dom.dirtySpots.style.display = 'none';
  if (dom.hungryRumble) dom.hungryRumble.style.display = 'none';
  if (dom.boredSigh) dom.boredSigh.style.display = 'none';
  if (dom.sleepySnot) dom.sleepySnot.style.display = 'none';

  // 잠든 상태나 3초 케어 모션 진행 중일 때는 상태 모션 적용 안 함
  if (gameState.isSleeping || gameState.isActionPlaying) {
    return;
  }

  dom.eyes.classList.remove('bored-eyes', 'sleepy-eyes');
  dom.mouth.className = 'mouth happy';

  // 청결도가 낮으면 항상 몸에 얼룩 & 먼지(꾀재재한 모습)를 표시
  if (gameState.clean <= 45) {
    dom.slime.classList.add('state-dirty');
    if (dom.dirtySpots) dom.dirtySpots.style.display = 'block';
  }

  // 가장 시급한 욕구 1가지를 메인 몸짓·표정으로 표현
  if (gameState.energy <= 40 || gameState.dailyStudyDone) {
    // 4. 졸린 모습 (꾸벅꾸벅 + 하품 + 콧방울)
    dom.slime.classList.add('state-sleepy');
    dom.eyes.classList.add('sleepy-eyes');
    dom.mouth.className = 'mouth yawn';
    if (dom.sleepySnot) dom.sleepySnot.style.display = 'block';
  } else if (gameState.hunger <= 45) {
    // 1. 배고파하는 모습 (홀쭉 떨림 + 꼬르륵~)
    dom.slime.classList.add('state-hungry');
    dom.mouth.className = 'mouth hungry';
    if (dom.hungryRumble) dom.hungryRumble.style.display = 'block';
  } else if (gameState.clean <= 45) {
    // 2. 꾀재재한 모습 (얼룩 + 파리 + 간질간질 부르르)
    // 위에서 이미 state-dirty와 얼룩 적용됨
  } else if (gameState.fun <= 45) {
    // 3. 심심한 모습 (납작 엎드려 뒹굴 + 한숨 + 반달 눈)
    dom.slime.classList.add('state-bored');
    dom.eyes.classList.add('bored-eyes');
    dom.mouth.className = 'mouth bored';
    if (dom.boredSigh) dom.boredSigh.style.display = 'block';
  }
}

// 방 안의 가구(먹이통, 세면도구, 놀이상자)에 실제 아이템을 생생하게 채워 넣는 렌더러
function renderFurnitureContents() {
  if (!dom.bowlContents) return;

  // 1. 먹이통 (사과 채우기)
  if (gameState.food <= 0) {
    dom.bowlContents.innerHTML = '<span class="empty-hint">텅 빔 🥣</span>';
    dom.bowlCountBadge.textContent = "0개";
    dom.bowlCountBadge.className = "furn-count-badge is-empty";
  } else {
    let applesHtml = "";
    const displayCount = Math.min(gameState.food, 4);
    for (let i = 0; i < displayCount; i++) {
      applesHtml += '<span class="bowl-apple">🍎</span>';
    }
    if (gameState.food > 4) {
      applesHtml += `<span style="font-size:12px; font-weight:800; color:#ef4444;">+${gameState.food - 4}</span>`;
    }
    dom.bowlContents.innerHTML = applesHtml;
    dom.bowlCountBadge.textContent = `${gameState.food}개`;
    dom.bowlCountBadge.className = "furn-count-badge";
  }

  // 2. 세면도구 (비누 및 거품 방울 채우기)
  if (gameState.soaps <= 0) {
    dom.washContents.innerHTML = '<span class="empty-hint">텅 빔 🫧</span>';
    dom.washCountBadge.textContent = "0개";
    dom.washCountBadge.className = "furn-count-badge is-empty";
  } else {
    let soapsHtml = "";
    const displayCount = Math.min(gameState.soaps, 3);
    for (let i = 0; i < displayCount; i++) {
      soapsHtml += '<span class="wash-soap">🧼</span>';
    }
    soapsHtml += '<span class="wash-bubble">🫧</span>';
    if (gameState.soaps > 3) {
      soapsHtml += `<span style="font-size:12px; font-weight:800; color:#06b6d4;">+${gameState.soaps - 3}</span>`;
    }
    dom.washContents.innerHTML = soapsHtml;
    dom.washCountBadge.textContent = `${gameState.soaps}개`;
    dom.washCountBadge.className = "furn-count-badge";
  }

  // 3. 놀이상자 (장난감 채우기)
  if (gameState.toys <= 0) {
    dom.chestContents.innerHTML = '<span class="empty-hint">텅 빔 📦</span>';
    dom.chestCountBadge.textContent = "0개";
    dom.chestCountBadge.className = "furn-count-badge is-empty";
  } else {
    const toyIcons = ["⚽", "🦆", "🚗", "🧸"];
    let toysHtml = "";
    const displayCount = Math.min(gameState.toys, 3);
    for (let i = 0; i < displayCount; i++) {
      toysHtml += `<span class="chest-toy">${toyIcons[i % toyIcons.length]}</span>`;
    }
    if (gameState.toys > 3) {
      toysHtml += `<span style="font-size:12px; font-weight:800; color:#ec4899;">+${gameState.toys - 3}</span>`;
    }
    dom.chestContents.innerHTML = toysHtml;
    dom.chestCountBadge.textContent = `${gameState.toys}개`;
    dom.chestCountBadge.className = "furn-count-badge";
  }
}

function updateBubbleText() {
  if (gameState.isSleeping) {
    dom.bubbleText.textContent = "쿨쿨... Zzz 💤";
    return;
  }
  if (gameState.food === 0 && gameState.hunger <= 50) {
    dom.bubbleText.textContent = "사과 따러 한글 놀이터 가요! 🍎";
  } else if (gameState.soaps === 0 && gameState.clean <= 50) {
    dom.bubbleText.textContent = "한글 공부하고 비누 받아요! 🧼";
  } else if (gameState.toys === 0 && gameState.fun <= 50) {
    dom.bubbleText.textContent = "장난감 받으러 가자! ⚽🎁";
  } else if (gameState.sleepUnlocked) {
    dom.bubbleText.textContent = "공부 완료! 이제 코~ 잘까요? 🌙";
  } else {
    const cutePhrases = [
      "반가워요! 콩콩콩~ 🐾",
      "한글 놀이터 재밌어요! ✏️",
      "오늘도 함께 놀아요! 💕",
      "말랑이는 행복해요! ✨"
    ];
    dom.bubbleText.textContent = cutePhrases[Math.floor(Math.random() * cutePhrases.length)];
  }
}

// --- 6. 방 안 통통 튀며 이동 (Hop To AI) ---
function hopTo(targetX, targetY, onComplete) {
  if (gameState.isMoving) return;
  gameState.isMoving = true;

  const startX = gameState.pos.x;
  const startY = gameState.pos.y;
  const dist = Math.hypot(targetX - startX, targetY - startY);

  // 방향 설정
  gameState.facingRight = targetX >= startX;

  // 거리 비례 점프 횟수 (1~3회)
  const hops = Math.max(1, Math.min(3, Math.round(dist / 22)));
  let hopIndex = 0;

  function doOneHop() {
    if (hopIndex >= hops) {
      gameState.pos.x = targetX;
      gameState.pos.y = targetY;
      updateSlimePosition();
      gameState.isMoving = false;
      if (onComplete) onComplete();
      return;
    }

    hopIndex++;
    sfx.playHop();

    // 점프 Squash & Stretch 애니메이션 클래스 주입
    dom.slime.classList.remove('is-hopping');
    void dom.slime.offsetWidth;
    dom.slime.classList.add('is-hopping');

    // 보간 좌표 계산
    const ratio = hopIndex / hops;
    gameState.pos.x = startX + (targetX - startX) * ratio;
    gameState.pos.y = startY + (targetY - startY) * ratio;
    updateSlimePosition();

    setTimeout(doOneHop, 450);
  }

  doOneHop();
}

// 자율 배회 AI (Wandering Loop)
function startRoamAI() {
  if (roamTimer) clearInterval(roamTimer);

  roamTimer = setInterval(() => {
    // 자는 중이거나 이동 중이거나 3초 케어 모션 중이거나 모달이 떠 있으면 멈춤
    if (gameState.isSleeping || gameState.isMoving || gameState.isActionPlaying ||
        dom.quizModal.style.display === "flex" || 
        dom.rewardBoxModal.style.display === "flex") {
      return;
    }

    // 60% 확률로 방 안의 임의 위치로 통통 이동
    if (Math.random() < 0.6) {
      const nextX = 18 + Math.random() * 64; // 방 중앙 바닥 (18% ~ 82%)
      const nextY = 16 + Math.random() * 18; // 바닥 높이 (16% ~ 34%)
      hopTo(nextX, nextY);
    }
  }, 4800);
}

// 자동 수면 타이머 리셋 (아이가 조작할 때마다 타이머 갱신)
function resetAutoSleepTimer() {
  if (autoSleepTimer) clearTimeout(autoSleepTimer);

  // 오늘 학습을 완료했고 깨어있는 상태라면 25초 후 자동 수면
  if (gameState.dailyStudyDone && !gameState.isSleeping) {
    autoSleepTimer = setTimeout(() => {
      triggerAutoSleep();
    }, 25000);
  }
}

// 자동 수면 진입 (자연스러운 유아 수면 습관 및 스마트폰 과몰입 방지)
function triggerAutoSleep() {
  if (gameState.isSleeping) return;
  dom.bubbleText.textContent = "하아암~ 졸려요... 💤";
  showToast("말랑이가 졸려서 침대로 가요 🌙");

  setTimeout(() => {
    hopTo(25, 20, () => {
      enterSleepMode();
    });
  }, 1000);
}

// 수면 모드 진입 공통 처리
function enterSleepMode() {
  gameState.isSleeping = true;
  sfx.playBoing();
  dom.room.classList.add('is-sleeping');
  dom.skyBody.textContent = "🌙";
  dom.sleepZzz.style.display = "block";
  dom.bubbleText.textContent = "쿨쿨... 꿈속에서 만나요 Zzz";

  // 수면 안심 커튼 오버레이 표시
  setTimeout(() => {
    dom.sleepOverlay.style.display = "flex";
  }, 800);

  updateUI();
}

// 기상 모드 진입
function wakeUpPet() {
  gameState.isSleeping = false;
  sfx.playBoing();
  dom.room.classList.remove('is-sleeping');
  dom.skyBody.textContent = "☀️";
  dom.sleepZzz.style.display = "none";
  dom.sleepOverlay.style.display = "none";

  gameState.energy = 100;
  gameState.hunger = Math.max(15, gameState.hunger - 10);
  gainExp(10);
  spawnParticles("☀️", 4);
  showToast("좋은 아침! 기운이 100% 충전됐어요 ☀️");
  dom.bubbleText.textContent = "잘 잤다! 신나게 놀아요! ☀️";
  sfx.playVoice('wake');
  updateUI();
  resetAutoSleepTimer();
}

// --- 7. 파티클 이펙트 & 3D 게임 아이콘 매핑 ---
const GAME_ICON_MAP = {
  "🍎": "assets/icons/apple.png",
  "⭐": "assets/icons/star.png",
  "🌟": "assets/icons/glowing_star.png",
  "🧼": "assets/icons/soap.png",
  "⚽": "assets/icons/soccer.png",
  "⚡": "assets/icons/lightning.png",
  "💖": "assets/icons/heart.png",
  "💕": "assets/icons/two_hearts.png",
  "🎁": "assets/icons/gift.png",
  "✏️": "assets/icons/pencil.png",
  "⚙️": "assets/icons/gear.png",
  "☀️": "assets/icons/sun.png",
  "🌙": "assets/icons/moon.png",
  "👑": "assets/icons/crown.png",
  "✨": "assets/icons/sparkle.png",
  "🫧": "assets/icons/bubbles.png",
  "💧": "assets/icons/droplet.png",
  "🎉": "assets/icons/party.png",
  "💨": "assets/icons/wind.png",
  "🍌": "assets/icons/banana.png",
  "🦋": "assets/icons/butterfly.png",
  "🐿️": "assets/icons/squirrel.png",
  "🦁": "assets/icons/lion.png",
  "🚗": "assets/icons/car.png",
  "🍇": "assets/icons/grapes.png",
  "🦛": "assets/icons/hippo.png",
  "🔒": "assets/icons/lock.png"
};

function renderGameIconHtml(emoji, extraClass = "icon-inline") {
  const src = GAME_ICON_MAP[emoji];
  if (!src) return emoji;
  return `<img src="${src}" alt="" class="game-icon ${extraClass}">`;
}

function spawnParticles(emoji, count = 5) {
  const stage = dom.roamStage;
  const stageW = stage.clientWidth || 360;
  const stageH = stage.clientHeight || 420;

  const startX = (gameState.pos.x / 100) * stageW;
  const startY = stageH - (gameState.pos.y / 100) * stageH - 50;
  const iconSrc = GAME_ICON_MAP[emoji];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'fx-particle';
    if (iconSrc) {
      p.innerHTML = `<img src="${iconSrc}" alt="" class="game-icon icon-particle">`;
    } else {
      p.textContent = emoji;
    }

    const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.4);
    const dist = 35 + Math.random() * 45;
    const tx = `${Math.cos(angle) * dist}px`;

    p.style.left = `${startX}px`;
    p.style.top = `${startY}px`;
    p.style.setProperty('--tx', tx);

    dom.fxLayer.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

// 토스트 메시지
let toastTimer = null;
function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.style.display = 'block';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.style.display = 'none';
  }, 2200);
}

// 학습 안내 강조 (방 안 가구 유도)
function highlightStudyBtn() {
  // 하단 버튼 제거됨: 필요 시 방 안 가구 터치로 한글 놀이 진입
}

// 경험치 및 레벨업
function gainExp(amount) {
  gameState.exp += amount;
  if (gameState.exp >= gameState.maxExp) {
    gameState.level += 1;
    gameState.exp = 0;
    sfx.playSuccess();
    spawnParticles("👑", 6);
    spawnParticles("⭐", 8);
    showToast("🎉 야호! 레벨 2 왕관 획득!");
    dom.crown.style.display = "block";
  }
  updateUI();
}

// --- 8. 유아용 4대 케어 터치 인터랙션 (학습 기반 보상 루프) ---

// A. 방 바닥 탭 이동
function handleRoomTap(e) {
  if (gameState.isSleeping || 
      dom.quizModal.style.display === "flex" || 
      dom.rewardBoxModal.style.display === "flex") return;

  const rect = dom.roamStage.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  dom.tapRipple.style.left = `${clickX}px`;
  dom.tapRipple.style.top = `${clickY}px`;
  dom.tapRipple.style.display = 'block';
  setTimeout(() => dom.tapRipple.style.display = 'none', 500);

  const pctX = Math.max(18, Math.min(82, (clickX / rect.width) * 100));
  const rawPctY = ((rect.height - clickY) / rect.height) * 100;
  const pctY = Math.max(14, Math.min(36, rawPctY));

  dom.bubbleText.textContent = "거기로 갈게요! 콩콩~ 🐾";
  hopTo(pctX, pctY);
  resetAutoSleepTimer();
}

// B. 슬라임 만지기 (젤리 촉감)
function handleSlimeTouch(e) {
  e.stopPropagation();

  if (gameState.isSleeping) {
    showToast("쉿~ 말랑이가 자고 있어요 💤");
    return;
  }

  sfx.playBoing();
  spawnParticles("💖", 4);

  dom.slime.classList.remove('is-bouncing');
  void dom.slime.offsetWidth;
  dom.slime.classList.add('is-bouncing');

  gameState.fun = Math.min(100, gameState.fun + 5);
  gainExp(2);

  const giggles = [
    { text: "꺄르륵! 간지러워요! 💖", voice: "giggle1" },
    { text: "반가워요! 콩콩콩~ 🐾", voice: "hello" },
    { text: "오늘도 함께 놀아요! 💕", voice: "happy" },
    { text: "더 만져주세요! 헤헤~", voice: "giggle2" }
  ];
  const picked = giggles[Math.floor(Math.random() * giggles.length)];
  dom.bubbleText.textContent = picked.text;
  sfx.playVoice(picked.voice);
  updateUI();
  resetAutoSleepTimer();
}

// 2단계: Lottie 60fps 벡터 애니메이션 재생 헬퍼
const activeLottieInstances = {};
function playLottieFX(containerId, path, durationMs = 2800) {
  if (typeof lottie === 'undefined') return;
  const el = document.getElementById(containerId);
  if (!el) return;

  if (activeLottieInstances[containerId]) {
    try { activeLottieInstances[containerId].destroy(); } catch (e) {}
    delete activeLottieInstances[containerId];
  }
  el.innerHTML = '';

  const anim = lottie.loadAnimation({
    container: el,
    renderer: 'svg',
    loop: durationMs > 2200,
    autoplay: true,
    path: path
  });
  activeLottieInstances[containerId] = anim;

  setTimeout(() => {
    if (activeLottieInstances[containerId] === anim) {
      try { anim.destroy(); } catch (e) {}
      el.innerHTML = '';
      delete activeLottieInstances[containerId];
    }
  }, durationMs);
}

// 부모 설정 플레이 시간에 따른 먹이 간격 및 게이지 감소 속도 계산
function getCareSchedule() {
  const effectiveMin = (typeof parentSettings !== 'undefined' && parentSettings.usageLimitMin > 0)
    ? parentSettings.usageLimitMin
    : 15;
  // 예: 10분 -> 3분(180초), 15분 -> 5분(300초), 20분 -> 6분(360초), 30분 -> 10분(600초)
  const feedIntervalSec = Math.max(120, Math.floor(effectiveMin / 3) * 60);
  const totalTicks5s = Math.max(1, (effectiveMin * 60) / 5);
  return {
    effectiveMin,
    feedIntervalSec,
    cleanDecayPer5s: 65 / totalTicks5s,
    funDecayPer5s: 85 / totalTicks5s
  };
}

// 한 번에 모든 행동을 몰아서 하지 못하도록 제한하는 공통 가드
function canPerformCareAction(type) {
  if (gameState.isSleeping) {
    showToast("자는 중에는 할 수 없어요. 깨워주세요!");
    return false;
  }
  if (gameState.isActionPlaying) return false;

  const usedSec = (typeof parentSettings !== 'undefined') ? parentSettings.usedSeconds : 0;
  const { feedIntervalSec } = getCareSchedule();

  // 방금 다른 돌봄 행동을 했으면 최소 15초 휴식 (연달아 모든 행동 방지)
  if (usedSec - gameState.lastCareActionAtSec < 15) {
    const remain = Math.max(1, 15 - (usedSec - gameState.lastCareActionAtSec));
    sfx.playPop();
    showToast(`방금 돌봐줬어요! ${remain}초 뒤에 천천히 해주세요 😊`);
    return false;
  }

  if (type === 'feed') {
    if (gameState.dailyFeedCount >= gameState.maxDailyFeed) {
      sfx.playWrong();
      showToast("오늘 맘마 3번을 모두 먹었어요! 내일 또 먹어요 🍎");
      dom.bubbleText.textContent = "오늘 맘마 3번 다 먹었어요! 배불러요~ 😊";
      return false;
    }
    if (gameState.food <= 0) {
      sfx.playPop();
      showToast("사과가 없어요! 문제를 풀어서 사과를 따와요 🍎");
      dom.bubbleText.textContent = "문제를 풀면 먹이통에 사과가 쏙! 🍎";
      setTimeout(() => openQuizModal('feed'), 350);
      return false;
    }
    if (usedSec - gameState.lastFeedAtSec < feedIntervalSec && gameState.hunger > 45) {
      const remainMin = Math.max(1, Math.ceil((feedIntervalSec - (usedSec - gameState.lastFeedAtSec)) / 60));
      sfx.playPop();
      showToast(`아직 배불러요! 약 ${remainMin}분 뒤에 배고파질 거예요 🍎`);
      dom.bubbleText.textContent = "지금은 배불러요~ 조금 있다 먹어요! 😋";
      return false;
    }
  } else if (type === 'wash') {
    if (gameState.soaps <= 0) {
      sfx.playPop();
      showToast("비누가 없어요! 문제를 풀어서 비누를 받아와요 🧼");
      dom.bubbleText.textContent = "문제를 풀면 목욕바구니에 비누가 쏙! 🧼";
      setTimeout(() => openQuizModal('wash'), 350);
      return false;
    }
    if (gameState.clean >= 75) {
      sfx.playPop();
      showToast("아직 뽀송뽀송 깨끗해요! 조금 더 놀다 씻어요 🧼");
      dom.bubbleText.textContent = "아직 깨끗해요! 비누는 아껴둘래요 ✨";
      return false;
    }
  } else if (type === 'play') {
    if (gameState.toys <= 0) {
      sfx.playPop();
      showToast("장난감이 없어요! 문제를 풀어서 장난감을 받아와요 ⚽");
      dom.bubbleText.textContent = "문제를 풀면 놀이상자에 장난감이 쏙! ⚽";
      setTimeout(() => openQuizModal('play'), 350);
      return false;
    }
    if (gameState.fun >= 75) {
      sfx.playPop();
      showToast("아직 신나서 기분이 최고예요! 조금 있다 놀아요 ⚽");
      dom.bubbleText.textContent = "지금도 엄청 신나요! 헤헤 💖";
      return false;
    }
  }

  return true;
}

// C. 맘마 주기 (🍎 사과 1개 소모 - 하루 3회, 설정 시간 간격)
function feedPet() {
  if (!canPerformCareAction('feed')) return;

  const usedSec = (typeof parentSettings !== 'undefined') ? parentSettings.usedSeconds : 0;
  gameState.isActionPlaying = true;
  gameState.food -= 1;
  gameState.dailyFeedCount += 1;
  gameState.lastFeedAtSec = usedSec;
  gameState.lastCareActionAtSec = usedSec;
  gameState.hunger = Math.min(100, gameState.hunger + 35);
  gameState.fun = Math.min(100, gameState.fun + 10);
  updateUI();

  // 0.0s: 사과 날아옴 & 기대감
  dom.slime.classList.remove('is-eating-seq', 'is-washing-seq', 'is-playing-seq');
  void dom.slime.offsetWidth;
  dom.slime.classList.add('is-eating-seq');
  dom.propApple.style.display = 'block';
  dom.bubbleText.textContent = "우와! 빨간 사과다~ 😋";
  playLottieFX('lottie-care-fx', 'assets/lottie/hearts_sparkle.json', 3200);
  sfx.playBoing();

  // 0.7s: 1입 아삭! (입 크게 벌리고 볼 빵빵 시작)
  setTimeout(() => {
    dom.mouth.className = "mouth eating-big";
    dom.cheekLeft.style.display = 'block';
    dom.cheekRight.style.display = 'block';
    sfx.playCrunch();
    spawnParticles("✨", 3);
    dom.bubbleText.textContent = "아삭아삭! 오물오물~ 🍎";
  }, 700);

  // 1.3s: 2입 오물오물
  setTimeout(() => {
    sfx.playNom();
    spawnParticles("🍎", 2);
  }, 1300);

  // 1.9s: 3입 마지막 한 입 꿀꺽!
  setTimeout(() => {
    sfx.playCrunch();
    dom.mouth.className = "mouth happy";
    dom.cheekLeft.style.display = 'none';
    dom.cheekRight.style.display = 'none';
  }, 1900);

  // 2.5s: 배부르고 행복한 눈웃음 & 하트 팡팡
  setTimeout(() => {
    dom.propApple.style.display = 'none';
    dom.eyes.classList.add('happy-eyes');
    sfx.playSuccess();
    sfx.playVoice('eat');
    spawnParticles("💕", 6);
    spawnParticles("✨", 4);
    dom.bubbleText.textContent = "아삭아삭! 꿀맛이에요! 💕";
    gainExp(15);
    showToast(`냠냠! 정말 잘 먹었어요! (남은 사과: ${gameState.food}개)`);
  }, 2500);

  // 3.3s: 모션 종료 & 기본 상태 복귀
  setTimeout(() => {
    dom.slime.classList.remove('is-eating-seq');
    dom.eyes.classList.remove('happy-eyes');
    gameState.isActionPlaying = false;
    updateUI();
    resetAutoSleepTimer();
  }, 3300);
}

// D. 목욕하기 (🧼 비누·칫솔 1개 소모 - 3.5초 다단계 거품+헹굼 목욕 모션)
function washPet() {
  if (!canPerformCareAction('wash')) return;

  const usedSec = (typeof parentSettings !== 'undefined') ? parentSettings.usedSeconds : 0;
  gameState.isActionPlaying = true;
  gameState.soaps -= 1;
  gameState.lastCareActionAtSec = usedSec;
  gameState.clean = 100;
  gameState.fun = Math.min(100, gameState.fun + 15);
  updateUI();

  // 0.0s: 비누 등장 & 쓱싹쓱싹 거품 생성
  dom.slime.classList.remove('is-eating-seq', 'is-washing-seq', 'is-playing-seq');
  void dom.slime.offsetWidth;
  dom.slime.classList.add('is-washing-seq');
  dom.propSoap.style.display = 'block';
  dom.propFoam.style.display = 'block';
  dom.bubbleText.textContent = "쓱싹쓱싹! 거품 목욕해요~ 🧼";
  sfx.playBubble();
  playLottieFX('lottie-care-fx', 'assets/lottie/soap_bubbles.json', 3500);

  // 0.9s: 거품이 풍성해지며 간지러워 웃음
  setTimeout(() => {
    sfx.playBubble();
    spawnParticles("🫧", 5);
    dom.eyes.classList.add('happy-eyes');
    dom.bubbleText.textContent = "보글보글 간지러워요! 헤헤 🫧";
  }, 900);

  // 1.7s: 거품 더 팡팡!
  setTimeout(() => {
    sfx.playBubble();
    spawnParticles("🫧", 5);
  }, 1700);

  // 2.2s: 비누 퇴장 & 시원한 샤워기 물줄기로 헹구기!
  setTimeout(() => {
    dom.propSoap.style.display = 'none';
    dom.propShower.style.display = 'block';
    sfx.playSplash();
    spawnParticles("💧", 6);
    dom.bubbleText.textContent = "샤악~ 시원한 물로 헹궈요! 💧";
  }, 2200);

  // 2.9s: 뽀송뽀송 반짝반짝 피니시!
  setTimeout(() => {
    dom.propFoam.style.display = 'none';
    dom.propShower.style.display = 'none';
    dom.cleanSparkle.style.display = 'block';
    sfx.playSuccess();
    sfx.playVoice('wash');
    spawnParticles("✨", 6);
    spawnParticles("🌟", 4);
    dom.bubbleText.textContent = "보글보글! 반짝반짝 빛나요~ ✨";
    gainExp(15);
    showToast("뽀송뽀송! 향기로운 목욕 완료 🧼✨");
  }, 2900);

  // 3.6s: 모션 종료 & 기본 상태 복귀
  setTimeout(() => {
    dom.slime.classList.remove('is-washing-seq');
    dom.eyes.classList.remove('happy-eyes');
    dom.cleanSparkle.style.display = 'none';
    gameState.isActionPlaying = false;
    updateUI();
    resetAutoSleepTimer();
  }, 3600);
}

// E. 놀아주기 (⚽ 장난감 1개 소모 - 3.5초 다단계 공 묘기 & 댄스 모션)
function playWithPet() {
  if (!canPerformCareAction('play')) return;

  const usedSec = (typeof parentSettings !== 'undefined') ? parentSettings.usedSeconds : 0;
  gameState.isActionPlaying = true;
  gameState.toys -= 1;
  gameState.lastCareActionAtSec = usedSec;
  gameState.fun = 100;
  updateUI();

  // 0.0s: 공 등장 & 1차 헤딩!
  dom.slime.classList.remove('is-eating-seq', 'is-washing-seq', 'is-playing-seq');
  void dom.slime.offsetWidth;
  dom.slime.classList.add('is-playing-seq');
  dom.propBall.style.display = 'block';
  dom.bubbleText.textContent = "앗 공이다! 받아라 헤딩~ ⚽";
  playLottieFX('lottie-care-fx', 'assets/lottie/play_stars.json', 3500);

  // 0.55s: 1차 헤딩 튕기기 소리
  setTimeout(() => {
    sfx.playBounceKick();
    spawnParticles("💨", 3);
  }, 550);

  // 1.6s: 공중 360도 덤블링 점프 묘기!
  setTimeout(() => {
    sfx.playHop();
    setTimeout(() => sfx.playBounceKick(), 180);
    spawnParticles("⭐", 5);
    dom.bubbleText.textContent = "우와아! 공중 빙그르르 묘기! 🌟";
  }, 1600);

  // 2.6s: 화려한 폭죽 & 승리 엉덩이 댄스!
  setTimeout(() => {
    dom.eyes.classList.add('happy-eyes');
    sfx.playSuccess();
    sfx.playVoice('play');
    spawnParticles("🎉", 6);
    spawnParticles("⭐", 6);
    dom.bubbleText.textContent = "신난다! 나 공놀이 천재! ⚽🎶";
    gainExp(20);
    showToast("와아! 신나는 공놀이 묘기 대성공! ⚽🎉");
  }, 2600);

  // 3.6s: 모션 종료 & 기본 상태 복귀
  setTimeout(() => {
    dom.slime.classList.remove('is-playing-seq');
    dom.propBall.style.display = 'none';
    dom.eyes.classList.remove('happy-eyes');
    gameState.isActionPlaying = false;
    updateUI();
    resetAutoSleepTimer();
  }, 3600);
}

// F. 잠자기 / 코~ (💤) - 침대 클릭 시 부모 설정 학습시간 종료 또는 취침시간 도달 시 가능
function canSleepNow() {
  if (typeof parentSettings === 'undefined') return { allowed: true };

  // 1) 부모가 정해준 하루 학습(이용) 시간이 다 되었는지 확인
  const limitSec = parentSettings.usageLimitMin > 0 ? parentSettings.usageLimitMin * 60 : 0;
  const isStudyTimeDone = limitSec > 0 && parentSettings.usedSeconds >= limitSec;

  // 2) 부모가 정해준 취침 시간 이후인지 확인 (밤 ~ 새벽 6시 전)
  let isBedtime = false;
  if (parentSettings.bedtimeEnabled && parentSettings.bedtimeTime) {
    const [bh, bm] = parentSettings.bedtimeTime.split(':').map(Number);
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const bedMin = bh * 60 + bm;
    isBedtime = nowMin >= bedMin || nowMin < 360;
  }

  if (isStudyTimeDone || isBedtime) {
    return { allowed: true };
  }

  let reason = "아직 잘 시간이 아니에요! ";
  if (limitSec > 0) {
    const remainMin = Math.max(1, Math.ceil((limitSec - parentSettings.usedSeconds) / 60));
    reason += `놀이 시간이 ${remainMin}분 남았어요`;
  }
  if (parentSettings.bedtimeEnabled && parentSettings.bedtimeTime) {
    reason += (limitSec > 0 ? ` (취침 ${parentSettings.bedtimeTime})` : `취침 시간(${parentSettings.bedtimeTime}) 전이에요`);
  }
  return { allowed: false, reason: `${reason} ☀️` };
}

function toggleSleep() {
  if (gameState.isSleeping) {
    wakeUpPet();
    return;
  }

  const sleepCheck = canSleepNow();
  if (!sleepCheck.allowed) {
    sfx.playWrong();
    showToast(sleepCheck.reason);
    dom.bubbleText.textContent = "아직 졸리지 않아요! 더 놀고 싶어요 ☀️";
    return;
  }

  hopTo(25, 20, () => {
    enterSleepMode();
  });
}

// 장난감 상자 터치 (레거시 안전장치)
function setupToyBox() {
  if (!dom.toyBox) return;
  const toys = dom.toyBox.querySelectorAll('.toy-item');
  toys.forEach(toy => {
    toy.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.playSqueak();
      toy.style.transform = "scale(1.3) rotate(15deg)";
      setTimeout(() => toy.style.transform = "", 250);
      showToast("뾱뾱! 장난감 소리가 나요 🦆");
      resetAutoSleepTimer();
    });
  });
}

// --- 9. 유아용 초단순 한글 놀이터 (먹이통·목욕도구·장난감통 터치 시 자연스럽게 진입) ---
function openQuizModal(preferredType = 'feed') {
  if (gameState.isSleeping) {
    showToast("자는 중에는 문제를 풀 수 없어요!");
    return;
  }

  gameState.quizFocusType = preferredType;
  if (preferredType === 'wash') {
    gameState.quizRewardOrder = ['wash', 'feed', 'play'];
    showToast("목욕도구 선물! 문제를 풀어서 비누를 모아요 🧼");
  } else if (preferredType === 'play') {
    gameState.quizRewardOrder = ['play', 'feed', 'wash'];
    showToast("장난감통 선물! 문제를 풀어서 장난감을 모아요 ⚽");
  } else {
    gameState.quizRewardOrder = ['feed', 'wash', 'play'];
    showToast("먹이통 선물! 문제를 풀어서 사과를 모아요 🍎");
  }

  gameState.studyStep = 0; // 3문항 시작
  loadNextQuizQuestion();
}

function loadNextQuizQuestion() {
  gameState.studyStep += 1;
  currentQuiz = toddlerQuizzes[Math.floor(Math.random() * toddlerQuizzes.length)];

  dom.quizEmoji.innerHTML = renderGameIconHtml(currentQuiz.emoji, 'icon-quiz');
  dom.quizWord.innerHTML = `<span class="blank-slot">?</span> ${currentQuiz.wordDisplay.replace('?', '').trim()}`;
  dom.quizHint.textContent = `[${gameState.studyStep}/3단계] ` + currentQuiz.hint;
  dom.quizResult.style.display = "none";

  dom.quizOptions.innerHTML = "";
  const shuffled = [...currentQuiz.options].sort(() => Math.random() - 0.5);

  shuffled.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = "toddler-opt-btn";
    btn.textContent = opt;
    btn.addEventListener('click', () => handleQuizChoice(opt, btn));
    dom.quizOptions.appendChild(btn);
  });

  dom.quizModal.style.display = "flex";
}

function animateBadge(badgeEl) {
  if (!badgeEl) return;
  badgeEl.classList.remove('just-added');
  void badgeEl.offsetWidth;
  badgeEl.classList.add('just-added');
}

function handleQuizChoice(chosen, btn) {
  const allBtns = dom.quizOptions.querySelectorAll('.toddler-opt-btn');
  allBtns.forEach(b => b.disabled = true);

  if (chosen === currentQuiz.correct) {
    // 정답!
    if (typeof parentSettings !== 'undefined') {
      parentSettings.solvedTodayCount += 1;
    }
    sfx.playSuccess();
    playLottieFX('lottie-celebrate-fx', 'assets/lottie/celebrate_confetti.json', 1800);
    btn.classList.add('correct');
    dom.quizWord.innerHTML = `<span style="color:#10b981; font-weight:800;">${currentQuiz.correct}</span> ${currentQuiz.wordDisplay.replace('?', '').trim()}`;

    // ★ 학습 1문제를 풀 때마다 방 안의 해당 가구에 실시간으로 즉시 채워지는 로직!
    const rewardOrder = gameState.quizRewardOrder || ['feed', 'wash', 'play'];
    const rewardType = rewardOrder[gameState.studyStep - 1] || 'feed';
    let stepRewardText = "";

    if (rewardType === 'feed') {
      gameState.food += 1;
      updateUI();
      animateBadge(dom.bowlCountBadge);
      spawnParticles("🍎", 5);
      stepRewardText = "먹이통에 사과 쏙! 🍎";
      showToast(`🎉 ${gameState.studyStep}단계 정답! 먹이통에 사과가 채워졌어요! 🍎`);
    } else if (rewardType === 'wash') {
      gameState.soaps += 1;
      updateUI();
      animateBadge(dom.washCountBadge);
      spawnParticles("🧼", 5);
      stepRewardText = "목욕바구니에 비누 쏙! 🧼";
      showToast(`🎉 ${gameState.studyStep}단계 정답! 세면도구에 비누가 채워졌어요! 🧼`);
    } else {
      gameState.toys += 1;
      updateUI();
      animateBadge(dom.chestCountBadge);
      spawnParticles("⚽", 5);
      stepRewardText = "장난감통에 장난감 쏙! ⚽";
      showToast(`🎉 ${gameState.studyStep}단계 정답! 놀이상자에 장난감이 채워졌어요! ⚽`);
    }

    if (gameState.studyStep < 3) {
      // 다음 문제로 이동
      dom.quizResult.style.display = "block";
      dom.quizResult.querySelector('.congrats-face').textContent = `🎉 참 잘했어요! (${gameState.studyStep}/3)`;
      dom.quizResult.querySelector('.congrats-gifts').textContent = `${stepRewardText} 다음 문제로 가요!`;

      setTimeout(() => {
        loadNextQuizQuestion();
      }, 1200);
    } else {
      // 3문항 완주! ➔ 오늘의 보물상자 지급 모달 오픈
      dom.quizResult.style.display = "block";
      dom.quizResult.querySelector('.congrats-face').textContent = `👑 3문제 모두 정답!`;
      dom.quizResult.querySelector('.congrats-gifts').textContent = `놀이상자에 장난감 채워짐! 선물 상자 오픈 🎁`;
      spawnParticles("🎁", 6);
      sfx.playFanfare();

      setTimeout(() => {
        dom.quizModal.style.display = "none";
        openRewardBox();
      }, 1300);
    }
  } else {
    // 오답
    sfx.playWrong();
    btn.classList.add('wrong');

    setTimeout(() => {
      btn.classList.remove('wrong');
      allBtns.forEach(b => b.disabled = false);
      showToast("다른 글자를 콕 눌러볼까요?");
    }, 600);
  }
}

// 4대 케어 보물상자 오픈 (완주 축하 보너스)
function openRewardBox() {
  dom.rewardBoxModal.style.display = "flex";
}

function claimDailyReward() {
  dom.rewardBoxModal.style.display = "none";

  // 하루치 완주 보너스 (먹이통에 사과 2개 추가, 별 5개, 취침 잠금 해제!)
  gameState.food += 2;
  gameState.stars += 5;
  gameState.dailyStudyDone = true;
  gameState.sleepUnlocked = true; // 취침 활성화!

  gainExp(30);
  sfx.playSuccess();
  spawnParticles("🍎", 4);
  spawnParticles("⭐", 6);

  showToast("🎁 한글 완주 선물 도착! 먹이통 사과 +2개, 별 +5개!");
  dom.bubbleText.textContent = "와아! 방 안에 먹이와 장난감이 가득해요! 🍎✨";
  updateUI();
  resetAutoSleepTimer();
}

// 방 안 가구(먹이통, 세면도구, 놀이상자, 침대) 직접 탭 상호작용
function setupFurnitureInteractions() {
  // 1. 먹이통 클릭 -> 슬라임이 먹이통으로 콩콩 이동 후 맘마 먹기
  if (dom.furnFoodbowl) {
    dom.furnFoodbowl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (gameState.isSleeping) {
        showToast("쉿~ 말랑이가 자고 있어요 💤");
        return;
      }
      sfx.playBoing();
      dom.bubbleText.textContent = "맘마 먹으러 갈래요! 🍎";
      hopTo(26, 18, () => {
        feedPet();
      });
    });
  }

  // 2. 세면도구 클릭 -> 슬라임이 세면대로 콩콩 이동 후 씻기
  if (dom.furnWashstand) {
    dom.furnWashstand.addEventListener('click', (e) => {
      e.stopPropagation();
      if (gameState.isSleeping) {
        showToast("쉿~ 말랑이가 자고 있어요 💤");
        return;
      }
      sfx.playBoing();
      dom.bubbleText.textContent = "씻으러 갈래요! 🧼";
      hopTo(72, 28, () => {
        washPet();
      });
    });
  }

  // 3. 놀이상자 클릭 -> 슬라임이 놀이상자로 콩콩 이동 후 놀기
  if (dom.furnToychest) {
    dom.furnToychest.addEventListener('click', (e) => {
      e.stopPropagation();
      if (gameState.isSleeping) {
        showToast("쉿~ 말랑이가 자고 있어요 💤");
        return;
      }
      sfx.playBoing();
      dom.bubbleText.textContent = "장난감 가지고 놀자! ⚽";
      hopTo(72, 18, () => {
        playWithPet();
      });
    });
  }

  // 4. 침대 클릭 -> 슬라임이 침대로 콩콩 이동 후 코~
  if (dom.cozyBed) {
    dom.cozyBed.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.playBoing();
      if (gameState.isSleeping) {
        wakeUpPet();
      } else {
        dom.bubbleText.textContent = "침대로 콩콩~ 🛌";
        hopTo(26, 28, () => {
          toggleSleep();
        });
      }
    });
  }
}

// --- 10. 초기화 ---
function init() {
  dom.roamStage.addEventListener('click', handleRoomTap);
  dom.slime.addEventListener('click', handleSlimeTouch);
  dom.speechBubble.addEventListener('click', handleSlimeTouch);

  dom.btnCloseQuiz.addEventListener('click', () => {
    dom.quizModal.style.display = "none";
  });
  dom.quizModal.addEventListener('click', (e) => {
    if (e.target === dom.quizModal) dom.quizModal.style.display = "none";
  });

  // 보상 수령 버튼
  dom.btnClaimReward.addEventListener('click', claimDailyReward);

  // 수면 오버레이 기상 버튼
  dom.btnWakeUp.addEventListener('click', wakeUpPet);

  // 방 안 가구(먹이통, 세면도구, 놀이상자, 침대) 직접 탭 상호작용 등록
  setupFurnitureInteractions();
  setupToyBox();

  // 하단 게이지(🍎, 🧼, ⚡, 💖)를 눌러 4가지 상태 모션을 즉시 미리보기할 수 있게 연결
  if (dom.statusHunger) {
    dom.statusHunger.addEventListener('click', () => {
      if (gameState.isSleeping || gameState.isActionPlaying) return;
      gameState.hunger = 25; gameState.clean = 80; gameState.energy = 80; gameState.fun = 80;
      gameState.dailyStudyDone = false;
      updateUI();
      dom.bubbleText.textContent = "꼬르륵~ 배고파요! 맘마 주세요 🍎";
      sfx.playVoice('hungry');
      showToast("배고파하는 모션! 🍎");
    });
  }
  if (dom.statusClean) {
    dom.statusClean.addEventListener('click', () => {
      if (gameState.isSleeping || gameState.isActionPlaying) return;
      gameState.clean = 25; gameState.hunger = 80; gameState.energy = 80; gameState.fun = 80;
      gameState.dailyStudyDone = false;
      updateUI();
      dom.bubbleText.textContent = "간질간질~ 씻겨주세요 🧼";
      sfx.playVoice('dirty');
      showToast("꾀재재한 모습! 🧼");
    });
  }
  if (dom.statusEnergy) {
    dom.statusEnergy.addEventListener('click', () => {
      if (gameState.isSleeping || gameState.isActionPlaying) return;
      gameState.energy = 25; gameState.hunger = 80; gameState.clean = 80; gameState.fun = 80;
      updateUI();
      dom.bubbleText.textContent = "하아암~ 너무 졸려요... 💤";
      sfx.playVoice('sleepy');
      showToast("졸린 모습! (꾸벅꾸벅 + 콧방울) 💤");
    });
  }
  if (dom.statusFun) {
    dom.statusFun.addEventListener('click', () => {
      if (gameState.isSleeping || gameState.isActionPlaying) return;
      gameState.fun = 25; gameState.hunger = 80; gameState.clean = 80; gameState.energy = 80;
      gameState.dailyStudyDone = false;
      updateUI();
      dom.bubbleText.textContent = "심심해요~ 놀아줘요! ⚽";
      sfx.playVoice('bored');
      showToast("심심한 모습! ⚽");
    });
  }

  // 말풍선 클릭 시 현재 상태에 맞는 말랑이 목소리 재생
  if (dom.speechBubble) {
    dom.speechBubble.style.cursor = 'pointer';
    dom.speechBubble.addEventListener('click', (e) => {
      e.stopPropagation();
      if (gameState.isSleeping) return;
      if (gameState.hunger <= 50) sfx.playVoice('hungry');
      else if (gameState.clean <= 50) sfx.playVoice('dirty');
      else if (gameState.fun <= 50) sfx.playVoice('bored');
      else if (gameState.energy <= 50) sfx.playVoice('sleepy');
      else sfx.playVoice('happy');
    });
  }

  updateSlimePosition();
  updateUI();
  startRoamAI();

  // 부모 설정 시간에 맞춘 욕구 게이지 감소 & 배고픔 간격 알림 (5초 주기)
  setInterval(() => {
    if (gameState.isSleeping || gameState.isActionPlaying) return;

    const { feedIntervalSec, cleanDecayPer5s, funDecayPer5s } = getCareSchedule();
    gameState.clean = Math.max(0, gameState.clean - cleanDecayPer5s);
    gameState.fun = Math.max(0, gameState.fun - funDecayPer5s);

    // 설정된 시간 간격(예: 10분->3분, 15분->5분)마다 배고픔 알림
    if (typeof parentSettings !== 'undefined' && gameState.dailyFeedCount < gameState.maxDailyFeed) {
      const slot = Math.floor(parentSettings.usedSeconds / feedIntervalSec);
      if (slot > 0 && slot > gameState.lastHungerPingSlot) {
        gameState.lastHungerPingSlot = slot;
        gameState.hunger = Math.min(gameState.hunger, 32);
        sfx.playPop();
        sfx.playVoice('hungry');
        dom.bubbleText.textContent = "꼬르륵~ 배고파요! 먹이통의 사과를 눌러주세요 🍎";
        showToast("말랑이가 배고파해요! 먹이통에서 사과를 눌러주세요 🍎");
      }
    }

    updateUI();
  }, 5000);

  // 부모님 공간 초기화
  initParentSpace();
}

// ==========================================================================
// 11. 부모님 공간 (비밀번호 잠금 + 슬라이드 설정창 + 약관 목업 모달)
// ==========================================================================
const parentSettings = {
  pin: "0000",
  inputPin: "",
  soundEnabled: true,
  usageLimitMin: 15,
  usedSeconds: 0,
  bedtimeEnabled: true,
  bedtimeTime: "21:00",
  selectedPlan: "monthly",
  isSubscribed: false,
  solvedTodayCount: 0,
};

function initParentSpace() {
  const btnParentGate = document.getElementById('btn-parent-gate');
  const pinModal = document.getElementById('parent-pin-modal');
  const pinCard = document.getElementById('pin-card');
  const btnClosePin = document.getElementById('btn-close-pin');
  const pinDots = document.querySelectorAll('#pin-dots .pin-dot');
  const pinErrorMsg = document.getElementById('pin-error-msg');
  const pinKeypad = document.getElementById('pin-keypad');

  const drawer = document.getElementById('parent-settings-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');

  // 구독 관련
  const planStatusBadge = document.getElementById('plan-status-badge');
  const btnPlanMonthly = document.getElementById('btn-plan-monthly');
  const btnPlanYearly = document.getElementById('btn-plan-yearly');
  const btnSubscribeMock = document.getElementById('btn-subscribe-mock');

  // 진도 관련
  const progStageText = document.getElementById('prog-stage-text');
  const progTodayCount = document.getElementById('prog-today-count');
  const progTotalStars = document.getElementById('prog-total-stars');
  const progPercentText = document.getElementById('prog-percent-text');
  const progBarFill = document.getElementById('prog-bar-fill');

  // 사용시간 & 취침시간
  const selectUsageLimit = document.getElementById('select-usage-limit');
  const usageTodayDesc = document.getElementById('usage-today-desc');
  const toggleBedtime = document.getElementById('toggle-bedtime');
  const bedtimeTimeRow = document.getElementById('bedtime-time-row');
  const selectBedtime = document.getElementById('select-bedtime');

  // 사용자 설정
  const inputPetName = document.getElementById('input-pet-name');
  const btnSaveName = document.getElementById('btn-save-name');
  const toggleSound = document.getElementById('toggle-sound');
  const inputNewPin = document.getElementById('input-new-pin');
  const btnSavePin = document.getElementById('btn-save-pin');
  const currentPinDesc = document.getElementById('current-pin-desc');

  // 약관 목업 모달
  const policyModal = document.getElementById('policy-mockup-modal');
  const policyTitle = document.getElementById('policy-modal-title');
  const policyBody = document.getElementById('policy-modal-body');
  const btnClosePolicy = document.getElementById('btn-close-policy');
  const btnOkPolicy = document.getElementById('btn-ok-policy');
  const footerLinkBtns = document.querySelectorAll('.footer-link-btn');

  if (!btnParentGate || !pinModal || !drawer) return;

  // 1. 상단 말랑이 배지 클릭 -> 비밀번호 모달 열기
  btnParentGate.addEventListener('click', () => {
    parentSettings.inputPin = "";
    pinErrorMsg.style.display = "none";
    updatePinDots();
    pinModal.style.display = "flex";
  });

  btnClosePin.addEventListener('click', () => {
    pinModal.style.display = "none";
  });
  pinModal.addEventListener('click', (e) => {
    if (e.target === pinModal) pinModal.style.display = "none";
  });

  function updatePinDots() {
    pinDots.forEach((dot, idx) => {
      if (idx < parentSettings.inputPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  // 2. 숫자 키패드 입력 & 검증
  pinKeypad.addEventListener('click', (e) => {
    const key = e.target.closest('.pin-key');
    if (!key) return;

    const num = key.dataset.num;
    const action = key.dataset.action;

    if (action === "clear") {
      parentSettings.inputPin = "";
      pinErrorMsg.style.display = "none";
      updatePinDots();
      return;
    }

    if (action === "back") {
      parentSettings.inputPin = parentSettings.inputPin.slice(0, -1);
      pinErrorMsg.style.display = "none";
      updatePinDots();
      return;
    }

    if (num !== undefined && parentSettings.inputPin.length < 4) {
      parentSettings.inputPin += num;
      updatePinDots();

      if (parentSettings.inputPin.length === 4) {
        if (parentSettings.inputPin === parentSettings.pin) {
          // 인증 성공! 슬라이드 설정창 열기
          sfx.playSuccess();
          setTimeout(() => {
            pinModal.style.display = "none";
            openParentDrawer();
          }, 180);
        } else {
          // 비밀번호 불일치
          sfx.playWrong();
          pinErrorMsg.style.display = "block";
          pinCard.classList.remove('shake-error');
          void pinCard.offsetWidth;
          pinCard.classList.add('shake-error');
          setTimeout(() => {
            parentSettings.inputPin = "";
            updatePinDots();
          }, 420);
        }
      }
    }
  });

  // 3. 슬라이드 설정창 열기/닫기
  function openParentDrawer() {
    refreshParentDashboard();
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeParentDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  btnCloseDrawer.addEventListener('click', closeParentDrawer);

  // 4. 학습 진도 & 대시보드 동기화
  function refreshParentDashboard() {
    const usedMin = Math.floor(parentSettings.usedSeconds / 60);
    usageTodayDesc.textContent = `오늘 사용: ${usedMin}분`;

    const stageLabels = [
      "1단계: 자음 14자",
      "2단계: 모음·자모결합",
      "3단계: 7대 대표 받침",
      "4단계: 쌍자음·낱말 완성"
    ];
    const stageIdx = Math.min(gameState.level - 1, stageLabels.length - 1);
    progStageText.textContent = stageLabels[stageIdx];
    progTodayCount.textContent = `${parentSettings.solvedTodayCount}문제`;
    progTotalStars.textContent = `${gameState.stars} ⭐`;

    // 진도율 계산 (기본 10% + 레벨/별/오늘 푼 문제 비례)
    const pct = Math.min(100, 10 + (gameState.level - 1) * 25 + parentSettings.solvedTodayCount * 3);
    progPercentText.textContent = `${pct}%`;
    progBarFill.style.width = `${pct}%`;

    inputPetName.value = gameState.name;
    currentPinDesc.textContent = `현재: ${parentSettings.pin}`;
  }

  // 사용 시간 카운터 (1초마다 체크)
  setInterval(() => {
    if (!gameState.isSleeping) {
      parentSettings.usedSeconds += 1;
    }
  }, 1000);

  // 5. 구독 플랜 선택 및 결제 목업
  [btnPlanMonthly, btnPlanYearly].forEach(btn => {
    btn.addEventListener('click', () => {
      btnPlanMonthly.classList.remove('active');
      btnPlanYearly.classList.remove('active');
      btn.classList.add('active');
      parentSettings.selectedPlan = btn.dataset.plan;
    });
  });

  btnSubscribeMock.addEventListener('click', () => {
    const planLabel = parentSettings.selectedPlan === "monthly" ? "월간 구독 (₩6,900)" : "연간 구독 (₩58,000)";
    parentSettings.isSubscribed = true;
    planStatusBadge.textContent = "프리미엄 이용 중 ✨";
    planStatusBadge.classList.add('is-pro');
    btnSubscribeMock.textContent = "구독 관리 중 (프리미엄 활성)";
    sfx.playFanfare();
    openPolicyMockup("subscribe", `선택하신 [${planLabel}] 결제 창 목업입니다.\n\n실제 앱 출시 시 구글 플레이 / 애플 앱스토어 인앱 결제가 이 위치에 연동됩니다. 현재는 체험용으로 프리미엄 상태가 즉시 활성화되었습니다!`);
  });

  // 6. 사용시간 및 취침시간 설정
  selectUsageLimit.addEventListener('change', (e) => {
    parentSettings.usageLimitMin = Number(e.target.value);
    const { feedIntervalSec } = getCareSchedule();
    const intervalMin = Math.round(feedIntervalSec / 60);
    const msg = parentSettings.usageLimitMin === 0
      ? `사용시간 제한을 해제했어요. (기본 ${intervalMin}분 간격 알림)`
      : `최대 ${parentSettings.usageLimitMin}분으로 설정했어요. (${intervalMin}분마다 배고픔 알림)`;
    showToast(msg);
  });

  toggleBedtime.addEventListener('change', (e) => {
    parentSettings.bedtimeEnabled = e.target.checked;
    bedtimeTimeRow.style.opacity = parentSettings.bedtimeEnabled ? "1" : "0.4";
    showToast(parentSettings.bedtimeEnabled ? "자동 취침 모드를 켰어요 🌙" : "자동 취침 모드를 껐어요");
  });

  selectBedtime.addEventListener('change', (e) => {
    parentSettings.bedtimeTime = e.target.value;
    showToast(`취침 예약 시각을 ${e.target.value}으로 저장했어요 🌙`);
  });

  // 7. 사용자 설정 (이름, 소리, 비밀번호 변경)
  btnSaveName.addEventListener('click', () => {
    const newName = inputPetName.value.trim();
    if (!newName) {
      showToast("이름을 입력해 주세요!");
      return;
    }
    gameState.name = newName;
    updateUI();
    sfx.playSuccess();
    showToast(`캐릭터 이름이 '${newName}'(으)로 변경되었어요!`);
  });

  toggleSound.addEventListener('change', (e) => {
    parentSettings.soundEnabled = e.target.checked;
    sfx.enabled = parentSettings.soundEnabled;
    sfx.isMuted = !parentSettings.soundEnabled;
    if (parentSettings.soundEnabled) {
      sfx.startAmbientBGM();
    } else {
      sfx.stopAmbientBGM();
    }
    showToast(parentSettings.soundEnabled ? "효과음과 배경음악이 켜졌어요 🔊" : "소리가 꺼졌어요 🔇");
  });

  btnSavePin.addEventListener('click', () => {
    const nextPin = inputNewPin.value.trim();
    if (!/^\d{4}$/.test(nextPin)) {
      showToast("비밀번호는 숫자 4자리로 입력해 주세요!");
      return;
    }
    parentSettings.pin = nextPin;
    inputNewPin.value = "";
    currentPinDesc.textContent = `현재: ${nextPin}`;
    sfx.playSuccess();
    showToast("부모님 비밀번호가 변경되었어요! 🔒");
  });

  // 8. 이용약관 / 개인정보처리방침 / 이용방법 안내 목업 모달
  const policyContents = {
    terms: {
      title: "이용약관 (미리보기 목업)",
      body: "제1조 (목적)\n본 약관은 YJ 스튜디오가 제공하는 유아 한글 학습 앱 '한글 다마고치' 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.\n\n제2조 (서비스 내용)\n3~6세 유아를 대상으로 한글 자모 학습 및 가상 반려 캐릭터 육성 기능을 제공합니다.\n\n※ 실제 정식 서비스 출시 시 법무 검토를 거친 정식 이용약관 링크가 연결됩니다."
    },
    privacy: {
      title: "개인정보처리방침 (미리보기 목업)",
      body: "1. 수집하는 개인정보 항목\n본 앱은 14세 미만 아동의 개인정보를 보호하기 위해 불필요한 신상 정보를 수집하지 않으며, 학습 진도 및 설정 정보는 기기 내부에 안전하게 보관됩니다.\n\n2. 아동의 개인정보 보호\n결제 및 설정 변경은 반드시 부모님 비밀번호 확인을 거친 후에만 가능합니다.\n\n※ 실제 정식 서비스 출시 시 정식 개인정보처리방침 페이지가 연결됩니다."
    },
    guide: {
      title: "이용방법 안내 (미리보기 목업)",
      body: "1. [한글 놀이터 가기!] 버튼을 눌러 아이와 함께 하루 3문제 한글 퀴즈를 풀어보세요.\n2. 문제를 맞힐 때마다 방 안의 먹이통(🍎), 세면도구(🧼), 놀이상자(⚽)가 실제로 채워집니다.\n3. 채워진 먹이와 도구로 말랑이를 직접 돌봐주며 애착을 형성하고, 학습 완료 후에는 잠자기 모드로 자연스럽게 스마트폰 사용을 마무리해 보세요!"
    }
  };

  function openPolicyMockup(type, customText) {
    if (type === "subscribe") {
      policyTitle.textContent = "구독 결제 안내 (미리보기 목업)";
      policyBody.innerText = customText;
    } else {
      const info = policyContents[type] || policyContents.guide;
      policyTitle.textContent = info.title;
      policyBody.innerText = info.body;
    }
    policyModal.style.display = "flex";
  }

  footerLinkBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      openPolicyMockup(btn.dataset.policy);
    });
  });

  [btnClosePolicy, btnOkPolicy].forEach(btn => {
    btn.addEventListener('click', () => {
      policyModal.style.display = "none";
    });
  });

  policyModal.addEventListener('click', (e) => {
    if (e.target === policyModal) policyModal.style.display = "none";
  });
}

document.addEventListener('DOMContentLoaded', init);
