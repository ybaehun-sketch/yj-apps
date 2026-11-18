import { showAlert } from './dialog.js';

const STORAGE_KEY = 'yj_wrong_note_v1';

const DEFAULT_DATA = {
  subjects: ['국어', '영어', '수학'],
  lastSubject: '수학',
  settings: {
    masteryTarget: 2, // 연속 몇 번 맞히면 완전 정복인지 (1~19)
    wrongFilterMode: 'unmastered', // 'unmastered' (정복 전 모두) | 'repeated' (일정 횟수 이상 틀린 문제만)
    wrongMinCount: 2 // 몇 번 이상 틀린 문제를 약점으로 볼지 (1~19)
  },
  problems: [
    {
      id: 'sample-1',
      subject: '수학',
      problemText: '이차방정식 x² - 5x + 6 = 0 의 두 근의 합과 곱을 구하시오.',
      problemImg: '',
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
      problemImg: '',
      answerText: '정답: ② since (특정 시점인 2020년 이후로 계속 ~해왔다)',
      answerImg: '',
      wrongCount: 1,
      correctStreak: 0,
      mastered: false,
      createdAt: Date.now() - 1800000
    }
  ]
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveState(DEFAULT_DATA);
      return structuredClone(DEFAULT_DATA);
    }
    const parsed = JSON.parse(raw);
    // 미리보기용 예시 문제 1회 복원 (목록이 비어 있을 때만, 한 번만 실행)
    const RESEED_KEY = 'yj_demo_reseed_20261118';
    if (
      !localStorage.getItem(RESEED_KEY) &&
      Array.isArray(parsed.problems) &&
      parsed.problems.length === 0
    ) {
      parsed.problems = structuredClone(DEFAULT_DATA.problems);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    localStorage.setItem(RESEED_KEY, '1');
    return {
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : ['국어', '영어', '수학'],
      lastSubject: parsed.lastSubject || '전체',
      settings: {
        masteryTarget: Math.min(19, Math.max(1, Number(parsed.settings?.masteryTarget) || 2)),
        wrongFilterMode: parsed.settings?.wrongFilterMode === 'repeated' ? 'repeated' : 'unmastered',
        wrongMinCount: Math.min(19, Math.max(1, Number(parsed.settings?.wrongMinCount) || 2))
      },
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
    showAlert('저장 공간이 부족합니다. 오래된 오답 카드를 몇 개 정리해 주세요.', { title: '저장 안내' });
    return false;
  }
}

/**
 * 업로드한 사진을 모바일/저장공간에 맞게 가볍게 줄여줍니다 (최대 가로 960px).
 */
export function compressImageFile(file, maxWidth = 960, quality = 0.82) {
  return new Promise((resolve, reject) => {
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
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
