import { t } from './i18n.js?v=20261125pay';

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
  const now = Date.now();
  try {
    const raw = localStorage.getItem(LICENSE_KEY);
    if (raw) {
      const parsed = decodePayload(raw);
      if (parsed && typeof parsed.startedAt === 'number') {
        const lic = {
          startedAt: parsed.startedAt,
          lastSeenAt: typeof parsed.lastSeenAt === 'number' ? parsed.lastSeenAt : parsed.startedAt,
          purchased: Boolean(parsed.purchased),
          simulatedExpired: Boolean(parsed.simulatedExpired),
          tampered: Boolean(parsed.tampered)
        };
        if (!lic.purchased) {
          // 휴대폰 시계를 1분 이상 과거로 돌린 경우 시간 역행 편법으로 감지
          if (now + 60_000 < lic.lastSeenAt) {
            lic.tampered = true;
          } else if (now > lic.lastSeenAt) {
            lic.lastSeenAt = now;
          }
          saveLicense(lic);
        }
        return lic;
      }
      // 저장값이 임의로 훼손된 경우 만료 처리
      const tamperedLic = {
        startedAt: now - TRIAL_DAYS * 86_400_000,
        lastSeenAt: now,
        purchased: false,
        simulatedExpired: false,
        tampered: true
      };
      saveLicense(tamperedLic);
      return tamperedLic;
    }

    // 기존 v1 저장 이력이 있으면 시작일을 이어받아 초기화
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const migrated = {
        startedAt: typeof legacy?.startedAt === 'number' ? legacy.startedAt : now,
        lastSeenAt: now,
        purchased: Boolean(legacy?.purchased),
        simulatedExpired: false,
        tampered: false
      };
      saveLicense(migrated);
      return migrated;
    }
  } catch {
    // 저장소 읽기 오류 시 기본 체험으로 진행
  }

  const fresh = {
    startedAt: now,
    lastSeenAt: now,
    purchased: false,
    simulatedExpired: false,
    tampered: false
  };
  saveLicense(fresh);
  return fresh;
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
  if (lic?.purchased) {
    return {
      state: 'purchased',
      daysLeft: 0,
      label: t('license.purchasedLabel')
    };
  }
  if (lic?.tampered || lic?.simulatedExpired) {
    return {
      state: 'expired',
      daysLeft: 0,
      label: t('license.expiredLabel')
    };
  }
  const elapsedMs = Math.max(0, Date.now() - (Number(lic?.startedAt) || Date.now()));
  const elapsedDays = Math.floor(elapsedMs / 86_400_000);
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsedDays);
  if (daysLeft <= 0) {
    return {
      state: 'expired',
      daysLeft: 0,
      label: t('license.expiredLabel')
    };
  }
  return {
    state: 'trial',
    daysLeft,
    label: t('license.trialLabel', { days: daysLeft })
  };
}
