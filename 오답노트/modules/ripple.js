/**
 * 가벼운 포인터 위치 기준 물결 터치 반응 부품
 * - 카드의 드롭다운 메뉴가 잘리지 않도록 별도 클립 레이어(.ripple-clip) 안에 물결을 띄웁니다.
 * - 애니메이션이 끝나면 요소를 즉시 정리해 메모리를 남기지 않습니다.
 */
const INTERACTIVE_SELECTOR = [
  'button:not(:disabled)',
  '.btn-upload',
  '.problem-card',
  '.settings-menu-item',
  '.curtain-overlay'
].join(', ');

const LIGHT_RIPPLE_CLASSES = [
  'btn-bottom-add',
  'btn-primary-lg',
  'btn-primary-xs',
  'btn-correct',
  'subject-pill active',
  'tool-btn active',
  'dialog-btn-ok'
];

function needsLightRipple(el) {
  if (el.classList.contains('active') && (el.classList.contains('subject-pill') || el.classList.contains('tool-btn'))) {
    return true;
  }
  return LIGHT_RIPPLE_CLASSES.some((cls) => !cls.includes(' ') && el.classList.contains(cls));
}

function getRippleClip(host) {
  let clip = host.querySelector(':scope > .ripple-clip');
  if (!clip) {
    clip = document.createElement('span');
    clip.className = 'ripple-clip';
    clip.setAttribute('aria-hidden', 'true');
    host.insertBefore(clip, host.firstChild);
  }
  return clip;
}

export function initRippleFeedback() {
  if (window.__yjRippleInitialized) return;
  window.__yjRippleInitialized = true;

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button > 0) return;
      const host = e.target?.closest?.(INTERACTIVE_SELECTOR);
      if (!host) return;
      // 카드 오른쪽 메뉴 버튼이나 드롭다운을 눌렀을 때는 바깥 카드 물결 중복 방지
      if (host.classList.contains('problem-card') && e.target.closest('.card-actions')) {
        return;
      }

      const style = getComputedStyle(host);
      if (style.position === 'static') {
        host.style.position = 'relative';
      }

      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const size = Math.max(rect.width, rect.height) * 2.1;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const clip = getRippleClip(host);
      const wave = document.createElement('span');
      wave.className = `ripple-wave${needsLightRipple(host) ? ' is-light' : ''}`;
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;

      clip.appendChild(wave);

      const cleanup = () => {
        wave.remove();
      };
      wave.addEventListener('animationend', cleanup, { once: true });
      setTimeout(cleanup, 600);
    },
    { passive: true }
  );
}
