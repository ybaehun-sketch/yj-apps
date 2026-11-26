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
    return null;
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
