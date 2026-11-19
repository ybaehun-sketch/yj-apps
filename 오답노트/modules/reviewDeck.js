import { t, formatSubjectLabel } from './i18n.js';
import { isSafeImageDataUrl } from './storage.js';

/**
 * 「10초 가림막 복습」 부품
 * - 많이 틀린 문제 / 미정복 문제 우선 정렬
 * - 가림막 터치로 정답 확인 → 맞혔어요 / 또 틀렸어요 원터치 이동
 */
export function buildReviewQueue(problems) {
  return [...problems].sort((a, b) => {
    if (a.mastered !== b.mastered) return a.mastered ? 1 : -1;
    if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount;
    return b.createdAt - a.createdAt;
  });
}

export function renderReviewCard({
  problem,
  index,
  total,
  subjectLabel,
  els
}) {
  els.progress.textContent = `${index + 1} / ${total}`;
  els.subjectTag.textContent = formatSubjectLabel(subjectLabel);

  // 메타 배지
  els.metaRow.innerHTML = '';
  const subBadge = document.createElement('span');
  subBadge.className = 'badge-subject';
  subBadge.textContent = formatSubjectLabel(problem.subject);
  els.metaRow.appendChild(subBadge);

  const statusBadge = document.createElement('span');
  if (problem.mastered) {
    statusBadge.className = 'badge-mastered';
    statusBadge.textContent = t('card.mastered');
  } else if (problem.wrongCount > 0) {
    statusBadge.className = 'badge-wrong';
    statusBadge.textContent = t('card.wrongCount', { count: problem.wrongCount });
  } else {
    statusBadge.className = 'badge-new';
    statusBadge.textContent = t('card.beforeMastery');
  }
  els.metaRow.appendChild(statusBadge);

  // 문제 내용 (최대 2장 지원)
  els.problemContent.innerHTML = '';
  const problemImgs = (Array.isArray(problem.problemImgs) && problem.problemImgs.length
    ? problem.problemImgs
    : problem.problemImg ? [problem.problemImg] : []
  ).filter(isSafeImageDataUrl);
  problemImgs.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = t('review.problemImgAlt', { num: i + 1 });
    img.draggable = false;
    if (i > 0) img.style.marginTop = '8px';
    els.problemContent.appendChild(img);
  });
  if (problem.problemText) {
    const p = document.createElement('div');
    p.className = 'review-problem-text';
    p.textContent = problem.problemText;
    els.problemContent.appendChild(p);
  }

  // 정답 · 해설 내용 (최대 2장 지원)
  els.answerContent.innerHTML = '';
  if (problem.answerText) {
    const ans = document.createElement('div');
    ans.textContent = problem.answerText;
    els.answerContent.appendChild(ans);
  }
  const answerImgs = (Array.isArray(problem.answerImgs) && problem.answerImgs.length
    ? problem.answerImgs
    : problem.answerImg ? [problem.answerImg] : []
  ).filter(isSafeImageDataUrl);
  answerImgs.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = t('review.answerImgAlt', { num: i + 1 });
    img.draggable = false;
    els.answerContent.appendChild(img);
  });
  if (!problem.answerText && answerImgs.length === 0) {
    const empty = document.createElement('div');
    empty.style.color = '#6b7280';
    empty.textContent = t('review.noAnswerMemo');
    els.answerContent.appendChild(empty);
  }

  // 가림막 다시 덮기
  els.curtainBtn.classList.remove('hidden');
  els.curtainBox?.classList.add('is-covered');
}
