/**
 * 구글 플레이 인앱 결제(1회성 평생 소장) 연동 모듈
 * - 안드로이드 TWA(Digital Goods API + Payment Request API) 환경에서 동작합니다.
 * - 구글 플레이 콘솔에 등록할 인앱 상품 ID: wrongnote_lifetime (3,900원)
 */
import { t, getLang } from './i18n.js?v=20261125pay';

export const PLAY_BILLING_METHOD = 'https://play.google.com/billing';
export const LIFETIME_PRODUCT_ID = 'wrongnote_lifetime';
export const DEFAULT_PRICE_KRW = '3900';

let cachedStorePrice = null;
let inflightStorePrice = null;

/**
 * 구글 플레이 스토어에서 내려주는 현지 통화 가격을 보기 좋게 포맷합니다.
 */
export function formatStorePrice(price) {
  if (!price || !price.currency || !price.value) return '';
  const num = Number(price.value);
  if (!Number.isFinite(num)) return `${price.currency} ${price.value}`;
  const lang = getLang();
  const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: price.currency,
      maximumFractionDigits: price.currency === 'KRW' || price.currency === 'JPY' ? 0 : 2
    }).format(num);
  } catch {
    return `${price.currency} ${price.value}`;
  }
}

/**
 * 스토어에 등록된 평생 소장 상품 가격을 조회합니다 (세션 캐시).
 */
export async function fetchLifetimeStorePrice() {
  if (cachedStorePrice) return cachedStorePrice;
  if (inflightStorePrice) return inflightStorePrice;
  if (typeof window === 'undefined' || typeof window.getDigitalGoodsService !== 'function') {
    return null;
  }

  inflightStorePrice = (async () => {
    try {
      const service = await window.getDigitalGoodsService(PLAY_BILLING_METHOD);
      if (!service) return null;
      const details = await service.getDetails([LIFETIME_PRODUCT_ID]);
      const item = Array.isArray(details)
        ? details.find((d) => d.itemId === LIFETIME_PRODUCT_ID)
        : null;
      if (item?.price?.currency && item?.price?.value) {
        cachedStorePrice = item.price;
        return item.price;
      }
      return null;
    } catch {
      return null;
    } finally {
      inflightStorePrice = null;
    }
  })();

  return inflightStorePrice;
}

/**
 * 구글 플레이 결제창을 열어 평생 소장 상품을 구매합니다.
 */
export async function purchaseLifetime() {
  if (
    typeof window === 'undefined' ||
    typeof window.getDigitalGoodsService !== 'function' ||
    typeof window.PaymentRequest === 'undefined'
  ) {
    return { ok: false, reason: t('license.playOnlyMsg') };
  }

  try {
    const service = await window.getDigitalGoodsService(PLAY_BILLING_METHOD);
    if (!service) {
      return { ok: false, reason: t('license.playOnlyMsg') };
    }

    const details = await service.getDetails([LIFETIME_PRODUCT_ID]);
    const item = Array.isArray(details) ? details[0] : null;
    if (!item) {
      return { ok: false, reason: t('license.storeUnavailableMsg') };
    }

    const totalAmount =
      item.price?.currency && item.price?.value
        ? { currency: item.price.currency, value: item.price.value }
        : { currency: 'KRW', value: DEFAULT_PRICE_KRW };

    const request = new PaymentRequest(
      [{ supportedMethods: PLAY_BILLING_METHOD, data: { sku: LIFETIME_PRODUCT_ID } }],
      {
        total: {
          label: item.title || t('license.productTitle'),
          amount: totalAmount
        }
      }
    );

    const response = await request.show();
    const purchaseToken = response?.details?.purchaseToken || '';
    await response.complete('success');
    return { ok: true, purchaseToken };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err || '');
    if (/cancel|user.*abort|aborted the request/i.test(msg)) {
      return { ok: false, reason: t('license.buyCancelledMsg'), cancelled: true };
    }
    return { ok: false, reason: t('license.buyErrorMsg') };
  }
}

/**
 * 구글 계정에 이미 평생 소장 구매 내역이 있는지 확인합니다 (구매 복원).
 */
export async function checkLifetimePurchase() {
  if (typeof window === 'undefined' || typeof window.getDigitalGoodsService !== 'function') {
    return { available: false, purchased: false };
  }
  try {
    const service = await window.getDigitalGoodsService(PLAY_BILLING_METHOD);
    if (!service) return { available: false, purchased: false };
    const purchases = await service.listPurchases();
    const purchased = Array.isArray(purchases)
      ? purchases.some((p) => p.itemId === LIFETIME_PRODUCT_ID)
      : false;
    return { available: true, purchased };
  } catch {
    return { available: false, purchased: false };
  }
}
