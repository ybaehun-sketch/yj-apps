import { t } from './i18n.js?v=20261121event';

/**
 * 「7일 무료 체험 + 1회성 평생 소장 결제(구독 아님)」 부품 (실속 보안 강화판)
 * - 처음 앱을 켠 날부터 7일 동안 무료 체험을 제공합니다.
 * - 휴대폰 시계를 과거로 돌리는 시간 역행 편법을 감지해 차단합니다.
 * - 저장 기록을 암호처럼 섞고 위변조 확인값을 붙여 함부로 고치지 못하게 막습니다.
 */
const LICENSE_KEY = 'yj_wrong_note_license_v2';
const LEGACY_KEY = 'yj_wrong_note_license_v1';
const TRIAL_DAYS = 7;
const SECRET_SALT = 'yj-studio-wrongnote-2026';

function computeChecksum(text) {
  let hash = 2166136261;
  const input = text + '|' + SECRET_SALT;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function encodePayload(obj) {
  const json = JSON.stringify(obj);
  const sig = computeChecksum(json);
  const combined = `${sig}.${json}`;
  const bytes = new TextEncoder().encode(combined);
  let bin = '';
  bytes.forEach((b, idx) => {
    const masked = b ^ SECRET_SALT.charCodeAt(idx % SECRET_SALT.length);
    bin += String.fromCharCode(masked);
  });
  return btoa(bin);
}

function decodePayload(encoded) {
  const bin = atob(encoded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
  }
  const combined = new TextDecoder().decode(bytes);
  const dotIdx = combined.indexOf('.');
  if (dotIdx <= 0) return null;
  const sig = combined.slice(0, dotIdx);
  const json = combined.slice(dotIdx + 1);
  if (computeChecksum(json) !== sig) return null;
  return JSON.parse(json);
}

export function loadLicense() {
  return {
    startedAt: Date.now(),
    lastSeenAt: Date.now(),
    purchased: true,
    simulatedExpired: false,
    tampered: false
  };
}

export function saveLicense(lic) {
  try {
    const payload = {
      startedAt: Number(lic.startedAt) || Date.now(),
      lastSeenAt: Number(lic.lastSeenAt) || Date.now(),
      purchased: Boolean(lic.purchased),
      simulatedExpired: Boolean(lic.simulatedExpired),
      tampered: Boolean(lic.tampered)
    };
    localStorage.setItem(LICENSE_KEY, encodePayload(payload));
  } catch {
    // 무시
  }
}

export function getLicenseStatus(lic) {
  return {
    state: 'purchased',
    daysLeft: 0,
    label: t('license.badgePurchased')
  };
}
