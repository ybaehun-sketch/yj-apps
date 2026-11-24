'use client';

import { useMemo, useState } from 'react';
import type { WelfarePost } from '@/lib/types';

interface AppPublishCalendarModalProps {
  open: boolean;
  posts: WelfarePost[];
  busyId: string | null;
  onClose: () => void;
  onHidePost: (post: WelfarePost) => Promise<void>;
}

function toKstDateKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  // Asia/Seoul (UTC+9) 기준 YYYY-MM-DD
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function getTodayKstKey(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function AppPublishCalendarModal({
  open,
  posts,
  busyId,
  onClose,
  onHidePost
}: AppPublishCalendarModalProps) {
  const postsByDate = useMemo(() => {
    const map = new Map<string, WelfarePost[]>();
    for (const post of posts) {
      const key =
        toKstDateKey(post.app_published_at) ||
        toKstDateKey(post.published_at) ||
        toKstDateKey(post.created_at);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(post);
      map.set(key, list);
    }
    return map;
  }, [posts]);

  const latestDateKey = useMemo(() => {
    const keys = Array.from(postsByDate.keys()).sort();
    return keys[keys.length - 1] ?? getTodayKstKey();
  }, [postsByDate]);

  const [selectedDate, setSelectedDate] = useState<string>(latestDateKey);
  const [viewYear, setViewYear] = useState<number>(() =>
    Number(latestDateKey.slice(0, 4))
  );
  const [viewMonth, setViewMonth] = useState<number>(() =>
    Number(latestDateKey.slice(5, 7))
  );
  const [lastOpen, setLastOpen] = useState(open);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setSelectedDate(latestDateKey);
      setViewYear(Number(latestDateKey.slice(0, 4)));
      setViewMonth(Number(latestDateKey.slice(5, 7)));
    }
  }

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const cells: Array<{ day: number | null; dateKey: string | null }> = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push({ day: null, dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const mm = String(viewMonth).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, dateKey: `${viewYear}-${mm}-${dd}` });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateKey: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  if (!open) return null;

  const selectedPosts = postsByDate.get(selectedDate) ?? [];

  function moveMonth(delta: number) {
    const next = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-[#202124]">
              모바일 앱 날짜별 발행 달력
            </h3>
            <p className="text-xs text-[#5f6368]">
              날짜를 누르면 해당 날짜에 앱으로 발행된 공고 목록이 아래에 표시됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-sm font-medium text-[#5f6368] hover:bg-[#f8f9fa]"
          >
            닫기
          </button>
        </div>

        {/* 스크롤 본문 */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* 월 이동 컨트롤 */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-xs font-semibold text-[#3c4043] hover:bg-[#f8f9fa]"
            >
              ‹ 이전 달
            </button>
            <div className="text-base font-bold text-[#202124]">
              {viewYear}년 {viewMonth}월
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-xs font-semibold text-[#3c4043] hover:bg-[#f8f9fa]"
            >
              다음 달 ›
            </button>
          </div>

          {/* 달력 그리드 */}
          <div className="overflow-hidden rounded-xl border border-[#dadce0]">
            <div className="grid grid-cols-7 border-b border-[#dadce0] bg-[#f8f9fa] text-center text-xs font-semibold text-[#5f6368]">
              {WEEKDAYS.map((w, idx) => (
                <div
                  key={w}
                  className={`py-2 ${
                    idx === 0 ? 'text-[#d93025]' : idx === 6 ? 'text-[#1a73e8]' : ''
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-y divide-[#e8eaed] bg-white">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.dateKey) {
                  return <div key={`empty-${idx}`} className="min-h-[64px] bg-[#fafafa]" />;
                }
                const count = postsByDate.get(cell.dateKey)?.length ?? 0;
                const isSelected = selectedDate === cell.dateKey;
                const isToday = getTodayKstKey() === cell.dateKey;
                const dayOfWeek = idx % 7;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateKey!)}
                    className={`flex min-h-[64px] flex-col items-center justify-between p-2 text-xs transition ${
                      isSelected
                        ? 'bg-[#e8f0fe] ring-2 ring-inset ring-[#1a73e8]'
                        : 'hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        isToday
                          ? 'rounded-full bg-[#1a73e8] px-1.5 py-0.5 text-white'
                          : dayOfWeek === 0
                            ? 'text-[#d93025]'
                            : dayOfWeek === 6
                              ? 'text-[#1a73e8]'
                              : 'text-[#202124]'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {count > 0 ? (
                      <span className="mt-1 inline-flex min-w-[24px] items-center justify-center rounded-full bg-[#1a73e8] px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {count}
                      </span>
                    ) : (
                      <span className="mt-1 text-[11px] text-[#dadce0]">-</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 선택한 날짜의 발행 내역 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#202124]">
                {selectedDate} 발행 내역 ({selectedPosts.length}건)
              </h4>
            </div>

            {selectedPosts.length === 0 ? (
              <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-6 text-center text-sm text-[#5f6368]">
                이 날짜에 발행된 공고가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-[#dadce0] rounded-xl border border-[#dadce0] bg-white">
                {selectedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f6368]">
                        <span className="rounded bg-[#e8f0fe] px-2 py-0.5 font-medium text-[#1a73e8]">
                          {post.region_sigungu}
                        </span>
                        <span>{post.category}</span>
                        <span>확신도 {post.ai_confidence}점</span>
                      </div>
                      <div className="mt-1 truncate text-sm font-bold text-[#202124]">
                        {post.app_title}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === post.id}
                      onClick={() => onHidePost(post)}
                      className="shrink-0 rounded-lg border border-[#dadce0] px-3 py-1.5 text-xs font-medium text-[#5f6368] hover:bg-[#f8f9fa]"
                    >
                      앱에서 숨기기
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
