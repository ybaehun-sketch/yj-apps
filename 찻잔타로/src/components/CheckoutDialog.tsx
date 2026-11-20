import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PORTONE_CHANNELS, PORTONE_STORE_ID, portoneReady, type Product } from "@/lib/products";
import { verifyPayment } from "@/lib/payment.functions";
import { setMembership } from "@/lib/membership";
import { isAdminEmail } from "@/lib/access";

export type { Product };
export const won = (n: number) => n.toLocaleString("ko-KR") + "원";

const METHODS = [
  { id: "kakao", label: "카카오페이", icon: "💛", pay: { payMethod: "EASY_PAY", easyPay: { easyPayProvider: "KAKAOPAY" } } },
  { id: "toss", label: "토스페이", icon: "💙", pay: { payMethod: "EASY_PAY", easyPay: { easyPayProvider: "TOSSPAY" } } },
  { id: "naver", label: "네이버페이", icon: "💚", pay: { payMethod: "EASY_PAY", easyPay: { easyPayProvider: "NAVERPAY" } } },
  { id: "card", label: "신용·체크카드", icon: "💳", pay: { payMethod: "CARD" } },
] as const;

const PENDING_KEY = "teacup-pending-payment";
const PHONE_KEY = "teacup-buyer-phone";
const NAME_KEY = "teacup-buyer-name";

/** 모바일 리다이렉트 결제 후 복귀 시 검증 */
export async function resumePendingPayment(paymentId: string, failCode?: string | null) {
  const raw = sessionStorage.getItem(PENDING_KEY);
  sessionStorage.removeItem(PENDING_KEY);
  if (failCode) throw new Error("결제가 취소되었거나 실패했어요");
  if (!raw) return null;
  const { productId } = JSON.parse(raw) as { productId: string };
  const r = await verifyPayment({ data: { paymentId, productId } });
  setMembership({ premium: r.wallet.premium, leaves: r.wallet.leaves });
  return r;
}

export function CheckoutDialog({
  product,
  onClose,
  onDone,
  doneLabel,
}: {
  product: Product | null;
  onClose: () => void;
  onDone: (p: Product, real: boolean) => void;
  doneLabel?: string;
}) {
  const real = portoneReady();
  const methods = real ? METHODS.filter((m) => PORTONE_CHANNELS[m.id]) : METHODS;
  const [method, setMethod] = useState<string>(methods[0]?.id ?? "card");
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    setPhone(localStorage.getItem(PHONE_KEY) ?? "");
    setName(localStorage.getItem(NAME_KEY) ?? "");
  }, []);
  const [step, setStep] = useState<"pick" | "paying" | "done">("pick");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id, email: data.user.email ?? null } : null));
    if (product) { setStep("pick"); setError(null); }
  }, [product]);
  // 안전장치: 결제창이 닫혔거나 이니시스 창으로 넘어갈 때 화면 클릭 잠금이 남지 않게 풀어준다
  const isOpen = !!product && step !== "paying";
  useEffect(() => {
    if (isOpen) return;
    const release = () => {
      document.body.style.pointerEvents = "";
      document.body.removeAttribute("data-scroll-locked");
    };
    release();
    const t = setTimeout(release, 350);
    return () => clearTimeout(t);
  }, [isOpen]);
  useEffect(() => () => { document.body.style.pointerEvents = ""; }, []);

  async function pay() {
    if (!product) return;
    setError(null);
    setStep("paying");
    if (!real) {
      if (!isAdminEmail(user?.email)) {
        setError("정식 결제는 오픈 준비 중이에요. 조금만 기다려 주세요 🍵");
        setStep("pick");
        return;
      }
      setTimeout(() => { onDone(product, false); setStep("done"); }, 1200);
      return;
    }
    const buyer = name.trim();
    if (buyer.length < 2) {
      setError("구매자 이름을 입력해 주세요");
      setStep("pick");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(digits)) {
      setError("휴대폰 번호를 정확히 입력해 주세요");
      setStep("pick");
      return;
    }
    localStorage.setItem(PHONE_KEY, digits);
    localStorage.setItem(NAME_KEY, buyer);
    try {
      const m = METHODS.find((x) => x.id === method)!;
      const paymentId = `tea-${crypto.randomUUID()}`;
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ productId: product.id }));
      const PortOne = (await import("@portone/browser-sdk/v2")).default;
      const res = await PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNELS[method],
        paymentId,
        orderName: product.name,
        totalAmount: product.price,
        currency: "CURRENCY_KRW",
        customer: { fullName: buyer, email: user?.email ?? undefined, phoneNumber: digits },
        customData: { uid: user?.id },
        redirectUrl: `${window.location.origin}/membership`,
        ...(m.pay as object),
      } as unknown as Parameters<typeof PortOne.requestPayment>[0]);
      if (!res || res.code) {
        sessionStorage.removeItem(PENDING_KEY);
        throw new Error(res?.message || "결제가 취소되었어요");
      }
      sessionStorage.removeItem(PENDING_KEY);
      const r = await verifyPayment({ data: { paymentId, productId: product.id } });
      setMembership({ premium: r.wallet.premium, leaves: r.wallet.leaves });
      onDone(product, true);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 중 문제가 생겼어요");
      setStep("pick");
    }
  }

  return (
    <Dialog
      open={!!product && step !== "paying"}
      modal={step !== "paying"}
      onOpenChange={(v) => !v && step !== "paying" && onClose()}
    >
      <DialogContent className="max-w-sm border-none bg-background">
        <DialogTitle className="font-serif text-lg">결제하기</DialogTitle>
        {user?.email && <p className="-mt-2 text-xs text-muted-foreground">충전 계정: {user.email}</p>}
        {product && step === "pick" && (
          <>
            <div className="flex justify-between rounded-xl bg-secondary p-4">
              <span>
                {product.name}
                {product.kind === "sub" && " (30일)"}
              </span>
              <b>{won(product.price)}</b>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`rounded-xl border p-3 text-sm ${method === m.id ? "border-primary bg-primary/10 font-bold" : "border-border"}`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            {real && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">구매자 이름</span>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
            )}
            {real && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">휴대폰 번호 (결제 안내 문자용)</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
            )}
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button size="lg" className="w-full" onClick={pay}>
              {won(product.price)} 결제하기
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              {real ? "암호화 안전결제 · 결제 즉시 찻잎이 지급돼요" : "가상 결제 · 실제 청구되지 않아요"}
            </p>
          </>
        )}
        {step === "paying" && <p className="py-10 text-center animate-pulse">결제 진행 중… ☕</p>}
        {step === "done" && (
          <div className="py-6 text-center">
            <p className="text-5xl">🍵</p>
            <p className="mt-3 font-serif text-lg font-bold">결제가 완료됐어요</p>
            <Button className="mt-4 w-full" onClick={onClose}>
              {doneLabel ?? "확인"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
