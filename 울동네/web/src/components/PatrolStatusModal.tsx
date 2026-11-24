'use client';

import { useMemo, useState } from 'react';
import type { CrawlTarget } from '@/lib/types';

export type PatrolFilterTab = 'all' | 'active' | 'error' | 'paused';

interface PatrolStatusModalProps {
  open: boolean;
  initialTab: PatrolFilterTab;
  targets: CrawlTarget[];
  onClose: () => void;
  onResetTarget: (targetId: string) => Promise<void>;
}

const SOURCE_TYPE_LABEL: Record<CrawlTarget['source_type'], string> = {
  API_GOV24: '공공데이터(보조금24)',
  API_WELFARE: '복지로 안내',
  WEB_BOARD: '지자체 게시판',
  FAMILYNET: '가족센터 게시판'
};

const STATUS_BADGE: Record<
  CrawlTarget['status'],
  { label: string; className: string }
> = {
  active: {
    label: '정상 순찰',
    className: 'bg-[#e8f0fe] text-[#1a73e8]'
  },
  error: {
    label: '오류 확인필요',
    className: 'bg-[#fce8e6] text-[#c5221f]'
  },
  paused: {
    label: '일시 정지',
    className: 'bg-[#f1f3f4] text-[#5f6368]'
  }
};

function formatRegionLabel(target: CrawlTarget) {
  if (target.region_sigungu === '전체' || target.region_code === '00000') {
    return '전국 공통';
  }
  return `${target.region_sido} ${target.region_sigungu}`;
}

function formatCheckedAt(iso: string | null) {
  if (!iso) return '아직 순찰 기록 없음';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function PatrolStatusModal({
  open,
  initialTab,
  targets,
  onClose,
  onResetTarget
}: PatrolStatusModalProps) {
  const [tab, setTab] = useState<PatrolFilterTab>(initialTab);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  // 모달이 열릴 때 초기 탭 동기화
  const [lastOpen, setLastOpen] = useState(open);
  const [lastInitialTab, setLastInitialTab] = useState(initialTab);
  if (open !== lastOpen || initialTab !== lastInitialTab) {
    setLastOpen(open);
    setLastInitialTab(initialTab);
    if (open) {
      setTab(initialTab);
      setSelectedRegion('ALL');
    }
  }

  const counts = useMemo(
    () => ({
      all: targets.length,
      active: targets.filter((t) => t.status === 'active').length,
      error: targets.filter((t) => t.status === 'error').length,
      paused: targets.filter((t) => t.status === 'paused').length
    }),
    [targets]
  );

  // 현재 순찰 중인 지역별 요약 (한눈에 파악용)
  const regionSummaries = useMemo(() => {
    const map = new Map<
      string,
      { label: string; total: number; active: number; error: number; paused: number }
    >();
    for (const t of targets) {
      const label = formatRegionLabel(t);
      const prev = map.get(label) ?? {
        label,
        total: 0,
        active: 0,
        error: 0,
        paused: 0
      };
      prev.total += 1;
      prev[t.status] += 1;
      map.set(label, prev);
    }
    return Array.from(map.values());
  }, [targets]);

  const filteredTargets = useMemo(() => {
    return targets.filter((t) => {
      if (tab !== 'all' && t.status !== tab) return false;
      if (selectedRegion !== 'ALL' && formatRegionLabel(t) !== selectedRegion) {
        return false;
      }
      return true;
    });
  }, [targets, tab, selectedRegion]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-2xl">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-[#202124]">
              AI 순찰 지역 · 게시판 세부 현황
            </h3>
            <p className="text-xs text-[#5f6368]">
              어느 지역의 어느 게시판을 순찰 중인지 상태별·지역별로 한눈에 확인하실 수 있습니다.
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

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* 상태별 탭 */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'all', label: `전체 (${counts.all})` },
                { key: 'active', label: `정상 순찰 (${counts.active})` },
                { key: 'error', label: `오류 (${counts.error})` },
                { key: 'paused', label: `일시 정지 (${counts.paused})` }
              ] as Array<{ key: PatrolFilterTab; label: string }>
            ).map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-[#1a73e8] text-white'
                      : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* 현재 순찰 지역 한눈에 파악 */}
          <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-[#202124]">
                현재 순찰 지역 한눈에 보기 (클릭 시 해당 지역만 보기)
              </span>
              {selectedRegion !== 'ALL' ? (
                <button
                  type="button"
                  onClick={() => setSelectedRegion('ALL')}
                  className="text-xs font-semibold text-[#1a73e8] hover:underline"
                >
                  전체 지역 보기
                </button>
              ) : null}
            </div>
            {regionSummaries.length === 0 ? (
              <p className="text-xs text-[#5f6368]">등록된 순찰 지역이 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {regionSummaries.map((r) => {
                  const selected = selectedRegion === r.label;
                  return (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() =>
                        setSelectedRegion((prev) => (prev === r.label ? 'ALL' : r.label))
                      }
                      className={`rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                        selected
                          ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]'
                          : 'border-[#dadce0] bg-white text-[#202124] hover:bg-[#f1f3f4]'
                      }`}
                    >
                      <span className="font-bold">{r.label}</span>{' '}
                      <span className="text-[#5f6368]">총 {r.total}곳</span>
                      {r.error > 0 ? (
                        <span className="ml-1 font-semibold text-[#c5221f]">
                          (오류 {r.error})
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 세부 게시판 리스트 */}
          {filteredTargets.length === 0 ? (
            <div className="rounded-xl border border-[#dadce0] bg-white p-8 text-center text-sm text-[#5f6368]">
              해당 조건에 맞는 순찰 게시판이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-[#dadce0] rounded-xl border border-[#dadce0] bg-white">
              {filteredTargets.map((target) => {
                const badge = STATUS_BADGE[target.status];
                return (
                  <div
                    key={target.id}
                    className="flex flex-wrap items-start justify-between gap-4 p-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                          {target.status === 'error' ? ` (${target.fail_count}회 실패)` : ''}
                        </span>
                        <span className="rounded bg-[#f1f3f4] px-2 py-0.5 text-xs font-medium text-[#3c4043]">
                          {formatRegionLabel(target)}
                        </span>
                        <span className="text-xs text-[#5f6368]">
                          {SOURCE_TYPE_LABEL[target.source_type]}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-[#202124]">
                        {target.org_name}
                      </div>

                      <div className="truncate text-xs text-[#5f6368]">
                        게시판 주소:{' '}
                        <a
                          href={target.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1a73e8] hover:underline"
                        >
                          {target.target_url}
                        </a>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5f6368]">
                        <span>최근 순찰: {formatCheckedAt(target.last_checked_at)}</span>
                        {target.last_item_title ? (
                          <span>최근 확인 공고: {target.last_item_title}</span>
                        ) : null}
                      </div>
                    </div>

                    {target.status === 'error' ? (
                      <button
                        type="button"
                        disabled={busyId === target.id}
                        onClick={async () => {
                          setBusyId(target.id);
                          try {
                            await onResetTarget(target.id);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        className="shrink-0 rounded-lg border border-[#fad2cf] bg-[#fce8e6] px-3 py-1.5 text-xs font-semibold text-[#c5221f] hover:bg-[#fad2cf]"
                      >
                        {busyId === target.id ? '처리 중...' : '다시 활성화'}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
