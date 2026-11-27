'use client';

import { useMemo, useState } from 'react';
import type { PatrolBriefing, PatrolBriefingTargetItem } from '@/lib/types';

interface PatrolBriefingModalProps {
  open: boolean;
  briefings: PatrolBriefing[];
  onClose: () => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const SLOT_META: Array<{
  key: 'slot_1' | 'slot_2' | 'slot_3';
  title: string;
  timeLabel: string;
}> = [
  { key: 'slot_1', title: '1차 순찰', timeLabel: '낮 12:00 (예비 12:20)' },
  { key: 'slot_2', title: '2차 순찰', timeLabel: '오후 18:00 (예비 18:20)' },
  { key: 'slot_3', title: '3차 순찰', timeLabel: '새벽 05:00 (예비 05:20)' }
];

function getKstDateKey(offsetDays = 0): string {
  const target = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(target);
}

function formatKstTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function TargetBadgeList({
  items,
  tone
}: {
  items: PatrolBriefingTargetItem[];
  tone: 'amber' | 'red' | 'blue';
}) {
  if (items.length === 0) return null;

  const toneClass =
    tone === 'red'
      ? 'border-[#f6aea9] bg-[#fce8e6] text-[#c5221f]'
      : tone === 'amber'
        ? 'border-[#fde293] bg-[#fef7e0] text-[#b06000]'
        : 'border-[#d2e3fc] bg-[#e8f0fe] text-[#1a73e8]';

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item, idx) => (
        <a
          key={`${item.org_name}-${idx}`}
          href={item.target_url}
          target="_blank"
          rel="noopener noreferrer"
          title={item.reason || item.org_name}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition hover:opacity-85 ${toneClass}`}
        >
          <span>
            [{item.region_sigungu || item.region_sido}] {item.org_name}
          </span>
          <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}

export function PatrolBriefingModal({ open, briefings, onClose }: PatrolBriefingModalProps) {
  const todayKey = useMemo(() => getKstDateKey(0), []);
  const defaultDateKey = useMemo(() => {
    if (briefings.length > 0) {
      return briefings[0].patrol_date;
    }
    return getKstDateKey(-1);
  }, [briefings]);

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateKey);
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(() => {
    const [y, m] = defaultDateKey.split('-').map(Number);
    return { year: y || 2026, month: (m || 1) - 1 };
  });

  const byDate = useMemo(() => {
    const map = new Map<string, PatrolBriefing[]>();
    for (const row of briefings) {
      const list = map.get(row.patrol_date) ?? [];
      list.push(row);
      map.set(row.patrol_date, list);
    }
    return map;
  }, [briefings]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewMonth.year, viewMonth.month, 1).getDay();
    const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateKey: string | null }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateKey: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth.month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, dateKey: `${viewMonth.year}-${mm}-${dd}` });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, dateKey: null });
    return cells;
  }, [viewMonth]);

  if (!open) return null;

  const selectedRows = byDate.get(selectedDate) ?? [];

  const moveMonth = (delta: number) => {
    setViewMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#202124]">일별 순찰 현황 브리핑</h2>
            <p className="mt-0.5 text-xs text-[#5f6368]">
              1차(12시)·2차(18시)·3차(새벽 5시) 순찰 수집 건수와 예비순찰대 복구·실패 내역을 날짜별로 확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-xs font-medium text-[#5f6368] hover:bg-[#f1f3f4]"
          >
            닫기
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
          {/* 왼쪽: 미니 달력 */}
          <div className="border-b border-[#dadce0] bg-[#f8f9fa] p-5 md:col-span-5 md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="rounded-md border border-[#dadce0] bg-white px-2.5 py-1 text-xs font-medium text-[#3c4043] hover:bg-[#f1f3f4]"
              >
                ◀ 이전
              </button>
              <span className="text-sm font-bold text-[#202124]">
                {viewMonth.year}년 {viewMonth.month + 1}월
              </span>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="rounded-md border border-[#dadce0] bg-white px-2.5 py-1 text-xs font-medium text-[#3c4043] hover:bg-[#f1f3f4]"
              >
                다음 ▶
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#5f6368]">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                if (!cell.dateKey || cell.day === null) {
                  return <div key={`empty-${idx}`} className="h-11" />;
                }
                const dayRows = byDate.get(cell.dateKey) ?? [];
                const hasAny = dayRows.length > 0;
                const hasFinalFail = dayRows.some(
                  (r) => r.patrol_type === 'reserve' && (r.failed_targets?.length ?? 0) > 0
                );
                const hasProblem = dayRows.some(
                  (r) => (r.problem_targets?.length ?? 0) > 0 || r.patrol_type === 'reserve'
                );
                const totalCreated = dayRows.reduce((acc, r) => acc + (r.created_posts || 0), 0);
                const isSelected = cell.dateKey === selectedDate;
                const isToday = cell.dateKey === todayKey;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateKey!)}
                    className={`flex h-12 flex-col items-center justify-center rounded-lg border text-xs transition ${
                      isSelected
                        ? 'border-[#1a73e8] bg-[#e8f0fe] font-bold text-[#1a73e8]'
                        : isToday
                          ? 'border-[#aecbfa] bg-white font-semibold text-[#202124] hover:bg-[#f1f3f4]'
                          : 'border-transparent bg-white text-[#3c4043] hover:border-[#dadce0]'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {hasAny ? (
                      <div className="mt-0.5 flex items-center gap-1">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            hasFinalFail
                              ? 'bg-[#d93025]'
                              : hasProblem
                                ? 'bg-[#f29900]'
                                : 'bg-[#1a73e8]'
                          }`}
                        />
                        {totalCreated > 0 && (
                          <span className="text-[10px] font-medium text-[#137333]">
                            +{totalCreated}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="mt-0.5 h-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 border-t border-[#e8eaed] pt-3 text-[11px] text-[#5f6368]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#1a73e8]" /> 정상 완료
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#f29900]" /> 예비순찰 출동
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#d93025]" /> 예비순찰 실패 포함
              </span>
            </div>
          </div>

          {/* 오른쪽: 선택한 날짜의 1차·2차·3차 상세 브리핑 */}
          <div className="p-6 md:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124]">
                {selectedDate} 순찰 보고서
                {selectedDate === todayKey && (
                  <span className="ml-2 rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold text-[#1a73e8]">
                    오늘
                  </span>
                )}
              </h3>
              <span className="text-xs text-[#5f6368]">
                총 수집{' '}
                <strong className="text-[#1a73e8]">
                  {selectedRows.reduce((acc, r) => acc + (r.created_posts || 0), 0)}건
                </strong>
              </span>
            </div>

            <div className="space-y-4">
              {SLOT_META.map((slot) => {
                const mainRow = selectedRows.find(
                  (r) => r.slot === slot.key && r.patrol_type === 'main'
                );
                const reserveRow = selectedRows.find(
                  (r) => r.slot === slot.key && r.patrol_type === 'reserve'
                );

                return (
                  <div
                    key={slot.key}
                    className="rounded-xl border border-[#dadce0] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f3f4] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#f1f3f4] px-2 py-0.5 text-xs font-bold text-[#202124]">
                          {slot.title}
                        </span>
                        <span className="text-xs text-[#5f6368]">{slot.timeLabel}</span>
                      </div>
                      {mainRow ? (
                        <span className="text-[11px] text-[#5f6368]">
                          마지막 보고 {formatKstTime(mainRow.updated_at)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#9aa0a6]">기록 없음</span>
                      )}
                    </div>

                    {!mainRow && !reserveRow ? (
                      <p className="mt-3 text-xs text-[#80868b]">
                        이 회차의 순찰 기록이 아직 없습니다.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3 text-xs">
                        {mainRow && (
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-[#202124]">
                              <span className="font-semibold text-[#1a73e8]">본순찰대</span>
                              <span>
                                점검 <strong>{mainRow.checked_count}곳</strong> · 정상{' '}
                                <strong>{mainRow.success_count}곳</strong> · 정상 수집{' '}
                                <strong className="text-[#137333]">
                                  {mainRow.created_posts}건
                                </strong>
                              </span>
                            </div>
                            {(mainRow.problem_targets?.length ?? 0) > 0 && (
                              <div className="mt-1.5 rounded-lg bg-[#fef7e0]/60 p-2.5">
                                <div className="text-[11px] font-semibold text-[#b06000]">
                                  접속 문제로 예비순찰대 호출 대상 ({mainRow.problem_targets.length}곳)
                                </div>
                                <TargetBadgeList items={mainRow.problem_targets} tone="amber" />
                              </div>
                            )}
                          </div>
                        )}

                        {reserveRow && (
                          <div className="border-t border-dashed border-[#e8eaed] pt-2.5">
                            <div className="flex flex-wrap items-center gap-2 text-[#202124]">
                              <span className="font-semibold text-[#0b57d0]">예비순찰대</span>
                              <span>
                                재점검 <strong>{reserveRow.checked_count}곳</strong> · 복구 성공{' '}
                                <strong>{reserveRow.success_count}곳</strong> · 추가 수집{' '}
                                <strong className="text-[#137333]">
                                  {reserveRow.created_posts}건
                                </strong>
                              </span>
                            </div>

                            {(reserveRow.recovered_targets?.length ?? 0) > 0 && (
                              <div className="mt-1.5 rounded-lg bg-[#e8f0fe]/50 p-2.5">
                                <div className="text-[11px] font-semibold text-[#1a73e8]">
                                  예비순찰대 복구 완료 ({reserveRow.recovered_targets.length}곳)
                                </div>
                                <TargetBadgeList items={reserveRow.recovered_targets} tone="blue" />
                              </div>
                            )}

                            {(reserveRow.failed_targets?.length ?? 0) > 0 && (
                              <div className="mt-1.5 rounded-lg border border-[#f6aea9] bg-[#fce8e6]/60 p-2.5">
                                <div className="text-[11px] font-bold text-[#c5221f]">
                                  예비순찰대마저 실패 ({reserveRow.failed_targets.length}곳 - 확인 필요)
                                </div>
                                <TargetBadgeList items={reserveRow.failed_targets} tone="red" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
