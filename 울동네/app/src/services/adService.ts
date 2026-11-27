import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getLastInterstitialTime, setLastInterstitialTime } from './storageService';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const COOLDOWN_MS = 3 * 60 * 1000; // 최소 3분 쿨타임
const FALLBACK_OPEN_TIMEOUT_MS = 15 * 1000; // 광고 콜백 지연 시 안전 타이머

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const REAL_INTERSTITIAL_ID = (extra.admobInterstitialUnitId ?? '').trim();
const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : (REAL_INTERSTITIAL_ID || TestIds.INTERSTITIAL);

let interstitialAd: InterstitialAd | null = null;
let isLoaded = false;
let isAdShowing = false;

/**
 * 전면 광고 사전 로딩 및 이벤트 리스너 연결
 */
export function initializeInterstitialAd(): void {
  if (Platform.OS === 'web') return;

  try {
    interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      isLoaded = true;
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      isLoaded = false;
      isAdShowing = false;
      // 다음 쿨타임을 위해 새 전면 광고 사전 준비
      interstitialAd?.load();
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      isLoaded = false;
      isAdShowing = false;
    });

    interstitialAd.load();
  } catch {
    interstitialAd = null;
    isLoaded = false;
  }
}

/**
 * 실제 AdMob 광고 단위 ID가 설정된 네이티브 앱 환경인지 확인
 */
export function hasNativeAdConfigured(): boolean {
  if (Platform.OS === 'web') return false;
  return Boolean(REAL_INTERSTITIAL_ID || (extra.admobBannerUnitId ?? extra.admobNativeUnitId ?? '').trim());
}

/**
 * 출처 링크 클릭 시 첫 이용자는 1회 무료 통과(즉시 이동) 후 3분 쿨타임 시작.
 * 이후에는 3분 쿨타임 경과 시에만 전면광고 노출.
 * 광고 미로딩·저장소 오류·광고 모듈 예외·콜백 누락 등 어떤 상황에서도 반드시 1회 onOpenTarget() 실행을 보장.
 */
export async function openWithCooldownInterstitial(onOpenTarget: () => void): Promise<void> {
  let opened = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const safeOpenTarget = () => {
    if (opened) return;
    opened = true;
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    isAdShowing = false;
    try {
      onOpenTarget();
    } catch {
      // 안전 방어
    }
  };

  const now = Date.now();
  let lastShown = 0;
  try {
    lastShown = await getLastInterstitialTime();
  } catch {
    lastShown = 0;
  }

  // 앱 최초 설치 후 첫 원문 이동은 광고 없이 바로 통과시키고, 이 시점부터 3분 쿨타임 시작
  if (lastShown === 0) {
    try {
      await setLastInterstitialTime(now);
    } catch {
      // 기록 실패 시에도 정상 진행
    }
    safeOpenTarget();
    return;
  }

  const isCooldownOver = now - lastShown >= COOLDOWN_MS;
  if (!isCooldownOver || !interstitialAd || !isLoaded || isAdShowing) {
    safeOpenTarget();
    return;
  }

  try {
    isAdShowing = true;
    fallbackTimer = setTimeout(safeOpenTarget, FALLBACK_OPEN_TIMEOUT_MS);

    const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeClosed();
      safeOpenTarget();
    });

    const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      unsubscribeError();
      safeOpenTarget();
    });

    await setLastInterstitialTime(now);
    await interstitialAd.show();
  } catch {
    safeOpenTarget();
  }
}
