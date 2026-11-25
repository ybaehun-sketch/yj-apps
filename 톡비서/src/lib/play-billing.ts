// Google Play Billing helper for Android TWA (Digital Goods API + Payment Request API).

export const PLAY_BILLING_METHOD = "https://play.google.com/billing";
export const MONTHLY_PRODUCT_ID = "tokbiseo_premium_monthly";

type DigitalGoodsItem = {
  itemId: string;
  title?: string;
  price?: { currency: string; value: string };
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

export async function purchaseMonthlyWithPlayBilling(): Promise<
  { ok: true; purchaseToken: string } | { ok: false; reason: string }
> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "브라우저 환경에서만 결제할 수 있어요" };
  }
  const w = window as WindowWithDgs;
  if (!w.getDigitalGoodsService || typeof PaymentRequest === "undefined") {
    return { ok: false, reason: "구글 플레이스토어 앱에서 결제할 수 있어요" };
  }
  try {
    const service = await w.getDigitalGoodsService(PLAY_BILLING_METHOD);
    const details = await service.getDetails([MONTHLY_PRODUCT_ID]);
    if (!details || details.length === 0) {
      return { ok: false, reason: "스토어 상품 정보를 아직 불러올 수 없어요" };
    }
    const request = new PaymentRequest(
      [{ supportedMethods: PLAY_BILLING_METHOD, data: { sku: MONTHLY_PRODUCT_ID } }],
      { total: { label: "톡비서 프리미엄 월간 구독", amount: { currency: "KRW", value: "4900" } } },
    );
    const response = await request.show();
    const token =
      (response.details as { purchaseToken?: string } | undefined)?.purchaseToken ?? "";
    await response.complete("success");
    return { ok: true, purchaseToken: token };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/cancel|abort/i.test(msg)) {
      return { ok: false, reason: "결제가 취소되었어요" };
    }
    return { ok: false, reason: "구글 플레이 결제를 진행하지 못했어요. 잠시 후 다시 시도해 주세요" };
  }
}
