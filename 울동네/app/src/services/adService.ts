import { getLastInterstitialTime, setLastInterstitialTime } from './storageService';

const COOLDOWN_MS = 3 * 60 * 1000; // 최소 3분 쿨타임
const SHOW_PROBABILITY = 0.45; // 45% 랜덤 확률

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
 * 출처 링크 클릭 시 쿨타임(3분) + 랜덤 확률(45%) 조건 충족 시에만 전면광고 노출.
 * 광고가 미로딩 상태거나 조건 미충족 시 대기 없이 0초 만에 즉시 onOpenTarget() 실행.
 */
export async function openWithCooldownInterstitial(onOpenTarget: () => void): Promise<void> {
  if (!registeredDriver || !registeredDriver.isLoaded()) {
    onOpenTarget();
    return;
  }

  const now = Date.now();
  const lastShown = await getLastInterstitialTime();
  const isCooldownOver = now - lastShown >= COOLDOWN_MS;
  const isLuckyHit = Math.random() < SHOW_PROBABILITY;

  if (!isCooldownOver || !isLuckyHit) {
    onOpenTarget();
    return;
  }

  await setLastInterstitialTime(now);
  registeredDriver.show(onOpenTarget);
}
