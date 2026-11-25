'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  variant?: 'inline' | 'button';
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'h-4 w-4'}
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export function ShareButton({ title, variant = 'button' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: `[울동네] ${title}`,
          url
        });
        return;
      } catch {
        // 사용자가 공유 창을 닫았거나 실패한 경우 아래 클립보드 복사 시도
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 클립보드 접근 불가 시 무시
      }
    }
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={() => void handleShare()}
        title="공유하기"
        aria-label="공유하기"
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium text-[#1a73e8] transition hover:bg-[#e8f0fe]"
      >
        <ShareIcon className="h-4 w-4" />
        <span>{copied ? '링크 복사됨 ✓' : '공유하기'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      title="공유하기"
      aria-label="공유하기"
      className="inline-flex items-center gap-2 rounded-lg border border-[#dadce0] bg-white px-4 py-2.5 text-sm font-semibold text-[#202124] transition hover:bg-[#f8f9fa]"
    >
      <ShareIcon className="h-4 w-4 text-[#1a73e8]" />
      <span>{copied ? '링크 복사됨 ✓' : '공유하기'}</span>
    </button>
  );
}
