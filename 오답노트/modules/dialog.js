import { t } from './i18n.js';

/**
 * 앱 내부 깔끔한 알림·확인 팝업 부품 (브라우저 시스템 팝업 대체)
 */
let dialogEls = null;
let resolver = null;

function ensureElements() {
  if (dialogEls) return dialogEls;
  dialogEls = {
    backdrop: document.getElementById('app-dialog'),
    title: document.getElementById('app-dialog-title'),
    message: document.getElementById('app-dialog-message'),
    btnCancel: document.getElementById('app-dialog-cancel'),
    btnOk: document.getElementById('app-dialog-ok')
  };

  dialogEls.btnCancel.addEventListener('click', () => closeDialog(false));
  dialogEls.btnOk.addEventListener('click', () => closeDialog(true));
  dialogEls.backdrop.addEventListener('click', (e) => {
    if (e.target === dialogEls.backdrop) {
      closeDialog(false);
    }
  });
  return dialogEls;
}

function closeDialog(result) {
  const els = ensureElements();
  els.backdrop.classList.add('hidden');
  if (resolver) {
    const done = resolver;
    resolver = null;
    done(result);
  }
}

export function showAlert(message, { title = t('dialog.alertTitle'), okText = t('dialog.ok') } = {}) {
  const els = ensureElements();
  els.title.textContent = title;
  els.message.textContent = message;
  els.btnCancel.classList.add('hidden');
  els.btnOk.textContent = okText;
  els.btnOk.classList.remove('btn-dialog-danger');
  els.backdrop.classList.remove('hidden');

  return new Promise((resolve) => {
    resolver = () => resolve();
  });
}

export function showConfirm(
  message,
  { title = t('dialog.confirmTitle'), okText = t('dialog.ok'), cancelText = t('dialog.cancel'), danger = false } = {}
) {
  const els = ensureElements();
  els.title.textContent = title;
  els.message.textContent = message;
  els.btnCancel.textContent = cancelText;
  els.btnCancel.classList.remove('hidden');
  els.btnOk.textContent = okText;
  els.btnOk.classList.toggle('btn-dialog-danger', danger);
  els.backdrop.classList.remove('hidden');

  return new Promise((resolve) => {
    resolver = resolve;
  });
}
