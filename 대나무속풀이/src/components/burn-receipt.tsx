import { forwardRef } from "react";
import type { Receipt, VentResult } from "@/lib/forest";

export const BurnReceipt = forwardRef<HTMLDivElement, { result: VentResult; receipt: Receipt }>(
  ({ result, receipt }, ref) => (
    <div ref={ref} className="burn-receipt mx-auto aspect-[9/16] w-full max-w-[360px] p-6 text-center" aria-label="분노 소각 영수증">
      <div className="flex h-full min-h-0 flex-col">
        <p className="font-mono text-xs">대나무숲 속풀이 · BAMBOO FOREST</p>
        <h2 className="font-display mt-3 text-2xl font-bold">분노 소각 영수증</h2>
        <p className="mt-1 font-mono text-xs">BURN RECEIPT</p>
        <div className="receipt-divider my-5" />
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-left text-xs">
          <dt>소각 일시</dt><dd className="text-right">{new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(receipt.burnedAt))}</dd>
          <dt>티켓 번호</dt><dd className="text-right font-mono">{receipt.ticket}</dd>
          <dt>남은 원문</dt><dd className="text-right">0 — 흔적 없음</dd>
        </dl>
        <div className="receipt-divider my-5" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-xs">오늘의 한 줄 처방</p>
          <p className="font-display text-lg font-bold">{result.title}</p>
          <p className="font-display break-words text-2xl font-bold leading-relaxed">“{result.prescription}”</p>
          <div className="receipt-stamp mt-2 px-4 py-2 text-xl font-bold">소각 완료</div>
        </div>
        <div className="receipt-divider my-4" />
        <div className="receipt-barcode mx-auto h-9 w-4/5" aria-hidden="true" />
        <p className="mt-2 font-mono text-[10px]">{receipt.ticket}</p>
        <p className="mt-3 text-[10px]">분노는 태우고, 당신은 남았습니다.</p>
      </div>
    </div>
  ),
);
BurnReceipt.displayName = "BurnReceipt";