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
    return (
      <div
        aria-label={`광고 영역 (${position})`}
        className="my-6 flex h-24 items-center justify-center rounded-lg border border-dashed border-[#dadce0] bg-[#f8f9fa] text-xs text-[#5f6368]"
      >
        Google AdSense 광고 슬롯 ({position === 'top' ? '상단' : position === 'middle' ? '중단' : '하단'})
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
