'use client';

import { useState } from 'react';
import { AdSenseSlot } from './AdSenseSlot';

const COOLDOWN_MS = 3 * 60 * 1000; // 3분 쿨타임
const SHOW_PROBABILITY = 0.45; // 45% 확률
const STORAGE_KEY = 'uldongne_web_last_interstitial_ms';

export function SourceLinkWithInterstitial({
  sourceUrl,
  slotId
}: {
  sourceUrl: string;
  slotId?: string;
}) {
  const [adModalOpen, setAdModalOpen] = useState(false);
  const isAdsenseConnected = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT && slotId);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // 정식 애드센스 슬롯이 연결되기 전에는 빈 팝업 없이 즉시 공식 원문으로 이동함
    if (!isAdsenseConnected) {
      return;
    }

    try {
      const last = Number(localStorage.getItem(STORAGE_KEY) || '0');
      const now = Date.now();
      const cooldownPassed = now - last >= COOLDOWN_MS;
      const luckyHit = Math.random() < SHOW_PROBABILITY;

      if (cooldownPassed && luckyHit) {
        e.preventDefault();
        localStorage.setItem(STORAGE_KEY, String(now));
        setAdModalOpen(true);
      }
      // 조건 미충족 시 기다림 없이 기본 <a> 링크로 즉시 원문 이동
    } catch {
      // localStorage 접근 불가 시 즉시 원문 이동
    }
  }

  function handleCloseAndOpen() {
    setAdModalOpen(false);
    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-flex items-center rounded-lg bg-[#1a73e8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1557b0]"
      >
        공식 원문·신청 페이지 바로가기 ↗
      </a>

      {adModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="rounded bg-[#f1f3f4] px-2 py-0.5 text-xs font-bold text-[#5f6368]">
                AD · 스폰서 안내
              </span>
              <button
                type="button"
                onClick={handleCloseAndOpen}
                className="text-xs font-semibold text-[#5f6368] hover:text-[#202124]"
              >
                닫기 ✕
              </button>
            </div>

            <div className="my-4">
              <AdSenseSlot position="middle" slotId={slotId} />
            </div>

            <button
              type="button"
              onClick={handleCloseAndOpen}
              className="w-full rounded-xl bg-[#1a73e8] py-3 text-sm font-bold text-white hover:bg-[#1557b0]"
            >
              확인하고 공식 신청 페이지로 이동 ↗
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
