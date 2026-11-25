import { getLastInterstitialTime, setLastInterstitialTime } from './storageService';

const COOLDOWN_MS = 3 * 60 * 1000; // 최소 3분 쿨타임
const FALLBACK_OPEN_TIMEOUT_MS = 45 * 1000; // 광고 콜백 누락 대비 최후 안전 타이머

interface InterstitialDriver {
  isLoaded: () => boolean;
  show: (onDismissed: () => void) => void;
}

let registeredDriver: InterstitialDriver | null = null;

/**
 * 실제 AdMob 전면광고 모듈을 앱 초기화 시 연결하기 위한 등록 함수
 */
export function registerInterstitialDriver(driver: InterstitialDriver): void {
  registeredDriver = driver;
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
    try {
      onOpenTarget();
    } catch {
      // 호출부에서 예외가 전파되지 않도록 보호
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
      // 저장소 기록 실패 시에도 사이트 이동은 정상 진행
    }
    safeOpenTarget();
    return;
  }

  let isDriverReady = false;
  try {
    isDriverReady = Boolean(registeredDriver && registeredDriver.isLoaded());
  } catch {
    isDriverReady = false;
  }

  if (!isDriverReady || !registeredDriver) {
    safeOpenTarget();
    return;
  }

  const isCooldownOver = now - lastShown >= COOLDOWN_MS;
  if (!isCooldownOver) {
    safeOpenTarget();
    return;
  }

  try {
    await setLastInterstitialTime(now);
  } catch {
    // 저장소 기록 실패 무시
  }

  try {
    fallbackTimer = setTimeout(safeOpenTarget, FALLBACK_OPEN_TIMEOUT_MS);
    registeredDriver.show(safeOpenTarget);
  } catch {
    safeOpenTarget();
  }
}
