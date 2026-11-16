/**
 * 「시험 전날 나만의 A4 시험지 뽑기」 부품
 * - 모달 미리보기 렌더링 + 실제 A4 인쇄용 페이지(앞장 문제지 + 뒷장 정답지) 생성
 */
export function renderPrintPreview({ problems, subjectLabel, previewEl, printRootEl }) {
  previewEl.innerHTML = '';
  printRootEl.innerHTML = '';

  if (problems.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'preview-page-card';
    empty.textContent = '인쇄할 문제가 없습니다. 필터를 변경하거나 오답을 먼저 등록해 주세요.';
    previewEl.appendChild(empty);
    return;
  }

  // 1) 모달 미리보기 (문제 + 정답 요약)
  const qCard = document.createElement('div');
  qCard.className = 'preview-page-card';
  const qTitle = document.createElement('h4');
  qTitle.textContent = `📝 나만의 오답 시험지 (${subjectLabel} · 총 ${problems.length}문제)`;
  qCard.appendChild(qTitle);

  problems.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'preview-q-item';

    const num = document.createElement('strong');
    num.textContent = `${idx + 1}. [${p.subject || '미분류'}] `;
    item.appendChild(num);

    if (p.problemText) {
      const span = document.createElement('span');
      span.textContent = p.problemText;
      item.appendChild(span);
    }
    const pImgs = Array.isArray(p.problemImgs) && p.problemImgs.length
      ? p.problemImgs
      : p.problemImg ? [p.problemImg] : [];
    pImgs.forEach((src, imgIdx) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `문제 ${idx + 1}-${imgIdx + 1}`;
      item.appendChild(img);
    });
    qCard.appendChild(item);
  });

  const aCard = document.createElement('div');
  aCard.className = 'preview-page-card';
  const aTitle = document.createElement('h4');
  aTitle.textContent = '✅ 빠른 정답 및 해설지 (뒷장)';
  aCard.appendChild(aTitle);

  problems.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'preview-q-item';
    const num = document.createElement('strong');
    num.textContent = `${idx + 1}번 정답: `;
    item.appendChild(num);

    const ans = document.createElement('span');
    ans.textContent = p.answerText || '(사진 해설 참고)';
    item.appendChild(ans);
    aCard.appendChild(item);
  });

  previewEl.appendChild(qCard);
  previewEl.appendChild(aCard);

  // 2) 실제 A4 인쇄 전용 영역 (앞장 문제지 + 뒷장 정답지)
  const qPage = document.createElement('div');
  qPage.className = 'a4-page';
  qPage.innerHTML = `
    <div class="a4-header">
      <h2>📝 나만의 오답 시험지 (${escapeHtml(subjectLabel)})</h2>
      <span>총 ${problems.length}문제</span>
    </div>
  `;
  problems.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'a4-item';
    const title = document.createElement('div');
    title.innerHTML = `<strong>${idx + 1}.</strong> <small>[${escapeHtml(p.subject || '미분류')} · ${p.wrongCount}회 오답]</small>`;
    item.appendChild(title);

    if (p.problemText) {
      const txt = document.createElement('div');
      txt.style.marginTop = '4px';
      txt.style.whiteSpace = 'pre-wrap';
      txt.textContent = p.problemText;
      item.appendChild(txt);
    }
    const pImgs = Array.isArray(p.problemImgs) && p.problemImgs.length
      ? p.problemImgs
      : p.problemImg ? [p.problemImg] : [];
    pImgs.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      item.appendChild(img);
    });
    const space = document.createElement('div');
    space.className = 'a4-solve-space';
    item.appendChild(space);
    qPage.appendChild(item);
  });

  const aPage = document.createElement('div');
  aPage.className = 'a4-page';
  aPage.innerHTML = `
    <div class="a4-header">
      <h2>✅ 정답 및 해설지</h2>
      <span>${escapeHtml(subjectLabel)}</span>
    </div>
  `;
  problems.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'a4-item';
    const row = document.createElement('div');
    row.innerHTML = `<strong>${idx + 1}번.</strong> `;
    const span = document.createElement('span');
    span.textContent = p.answerText || '(아래 해설 이미지 참고)';
    row.appendChild(span);
    item.appendChild(row);
    const aImgs = Array.isArray(p.answerImgs) && p.answerImgs.length
      ? p.answerImgs
      : p.answerImg ? [p.answerImg] : [];
    aImgs.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      item.appendChild(img);
    });
    aPage.appendChild(item);
  });

  printRootEl.appendChild(qPage);
  printRootEl.appendChild(aPage);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
