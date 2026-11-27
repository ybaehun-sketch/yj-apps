import { loadState, saveState, compressImageFile, isSafeImageDataUrl } from './modules/storage.js?v=20261125quiz';
import { renderSubjectBar } from './modules/subjectBar.js?v=20261121free';
import { createMagicEraser } from './modules/magicEraser.js?v=20261121idle';
import { buildReviewQueue, renderReviewCard } from './modules/reviewDeck.js?v=20261127answer1';
import { showAlert, showConfirm } from './modules/dialog.js?v=20261121free';
import { loadLicense, saveLicense, getLicenseStatus } from './modules/trialLicense.js?v=20261125pay';
import {
  fetchLifetimeStorePrice,
  formatStorePrice,
  purchaseLifetime,
  checkLifetimePurchase
} from './modules/playBilling.js?v=20261125pay';
import { initRippleFeedback } from './modules/ripple.js?v=20261121event';
import {
  t,
  formatSubjectLabel,
  getLang,
  getLangPref,
  setLangPref,
  applyStaticTranslations
} from './modules/i18n.js?v=20261127welcome1';

const WELCOME_GUIDE_SEEN_KEY = 'odabnote_welcome_guide_seen_v1';

const MAX_SUBJECTS = 13;
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
  el.textContent = '';
  const iconEl = document.createElement('span');
  iconEl.className = 'material-symbols-rounded ms-icon';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = icon;
  const textEl = document.createElement('span');
  textEl.textContent = text;
  el.appendChild(iconEl);
  el.appendChild(textEl);
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
  inputNew: document.getElementById('input-new-subject'),
  btnAdd: document.getElementById('btn-add-subject'),
  list: document.getElementById('subject-manage-list')
};

const criteriaEls = {
  modal: document.getElementById('criteria-modal'),
  inputMasteryTarget: document.getElementById('input-mastery-target')
};

const licenseEls = {
  modal: document.getElementById('license-modal'),
  title: document.getElementById('license-modal-title'),
  badge: document.getElementById('license-badge-text'),
  btnBuy: document.getElementById('btn-buy-lifetime'),
  btnBuyText: document.getElementById('btn-buy-lifetime-text'),
  btnRestore: document.getElementById('btn-restore-lifetime')
};

const settingsEls = {
  modal: document.getElementById('settings-modal'),
  panel: document.querySelector('#settings-modal .drawer-panel'),
  menuSubjects: document.getElementById('menu-open-subjects'),
  menuCriteria: document.getElementById('menu-open-criteria'),
  menuTheme: document.getElementById('menu-open-theme'),
  themeBadge: document.getElementById('settings-theme-badge'),
  menuLanguage: document.getElementById('menu-open-language'),
  menuWelcomeGuide: document.getElementById('menu-open-welcome-guide'),
  languageBadge: document.getElementById('settings-language-badge'),
  menuLicense: document.getElementById('menu-open-license'),
  licenseLabel: document.getElementById('settings-license-label'),
  licenseBadge: document.getElementById('settings-license-badge'),
  linkGuide: document.getElementById('link-guide'),
  linkTerms: document.getElementById('link-terms'),
  linkPrivacy: document.getElementById('link-privacy')
};

const languageEls = {
  modal: document.getElementById('language-modal'),
  optionList: document.getElementById('language-option-list')
};

const themeEls = {
  modal: document.getElementById('theme-modal'),
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
    sizeInput: document.getElementById(ids.sizeInput)
  };

  let images = [];
  let activeIdx = 0;
  let currentTool = 'none';

  const eraser = createMagicEraser({
    canvas: els.canvas,
    onHintChange: (msg) => {
      els.hint.textContent = msg;
    }
  });

  function setTool(tool) {
    currentTool = tool || 'none';
    els.toolEraser.classList.toggle('active', currentTool === 'eraser');
    els.toolCrop.classList.toggle('active', currentTool === 'crop');
    els.sizeRow.classList.toggle('hidden', currentTool !== 'eraser');
    eraser.setMode(currentTool);
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
      btn.textContent = t('add.photoTab', { num: idx + 1 });
      btn.addEventListener('click', async () => {
        if (idx === activeIdx) return;
        commitCurrentCanvas();
        activeIdx = idx;
        await eraser.loadDataUrl(images[activeIdx]);
        setTool('none');
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
    setTool('none');
    renderTabs();
  }

  function reset() {
    images = [];
    activeIdx = 0;
    els.input.value = '';
    els.wrap.classList.add('hidden');
    els.clearBtn.classList.add('hidden');
    els.photoTabs.innerHTML = '';
    setTool('none');
  }

  els.input.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    els.input.value = '';
    if (!files.length) return;

    commitCurrentCanvas();
    const remain = MAX_PHOTOS - images.length;
    if (remain <= 0) {
      await showAlert(t('add.maxPhotos'));
      return;
    }
    if (files.length > remain) {
      await showAlert(t('add.maxPhotosPartial', { remain }));
    }

    for (const file of files.slice(0, remain)) {
      try {
        const dataUrl = await compressImageFile(file, 840, 0.78);
        images.push(dataUrl);
      } catch (err) {
        if (err?.message === 'FILE_TOO_LARGE') {
          await showAlert(t('add.imageTooLarge'));
        } else {
          await showAlert(t('add.invalidImage'));
        }
      }
    }
    if (images.length > 0) {
      activeIdx = images.length - 1;
    }
    await showActiveSlot();
  });

  els.clearBtn.addEventListener('click', async () => {
    if (images.length === 0) return;
    images.splice(activeIdx, 1);
    activeIdx = Math.max(0, activeIdx - 1);
    await showActiveSlot();
  });

  els.toolEraser.addEventListener('click', () => setTool(currentTool === 'eraser' ? 'none' : 'eraser'));
  els.toolCrop.addEventListener('click', () => setTool(currentTool === 'crop' ? 'none' : 'crop'));
  els.rotateBtn?.addEventListener('click', () => eraser.rotate90());
  els.undoBtn.addEventListener('click', () => eraser.undo());
  els.sizeInput.addEventListener('input', (e) => eraser.setBrushSize(e.target.value));

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
  sizeInput: 'eraser-size'
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
  sizeInput: 'answer-eraser-size'
});

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
  window.scrollTo(0, 0);
}

function resolveValidSubject(subj) {
  if (!subj || subj === '미분류') return '미분류';
  return state.subjects.includes(subj) ? subj : '미분류';
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
  if (isSafeImageDataUrl(thumbSrc)) {
    const thumb = document.createElement('img');
    thumb.className = 'problem-thumb';
    thumb.src = thumbSrc;
    thumb.alt = t('card.thumbAlt');
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
  sub.textContent = formatSubjectLabel(p.subject);
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
  title.textContent = p.problemText || t('card.photoProblem');
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

function attachCardMoreMenu(cardActions, cardEl, items) {
  const moreBtn = document.createElement('button');
  moreBtn.type = 'button';
  moreBtn.className = 'btn-card-more';
  moreBtn.setAttribute('aria-label', t('aria.cardMenu'));
  moreBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">more_vert</span>';

  const dropdown = document.createElement('div');
  dropdown.className = 'card-menu-dropdown hidden';

  items.forEach(({ icon, label, danger = false, onClick }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `card-menu-item${danger ? ' danger' : ''}`;
    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-rounded ms-icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = icon;
    const textSpan = document.createElement('span');
    textSpan.textContent = label;
    btn.appendChild(iconSpan);
    btn.appendChild(textSpan);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllCardMenus();
      onClick();
    });
    dropdown.appendChild(btn);
  });

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
  homeEls.subjectTotalSummary.textContent = t('home.totalSummary', { count: list.length });

  homeEls.problemList.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon"><span class="material-symbols-rounded ms-icon ms-empty" aria-hidden="true">menu_book</span></div>
      <p><strong>${t('home.emptyTitle')}</strong></p>
      <p>${t('home.emptyDesc')}</p>
    `;
    homeEls.problemList.appendChild(empty);
    return;
  }

  const targetCount = state.settings.masteryTarget || 2;
  list.forEach((p) => {
    const streak = p.correctStreak || 0;
    const card = createProblemCardElement(p, {
      statusText: p.wrongCount > 0 ? t('card.wrongCount', { count: p.wrongCount }) : t('card.beforeMastery'),
      statusClass: p.wrongCount > 0 ? 'badge-wrong' : 'badge-new',
      streakBadgeText: t('card.streak', { streak, target: targetCount }),
      streakActive: streak > 0,
      buildActions: (cardActions, cardEl) => {
        attachCardMoreMenu(cardActions, cardEl, [
          {
            icon: 'edit',
            label: t('card.edit'),
            onClick: () => openEditProblem(p)
          },
          {
            icon: 'delete',
            label: t('card.delete'),
            danger: true,
            onClick: async () => {
              const ok = await showConfirm(t('card.deleteConfirmMsg'), {
                title: t('card.deleteConfirmTitle'),
                okText: t('card.delete'),
                danger: true
              });
              if (!ok) return;
              state.problems = state.problems.filter((item) => item.id !== p.id);
              saveState(state);
              renderHome();
            }
          }
        ]);
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
  masteredEls.totalSummary.textContent = t('mastered.summary', { count: list.length });
  masteredEls.list.innerHTML = '';

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon"><span class="material-symbols-rounded ms-icon ms-empty" aria-hidden="true">task_alt</span></div>
      <p><strong>${t('mastered.emptyTitle')}</strong></p>
      <p>${t('mastered.emptyDesc')}</p>
    `;
    masteredEls.list.appendChild(empty);
    return;
  }

  list.forEach((p) => {
    const card = createProblemCardElement(p, {
      statusText: t('card.mastered'),
      statusClass: 'badge-mastered',
      subText: t('card.masteredSub'),
      buildActions: (cardActions, cardEl) => {
        attachCardMoreMenu(cardActions, cardEl, [
          {
            icon: 'restore',
            label: t('card.restore'),
            onClick: () => restoreMasteredProblem(p.id)
          },
          {
            icon: 'delete_forever',
            label: t('card.deleteForever'),
            danger: true,
            onClick: async () => {
              const ok = await showConfirm(t('card.deleteForeverConfirmMsg'), {
                title: t('card.deleteForeverConfirmTitle'),
                okText: t('card.deleteForever'),
                danger: true
              });
              if (!ok) return;
              state.masteredProblems = state.masteredProblems.filter((item) => item.id !== p.id);
              saveState(state);
              renderMastered();
              renderHome();
            }
          }
        ]);
      }
    });

    card.addEventListener('click', () => startReview([p], { fromMastered: true, returnTo: 'mastered' }));
    masteredEls.list.appendChild(card);
  });
}

function restoreMasteredProblem(problemId, { silent = false } = {}) {
  const target = state.masteredProblems.find((item) => item.id === problemId);
  if (!target) return false;
  const targetSubj = resolveValidSubject(target.subject);
  if (countProblemsInSubject(targetSubj) >= MAX_PROBLEMS_PER_SUBJECT) {
    showAlert(t('mastered.restoreFull', { subject: formatSubjectLabel(targetSubj), max: MAX_PROBLEMS_PER_SUBJECT }));
    return false;
  }
  state.masteredProblems = state.masteredProblems.filter((item) => item.id !== problemId);
  const restored = {
    ...target,
    subject: targetSubj,
    mastered: false,
    correctStreak: 0
  };
  delete restored.masteredAt;
  state.problems.unshift(restored);
  saveState(state);
  renderMastered();
  renderHome();
  if (!silent) {
    showToast(t('mastered.restoredToast'));
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
    showAlert(t('mastered.noneToReview'));
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
  addEls.title.textContent = t('add.titleNew');
  setSaveBtnLabel(t('add.save'));
  problemEditor.reset();
  answerEditor.reset();
  addEls.inputProblemText.value = '';
  addEls.inputAnswerText.value = '';
  addSubject = state.lastSubject && state.lastSubject !== '전체' ? state.lastSubject : '미분류';
  renderAddSubjectBar();
}

async function openEditProblem(p) {
  editingProblemId = p.id;
  addEls.title.textContent = t('add.titleEdit');
  setSaveBtnLabel(t('add.saveEdit'));
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
    showAlert(t('add.needProblem'));
    return;
  }

  if (countProblemsInSubject(addSubject, editingProblemId) >= MAX_PROBLEMS_PER_SUBJECT) {
    showAlert(t('add.subjectFull', { subject: formatSubjectLabel(addSubject), max: MAX_PROBLEMS_PER_SUBJECT }));
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
    showToast(isEditing ? t('add.toastUpdated') : t('add.toastSaved'));
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
      showToast(t('review.remainingToast', { count: remaining.length }), { icon: 'target', duration: 1500 });
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
          ? t('review.doneMasteredWithWrong', { total: reviewQueue.length, correct: sessionCorrect, wrong: sessionWrong })
          : t('review.doneMasteredAll', { total: reviewQueue.length });
    } else if (reviewLoopMode) {
      reviewEls.doneSummary.textContent = t('review.doneLoop', { total: loopStartCount });
    } else {
      reviewEls.doneSummary.textContent =
        sessionCleared > 0
          ? t('review.doneNormalCleared', { total: reviewQueue.length, cleared: sessionCleared })
          : t('review.doneNormal', { total: reviewQueue.length, correct: sessionCorrect, wrong: sessionWrong });
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
    showAlert(t('review.noProblems'));
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
        const mSubj = resolveValidSubject(mTarget.subject);
        if (countProblemsInSubject(mSubj) >= MAX_PROBLEMS_PER_SUBJECT) {
          showToast(t('review.subjectFullKeepMastered', { subject: formatSubjectLabel(mSubj), max: MAX_PROBLEMS_PER_SUBJECT }), { icon: 'info', duration: 1800 });
        } else {
          state.masteredProblems = state.masteredProblems.filter((p) => p.id !== curr.id);
          const restored = {
            ...mTarget,
            subject: mSubj,
            wrongCount: (mTarget.wrongCount || 0) + 1,
            correctStreak: 0,
            mastered: false
          };
          delete restored.masteredAt;
          state.problems.unshift(restored);
          saveState(state);
          showToast(t('review.restoredToWrongToast'), { icon: 'restore', duration: 1600 });
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
    showToast(t('review.clearedToast'), { cleared: true, icon: 'task_alt', duration: 1700 });
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

  area.addEventListener('dragstart', (e) => e.preventDefault());

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
    empty.textContent = t('subjectModal.empty');
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
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="material-symbols-rounded ms-icon" aria-hidden="true">check</span><span>${t('subjectModal.rename')}</span>`;

    input.addEventListener('input', () => {
      const val = input.value.trim();
      saveBtn.disabled = !val || val === subj;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !saveBtn.disabled) {
        saveBtn.click();
      }
    });

    saveBtn.addEventListener('click', () => {
      const nextName = input.value.trim();
      if (!nextName) {
        showAlert(t('subjectModal.needName'));
        return;
      }
      if (nextName === subj) return;
      if (state.subjects.includes(nextName)) {
        showAlert(t('subjectModal.duplicate'));
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
    delBtn.innerHTML = `<span class="material-symbols-rounded ms-icon" aria-hidden="true">delete</span><span>${t('subjectModal.delete')}</span>`;
    delBtn.addEventListener('click', async () => {
      const ok = await showConfirm(
        t('subjectModal.deleteConfirmMsg', { subject: subj }),
        { title: t('subjectModal.deleteConfirmTitle'), okText: t('card.delete'), danger: true }
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

function syncAddSubjectBtnState() {
  subjectModalEls.btnAdd.disabled = !subjectModalEls.inputNew.value.trim();
}

function handleAddSubjectFromModal() {
  const name = subjectModalEls.inputNew.value.trim();
  if (!name) {
    showAlert(t('subjectModal.needAddName'));
    return;
  }
  if (state.subjects.includes(name)) {
    showAlert(t('subjectModal.duplicate'));
    return;
  }
  if (state.subjects.length >= MAX_SUBJECTS) {
    showAlert(t('subjectModal.maxSubjects', { max: MAX_SUBJECTS }));
    return;
  }
  addNewSubject(name);
  subjectModalEls.inputNew.value = '';
  syncAddSubjectBtnState();
  renderSubjectManageList();
  renderHome();
  renderAddSubjectBar();
}

subjectModalEls.inputNew.addEventListener('input', syncAddSubjectBtnState);
subjectModalEls.btnAdd.addEventListener('click', handleAddSubjectFromModal);
subjectModalEls.inputNew.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleAddSubjectFromModal();
  }
});

function openSubjectModal() {
  subjectModalEls.inputNew.value = '';
  syncAddSubjectBtnState();
  renderSubjectManageList();
  navigateDrawerPage('subjects');
}

function closeSubjectModal() {
  renderHome();
  renderAddSubjectBar();
  navigateDrawerPage('main');
}

/* ================= 6. 내 학습 기준 설정 ================= */
function renderCriteriaModal() {
  criteriaEls.inputMasteryTarget.value = String(state.settings.masteryTarget || 2);
}

function openCriteriaModalFlow() {
  renderCriteriaModal();
  navigateDrawerPage('criteria');
}

function applyCriteriaTarget({ showInvalidAlert = false } = {}) {
  const raw = criteriaEls.inputMasteryTarget.value.trim();
  const masteryVal = Number(raw);
  if (!Number.isInteger(masteryVal) || masteryVal < 1 || masteryVal >= 20) {
    if (showInvalidAlert) {
      showAlert(t('criteriaModal.invalidNumber'));
    }
    return false;
  }
  if (state.settings.masteryTarget === masteryVal) return true;

  state.settings.masteryTarget = masteryVal;
  // 새 기준을 이미 채운 문제들은 정복 보관함으로 이동
  const newlyMastered = state.problems.filter((p) => (p.correctStreak || 0) >= masteryVal);
  if (newlyMastered.length > 0) {
    newlyMastered.forEach((p) => pushMasteredProblem(p));
    state.problems = state.problems.filter((p) => (p.correctStreak || 0) < masteryVal);
  }
  saveState(state);
  renderHome();
  return true;
}

criteriaEls.inputMasteryTarget.addEventListener('input', () => {
  applyCriteriaTarget({ showInvalidAlert: false });
});

criteriaEls.inputMasteryTarget.addEventListener('change', () => {
  if (!applyCriteriaTarget({ showInvalidAlert: true })) {
    renderCriteriaModal();
  }
});

/* ================= 7. 7일 무료 체험 & 평생 소장 ================= */
let cachedDisplayPrice = '';

function updateBuyButtonPriceText() {
  if (!licenseEls.btnBuyText) return;
  licenseEls.btnBuyText.textContent = cachedDisplayPrice
    ? t('license.buyBtnWithPrice', { price: cachedDisplayPrice })
    : t('license.buyBtn');
}

function updateLicenseUI() {
  const info = getLicenseStatus(license);
  if (settingsEls.licenseLabel) {
    settingsEls.licenseLabel.textContent =
      info.state === 'purchased' ? t('settings.licensePurchased') : t('settings.license');
  }
  settingsEls.licenseBadge.textContent =
    info.state === 'purchased'
      ? t('license.badgePurchased')
      : info.state === 'expired'
        ? t('license.badgeExpired')
        : t('license.badgeTrial');
  licenseEls.badge.textContent = info.label;
  const isPurchased = info.state === 'purchased';
  licenseEls.btnBuy.classList.toggle('hidden', isPurchased);
  licenseEls.btnRestore?.classList.toggle('hidden', isPurchased);
  updateBuyButtonPriceText();
}

function openLicenseModal(expiredNotice = false) {
  const info = getLicenseStatus(license);
  updateLicenseUI();
  licenseEls.title.textContent =
    info.state === 'expired' || expiredNotice
      ? t('license.titleExpired')
      : info.state === 'purchased'
        ? t('license.titlePurchased')
        : t('license.titleTrial');
  if (!settingsEls.modal.classList.contains('is-open')) {
    openSettingsDrawer('license');
  } else {
    navigateDrawerPage('license');
  }
  if (info.state !== 'purchased') {
    fetchLifetimeStorePrice().then((price) => {
      if (price) {
        cachedDisplayPrice = formatStorePrice(price);
        updateBuyButtonPriceText();
      }
    });
  }
}

async function syncPlayPurchaseSilently() {
  if (license.purchased) return;
  const result = await checkLifetimePurchase();
  if (result.purchased) {
    license.purchased = true;
    license.simulatedExpired = false;
    license.tampered = false;
    license.lastSeenAt = Date.now();
    saveLicense(license);
    updateLicenseUI();
  }
}

/* ================= 8. 왼쪽 슬라이드 설정 서랍 & 테마 ================= */
const THEME_COLORS = ['indigo', 'blue', 'emerald', 'amber', 'gold'];

const THEME_STORAGE_KEY = 'yj_wrong_note_theme_v1';

function loadSavedThemeIntoState() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.themeMode === 'dark' || parsed.themeMode === 'light') {
      state.settings.themeMode = parsed.themeMode;
    }
    if (THEME_COLORS.includes(parsed.themeColor)) {
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
  const color = THEME_COLORS.includes(state.settings.themeColor) ? state.settings.themeColor : 'indigo';
  document.documentElement.dataset.theme = mode;
  document.documentElement.dataset.accent = color;
  saveThemePref(mode, color);

  if (settingsEls.themeBadge) {
    const colorLabel = t(`theme.color.${color}`);
    const modeLabel = mode === 'dark' ? t('themeModal.darkShort') : t('themeModal.lightShort');
    settingsEls.themeBadge.textContent = `${colorLabel} · ${modeLabel}`;
  }
  themeEls.btnLight?.classList.toggle('active', mode === 'light');
  themeEls.btnDark?.classList.toggle('active', mode === 'dark');
  themeEls.colorGrid?.querySelectorAll('.theme-swatch-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.color === color);
  });
}

function openThemeModal() {
  applyTheme();
  navigateDrawerPage('theme');
}

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
let activeDrawerPage = 'main';

function navigateDrawerPage(page = 'main') {
  if (activeDrawerPage === 'criteria' && page !== 'criteria') {
    applyCriteriaTarget({ showInvalidAlert: false });
  }
  activeDrawerPage = page;
  const mainPage = settingsEls.modal.querySelector('.drawer-page-main');
  const subPages = settingsEls.modal.querySelectorAll('.drawer-subpage');
  if (mainPage) {
    mainPage.classList.toggle('is-pushed', page !== 'main');
  }
  subPages.forEach((el) => {
    el.classList.toggle('is-active', el.dataset.drawerPage === page);
  });
}

function openSettingsDrawer(initialPage = 'main') {
  if (drawerCloseTimer) {
    clearTimeout(drawerCloseTimer);
    drawerCloseTimer = null;
  }
  if (settingsEls.panel) {
    settingsEls.panel.classList.remove('is-swiping');
    settingsEls.panel.style.transform = '';
  }
  updateLicenseUI();
  navigateDrawerPage(initialPage);
  settingsEls.modal.classList.remove('hidden');
  settingsEls.modal.setAttribute('aria-hidden', 'false');
  void settingsEls.modal.offsetWidth;
  settingsEls.modal.classList.add('is-open');
}

function closeSettingsDrawer({ immediate = false } = {}) {
  if (activeDrawerPage === 'criteria') {
    applyCriteriaTarget({ showInvalidAlert: false });
  }
  if (settingsEls.panel) {
    settingsEls.panel.classList.remove('is-swiping');
    settingsEls.panel.style.transform = '';
  }
  settingsEls.modal.classList.remove('is-open');
  settingsEls.modal.setAttribute('aria-hidden', 'true');
  if (immediate) {
    settingsEls.modal.classList.add('hidden');
    navigateDrawerPage('main');
    return;
  }
  if (drawerCloseTimer) clearTimeout(drawerCloseTimer);
  drawerCloseTimer = setTimeout(() => {
    if (!settingsEls.modal.classList.contains('is-open')) {
      settingsEls.modal.classList.add('hidden');
      navigateDrawerPage('main');
    }
    drawerCloseTimer = null;
  }, 240);
}

homeEls.btnOpenDrawer?.addEventListener('click', () => openSettingsDrawer('main'));

settingsEls.modal.querySelectorAll('.btn-drawer-back').forEach((btn) => {
  btn.addEventListener('click', () => navigateDrawerPage('main'));
});

// 설정 슬라이드 왼쪽으로 밀어 닫기
(() => {
  const panel = settingsEls.panel;
  if (!panel) return;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let swiping = false;

  panel.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || !settingsEls.modal.classList.contains('is-open')) return;
    if (e.target.closest('input, textarea, select')) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    swiping = false;
  });

  panel.addEventListener('pointermove', (e) => {
    if (pointerId !== e.pointerId) return;
    const curDx = e.clientX - startX;
    const curDy = e.clientY - startY;

    if (!swiping) {
      if (curDx < -12 && Math.abs(curDx) > Math.abs(curDy) * 1.2) {
        swiping = true;
        panel.classList.add('is-swiping');
        panel.setPointerCapture?.(e.pointerId);
      } else if (Math.abs(curDy) > 14 || curDx > 14) {
        pointerId = null;
        return;
      } else {
        return;
      }
    }

    dx = Math.min(0, curDx);
    panel.style.transform = `translateX(${dx}px)`;
  });

  function finishDrawerSwipe(e) {
    if (pointerId !== e.pointerId) return;
    pointerId = null;
    if (!swiping) return;
    swiping = false;
    panel.classList.remove('is-swiping');
    panel.style.transform = '';
    if (dx <= -65) {
      closeSettingsDrawer();
    }
  }

  panel.addEventListener('pointerup', finishDrawerSwipe);
  panel.addEventListener('pointercancel', finishDrawerSwipe);
})();

settingsEls.modal.addEventListener('click', (e) => {
  const helpBtn = e.target.closest('.btn-help-q');
  if (helpBtn) {
    const msgKey = helpBtn.dataset.helpKey;
    const titleKey = helpBtn.dataset.helpTitle;
    if (msgKey) {
      showAlert(t(msgKey), { title: titleKey ? t(titleKey) : t('dialog.alertTitle') });
    }
    return;
  }
  if (e.target === settingsEls.modal) {
    closeSettingsDrawer();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && settingsEls.modal.classList.contains('is-open')) {
    if (activeDrawerPage !== 'main') {
      navigateDrawerPage('main');
    } else {
      closeSettingsDrawer();
    }
  }
});

settingsEls.menuSubjects.addEventListener('click', () => {
  openSubjectModal();
});

settingsEls.menuCriteria.addEventListener('click', () => {
  openCriteriaModalFlow();
});

settingsEls.menuTheme?.addEventListener('click', () => {
  openThemeModal();
});

function updateLanguageUI() {
  const activeLang = getLang();
  if (settingsEls.languageBadge) {
    settingsEls.languageBadge.textContent = t(`lang.name.${activeLang}`);
  }
  languageEls.optionList?.querySelectorAll('.language-option-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === activeLang);
  });
}

function applyLanguageChange() {
  applyStaticTranslations();
  applyTheme();
  updateLicenseUI();
  updateLanguageUI();
  renderHome();
  renderMastered();
  renderAddSubjectBar();
}

function openLanguageModal() {
  updateLanguageUI();
  navigateDrawerPage('language');
}

settingsEls.menuLanguage?.addEventListener('click', () => {
  openLanguageModal();
});

languageEls.optionList?.addEventListener('click', (e) => {
  const btn = e.target.closest('.language-option-btn');
  if (!btn || !btn.dataset.lang) return;
  setLangPref(btn.dataset.lang);
  applyLanguageChange();
});

window.addEventListener('languagechange', () => {
  if (getLangPref() === 'auto') {
    applyLanguageChange();
  }
});

settingsEls.menuLicense.addEventListener('click', () => {
  openLicenseModal(false);
});

const LEGAL_URL_BASE = 'https://yjstudio.app/wrongnote';

settingsEls.linkGuide.addEventListener('click', () => {
  window.open(`${LEGAL_URL_BASE}#guide`, '_blank', 'noopener,noreferrer');
});

settingsEls.linkTerms.addEventListener('click', () => {
  window.open(`${LEGAL_URL_BASE}#terms`, '_blank', 'noopener,noreferrer');
});

settingsEls.linkPrivacy.addEventListener('click', () => {
  window.open(`${LEGAL_URL_BASE}#privacy`, '_blank', 'noopener,noreferrer');
});

async function showWelcomeGuide({ markSeen = false } = {}) {
  await showAlert(t('welcome.message'), {
    title: t('welcome.title'),
    okText: t('welcome.ok')
  });
  if (markSeen) {
    try {
      localStorage.setItem(WELCOME_GUIDE_SEEN_KEY, '1');
    } catch {
      // 무시
    }
  }
}

settingsEls.menuWelcomeGuide?.addEventListener('click', async () => {
  closeSettingsDrawer();
  await showWelcomeGuide({ markSeen: true });
});

licenseEls.btnBuy.addEventListener('click', async () => {
  if (licenseEls.btnBuy.disabled) return;
  licenseEls.btnBuy.disabled = true;
  try {
    const result = await purchaseLifetime();
    if (!result.ok) {
      if (result.cancelled) {
        showToast(result.reason);
      } else {
        await showAlert(result.reason);
      }
      return;
    }
    license.purchased = true;
    license.simulatedExpired = false;
    license.tampered = false;
    license.lastSeenAt = Date.now();
    saveLicense(license);
    updateLicenseUI();
    navigateDrawerPage('main');
    await showAlert(t('license.buySuccessMsg'), {
      title: t('license.buySuccessTitle')
    });
  } finally {
    licenseEls.btnBuy.disabled = false;
  }
});

licenseEls.btnRestore?.addEventListener('click', async () => {
  if (licenseEls.btnRestore.disabled) return;
  licenseEls.btnRestore.disabled = true;
  try {
    const result = await checkLifetimePurchase();
    if (!result.available) {
      await showAlert(t('license.playOnlyMsg'));
      return;
    }
    if (!result.purchased) {
      await showAlert(t('license.restoreNotFoundMsg'));
      return;
    }
    license.purchased = true;
    license.simulatedExpired = false;
    license.tampered = false;
    license.lastSeenAt = Date.now();
    saveLicense(license);
    updateLicenseUI();
    navigateDrawerPage('main');
    await showAlert(t('license.restoreSuccessMsg'), {
      title: t('license.buySuccessTitle')
    });
  } finally {
    licenseEls.btnRestore.disabled = false;
  }
});

// 초기 화면 그리기 및 다국어·테마·물결 터치 반응 연결
applyStaticTranslations();
loadSavedThemeIntoState();
applyTheme();
initRippleFeedback();
updateLicenseUI();
updateLanguageUI();
renderHome();
syncPlayPurchaseSilently();

try {
  if (!localStorage.getItem(WELCOME_GUIDE_SEEN_KEY)) {
    showWelcomeGuide({ markSeen: true });
  }
} catch {
  // 무시
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
