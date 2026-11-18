import { loadState, saveState, compressImageFile } from './modules/storage.js?v=20261116e';
import { renderSubjectBar } from './modules/subjectBar.js?v=20261116i';
import { createMagicEraser } from './modules/magicEraser.js?v=20261116g';
import { buildReviewQueue, renderReviewCard } from './modules/reviewDeck.js?v=20261116h';
import { renderPrintPreview } from './modules/examPrint.js?v=20261116f';
import { showAlert, showConfirm } from './modules/dialog.js';
import { loadLicense, saveLicense, getLicenseStatus } from './modules/trialLicense.js?v=20261116d';

let state = loadState();
let license = loadLicense();
let activeSubject = '전체';
let wrongOnly = false;

// 등록/수정 화면 임시 상태
let addSubject = state.lastSubject && state.lastSubject !== '전체' ? state.lastSubject : '미분류';
let editingProblemId = null;

// 복습 화면 상태
let reviewQueue = [];
let reviewIdx = 0;
let sessionCorrect = 0;
let sessionWrong = 0;
let sessionCleared = 0;

// 화면 요소
const screens = {
  home: document.getElementById('screen-home'),
  add: document.getElementById('screen-add'),
  review: document.getElementById('screen-review')
};

const homeEls = {
  subjectBar: document.getElementById('home-subject-bar'),
  toggleWrongOnly: document.getElementById('toggle-wrong-only'),
  subjectTotalSummary: document.getElementById('subject-total-summary'),
  btnStartReview: document.getElementById('btn-start-review'),
  problemList: document.getElementById('problem-list'),
  btnFabAdd: document.getElementById('btn-fab-add'),
  btnOpenSettings: document.getElementById('btn-open-settings')
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
  btnReviewHome: document.getElementById('btn-review-home')
};

const printEls = {
  modal: document.getElementById('print-modal'),
  btnClose: document.getElementById('btn-close-print'),
  wrongOnly: document.getElementById('print-wrong-only'),
  countInfo: document.getElementById('print-count-info'),
  previewArea: document.getElementById('print-preview-area'),
  btnDoPrint: document.getElementById('btn-do-print'),
  printRoot: document.getElementById('a4-print-root')
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
  inputMasteryTarget: document.getElementById('input-mastery-target'),
  inputWrongMinCount: document.getElementById('input-wrong-min-count')
};

const licenseEls = {
  modal: document.getElementById('license-modal'),
  title: document.getElementById('license-modal-title'),
  badge: document.getElementById('license-badge-text'),
  btnClose: document.getElementById('btn-close-license'),
  btnBuy: document.getElementById('btn-buy-lifetime'),
  btnRestore: document.getElementById('btn-restore-purchase'),
  btnSimTrial: document.getElementById('btn-sim-trial'),
  btnSimExpired: document.getElementById('btn-sim-expired'),
  btnSimPurchased: document.getElementById('btn-sim-purchased')
};

const settingsEls = {
  modal: document.getElementById('settings-modal'),
  btnClose: document.getElementById('btn-close-settings'),
  menuSubjects: document.getElementById('menu-open-subjects'),
  menuCriteria: document.getElementById('menu-open-criteria'),
  menuPrint: document.getElementById('menu-open-print'),
  menuLicense: document.getElementById('menu-open-license'),
  licenseSub: document.getElementById('settings-license-sub'),
  licenseBadge: document.getElementById('settings-license-badge'),
  linkGuide: document.getElementById('link-guide'),
  linkTerms: document.getElementById('link-terms'),
  linkPrivacy: document.getElementById('link-privacy')
};

const solveChoiceEls = {
  modal: document.getElementById('solve-choice-modal'),
  desc: document.getElementById('solve-choice-desc'),
  btnAll: document.getElementById('btn-solve-all'),
  allCount: document.getElementById('solve-all-count'),
  btnWrong: document.getElementById('btn-solve-wrong'),
  wrongCount: document.getElementById('solve-wrong-count'),
  btnClose: document.getElementById('btn-close-solve-choice')
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

function getFilteredProblems(onlyWrongFlag = wrongOnly) {
  return state.problems.filter((p) => {
    const subj = p.subject || '미분류';
    const matchSubject = activeSubject === '전체' || subj === activeSubject;
    let matchWrong = true;
    if (onlyWrongFlag) {
      const minWrong = state.settings.wrongMinCount || 2;
      matchWrong = p.wrongCount >= minWrong;
    }
    return matchSubject && matchWrong;
  });
}

function addNewSubject(name) {
  if (!state.subjects.includes(name)) {
    state.subjects.push(name);
    saveState(state);
  }
  return name;
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

function renderHome() {
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

  const allInSubject = getFilteredProblems(false);
  const list = getFilteredProblems();
  homeEls.subjectTotalSummary.textContent = wrongOnly
    ? `${list.length} / 전체 ${allInSubject.length}문제`
    : `전체 ${allInSubject.length}문제`;

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

  list.forEach((p) => {
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
    if (p.wrongCount > 0) {
      status.className = 'badge-wrong';
      status.textContent = `${p.wrongCount}번 틀림`;
    } else {
      status.className = 'badge-new';
      status.textContent = '복습 전';
    }
    badges.appendChild(status);
    info.appendChild(badges);

    const title = document.createElement('div');
    title.className = 'problem-title';
    title.textContent = p.problemText || '사진 문제 (눌러서 바로 복습)';
    info.appendChild(title);

    const subText = document.createElement('div');
    subText.className = 'problem-sub';
    const targetCount = state.settings.masteryTarget || 2;
    const streak = p.correctStreak || 0;
    subText.textContent = `연속 ${streak}/${targetCount}번 맞히면 자동 삭제 · 눌러서 풀기`;
    info.appendChild(subText);

    card.appendChild(info);

    const cardActions = document.createElement('div');
    cardActions.className = 'card-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-card-edit';
    editBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">edit</span><span>수정</span>';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditProblem(p);
    });
    cardActions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-card-del';
    delBtn.innerHTML = '<span class="material-symbols-rounded ms-icon" aria-hidden="true">delete</span><span>삭제</span>';
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
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
    cardActions.appendChild(delBtn);

    card.appendChild(cardActions);

    // 카드를 누르면 해당 문제부터 바로 복습 시작
    card.addEventListener('click', () => startReview([p]));
    homeEls.problemList.appendChild(card);
  });
}

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
    },
    onOpenManage: openSubjectModal
  });
}

function resetAddForm() {
  editingProblemId = null;
  addEls.title.textContent = '3초 오답 올리기';
  addEls.btnSave.textContent = '저장하기';
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
  addEls.btnSave.textContent = '수정 완료';
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

  const finalProblemImgs = problemEditor.exportImages();
  const finalAnswerImgs = answerEditor.exportImages();

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
  }
});

/* ================= 3. 다시 풀기 (가림막 복습) ================= */
function startReview(customList = null) {
  const source = customList || getFilteredProblems();
  if (!source.length) return;
  reviewQueue = buildReviewQueue(source);
  reviewIdx = 0;
  sessionCorrect = 0;
  sessionWrong = 0;
  sessionCleared = 0;

  reviewEls.cardArea.classList.remove('hidden');
  reviewEls.actionBar.classList.remove('hidden');
  reviewEls.doneArea.classList.add('hidden');
  showScreen('review');
  showCurrentReviewCard();
}

function showCurrentReviewCard() {
  if (reviewIdx >= reviewQueue.length) {
    reviewEls.cardArea.classList.add('hidden');
    reviewEls.actionBar.classList.add('hidden');
    reviewEls.doneArea.classList.remove('hidden');
    reviewEls.doneSummary.textContent =
      sessionCleared > 0
        ? `총 ${reviewQueue.length}문제 중 ${sessionCleared}문제를 정복해서 목록에서 비웠어요!`
        : `총 ${reviewQueue.length}문제 중 ${sessionCorrect}문제 맞혔고, ${sessionWrong}문제 다시 틀렸어요.`;
    return;
  }
  renderReviewCard({
    problem: reviewQueue[reviewIdx],
    index: reviewIdx,
    total: reviewQueue.length,
    subjectLabel: activeSubject,
    els: reviewEls
  });
}

homeEls.btnStartReview.addEventListener('click', () => {
  const allInSubject = getFilteredProblems(false);
  const wrongInSubject = getFilteredProblems(true);
  if (allInSubject.length === 0) {
    showAlert('현재 과목에 등록된 문제가 없어요.\n오른쪽 아래 [＋ 오답 올리기]로 문제를 먼저 추가해 주세요.');
    return;
  }
  solveChoiceEls.desc.textContent = `[${activeSubject}] 과목에서 어떤 문제를 풀어볼까요?`;
  solveChoiceEls.allCount.textContent = `${allInSubject.length}문제`;
  solveChoiceEls.wrongCount.textContent = `${wrongInSubject.length}문제`;
  solveChoiceEls.btnAll.disabled = allInSubject.length === 0;
  solveChoiceEls.btnWrong.disabled = wrongInSubject.length === 0;
  solveChoiceEls.modal.classList.remove('hidden');
});

solveChoiceEls.btnAll.addEventListener('click', () => {
  solveChoiceEls.modal.classList.add('hidden');
  startReview(getFilteredProblems(false));
});

solveChoiceEls.btnWrong.addEventListener('click', () => {
  solveChoiceEls.modal.classList.add('hidden');
  startReview(getFilteredProblems(true));
});

solveChoiceEls.btnClose.addEventListener('click', () => {
  solveChoiceEls.modal.classList.add('hidden');
});
homeEls.toggleWrongOnly.addEventListener('change', (e) => {
  wrongOnly = e.target.checked;
  renderHome();
});

reviewEls.curtainBtn.addEventListener('click', () => {
  reviewEls.curtainBtn.classList.add('hidden');
  reviewEls.curtainBox.classList.remove('is-covered');
});

reviewEls.btnMarkWrong.addEventListener('click', () => {
  const curr = reviewQueue[reviewIdx];
  const target = state.problems.find((p) => p.id === curr.id);
  if (target) {
    target.wrongCount += 1;
    target.correctStreak = 0;
    target.mastered = false;
    saveState(state);
  }
  sessionWrong += 1;
  reviewIdx += 1;
  showCurrentReviewCard();
});

reviewEls.btnMarkCorrect.addEventListener('click', () => {
  const curr = reviewQueue[reviewIdx];
  const target = state.problems.find((p) => p.id === curr.id);
  if (target) {
    target.correctStreak = (target.correctStreak || 0) + 1;
    const targetCount = state.settings.masteryTarget || 2;
    if (target.correctStreak >= targetCount) {
      // 정복 표시를 남기지 않고 목록에서 미련 없이 즉시 삭제
      state.problems = state.problems.filter((p) => p.id !== curr.id);
      sessionCleared += 1;
    }
    saveState(state);
  }
  sessionCorrect += 1;
  reviewIdx += 1;
  showCurrentReviewCard();
});

reviewEls.btnExit.addEventListener('click', () => {
  renderHome();
  showScreen('home');
});
reviewEls.btnReviewHome.addEventListener('click', () => {
  renderHome();
  showScreen('home');
});
reviewEls.btnReviewAgain.addEventListener('click', () => startReview(reviewQueue));

/* ================= 4. A4 시험지 뽑기 ================= */
function updatePrintModal() {
  const list = getFilteredProblems(printEls.wrongOnly.checked);
  printEls.countInfo.textContent = `${list.length}문제`;
  renderPrintPreview({
    problems: list,
    subjectLabel: activeSubject,
    previewEl: printEls.previewArea,
    printRootEl: printEls.printRoot
  });
}

function openPrintModalFlow() {
  if (getLicenseStatus(license).state === 'expired') {
    openLicenseModal(true);
    return;
  }
  updatePrintModal();
  printEls.modal.classList.remove('hidden');
}
printEls.btnClose.addEventListener('click', () => {
  printEls.modal.classList.add('hidden');
});
printEls.wrongOnly.addEventListener('change', updatePrintModal);
printEls.btnDoPrint.addEventListener('click', () => {
  window.print();
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
      if (activeSubject === subj) activeSubject = nextName;
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
      if (activeSubject === subj) activeSubject = '전체';
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
  criteriaEls.inputWrongMinCount.value = String(state.settings.wrongMinCount || 2);
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
  const wrongMinVal = Number(criteriaEls.inputWrongMinCount.value);
  if (!Number.isInteger(masteryVal) || masteryVal < 1 || masteryVal >= 20) {
    await showAlert('자동 삭제 기준 횟수는 1에서 19(20회 미만) 사이의 숫자로 입력해 주세요.');
    return;
  }
  if (!Number.isInteger(wrongMinVal) || wrongMinVal < 1 || wrongMinVal >= 20) {
    await showAlert('틀린 횟수 기준은 1에서 19(20회 미만) 사이의 숫자로 입력해 주세요.');
    return;
  }

  state.settings.masteryTarget = masteryVal;
  state.settings.wrongMinCount = wrongMinVal;
  // 새 기준을 이미 채운 문제들은 미련 없이 즉시 정리
  state.problems = state.problems.filter((p) => (p.correctStreak || 0) < masteryVal);
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

/* ================= 8. 통합 설정 메뉴 ================= */
homeEls.btnOpenSettings.addEventListener('click', () => {
  updateLicenseUI();
  settingsEls.modal.classList.remove('hidden');
});

settingsEls.btnClose.addEventListener('click', () => {
  settingsEls.modal.classList.add('hidden');
});

settingsEls.menuSubjects.addEventListener('click', () => {
  settingsEls.modal.classList.add('hidden');
  openSubjectModal();
});

settingsEls.menuCriteria.addEventListener('click', () => {
  settingsEls.modal.classList.add('hidden');
  openCriteriaModalFlow();
});

settingsEls.menuPrint.addEventListener('click', () => {
  settingsEls.modal.classList.add('hidden');
  openPrintModalFlow();
});

settingsEls.menuLicense.addEventListener('click', () => {
  settingsEls.modal.classList.add('hidden');
  openLicenseModal(false);
});

settingsEls.linkGuide.addEventListener('click', () => {
  showAlert(
    '1. 틀린 문제를 사진(최대 2장)이나 메모로 3초 만에 올립니다.\n2. 복습하며 가림막을 열어 풀고 맞혔어요/틀렸어요를 누릅니다.\n3. 내가 정한 횟수만큼 연속으로 맞히면 정복 완료로 보고 목록에서 미련 없이 자동 삭제됩니다.',
    { title: '이용방법' }
  );
});

settingsEls.linkTerms.addEventListener('click', () => {
  showAlert(
    '이 앱은 틀린 문제만 가볍게 보고 정복한 문제는 자동 삭제되는 초간편 오답노트입니다.\n회원가입 없이 내 휴대폰에만 저장되므로, 앱을 지우면 저장된 문제도 함께 삭제됩니다.',
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

licenseEls.btnSimTrial.addEventListener('click', () => {
  license.purchased = false;
  license.simulatedExpired = false;
  license.tampered = false;
  license.startedAt = Date.now();
  license.lastSeenAt = Date.now();
  saveLicense(license);
  updateLicenseUI();
  openLicenseModal(false);
});

licenseEls.btnSimExpired.addEventListener('click', () => {
  license.purchased = false;
  license.simulatedExpired = true;
  license.tampered = false;
  saveLicense(license);
  updateLicenseUI();
  openLicenseModal(true);
});

licenseEls.btnSimPurchased.addEventListener('click', () => {
  license.purchased = true;
  license.simulatedExpired = false;
  license.tampered = false;
  license.lastSeenAt = Date.now();
  saveLicense(license);
  updateLicenseUI();
  openLicenseModal(false);
});

// 초기 화면 그리기
updateLicenseUI();
renderHome();
