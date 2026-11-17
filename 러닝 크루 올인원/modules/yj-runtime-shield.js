(function() {
  // 전역 런타임 예외 및 에셋 로드 실패 방어막 (B1 검증 자산 재활용)
  window.addEventListener('error', function(e) {
    if (e && e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'AUDIO')) {
      if (e.target.tagName === 'IMG' && !e.target.dataset.fallbackApplied) {
        e.target.dataset.fallbackApplied = '1';
        e.target.style.background = '#1e293b';
        e.target.style.minHeight = '40px';
      }
      e.preventDefault();
    }
  }, true);

  window.addEventListener('unhandledrejection', function(e) {
    if (e && e.preventDefault) e.preventDefault();
  });

  if (typeof window.confetti === 'undefined') {
    window.confetti = function() {};
  }
})();
