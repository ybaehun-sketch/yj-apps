// Google Play Billing helper for Android TWA (Digital Goods API + Payment Request API).

export const PLAY_BILLING_METHOD = "https://play.google.com/billing";
export const MONTHLY_PRODUCT_ID = "tokbiseo_premium_monthly";
export const YEARLY_PRODUCT_ID = "tokbiseo_premium_yearly";
export type BillingCycle = "monthly" | "yearly";

const PRODUCT_META: Record<BillingCycle, { id: string; label: string; amount: string }> = {
  monthly: { id: MONTHLY_PRODUCT_ID, label: "톡비서 프리미엄 월간 구독", amount: "3900" },
  yearly: { id: YEARLY_PRODUCT_ID, label: "톡비서 프리미엄 연간 구독", amount: "39000" },
};

export type StorePrice = { currency: string; value: string };
export type StorePrices = Partial<Record<BillingCycle, StorePrice>>;

type DigitalGoodsItem = {
  itemId: string;
  title?: string;
  price?: StorePrice;
};

type DigitalGoodsPurchase = {
  itemId: string;
  purchaseToken: string;
};

type DigitalGoodsService = {
  getDetails: (itemIds: string[]) => Promise<DigitalGoodsItem[]>;
  listPurchases: () => Promise<DigitalGoodsPurchase[]>;
};

type WindowWithDgs = Window & {
  getDigitalGoodsService?: (paymentMethod: string) => Promise<DigitalGoodsService>;
};

let cachedStorePrices: StorePrices | null = null;
let inflightStorePrices: Promise<StorePrices> | null = null;

/** Format a Google Play store price using the active locale. */
export function formatStorePrice(price: StorePrice, loc: string): string {
  const num = Number(price.value);
  if (!Number.isFinite(num)) return `${price.currency} ${price.value}`;
  try {
    return new Intl.NumberFormat(loc, { style: "currency", currency: price.currency }).format(num);
  } catch {
    return `${price.currency} ${price.value}`;
  }
}

/** Fetch localized subscription prices from Google Play Digital Goods API (cached per session). */
export async function fetchPlayStorePrices(): Promise<StorePrices> {
  if (cachedStorePrices) return cachedStorePrices;
  if (inflightStorePrices) return inflightStorePrices;
  if (typeof window === "undefined") return {};
  const w = window as WindowWithDgs;
  const getDgs = w.getDigitalGoodsService;
  if (!getDgs) return {};

  inflightStorePrices = (async () => {
    try {
      const service = await getDgs(PLAY_BILLING_METHOD);
      if (!service) return {};
      const details = await service.getDetails([MONTHLY_PRODUCT_ID, YEARLY_PRODUCT_ID]);
      const out: StorePrices = {};
      for (const item of details ?? []) {
        if (!item.price?.currency || !item.price?.value) continue;
        if (item.itemId === MONTHLY_PRODUCT_ID) out.monthly = item.price;
        else if (item.itemId === YEARLY_PRODUCT_ID) out.yearly = item.price;
      }
      if (Object.keys(out).length > 0) cachedStorePrices = out;
      return out;
    } catch {
      return {};
    } finally {
      inflightStorePrices = null;
    }
  })();

  return inflightStorePrices;
}

export async function isPlayBillingAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const w = window as WindowWithDgs;
  if (!w.getDigitalGoodsService || typeof PaymentRequest === "undefined") return false;
  try {
    const svc = await w.getDigitalGoodsService(PLAY_BILLING_METHOD);
    return !!svc;
  } catch {
    return false;
  }
}

export async function purchaseWithPlayBilling(cycle: BillingCycle): Promise<
  { ok: true; purchaseToken: string } | { ok: false; reason: string }
> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "브라우저 환경에서만 결제할 수 있어요" };
  }
  const w = window as WindowWithDgs;
  if (!w.getDigitalGoodsService || typeof PaymentRequest === "undefined") {
    return { ok: false, reason: "구글 플레이스토어 앱에서 결제할 수 있어요" };
  }
  const meta = PRODUCT_META[cycle];
  try {
    const service = await w.getDigitalGoodsService(PLAY_BILLING_METHOD);
    const details = await service.getDetails([meta.id]);
    if (!details || details.length === 0) {
      return { ok: false, reason: "스토어 상품 정보를 아직 불러올 수 없어요" };
    }
    const storePrice = details[0]?.price;
    const totalAmount =
      storePrice?.currency && storePrice?.value
        ? { currency: storePrice.currency, value: storePrice.value }
        : { currency: "KRW", value: meta.amount };
    const request = new PaymentRequest(
      [{ supportedMethods: PLAY_BILLING_METHOD, data: { sku: meta.id } }],
      { total: { label: details[0]?.title || meta.label, amount: totalAmount } },
    );
    const response = await request.show();
    const token =
      (response.details as { purchaseToken?: string } | undefined)?.purchaseToken ?? "";
    await response.complete("success");
    return { ok: true, purchaseToken: token };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const msg = e instanceof Error ? e.message : String(e ?? "");
    if (/cancel|user.*abort|aborted the request/i.test(msg)) {
      return { ok: false, reason: "결제가 취소되었어요" };
    }
    const detail = [name, msg].filter(Boolean).join(": ");
    return {
      ok: false,
      reason: detail
        ? `구글 플레이 결제를 진행하지 못했어요 (${detail})`
        : "구글 플레이 결제를 진행하지 못했어요. 잠시 후 다시 시도해 주세요",
    };
  }
}

export async function checkPlaySubscription(): Promise<{ available: boolean; active: boolean }> {
  if (typeof window === "undefined") return { available: false, active: false };
  const w = window as WindowWithDgs;
  if (!w.getDigitalGoodsService) return { available: false, active: false };
  try {
    const service = await w.getDigitalGoodsService(PLAY_BILLING_METHOD);
    if (!service) return { available: false, active: false };
    const purchases = await service.listPurchases();
    const active = purchases.some(
      (p) => p.itemId === MONTHLY_PRODUCT_ID || p.itemId === YEARLY_PRODUCT_ID,
    );
    return { available: true, active };
  } catch {
    return { available: false, active: false };
  }
}

export async function purchaseMonthlyWithPlayBilling() {
  return purchaseWithPlayBilling("monthly");
}
