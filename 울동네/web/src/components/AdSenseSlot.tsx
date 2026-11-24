'use client';

import { useEffect } from 'react';

interface AdSenseSlotProps {
  slotId?: string;
  position: 'top' | 'middle' | 'bottom';
}

export function AdSenseSlot({ slotId, position }: AdSenseSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !slotId) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // 광고 차단기 등으로 인한 예외 무시
    }
  }, [client, slotId]);

  if (!client || !slotId) {
    const label = position === 'top' ? '상단' : position === 'middle' ? '중간' : '하단';
    return (
      <div
        aria-label={`목업 광고 영역 (${position})`}
        className="my-5 rounded-2xl border border-[#dadce0] bg-[#f8f9fa] p-5"
      >
        <div className="flex items-center gap-2 text-xs text-[#5f6368]">
          <span className="rounded bg-[#e8eaed] px-2 py-0.5 font-bold text-[#3c4043]">AD</span>
          <span>스폰서 추천 정보 · {label} 목업 광고</span>
        </div>
        <div className="mt-2 text-[16px] font-bold text-[#202124]">
          우리 동네 알뜰 생활·금융 혜택 파트너 안내
        </div>
        <p className="mt-1 text-sm text-[#5f6368]">
          정식 애드센스 연결 전까지 화면 배치와 비율을 확인하기 위한 테스트용 목업 광고입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden">
      <ins
        className="adsbygoogle block"
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
