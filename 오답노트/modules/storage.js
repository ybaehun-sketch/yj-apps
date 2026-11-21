import { showAlert } from './dialog.js';
import { t, detectDeviceLang } from './i18n.js';
import { SAMPLE_MATH_IMG, SAMPLE_ENG_IMG } from './sampleImages.js?v=20261121a';

const STORAGE_KEY = 'yj_wrong_note_v1';
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

export function isSafeImageDataUrl(src) {
  return (
    typeof src === 'string' &&
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(src)
  );
}

const DEFAULT_DATA = {
  subjects: ['국어', '영어', '수학'],
  lastSubject: '수학',
  settings: {
    masteryTarget: 2, // 연속 몇 번 맞히면 완전 정복인지 (1~19)
    wrongFilterMode: 'unmastered', // 'unmastered' (정복 전 모두) | 'repeated' (일정 횟수 이상 틀린 문제만)
    wrongMinCount: 2, // 몇 번 이상 틀린 문제를 약점으로 볼지 (1~19)
    themeMode: 'light', // 'light' | 'dark'
    themeColor: 'indigo' // 'indigo' | 'blue' | 'emerald' | 'amber' | 'gold'
  },
  masteredProblems: [],
  problems: [
    {
      id: 'sample-1',
      subject: '수학',
      problemText: '이차방정식 x² - 5x + 6 = 0 의 두 근의 합과 곱을 구하시오.',
      problemImg: SAMPLE_MATH_IMG,
      answerText: '두 근: 2, 3 → 합 = 5, 곱 = 6 (근과 계수의 관계: -b/a, c/a)',
      answerImg: '',
      wrongCount: 2,
      correctStreak: 0,
      mastered: false,
      createdAt: Date.now() - 3600000
    },
    {
      id: 'sample-2',
      subject: '영어',
      problemText: '다음 빈칸에 알맞은 것은?\n"She has been living in Seoul ___ 2020."\n① for  ② since  ③ during  ④ while',
      problemImg: SAMPLE_ENG_IMG,
      answerText: '정답: ② since (특정 시점인 2020년 이후로 계속 ~해왔다)',
      answerImg: '',
      wrongCount: 1,
      correctStreak: 0,
      mastered: false,
      createdAt: Date.now() - 1800000
    }
  ]
};

function createLocalizedDefaultData() {
  const lang = detectDeviceLang();
  if (lang === 'en') {
    return {
      subjects: ['Reading', 'English', 'Math'],
      lastSubject: 'Math',
      settings: {
        masteryTarget: 2,
        wrongFilterMode: 'unmastered',
        wrongMinCount: 2,
        themeMode: 'light',
        themeColor: 'indigo'
      },
      masteredProblems: [],
      problems: [
        {
          id: 'sample-1',
          subject: 'Math',
          problemText: 'Find the sum and product of the two roots of x² - 5x + 6 = 0.',
          problemImg: SAMPLE_MATH_IMG,
          answerText: 'Roots: 2, 3 → Sum = 5, Product = 6 (Vieta’s formulas: -b/a, c/a)',
          answerImg: '',
          wrongCount: 2,
          correctStreak: 0,
          mastered: false,
          createdAt: Date.now() - 3600000
        },
        {
          id: 'sample-2',
          subject: 'English',
          problemText: 'Choose the best word for the blank:\n"She has been living in New York ___ 2020."\n① for  ② since  ③ during  ④ while',
          problemImg: SAMPLE_ENG_IMG,
          answerText: 'Answer: ② since (used with a specific starting point in time)',
          answerImg: '',
          wrongCount: 1,
          correctStreak: 0,
          mastered: false,
          createdAt: Date.now() - 1800000
        }
      ]
    };
  }
  if (lang === 'ja') {
    return {
      subjects: ['国語', '英語', '数学'],
      lastSubject: '数学',
      settings: {
        masteryTarget: 2,
        wrongFilterMode: 'unmastered',
        wrongMinCount: 2,
        themeMode: 'light',
        themeColor: 'indigo'
      },
      masteredProblems: [],
      problems: [
        {
          id: 'sample-1',
          subject: '数学',
          problemText: '二次方程式 x² - 5x + 6 = 0 の2つの解の和と積を求めなさい。',
          problemImg: SAMPLE_MATH_IMG,
          answerText: '解: 2, 3 → 和 = 5, 積 = 6（解と係数の関係: -b/a, c/a）',
          answerImg: '',
          wrongCount: 2,
          correctStreak: 0,
          mastered: false,
          createdAt: Date.now() - 3600000
        },
        {
          id: 'sample-2',
          subject: '英語',
          problemText: '空欄に入る最も適切なものを選びなさい。\n"She has been living in Tokyo ___ 2020."\n① for  ② since  ③ during  ④ while',
          problemImg: SAMPLE_ENG_IMG,
          answerText: '正解: ② since（特定の起点「2020年からずっと」を表す）',
          answerImg: '',
          wrongCount: 1,
          correctStreak: 0,
          mastered: false,
          createdAt: Date.now() - 1800000
        }
      ]
    };
  }
  return structuredClone(DEFAULT_DATA);
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createLocalizedDefaultData();
      saveState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    // 체험용 사진 예시 문제 1회 자동 채우기 (기존 예시 문제에 사진이 비어 있을 때만)
    const SAMPLE_IMG_KEY = 'yj_sample_img_seed_20261121';
    if (!localStorage.getItem(SAMPLE_IMG_KEY) && Array.isArray(parsed.problems)) {
      let updated = false;
      parsed.problems.forEach((p) => {
        if (p.id === 'sample-1' && !p.problemImg) {
          p.problemImg = SAMPLE_MATH_IMG;
          updated = true;
        }
        if (p.id === 'sample-2' && !p.problemImg) {
          p.problemImg = SAMPLE_ENG_IMG;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      localStorage.setItem(SAMPLE_IMG_KEY, '1');
    }
    return {
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : ['국어', '영어', '수학'],
      lastSubject: parsed.lastSubject || '전체',
      settings: {
        masteryTarget: Math.min(19, Math.max(1, Number(parsed.settings?.masteryTarget) || 2)),
        wrongFilterMode: parsed.settings?.wrongFilterMode === 'repeated' ? 'repeated' : 'unmastered',
        wrongMinCount: Math.min(19, Math.max(1, Number(parsed.settings?.wrongMinCount) || 2)),
        themeMode: parsed.settings?.themeMode === 'dark' ? 'dark' : 'light',
        themeColor: ['indigo', 'blue', 'emerald', 'amber', 'gold'].includes(parsed.settings?.themeColor)
          ? parsed.settings.themeColor
          : 'indigo'
      },
      masteredProblems: Array.isArray(parsed.masteredProblems) ? parsed.masteredProblems : [],
      problems: Array.isArray(parsed.problems) ? parsed.problems : []
    };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    showAlert(t('storage.fullMsg'), { title: t('storage.fullTitle') });
    return false;
  }
}

/**
 * 업로드한 사진을 모바일/저장공간에 맞게 가볍게 줄여줍니다 (최대 가로 960px).
 */
export function compressImageFile(file, maxWidth = 960, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      reject(new Error('INVALID_TYPE'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('FILE_TOO_LARGE'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('INVALID_TYPE'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('INVALID_TYPE'));
    reader.readAsDataURL(file);
  });
}
