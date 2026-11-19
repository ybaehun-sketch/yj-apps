import { t, formatSubjectLabel } from './i18n.js';

/**
 * 가로 1줄 과목 버튼 + 오른쪽 고정 [과목설정] 단일 버튼 부품
 * - 과목이 많아져도 오른쪽 [과목설정] 버튼은 항상 화면에 고정됩니다.
 * - 모바일 터치뿐만 아니라 PC 마우스 드래그·휠로도 옆으로 밀어 과목을 고를 수 있습니다.
 * - 홈 화면에서는 [전체]와 [미분류] 모두 과목처럼 선택할 수 있습니다.
 */
export function renderSubjectBar({
  container,
  subjects,
  selected,
  includeAll = true,
  counts = null,
  onSelect,
  onOpenManage
}) {
  const prevScrollLeft = container.querySelector('.subject-scroll')?.scrollLeft || 0;
  container.innerHTML = '';

  const scrollTrack = document.createElement('div');
  scrollTrack.className = 'subject-scroll';

  const items = includeAll ? ['전체', '미분류', ...subjects] : ['미분류', ...subjects];

  let isDragging = false;
  let moved = false;
  let startX = 0;
  let startScrollLeft = 0;

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 4) moved = true;
    scrollTrack.scrollLeft = startScrollLeft - dx;
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    scrollTrack.classList.remove('is-dragging');
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  scrollTrack.addEventListener('mousedown', (e) => {
    isDragging = true;
    moved = false;
    startX = e.pageX;
    startScrollLeft = scrollTrack.scrollLeft;
    scrollTrack.classList.add('is-dragging');
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  // 마우스 휠을 위아래로 굴려도 가로로 부드럽게 이동
  scrollTrack.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        scrollTrack.scrollLeft += e.deltaY;
      }
    },
    { passive: false }
  );

  items.forEach((name) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `subject-pill${selected === name ? ' active' : ''}`;
    const displayName = formatSubjectLabel(name);
    if (counts && typeof counts[name] === 'number') {
      const labelSpan = document.createElement('span');
      labelSpan.textContent = displayName;
      const countSpan = document.createElement('span');
      countSpan.className = 'subject-pill-count';
      countSpan.textContent = String(counts[name]);
      btn.appendChild(labelSpan);
      btn.appendChild(countSpan);
    } else {
      btn.textContent = displayName;
    }
    btn.addEventListener('click', (e) => {
      if (moved) {
        e.preventDefault();
        return;
      }
      onSelect(name);
    });
    scrollTrack.appendChild(btn);
  });

  container.appendChild(scrollTrack);
  scrollTrack.scrollLeft = prevScrollLeft;

  if (onOpenManage) {
    const fixedActions = document.createElement('div');
    fixedActions.className = 'subject-fixed-actions';

    const manageBtn = document.createElement('button');
    manageBtn.type = 'button';
    manageBtn.className = 'subject-pill manage-pill';
    manageBtn.innerHTML = `<span class="material-symbols-rounded ms-icon" aria-hidden="true">tune</span><span>${t('subject.manage')}</span>`;
    manageBtn.addEventListener('click', onOpenManage);
    fixedActions.appendChild(manageBtn);

    container.appendChild(fixedActions);
  }
}
