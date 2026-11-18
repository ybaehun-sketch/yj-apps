import { loadState, saveState, compressImageFile } from './modules/storage.js?v=20261119a';
import { renderSubjectBar } from './modules/subjectBar.js?v=20261118a';
import { createMagicEraser } from './modules/magicEraser.js?v=20261118a';
import { buildReviewQueue, renderReviewCard } from './modules/reviewDeck.js?v=20261118b';
import { showAlert, showConfirm } from './modules/dialog.js';
import { loadLicense, saveLicense, getLicenseStatus } from './modules/trialLicense.js?v=20261116d';
import { initRippleFeedback } from './modules/ripple.js?v=20261118a';

const MAX_SUBJECTS = 10;
const MAX_PROBLEMS_PER_SUBJECT = 50;
const MAX_MASTERED_PROBLEMS = 200;

let state = loadState();
let license = loadLicense();
let activeSubject = '전체';
let activeMasteredSubject = '전체';

// 등록/수정 화면 임시 상태
let addSubject = state.lastSubject && state.lastSubject !== '전체' ? state.lastSubject : '미분류';
let editingProblemId = null;

// 복습 화면 상태
let reviewQueue = [];
let reviewIdx = 0;
let sessionCorrect = 0;
let sessionWrong = 0;
let sessionCleared = 0;
let sessionWrongIds = new Set();
let reviewLoopMode = false;
let loopStartCount = 0;
let reviewFromMastered = false;
let reviewReturnScreen = 'home';
let isAnimatingReview = false;
let toastTimer = null;

function showToast(text, { cleared = false, icon = 'check_circle', duration = 1600 } = {}) {
  const el = document.getElementById('app-toast');
  if (!el) return;
  if (toastTimer) clearTimeout(toastTimer);
  el.className = `app-toast${cleared ? ' is-cleared' : ''}`;
  el.innerHTML = `<span class="material-symbols-rounded ms-icon" aria-hidden="true">${icon}</span><span>${text}</span>`;
  el.classList.remove('hidden');
  toastTimer = setTimeout(() => {
    el.classList.add('hidden');
  }, duration);
}

// 화면 요소
const screens = {
  home: document.getElementById('screen-home'),
  add: document.getElementById('screen-add'),
  review: document.getElementById('screen-review'),
  mastered: document.getElementById('screen-mastered')
};

const homeEls = {
  subjectBar: document.getElementById('home-subject-bar'),
  subjectTotalSummary: document.getElementById('subject-total-summary'),
  btnStartReview: document.getElementById('btn-start-review'),
  problemList: document.getElementById('problem-list'),
  btnFabAdd: document.getElementById('btn-fab-add'),
  btnOpenMastered: document.getElementById('btn-open-mastered'),
  masteredCountBadge: document.getElementById('home-mastered-count'),
  btnOpenDrawer: document.getElementById('btn-open-drawer')
};

const masteredEls = {
  btnBack: document.getElementById('btn-mastered-back'),
  subjectBar: document.getElementById('mastered-subject-bar'),
  totalSummary: document.getElementById('mastered-total-summary'),
  list: document.getElementById('mastered-list'),
  btnReviewAll: document.getElementById('btn-review-mastered-all')
};

const addEls = {
  btnBack: document.getElementById('btn-add-back'),
  title: document.getElementById('add-screen-title'),
  inputProblemText: document.getElementById('input-problem-text'),
  inputAnswerText: document.getElementById('input-answer-text'),
  subjectBar: document.getElementById('add-subject-bar'),
  btnSave: document.getElementById('btn-save-problem')
};

const reviewEls = {
  btnExit: document.getElementById('btn-review-exit'),
  progress: document.getElementById('review-progress'),
  subjectTag: document.getElementById('review-subject-tag'),
  cardArea: document.getElementById('review-card-area'),
  doneArea: document.getElementById('review-done-area'),
  doneSummary: document.getElementById('review-done-summary'),
  actionBar: document.getElementById('review-action-bar'),
  metaRow: document.getElementById('review-meta-row'),
  problemContent: document.getElementById('review-problem-content'),
  answerContent: document.getElementById('review-answer-content'),
  curtainBox: document.getElementById('answer-curtain-box'),
  curtainBtn: document.getElementById('btn-reveal-answer'),
  btnMarkWrong: document.getElementById('btn-mark-wrong'),
  btnMarkCorrect: document.getElementById('btn-mark-correct'),
  btnReviewAgain: document.getElementById('btn-review-again'),
  btnReviewHome: document.getElementById('btn-review-home'),
  swipeBadgeCorrect: document.getElementById('swipe-badge-correct'),
  swipeBadgeWrong: document.getElementById('swipe-badge-wrong')
};

const subjectModalEls = {
  modal: document.getElementById('subject-modal'),
  btnClose: document.getElementById('btn-close-subject-modal'),
  btnDone: document.getElementById('btn-done-subject-modal'),
  inputNew: document.getElementById('input-new-subject'),
  btnAdd: document.getElementById('btn-add-subject'),
  list: document.getElementById('subject-manage-list')
};

const criteriaEls = {
  modal: document.getElementById('criteria-modal'),
  btnClose: document.getElementById('btn-close-criteria'),
  btnSave: document.getElementById('btn-save-criteria'),
  inputMasteryTarget: document.getElementById('input-mastery-target')
};

const licenseEls = {
  modal: document.getElementById('license-modal'),
  title: document.getElementById('license-modal-title'),
  badge: document.getElementById('license-badge-text'),
  btnClose: document.getElementById('btn-close-license'),
  btnBuy: document.getElementById('btn-buy-lifetime'),
  btnRestore: document.getElementById('btn-restore-purchase')
};

const settingsEls = {
  modal: document.getElementById('settings-modal'),
  btnClose: document.getElementById('btn-close-settings'),
  menuSubjects: document.getElementById('menu-open-subjects'),
  menuCriteria: document.getElementById('menu-open-criteria'),
  menuTheme: document.getElementById('menu-open-theme'),
  themeBadge: document.getElementById('settings-theme-badge'),
  menuLicense: document.getElementById('menu-open-license'),
  licenseSub: document.getElementById('settings-license-sub'),
  licenseBadge: document.getElementById('settings-license-badge'),
  linkGuide: document.getElementById('link-guide'),
  linkTerms: document.getElementById('link-terms'),
  linkPrivacy: document.getElementById('link-privacy')
};

const themeEls = {
  modal: document.getElementById('theme-modal'),
  btnClose: document.getElementById('btn-close-theme'),
  btnDone: document.getElementById('btn-done-theme'),
  btnLight: document.getElementById('btn-theme-light'),
  btnDark: document.getElementById('btn-theme-dark'),
  colorGrid: document.getElementById('theme-color-grid')
};

function createPhotoEditorField(ids) {
  const MAX_PHOTOS = 2;
  const els = {
    input: document.getElementById(ids.input),
    clearBtn: document.getElementById(ids.clearBtn),
    wrap: document.getElementById(ids.wrap),
    photoTabs: document.getElementById(ids.photoTabs),
    toolEraser: document.getElementById(ids.toolEraser),
    toolCrop: document.getElementById(ids.toolCrop),
    rotateBtn: document.getElementById(ids.rotateBtn),
    undoBtn: document.getElementById(ids.undoBtn),
    hint: document.getElementById(ids.hint),
    canvas: document.getElementById(ids.canvas),
    sizeRow: document.getElementById(ids.sizeRow),
    sizeInput: document.getElementById(ids.sizeInput),
    cropRow: document.getElementById(ids.cropRow),
    applyCropBtn: document.getElementById(ids.applyCropBtn)
  };

  let images = [];
  let activeIdx = 0;

  const eraser = createMagicEraser({
    canvas: els.canvas,
    onHintChange: (msg) => {
      els.hint.textContent = msg;
    }
  });

  function setTool(tool) {
    els.toolEraser.classList.toggle('active', tool === 'eraser');
    els.toolCrop.classList.toggle('active', tool === 'crop');
    els.sizeRow.classList.toggle('hidden', tool !== 'eraser');
    els.cropRow.classList.toggle('hidden', tool !== 'crop');
    eraser.setMode(tool);
  }

  function commitCurrentCanvas() {
    if (images.length > 0 && images[activeIdx] !== undefined) {
      images[activeIdx] = eraser.exportDataUrl();
    }
  }

  function renderTabs() {
    els.photoTabs.innerHTML = '';
    images.forEach((_, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `photo-slot-btn${idx === activeIdx ? ' active' : ''}`;
      btn.textContent = `사진 ${idx + 1}`;
      btn.addEventListener('click', async () => {
        if (idx === activeIdx) return;
        commitCurrentCanvas();
        activeIdx = idx;
        await eraser.loadDataUrl(images[activeIdx]);
        setTool('eraser');
        renderTabs();
      });
      els.photoTabs.appendChild(btn);
    });
  }

  async function showActiveSlot() {
    if (images.length === 0) {
      els.wrap.classList.add('hidden');
      els.clearBtn.classList.add('hidden');
      els.photoTabs.innerHTML = '';
      return;
    }
    activeIdx = Math.min(activeIdx, images.length - 1);
    await eraser.loadDataUrl(images[activeIdx]);
    els.wrap.classList.remove('hidden');
    els.clearBtn.classList.remove('hidden');
    setTool('eraser');
    renderTabs();
  }

  function reset() {
    images = [];
    activeIdx = 0;
    els.input.value = '';
    els.wrap.classList.add('hidden');
    els.clearBtn.classList.add('hidden');
    els.photoTabs.innerHTML = '';
    setTool('eraser');
  }

  els.input.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    els.input.value = '';
    if (!files.length) return;

    commitCurrentCanvas();
    const remain = MAX_PHOTOS - images.length;
    if (remain <= 0) {
      await showAlert('사진은 최대 2장까지만 올릴 수 있습니다.\n기존 사진을 지운 뒤 다시 올려 주세요.');
      return;
    }
    if (files.length > remain) {
      await showAlert(`사진은 최대 2장까지만 올릴 수 있어 ${remain}장만 추가합니다.`);
    }

    for (const file of files.slice(0, remain)) {
      const dataUrl = await compressImageFile(file, 840, 0.78);
      images.push(dataUrl);
    }
    activeIdx = images.length - 1;
    await showActiveSlot();
  });

  els.clearBtn.addEventListener('click', async () => {
    if (images.length === 0) return;
    images.splice(activeIdx, 1);
    activeIdx = Math.max(0, activeIdx - 1);
    await showActiveSlot();
  });

  els.toolEraser.addEventListener('click', () => setTool('eraser'));
  els.toolCrop.addEventListener('click', () => setTool('crop'));
  els.rotateBtn?.addEventListener('click', () => eraser.rotate90());
  els.undoBtn.addEventListener('click', () => eraser.undo());
  els.sizeInput.addEventListener('input', (e) => eraser.setBrushSize(e.target.value));
  els.applyCropBtn.addEventListener('click', () => {
    if (eraser.applyCrop()) setTool('eraser');
  });

  async function loadExisting(existingList) {
    const list = Array.isArray(existingList) ? existingList.filter(Boolean).slice(0, MAX_PHOTOS) : [];
    if (list.length === 0) {
      reset();
      return;
    }
    images = [...list];
    activeIdx = 0;
    await showActiveSlot();
  }

  return {
    reset,
    loadExisting,
    hasImage: () => images.length > 0,
    exportImages: () => {
      commitCurrentCanvas();
      return [...images];
    }
  };
}

const problemEditor = createPhotoEditorField({
  input: 'input-problem-img',
  clearBtn: 'btn-clear-problem-img',
  wrap: 'editor-wrap',
  photoTabs: 'problem-photo-tabs',
  toolEraser: 'tool-eraser',
  toolCrop: 'tool-crop',
  rotateBtn: 'btn-editor-rotate',
  undoBtn: 'btn-editor-undo',
  hint: 'editor-hint',
  canvas: 'problem-canvas',
  sizeRow: 'eraser-size-row',
  sizeInput: 'eraser-size',
  cropRow: 'crop-action-row',
  applyCropBtn: 'btn-apply-crop'
});

const answerEditor = createPhotoEditorField({
  input: 'input-answer-img',
  clearBtn: 'btn-clear-answer-img',
  wrap: 'answer-editor-wrap',
  photoTabs: 'answer-photo-tabs',
  toolEraser: 'answer-tool-eraser',
  toolCrop: 'answer-tool-crop',
  rotateBtn: 'btn-answer-rotate',
  undoBtn: 'btn-answer-undo',
  hint: 'answer-editor-hint',
  canvas: 'answer-canvas',
  sizeRow: 'answer-eraser-size-row',
  sizeInput: 'answer-eraser-size',
  cropRow: 'answer-crop-action-row',
  applyCropBtn: 'btn-answer-apply-crop'
});

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
  window.scrollTo(0, 0);
}

function getFilteredProblems() {
  return state.problems.filter((p) => {
    const subj = p.subject || '미분류';
    return activeSubject === '전체' || subj === activeSubject;
  });
}

function countProblemsInSubject(subjectName, excludeId = null) {
  const targetSubj = subjectName || '미분류';
  return state.problems.filter((p) => p.id !== excludeId && (p.subject || '미분류') === targetSubj).length;
}

function pushMasteredProblem(problem) {
  state.masteredProblems.unshift({
    ...problem,
    mastered: true,
    masteredAt: Date.now()
  });
  if (state.masteredProblems.length > MAX_MASTERED_PROBLEMS) {
    state.masteredProblems = state.masteredProblems.slice(0, MAX_MASTERED_PROBLEMS);
  }
}

function addNewSubject(name) {
  if (state.subjects.length >= MAX_SUBJECTS) {
    return false;
  }
  if (!state.subjects.includes(name)) {
    state.subjects.push(name);
    saveState(state);
  }
  return true;
}

function getSubjectCounts() {
  const counts = { 전체: state.problems.length, 미분류: 0 };
  state.subjects.forEach((s) => {
    counts[s] = 0;
  });
  state.problems.forEach((p) => {
    const subj = p.subject || '미분류';
    counts[subj] = (counts[subj] || 0) + 1;
  });
  return counts;
}

function closeAllCardMenus() {
  document.querySelectorAll('.card-menu-dropdown').forEach((menu) => menu.classList.add('hidden'));
  document.querySelectorAll('.problem-card.menu-open').forEach((card) => card.classList.remove('menu-open'));
}

document.addEventListener('click', () => closeAllCardMenus());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllCardMenus();
});

function createProblemCardElement(p, { statusText, statusClass, streakBadgeText = '', streakActive = false, subText = '', buildActions }) {
  const card = document.createElement('div');
  card.className = 'problem-card';

  const thumbSrc = Array.isArray(p.problemImgs) && p.problemImgs.length
    ? p.problemImgs[0]
    : p.problemImg;
  if (thumbSrc) {
    const thumb = document.createElement('img');
    thumb.className = 'problem-thumb';
    thumb.src = thumbSrc;
    thumb.alt = '문제 썸네일';
    card.appendChild(thumb);
  } else {
    const thumbBox = document.createElement('div');
    thumbBox.className = 'problem-thumb-text';
    thumbBox.innerHTML = '<span class="material-symbols-rounded ms-icon ms-thumb" aria-hidden="true">edit_note</span>';
    card.appendChild(thumbBox);
  }

  const info = document.createElement('div');
  info.className = 'problem-info';

  const badges = document.createElement('div');
  badges.className = 'problem-badges';

  const sub = document.createElement('span');
  sub.className = 'badge-subject';
  sub.textContent = p.subject || '미분류';
  badges.appendChild(sub);

  const status = document.createElement('span');
  status.className = statusClass;
  status.textContent = statusText;
  badges.appendChild(status);

  if (streakBadgeText) {
    const streakEl = document.createElement('span');
    streakEl.className = `badge-streak${streakActive ? ' is-progress' : ''}`;
    streakEl.textContent = streakBadgeText;
    badges.appendChild(streakEl);
  }

  info.appendChild(badges);

  const title = document.createElement('div');
  title.className = 'problem-title';
  title.textContent = p.problemText || '사진 문제';
  info.appendChild(title);

  if (subText) {
    const subEl = document.createElement('div');
    subEl.className = 'problem-sub';
    subEl.textContent = subText;
    info.appendChild(subEl);
  }

  card.appendChild(info);

  if (buildActions) {
    const cardActions = document.createElement('div');
    cardActions.className = 'card-actions';
    buildActions(cardActions, card);
    card.appendChild(cardActions);
  }

  return card;
}

function renderHome() {
  if (homeEls.masteredCountBadge) {
    homeEls.masteredCountBadge.textContent = String(state.masteredProblems.length);
  }

  renderSubjectBar({
    container: homeEls.subjectBar,
    subjects: state.subjects,
    selected: activeSubject,
    includeAll: true,
    onSelect: (subj) => {
      activeSubject = subj;
      renderHome();
    }
  });

  const list = getFilteredProblems();
  homeEls.subjectTotalSummary.textContent = `전체 ${list.length}문제`;

  homeEls.problemList.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon"><span class="material-symbols-rounded ms-icon ms-empty" aria-hidden="true">menu_book</span></div>
      <p><strong>아직 등록된 오답이 없어요</strong></p>
      <p>오른쪽 아래 <b>오답 올리기</b>를 눌러<br/>3초 만에 첫 오답을 등록해 보세요.</p>
    `;
    homeEls.problemList.appendChild(empty);
    return;
  }

  const targetCount = state.settings.masteryTarget || 2;
  list.forEach((p) => {
    const streak = p.correctStreak || 0;
    const card = createProblemCardElement(p, {
      statusText: p.wrongCount > 0 ? `${p.wrongCount}번 틀림` : '정복 전',
      statusClass: p.wrongCount > 0 ? 'badge-wrong' : 'badge-new',
      streakBadgeText: `연속 ${streak}/${targetCount}`,
      streakActive: streak > 0,
      buildActions: (cardActions, cardEl) => {
        const moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'btn-card-more';
        moreBtn.setAttribute('aria-label', '문제 메뉴');
        moreBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">more_vert</span>';

        const dropdown = document.createElement('div');
        dropdown.className = 'card-menu-dropdown hidden';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'card-menu-item';
        editBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">edit</span><span>수정하기</span>';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeAllCardMenus();
          openEditProblem(p);
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'card-menu-item danger';
        delBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">delete</span><span>삭제하기</span>';
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          closeAllCardMenus();
          const ok = await showConfirm('이 오답 카드를 삭제할까요?', {
            title: '오답 삭제',
            okText: '삭제하기',
            danger: true
          });
          if (!ok) return;
          state.problems = state.problems.filter((item) => item.id !== p.id);
          saveState(state);
          renderHome();
        });

        dropdown.appendChild(editBtn);
        dropdown.appendChild(delBtn);

        moreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasHidden = dropdown.classList.contains('hidden');
          closeAllCardMenus();
          if (wasHidden) {
            dropdown.classList.remove('hidden');
            cardEl.classList.add('menu-open');
          }
        });

        cardActions.appendChild(moreBtn);
        cardActions.appendChild(dropdown);
      }
    });

    // 카드를 누르면 해당 문제부터 바로 복습 시작
    card.addEventListener('click', () => startReview([p], { returnTo: 'home' }));
    homeEls.problemList.appendChild(card);
  });
}

function getFilteredMasteredProblems() {
  return state.masteredProblems.filter((p) => {
    const subj = p.subject || '미분류';
    return activeMasteredSubject === '전체' || subj === activeMasteredSubject;
  });
}

function renderMastered() {
  renderSubjectBar({
    container: masteredEls.subjectBar,
    subjects: state.subjects,
    selected: activeMasteredSubject,
    includeAll: true,
    onSelect: (subj) => {
      activeMasteredSubject = subj;
      renderMastered();
    }
  });

  const list = getFilteredMasteredProblems();
  masteredEls.totalSummary.textContent = `정복 완료 ${list.length}문제`;
  masteredEls.list.innerHTML = '';

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon"><span class="material-symbols-rounded ms-icon ms-empty" aria-hidden="true">task_alt</span></div>
      <p><strong>아직 정복 보관함이 비어 있어요</strong></p>
      <p>오답을 정한 횟수만큼 연속으로 맞히면<br/>이곳에 안전하게 따로 모입니다.</p>
    `;
    masteredEls.list.appendChild(empty);
    return;
  }

  list.forEach((p) => {
    const card = createProblemCardElement(p, {
      statusText: '정복 완료',
      statusClass: 'badge-mastered',
      subText: '눌러서 다시 풀거나 복구할 수 있어요',
      buildActions: (cardActions) => {
        const restoreBtn = document.createElement('button');
        restoreBtn.type = 'button';
        restoreBtn.className = 'btn-card-restore';
        restoreBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">restore</span><span>복구</span>';
        restoreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          restoreMasteredProblem(p.id);
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-card-more';
        delBtn.setAttribute('aria-label', '완전 삭제');
        delBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">delete_outline</span>';
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const ok = await showConfirm('정복 보관함에서도 이 문제를 완전히 지울까요?', {
            title: '완전 삭제',
            okText: '삭제하기',
            danger: true
          });
          if (!ok) return;
          state.masteredProblems = state.masteredProblems.filter((item) => item.id !== p.id);
          saveState(state);
          renderMastered();
          renderHome();
        });

        cardActions.appendChild(restoreBtn);
        cardActions.appendChild(delBtn);
      }
    });

    card.addEventListener('click', () => startReview([p], { fromMastered: true, returnTo: 'mastered' }));
    masteredEls.list.appendChild(card);
  });
}

function restoreMasteredProblem(problemId, { silent = false } = {}) {
  const target = state.masteredProblems.find((item) => item.id === problemId);
  if (!target) return false;
  const targetSubj = target.subject || '미분류';
  if (countProblemsInSubject(targetSubj) >= MAX_PROBLEMS_PER_SUBJECT) {
    showAlert(`'${targetSubj}' 과목은 최대 ${MAX_PROBLEMS_PER_SUBJECT}문제까지만 저장할 수 있어요.\n먼저 해당 과목의 문제를 조금 비운 뒤 복구해 주세요.`);
    return false;
  }
  state.masteredProblems = state.masteredProblems.filter((item) => item.id !== problemId);
  const restored = {
    ...target,
    mastered: false,
    correctStreak: 0
  };
  delete restored.masteredAt;
  state.problems.unshift(restored);
  saveState(state);
  renderMastered();
  renderHome();
  if (!silent) {
    showToast('오답 목록으로 복구했어요!');
  }
  return true;
}

homeEls.btnOpenMastered?.addEventListener('click', () => {
  renderMastered();
  showScreen('mastered');
});

masteredEls.btnBack?.addEventListener('click', () => {
  renderHome();
  showScreen('home');
});

masteredEls.btnReviewAll?.addEventListener('click', () => {
  const list = getFilteredMasteredProblems();
  if (list.length === 0) {
    showAlert('정복 보관함에 다시 풀 문제가 아직 없어요.');
    return;
  }
  startReview(list, { fromMastered: true, returnTo: 'mastered' });
});

/* ================= 2. 오답 올리기 ================= */
function renderAddSubjectBar() {
  renderSubjectBar({
    container: addEls.subjectBar,
    subjects: state.subjects,
    selected: addSubject,
    includeAll: false,
    onSelect: (subj) => {
      addSubject = subj;
      renderAddSubjectBar();
    }
  });
}

function setSaveBtnLabel(label) {
  addEls.btnSave.innerHTML = `<span class="material-symbols-rounded ms-icon" aria-hidden="true">check_circle</span><span>${label}</span>`;
}

function resetAddForm() {
  editingProblemId = null;
  addEls.title.textContent = '3초 오답 올리기';
  setSaveBtnLabel('저장하기');
  problemEditor.reset();
  answerEditor.reset();
  addEls.inputProblemText.value = '';
  addEls.inputAnswerText.value = '';
  addSubject = state.lastSubject && state.lastSubject !== '전체' ? state.lastSubject : '미분류';
  renderAddSubjectBar();
}

async function openEditProblem(p) {
  editingProblemId = p.id;
  addEls.title.textContent = '오답 수정하기';
  setSaveBtnLabel('수정 완료');
  addEls.inputProblemText.value = p.problemText || '';
  addEls.inputAnswerText.value = p.answerText || '';
  addSubject = p.subject || '미분류';
  renderAddSubjectBar();
  showScreen('add');
  const existingProblemImgs = Array.isArray(p.problemImgs) && p.problemImgs.length
    ? p.problemImgs
    : p.problemImg ? [p.problemImg] : [];
  const existingAnswerImgs = Array.isArray(p.answerImgs) && p.answerImgs.length
    ? p.answerImgs
    : p.answerImg ? [p.answerImg] : [];
  await problemEditor.loadExisting(existingProblemImgs);
  await answerEditor.loadExisting(existingAnswerImgs);
}

homeEls.btnFabAdd.addEventListener('click', () => {
  if (getLicenseStatus(license).state === 'expired') {
    openLicenseModal(true);
    return;
  }
  resetAddForm();
  showScreen('add');
});

addEls.btnBack.addEventListener('click', () => showScreen('home'));

addEls.btnSave.addEventListener('click', () => {
  const problemText = addEls.inputProblemText.value.trim();
  const answerText = addEls.inputAnswerText.value.trim();
  if (!problemEditor.hasImage() && !problemText) {
    showAlert('문제 사진을 올리거나 문제 내용을 간단히 적어 주세요!');
    return;
  }

  if (countProblemsInSubject(addSubject, editingProblemId) >= MAX_PROBLEMS_PER_SUBJECT) {
    showAlert(`'${addSubject}' 과목에는 최대 ${MAX_PROBLEMS_PER_SUBJECT}문제까지만 저장할 수 있어요.\n정복하거나 기존 문제를 정리한 뒤 다시 올려 주세요.`);
    return;
  }

  const finalProblemImgs = problemEditor.exportImages();
  const finalAnswerImgs = answerEditor.exportImages();

  const isEditing = Boolean(editingProblemId);
  if (editingProblemId) {
    const target = state.problems.find((item) => item.id === editingProblemId);
    if (target) {
      target.subject = addSubject;
      target.problemText = problemText;
      target.problemImgs = finalProblemImgs;
      target.problemImg = finalProblemImgs[0] || '';
      target.answerText = answerText;
      target.answerImgs = finalAnswerImgs;
      target.answerImg = finalAnswerImgs[0] || '';
    }
    editingProblemId = null;
  } else {
    const newItem = {
      id: 'p-' + Date.now(),
      subject: addSubject,
      problemText,
      problemImgs: finalProblemImgs,
      problemImg: finalProblemImgs[0] || '',
      answerText,
      answerImgs: finalAnswerImgs,
      answerImg: finalAnswerImgs[0] || '',
      wrongCount: 0,
      correctStreak: 0,
      mastered: false,
      createdAt: Date.now()
    };
    state.problems.unshift(newItem);
  }

  state.lastSubject = addSubject;
  if (saveState(state)) {
    renderHome();
    showScreen('home');
    showToast(isEditing ? '오답을 수정했어요!' : '오답을 쏙 저장했어요!');
  }
});

/* ================= 3. 다시 풀기 (가림막 복습) ================= */
function startReview(customList = null, { loop = false, fromMastered = false, returnTo = 'home' } = {}) {
  const source = customList || getFilteredProblems();
  if (!source.length) return;
  reviewQueue = buildReviewQueue(source);
  reviewIdx = 0;
  reviewLoopMode = loop;
  loopStartCount = loop ? source.length : 0;
  reviewFromMastered = Boolean(fromMastered);
  reviewReturnScreen = returnTo;
  sessionCorrect = 0;
  sessionWrong = 0;
  sessionCleared = 0;
  sessionWrongIds = new Set();

  reviewEls.cardArea.classList.remove('hidden');
  reviewEls.actionBar.classList.remove('hidden');
  reviewEls.doneArea.classList.add('hidden');
  showScreen('review');
  showCurrentReviewCard();
}

function resetReviewCardVisual() {
  const area = reviewEls.cardArea;
  area.classList.remove('is-dragging', 'is-fly-left', 'is-fly-right', 'is-cleared-fly', 'is-enter-card');
  area.style.transform = '';
  if (reviewEls.swipeBadgeCorrect) reviewEls.swipeBadgeCorrect.style.opacity = '0';
  if (reviewEls.swipeBadgeWrong) reviewEls.swipeBadgeWrong.style.opacity = '0';
}

function showCurrentReviewCard() {
  resetReviewCardVisual();

  // 정복 모드: 한 바퀴가 끝나면 아직 못 지운 문제로 자동 이어집니다.
  if (reviewIdx >= reviewQueue.length && reviewLoopMode) {
    const queueIds = new Set(reviewQueue.map((q) => q.id));
    const remaining = state.problems.filter((p) => queueIds.has(p.id));
    if (remaining.length > 0) {
      reviewQueue = buildReviewQueue(remaining);
      reviewIdx = 0;
      showToast(`미정복 ${remaining.length}문제 남았어요!`, { icon: 'target', duration: 1500 });
    }
  }

  if (reviewIdx >= reviewQueue.length) {
    reviewEls.cardArea.classList.add('hidden');
    reviewEls.actionBar.classList.add('hidden');
    reviewEls.doneArea.classList.remove('hidden');
    const stillWrong = state.problems.filter((p) => sessionWrongIds.has(p.id));
    reviewEls.btnReviewAgain.classList.toggle('hidden', stillWrong.length === 0);
    if (reviewFromMastered) {
      reviewEls.doneSummary.textContent =
        sessionWrong > 0
          ? `정복 보관함 ${reviewQueue.length}문제 중 ${sessionCorrect}문제 맞혔고, 틀린 ${sessionWrong}문제는 오답 목록으로 복구했어요.`
          : `정복 보관함 ${reviewQueue.length}문제를 모두 다시 맞혔어요!`;
    } else if (reviewLoopMode) {
      reviewEls.doneSummary.textContent = `미정복 ${loopStartCount}문제를 전부 정복해서 보관함으로 옮겼어요!`;
    } else {
      reviewEls.doneSummary.textContent =
        sessionCleared > 0
          ? `총 ${reviewQueue.length}문제 중 ${sessionCleared}문제를 정복해서 보관함으로 옮겼어요!`
          : `총 ${reviewQueue.length}문제 중 ${sessionCorrect}문제 맞혔고, ${sessionWrong}문제 못 지웠어요.`;
    }
    return;
  }
  renderReviewCard({
    problem: reviewQueue[reviewIdx],
    index: reviewIdx,
    total: reviewQueue.length,
    subjectLabel: reviewFromMastered ? activeMasteredSubject : activeSubject,
    els: reviewEls
  });
  void reviewEls.cardArea.offsetWidth;
  reviewEls.cardArea.classList.add('is-enter-card');
}

homeEls.btnStartReview.addEventListener('click', () => {
  const list = getFilteredProblems();
  if (list.length === 0) {
    showAlert('현재 과목에 등록된 문제가 없어요.\n오른쪽 아래 [오답 올리기]로 문제를 먼저 추가해 주세요.');
    return;
  }
  startReview(list);
});

reviewEls.curtainBtn.addEventListener('click', () => {
  reviewEls.curtainBtn.classList.add('hidden');
  reviewEls.curtainBox.classList.remove('is-covered');
});

function handleReviewAnswer(isCorrect) {
  if (isAnimatingReview || reviewIdx >= reviewQueue.length) return;
  isAnimatingReview = true;

  const curr = reviewQueue[reviewIdx];
  let clearedNow = false;

  if (reviewFromMastered) {
    if (isCorrect) {
      sessionCorrect += 1;
    } else {
      const mTarget = state.masteredProblems.find((p) => p.id === curr.id);
      if (mTarget) {
        const mSubj = mTarget.subject || '미분류';
        if (countProblemsInSubject(mSubj) >= MAX_PROBLEMS_PER_SUBJECT) {
          showToast(`'${mSubj}' 과목이 ${MAX_PROBLEMS_PER_SUBJECT}문제 꽉 차서 정복함에 유지했어요`, { icon: 'info', duration: 1800 });
        } else {
          state.masteredProblems = state.masteredProblems.filter((p) => p.id !== curr.id);
          const restored = {
            ...mTarget,
            wrongCount: (mTarget.wrongCount || 0) + 1,
            correctStreak: 0,
            mastered: false
          };
          delete restored.masteredAt;
          state.problems.unshift(restored);
          saveState(state);
          showToast('틀린 문제는 오답 목록으로 복구했어요', { icon: 'restore', duration: 1600 });
        }
      }
      sessionWrongIds.add(curr.id);
      sessionWrong += 1;
    }
  } else {
    const target = state.problems.find((p) => p.id === curr.id);
    if (isCorrect) {
      if (target) {
        target.correctStreak = (target.correctStreak || 0) + 1;
        const targetCount = state.settings.masteryTarget || 2;
        if (target.correctStreak >= targetCount) {
          state.problems = state.problems.filter((p) => p.id !== curr.id);
          pushMasteredProblem(target);
          sessionCleared += 1;
          clearedNow = true;
        }
        saveState(state);
      }
      sessionCorrect += 1;
    } else {
      if (target) {
        target.wrongCount += 1;
        target.correctStreak = 0;
        target.mastered = false;
        saveState(state);
      }
      sessionWrongIds.add(curr.id);
      sessionWrong += 1;
    }
  }

  const area = reviewEls.cardArea;
  area.classList.remove('is-dragging', 'is-enter-card');
  area.style.transform = '';
  if (clearedNow) {
    area.classList.add('is-cleared-fly');
    showToast('완전 정복! 정복 보관함으로 옮겼어요', { cleared: true, icon: 'task_alt', duration: 1700 });
  } else if (isCorrect) {
    area.classList.add('is-fly-right');
  } else {
    area.classList.add('is-fly-left');
  }

  setTimeout(() => {
    reviewIdx += 1;
    isAnimatingReview = false;
    showCurrentReviewCard();
  }, 210);
}

reviewEls.btnMarkWrong.addEventListener('click', () => handleReviewAnswer(false));
reviewEls.btnMarkCorrect.addEventListener('click', () => handleReviewAnswer(true));

// 복습 카드 좌우 스와이프 (오른쪽: 맞혔어요 / 왼쪽: 틀렸어요)
(() => {
  const area = reviewEls.cardArea;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let swiping = false;

  area.addEventListener('pointerdown', (e) => {
    if (isAnimatingReview || e.button > 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    swiping = false;
  });

  area.addEventListener('pointermove', (e) => {
    if (pointerId !== e.pointerId || isAnimatingReview) return;
    const curDx = e.clientX - startX;
    const curDy = e.clientY - startY;

    if (!swiping) {
      if (Math.abs(curDx) > 12 && Math.abs(curDx) > Math.abs(curDy) * 1.2) {
        swiping = true;
        area.classList.remove('is-enter-card');
        area.classList.add('is-dragging');
        area.setPointerCapture?.(e.pointerId);
      } else if (Math.abs(curDy) > 14) {
        pointerId = null;
        return;
      } else {
        return;
      }
    }

    dx = curDx;
    const rotate = Math.max(-10, Math.min(10, dx * 0.04));
    area.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;

    const ratio = Math.min(1, Math.abs(dx) / 75);
    if (dx > 0) {
      if (reviewEls.swipeBadgeCorrect) reviewEls.swipeBadgeCorrect.style.opacity = String(ratio);
      if (reviewEls.swipeBadgeWrong) reviewEls.swipeBadgeWrong.style.opacity = '0';
    } else {
      if (reviewEls.swipeBadgeWrong) reviewEls.swipeBadgeWrong.style.opacity = String(ratio);
      if (reviewEls.swipeBadgeCorrect) reviewEls.swipeBadgeCorrect.style.opacity = '0';
    }
  });

  function finishSwipe(e) {
    if (pointerId !== e.pointerId) return;
    pointerId = null;
    if (!swiping) return;
    swiping = false;
    area.classList.remove('is-dragging');

    if (dx >= 75) {
      handleReviewAnswer(true);
    } else if (dx <= -75) {
      handleReviewAnswer(false);
    } else {
      area.style.transform = '';
      if (reviewEls.swipeBadgeCorrect) reviewEls.swipeBadgeCorrect.style.opacity = '0';
      if (reviewEls.swipeBadgeWrong) reviewEls.swipeBadgeWrong.style.opacity = '0';
    }
  }

  area.addEventListener('pointerup', finishSwipe);
  area.addEventListener('pointercancel', finishSwipe);
})();

function exitReviewScreen() {
  renderHome();
  if (reviewReturnScreen === 'mastered') {
    renderMastered();
    showScreen('mastered');
  } else {
    showScreen('home');
  }
}

reviewEls.btnExit.addEventListener('click', exitReviewScreen);
reviewEls.btnReviewHome.addEventListener('click', exitReviewScreen);
reviewEls.btnReviewAgain.addEventListener('click', () => {
  const retryList = state.problems.filter((p) => sessionWrongIds.has(p.id));
  if (retryList.length === 0) {
    exitReviewScreen();
    return;
  }
  startReview(retryList, { loop: true, fromMastered: false, returnTo: reviewReturnScreen });
});

/* ================= 5. 과목 정리하기 (수정/삭제) ================= */
function renderSubjectManageList() {
  subjectModalEls.list.innerHTML = '';
  if (state.subjects.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'subject-modal-hint';
    empty.textContent = '등록된 과목이 없습니다. 상단의 ＋ 버튼으로 새 과목을 추가해 보세요.';
    subjectModalEls.list.appendChild(empty);
    return;
  }

  state.subjects.forEach((subj, idx) => {
    const row = document.createElement('div');
    row.className = 'subject-manage-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'subject-manage-input';
    input.value = subj;

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-subject-save';
    saveBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">check</span><span>이름 변경</span>';
    saveBtn.addEventListener('click', () => {
      const nextName = input.value.trim();
      if (!nextName) {
        showAlert('과목 이름을 입력해 주세요.');
        return;
      }
      if (nextName === subj) return;
      if (state.subjects.includes(nextName)) {
        showAlert('이미 같은 이름의 과목이 있습니다.');
        return;
      }
      state.subjects[idx] = nextName;
      state.problems.forEach((p) => {
        if (p.subject === subj) p.subject = nextName;
      });
      state.masteredProblems.forEach((p) => {
        if (p.subject === subj) p.subject = nextName;
      });
      if (activeSubject === subj) activeSubject = nextName;
      if (activeMasteredSubject === subj) activeMasteredSubject = nextName;
      if (state.lastSubject === subj) state.lastSubject = nextName;
      if (addSubject === subj) addSubject = nextName;
      saveState(state);
      renderSubjectManageList();
      renderHome();
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-subject-del';
    delBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">delete</span><span>삭제</span>';
    delBtn.addEventListener('click', async () => {
      const ok = await showConfirm(
        `'${subj}' 과목을 삭제할까요?\n(이 과목에 있던 문제는 '미분류'로 안전하게 남습니다.)`,
        { title: '과목 삭제', okText: '삭제하기', danger: true }
      );
      if (!ok) return;
      state.subjects = state.subjects.filter((s) => s !== subj);
      state.problems.forEach((p) => {
        if (p.subject === subj) p.subject = '미분류';
      });
      state.masteredProblems.forEach((p) => {
        if (p.subject === subj) p.subject = '미분류';
      });
      if (activeSubject === subj) activeSubject = '전체';
      if (activeMasteredSubject === subj) activeMasteredSubject = '전체';
      if (state.lastSubject === subj) state.lastSubject = '미분류';
      if (addSubject === subj) addSubject = '미분류';
      saveState(state);
      renderSubjectManageList();
      renderHome();
    });

    row.appendChild(input);
    row.appendChild(saveBtn);
    row.appendChild(delBtn);
    subjectModalEls.list.appendChild(row);
  });
}

function handleAddSubjectFromModal() {
  const name = subjectModalEls.inputNew.value.trim();
  if (!name) {
    showAlert('추가할 과목 이름을 입력해 주세요.');
    return;
  }
  if (state.subjects.includes(name)) {
    showAlert('이미 같은 이름의 과목이 있습니다.');
    return;
  }
  if (state.subjects.length >= MAX_SUBJECTS) {
    showAlert(`과목은 최대 ${MAX_SUBJECTS}개까지만 만들 수 있어요.`);
    return;
  }
  addNewSubject(name);
  subjectModalEls.inputNew.value = '';
  renderSubjectManageList();
  renderHome();
  renderAddSubjectBar();
}

subjectModalEls.btnAdd.addEventListener('click', handleAddSubjectFromModal);
subjectModalEls.inputNew.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleAddSubjectFromModal();
  }
});

function openSubjectModal() {
  subjectModalEls.inputNew.value = '';
  renderSubjectManageList();
  subjectModalEls.modal.classList.remove('hidden');
}

function closeSubjectModal() {
  subjectModalEls.modal.classList.add('hidden');
  renderHome();
  renderAddSubjectBar();
}

subjectModalEls.btnClose.addEventListener('click', closeSubjectModal);
subjectModalEls.btnDone.addEventListener('click', closeSubjectModal);

/* ================= 6. 내 학습 기준 설정 ================= */
function renderCriteriaModal() {
  criteriaEls.inputMasteryTarget.value = String(state.settings.masteryTarget || 2);
}

function openCriteriaModalFlow() {
  renderCriteriaModal();
  criteriaEls.modal.classList.remove('hidden');
}

criteriaEls.btnClose.addEventListener('click', () => {
  criteriaEls.modal.classList.add('hidden');
});

criteriaEls.btnSave.addEventListener('click', async () => {
  const masteryVal = Number(criteriaEls.inputMasteryTarget.value);
  if (!Number.isInteger(masteryVal) || masteryVal < 1 || masteryVal >= 20) {
    await showAlert('자동 삭제 기준 횟수는 1에서 19(20회 미만) 사이의 숫자로 입력해 주세요.');
    return;
  }

  state.settings.masteryTarget = masteryVal;
  // 새 기준을 이미 채운 문제들은 정복 보관함으로 이동
  const newlyMastered = state.problems.filter((p) => (p.correctStreak || 0) >= masteryVal);
  if (newlyMastered.length > 0) {
    newlyMastered.forEach((p) => pushMasteredProblem(p));
    state.problems = state.problems.filter((p) => (p.correctStreak || 0) < masteryVal);
  }
  saveState(state);
  criteriaEls.modal.classList.add('hidden');
  renderHome();
});

/* ================= 7. 7일 무료 체험 & 평생 소장 ================= */
function updateLicenseUI() {
  const info = getLicenseStatus(license);
  settingsEls.licenseSub.textContent = info.label;
  settingsEls.licenseBadge.textContent =
    info.state === 'purchased' ? '소장 완료' : info.state === 'expired' ? '체험 종료' : '체험 중';
}

function openLicenseModal(expiredNotice = false) {
  const info = getLicenseStatus(license);
  licenseEls.badge.textContent = info.label;
  licenseEls.title.textContent =
    info.state === 'expired' || expiredNotice
      ? '⏰ 7일 무료 체험이 끝났어요'
      : info.state === 'purchased'
        ? '✅ 평생 소장 중입니다'
        : '🎁 7일 무료 체험 안내';
  licenseEls.btnBuy.classList.toggle('hidden', info.state === 'purchased');
  licenseEls.btnRestore.classList.toggle('hidden', info.state === 'purchased');
  licenseEls.modal.classList.remove('hidden');
}

licenseEls.btnClose.addEventListener('click', () => licenseEls.modal.classList.add('hidden'));

/* ================= 8. 왼쪽 슬라이드 설정 서랍 & 테마 ================= */
const THEME_COLOR_LABELS = {
  indigo: '인디고',
  blue: '블루',
  emerald: '에메랄드',
  amber: '오렌지',
  rose: '로즈'
};

const THEME_STORAGE_KEY = 'yj_wrong_note_theme_v1';

function loadSavedThemeIntoState() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.themeMode === 'dark' || parsed.themeMode === 'light') {
      state.settings.themeMode = parsed.themeMode;
    }
    if (THEME_COLOR_LABELS[parsed.themeColor]) {
      state.settings.themeColor = parsed.themeColor;
    }
  } catch {
    // 무시
  }
}

function saveThemePref(mode, color) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ themeMode: mode, themeColor: color }));
  } catch {
    // 무시
  }
}

function applyTheme() {
  const mode = state.settings.themeMode === 'dark' ? 'dark' : 'light';
  const color = THEME_COLOR_LABELS[state.settings.themeColor] ? state.settings.themeColor : 'indigo';
  document.documentElement.dataset.theme = mode;
  document.documentElement.dataset.accent = color;
  saveThemePref(mode, color);

  if (settingsEls.themeBadge) {
    settingsEls.themeBadge.textContent = `${THEME_COLOR_LABELS[color]} · ${mode === 'dark' ? '다크' : '화이트'}`;
  }
  themeEls.btnLight?.classList.toggle('active', mode === 'light');
  themeEls.btnDark?.classList.toggle('active', mode === 'dark');
  themeEls.colorGrid?.querySelectorAll('.theme-swatch-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.color === color);
  });
}

function openThemeModal() {
  applyTheme();
  themeEls.modal?.classList.remove('hidden');
}

function closeThemeModal() {
  themeEls.modal?.classList.add('hidden');
}

themeEls.btnClose?.addEventListener('click', closeThemeModal);
themeEls.btnDone?.addEventListener('click', closeThemeModal);

themeEls.btnLight?.addEventListener('click', () => {
  state.settings.themeMode = 'light';
  saveState(state);
  applyTheme();
});

themeEls.btnDark?.addEventListener('click', () => {
  state.settings.themeMode = 'dark';
  saveState(state);
  applyTheme();
});

themeEls.colorGrid?.addEventListener('click', (e) => {
  const btn = e.target.closest('.theme-swatch-btn');
  if (!btn || !btn.dataset.color) return;
  state.settings.themeColor = btn.dataset.color;
  saveState(state);
  applyTheme();
});

let drawerCloseTimer = null;

function openSettingsDrawer() {
  if (drawerCloseTimer) {
    clearTimeout(drawerCloseTimer);
    drawerCloseTimer = null;
  }
  updateLicenseUI();
  settingsEls.modal.classList.remove('hidden');
  settingsEls.modal.setAttribute('aria-hidden', 'false');
  void settingsEls.modal.offsetWidth;
  settingsEls.modal.classList.add('is-open');
}

function closeSettingsDrawer({ immediate = false } = {}) {
  settingsEls.modal.classList.remove('is-open');
  settingsEls.modal.setAttribute('aria-hidden', 'true');
  if (immediate) {
    settingsEls.modal.classList.add('hidden');
    return;
  }
  if (drawerCloseTimer) clearTimeout(drawerCloseTimer);
  drawerCloseTimer = setTimeout(() => {
    if (!settingsEls.modal.classList.contains('is-open')) {
      settingsEls.modal.classList.add('hidden');
    }
    drawerCloseTimer = null;
  }, 240);
}

homeEls.btnOpenDrawer?.addEventListener('click', openSettingsDrawer);

settingsEls.btnClose.addEventListener('click', () => closeSettingsDrawer());

settingsEls.modal.addEventListener('click', (e) => {
  if (e.target === settingsEls.modal) {
    closeSettingsDrawer();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && settingsEls.modal.classList.contains('is-open')) {
    closeSettingsDrawer();
  }
});

settingsEls.menuSubjects.addEventListener('click', () => {
  closeSettingsDrawer({ immediate: true });
  openSubjectModal();
});

settingsEls.menuCriteria.addEventListener('click', () => {
  closeSettingsDrawer({ immediate: true });
  openCriteriaModalFlow();
});

settingsEls.menuTheme?.addEventListener('click', () => {
  closeSettingsDrawer({ immediate: true });
  openThemeModal();
});

settingsEls.menuLicense.addEventListener('click', () => {
  closeSettingsDrawer({ immediate: true });
  openLicenseModal(false);
});

settingsEls.linkGuide.addEventListener('click', () => {
  showAlert(
    '1. 틀린 문제를 사진(최대 2장)이나 메모로 3초 만에 올립니다.\n2. 정복하기를 눌러 가림막을 열어 풀고 맞혔어요/틀렸어요를 누르거나 카드를 슥 밀어 넘깁니다. 틀린 문제는 다 지울 때까지 계속 돌아옵니다.\n3. 내가 정한 횟수만큼 연속으로 맞히면 정복 완료로 보고 목록에서 미련 없이 자동 삭제됩니다.',
    { title: '이용방법' }
  );
});

settingsEls.linkTerms.addEventListener('click', () => {
  showAlert(
    '이 앱은 틀린 문제만 가볍게 보고 정복한 문제는 자동 삭제되는 초간편 오답정복 앱입니다.\n회원가입 없이 내 휴대폰에만 저장되므로, 앱을 지우면 저장된 문제도 함께 삭제됩니다.',
    { title: '이용약관' }
  );
});

settingsEls.linkPrivacy.addEventListener('click', () => {
  showAlert(
    '이 앱은 회원가입을 받지 않으며, 올리신 문제 사진과 메모를 외부 서버로 보내거나 수집하지 않고 내 휴대폰 안에만 안전하게 보관합니다.',
    { title: '개인정보처리방침' }
  );
});

licenseEls.btnBuy.addEventListener('click', async () => {
  license.purchased = true;
  license.simulatedExpired = false;
  license.tampered = false;
  license.lastSeenAt = Date.now();
  saveLicense(license);
  updateLicenseUI();
  licenseEls.modal.classList.add('hidden');
  await showAlert('평생 소장 결제가 완료되었습니다!\n이제 매달 결제 없이 평생 모든 기능을 제한 없이 쓰실 수 있습니다.', {
    title: '구매 완료'
  });
});

licenseEls.btnRestore.addEventListener('click', async () => {
  await showAlert('구글 스토어 출시 후 기존 구매 내역을 자동으로 불러오는 버튼입니다.', {
    title: '구매 내역 복원'
  });
});

// 초기 화면 그리기 및 테마·물결 터치 반응 연결
loadSavedThemeIntoState();
applyTheme();
initRippleFeedback();
updateLicenseUI();
renderHome();
