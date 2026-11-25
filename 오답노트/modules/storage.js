import { showAlert } from './dialog.js';
import { t, detectDeviceLang } from './i18n.js';

const STORAGE_KEY = 'yj_wrong_note_v1';
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

export function isSafeImageDataUrl(src) {
  return (
    typeof src === 'string' &&
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(src)
  );
}

/**
 * 언어별 앱 사용법 퀴즈 예시 문제(미분류)를 생성한다.
 */
function buildSampleProblems(lang = 'ko') {
  const now = Date.now();
  const contentByLang = {
    ko: [
      {
        id: 'sample-1',
        problemText: '오답정복은 과목을 내 맘대로 추가하고 수정할 수 있다.\n( O  /  X )',
        answerText: "정답: O\n위쪽 과목 줄의 '과목 관리'에서 최대 13과목까지 자유롭게 추가하고 이름을 바꿀 수 있어요!"
      },
      {
        id: 'sample-2',
        problemText: '복습할 때 문제를 맞혔으면 화면을 어느 쪽으로 밀면 정답 처리될까요?\n( 왼쪽  /  오른쪽 )',
        answerText: "정답: 오른쪽\n오른쪽으로 밀면 '맞힘(정복 진행)', 왼쪽으로 밀면 '다시 틀림'으로 기록돼요!"
      },
      {
        id: 'sample-3',
        problemText: "시험지에 낙서나 답이 적혀 있어도, 사진을 찍은 뒤 '쓱-지우개'로 지워서 깔끔한 오답노트로 만들 수 있다.\n( O  /  X )",
        answerText: "정답: O\n문제를 등록할 때 사진을 올리고 '쓱-지우개'로 필기나 정답 표시를 문지르면 감쪽같이 지워져요!"
      }
    ],
    en: [
      {
        id: 'sample-1',
        problemText: 'You can add and edit subjects freely in WrongNote.\n( O  /  X )',
        answerText: 'Answer: O\nTap "Manage Subjects" in the top bar to add or rename up to 13 subjects!'
      },
      {
        id: 'sample-2',
        problemText: 'When reviewing, which way should you swipe if you got the problem right?\n( Left  /  Right )',
        answerText: 'Answer: Right\nSwipe right for "Got it" (closer to mastery), or swipe left for "Missed again"!'
      },
      {
        id: 'sample-3',
        problemText: 'Even if your test paper has scribbles or answers written on it, you can take a photo and erase them with the Magic Eraser.\n( O  /  X )',
        answerText: 'Answer: O\nUpload a photo when adding a question and rub over pen marks or answers with the Magic Eraser to make a clean note!'
      }
    ],
    ja: [
      {
        id: 'sample-1',
        problemText: '誤答ノートでは、科目を自由に追加・編集できる。\n( O  /  X )',
        answerText: '正解: O\n上部の「科目管理」から最大13科目まで自由に追加したり名前を変更したりできます！'
      },
      {
        id: 'sample-2',
        problemText: '復習するとき、問題に正解したら画面をどちらにスワイプすれば正解になりますか？\n( 左  /  右 )',
        answerText: '正解: 右\n右にスワイプすると「正解（攻略へ前進）」、左にスワイプすると「もう一度間違い」として記録されます！'
      },
      {
        id: 'sample-3',
        problemText: 'テスト用紙に落書きや答えが書いてあっても、写真を撮って「サッと消しゴム」で消せばきれいな誤答ノートが作れる。\n( O  /  X )',
        answerText: '正解: O\n問題登録時に写真をアップし、「サッと消しゴム」で書き込みをなぞるだけできれいに消せます！'
      }
    ]
  };

  const items = contentByLang[lang] || contentByLang.ko;
  return items.map((item, idx) => ({
    id: item.id,
    subject: '미분류',
    problemText: item.problemText,
    problemImg: '',
    answerText: item.answerText,
    answerImg: '',
    wrongCount: idx === 0 ? 2 : 1,
    correctStreak: 0,
    mastered: false,
    createdAt: now - (items.length - idx) * 1800000
  }));
}

function createLocalizedDefaultData() {
  const lang = detectDeviceLang();
  const subjectsByLang = {
    ko: ['국어', '영어', '수학'],
    en: ['Reading', 'English', 'Math'],
    ja: ['国語', '英語', '数学']
  };
  return {
    subjects: subjectsByLang[lang] || subjectsByLang.ko,
    lastSubject: '전체',
    settings: {
      masteryTarget: 2, // 연속 몇 번 맞히면 완전 정복인지 (1~19)
      wrongFilterMode: 'unmastered', // 'unmastered' (정복 전 모두) | 'repeated' (일정 횟수 이상 틀린 문제만)
      wrongMinCount: 2, // 몇 번 이상 틀린 문제를 약점으로 볼지 (1~19)
      themeMode: 'light', // 'light' | 'dark'
      themeColor: 'indigo' // 'indigo' | 'blue' | 'emerald' | 'amber' | 'gold'
    },
    masteredProblems: [],
    problems: buildSampleProblems(lang)
  };
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
    // 기존 수학·영어 예시가 남아있는 기기에서도 사용법 퀴즈(3문항)로 1회 자동 교체
    const SAMPLE_QUIZ_KEY = 'yj_sample_quiz_seed_20261125';
    if (!localStorage.getItem(SAMPLE_QUIZ_KEY) && Array.isArray(parsed.problems)) {
      const hasLegacySample = parsed.problems.some((p) => p.id === 'sample-1' || p.id === 'sample-2');
      if (hasLegacySample) {
        const localizedSamples = buildSampleProblems(detectDeviceLang());
        const sampleMap = new Map(localizedSamples.map((s) => [s.id, s]));
        let hasSample3 = false;
        parsed.problems = parsed.problems.map((p) => {
          if (p.id === 'sample-3') hasSample3 = true;
          return sampleMap.has(p.id) ? sampleMap.get(p.id) : p;
        });
        if (!hasSample3) {
          const sample3 = sampleMap.get('sample-3');
          if (sample3) parsed.problems.push(sample3);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      localStorage.setItem(SAMPLE_QUIZ_KEY, '1');
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
