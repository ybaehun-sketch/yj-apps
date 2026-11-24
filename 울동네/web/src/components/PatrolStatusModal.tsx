'use client';

import { useMemo, useState } from 'react';
import { KOREA_REGIONS, normalizeSidoName } from '@/lib/koreaRegions';
import type { CrawlTarget } from '@/lib/types';

export type PatrolFilterTab = 'all' | 'active' | 'error' | 'paused';

interface PatrolStatusModalProps {
  open: boolean;
  initialTab: PatrolFilterTab;
  initialRegion?: string;
  targets: CrawlTarget[];
  onClose: () => void;
}

interface RegionCellData {
  key: string;
  sido: string;
  sigungu: string;
  items: CrawlTarget[];
  activeCount: number;
  errorCount: number;
  pausedCount: number;
}

const STATUS_DOT: Record<
  CrawlTarget['status'],
  { label: string; dotClass: string }
> = {
  active: { label: '정상', dotClass: 'bg-[#22c55e]' },
  error: { label: '오류', dotClass: 'bg-[#facc15]' },
  paused: { label: '일시정지', dotClass: 'bg-[#ef4444]' }
};

function isCommonTarget(target: CrawlTarget) {
  return target.region_sigungu === '전체' || target.region_code === '00000';
}

function sortTargetsBySeverity(items: CrawlTarget[]) {
  const order: Record<CrawlTarget['status'], number> = {
    paused: 0,
    error: 1,
    active: 2
  };
  return [...items].sort((a, b) => order[a.status] - order[b.status]);
}

function matchesTab(cell: RegionCellData, tab: PatrolFilterTab) {
  if (tab === 'all') return true;
  if (tab === 'active') return cell.activeCount > 0;
  if (tab === 'error') return cell.errorCount > 0;
  if (tab === 'paused') return cell.pausedCount > 0;
  return true;
}

export function PatrolStatusModal({
  open,
  initialTab,
  targets,
  onClose
}: PatrolStatusModalProps) {
  const [tab, setTab] = useState<PatrolFilterTab>(initialTab);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [lastOpen, setLastOpen] = useState(open);
  const [lastInitialTab, setLastInitialTab] = useState(initialTab);
  if (open !== lastOpen || initialTab !== lastInitialTab) {
    setLastOpen(open);
    setLastInitialTab(initialTab);
    if (open) {
      setTab(initialTab);
      setSelectedKey(null);
    }
  }

  const counts = useMemo(
    () => ({
      active: targets.filter((t) => t.status === 'active').length,
      error: targets.filter((t) => t.status === 'error').length,
      paused: targets.filter((t) => t.status === 'paused').length
    }),
    [targets]
  );

  const { commonCell, sidoSections } = useMemo(() => {
    const commonItems: CrawlTarget[] = [];
    const targetMap = new Map<string, CrawlTarget[]>();

    for (const t of targets) {
      if (isCommonTarget(t)) {
        commonItems.push(t);
        continue;
      }
      const sido = normalizeSidoName(t.region_sido);
      const sigungu = t.region_sigungu.trim();
      const key = `${sido}::${sigungu}`;
      const list = targetMap.get(key) ?? [];
      list.push(t);
      targetMap.set(key, list);
    }

    const common: RegionCellData = {
      key: 'COMMON',
      sido: '전국',
      sigungu: '전국 공통',
      items: sortTargetsBySeverity(commonItems),
      activeCount: commonItems.filter((t) => t.status === 'active').length,
      errorCount: commonItems.filter((t) => t.status === 'error').length,
      pausedCount: commonItems.filter((t) => t.status === 'paused').length
    };

    const usedKeys = new Set<string>();
    const sections = KOREA_REGIONS.map((group) => {
      const cells: RegionCellData[] = group.sigungus.map((sigungu) => {
        const key = `${group.sido}::${sigungu}`;
        usedKeys.add(key);
        const items = sortTargetsBySeverity(targetMap.get(key) ?? []);
        return {
          key,
          sido: group.sido,
          sigungu,
          items,
          activeCount: items.filter((t) => t.status === 'active').length,
          errorCount: items.filter((t) => t.status === 'error').length,
          pausedCount: items.filter((t) => t.status === 'paused').length
        };
      });

      // 혹시 기본 목록 외 시군구명이 들어온 경우 누락 없이 포함
      for (const [key, rawItems] of targetMap.entries()) {
        if (!usedKeys.has(key) && key.startsWith(`${group.sido}::`)) {
          usedKeys.add(key);
          const sigungu = key.split('::')[1] ?? '';
          const items = sortTargetsBySeverity(rawItems);
          cells.push({
            key,
            sido: group.sido,
            sigungu,
            items,
            activeCount: items.filter((t) => t.status === 'active').length,
            errorCount: items.filter((t) => t.status === 'error').length,
            pausedCount: items.filter((t) => t.status === 'paused').length
          });
        }
      }

      const filteredCells =
        tab === 'all' ? cells : cells.filter((c) => matchesTab(c, tab));

      const activeRegionCount = filteredCells.filter((c) => c.items.length > 0).length;
      const problemCount = filteredCells.reduce(
        (sum, c) => sum + c.errorCount + c.pausedCount,
        0
      );

      return {
        sido: group.sido,
        cells: filteredCells,
        activeRegionCount,
        problemCount
      };
    }).filter((section) => section.cells.length > 0);

    // 문제 있는 시·도 최상단, 다음 활성화된 시·도, 나머지 비활성 시·도 순 정렬
    sections.sort((a, b) => {
      const aProblem = a.problemCount > 0 ? 1 : 0;
      const bProblem = b.problemCount > 0 ? 1 : 0;
      if (aProblem !== bProblem) return bProblem - aProblem;

      const aActive = a.activeRegionCount > 0 ? 1 : 0;
      const bActive = b.activeRegionCount > 0 ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;

      return 0;
    });

    return { commonCell: common, sidoSections: sections };
  }, [targets, tab]);

  if (!open) return null;

  const showCommon =
    commonCell.items.length > 0 && matchesTab(commonCell, tab);

  const renderDetailBox = (cell: RegionCellData, title: string) => (
    <div className="mt-3 rounded-xl border border-[#dadce0] bg-[#fafafa] p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-[#202124]">
          {title} 상세현황 ({cell.items.length}곳)
        </span>
        <button
          type="button"
          onClick={() => setSelectedKey(null)}
          className="text-xs font-medium text-[#5f6368] hover:text-[#202124]"
        >
          접기 ▴
        </button>
      </div>
      <div className="space-y-2">
        {cell.items.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e8eaed] bg-white px-3 py-2 text-xs"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[t.status].dotClass}`}
              />
              {t.target_url ? (
                <a
                  href={t.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-semibold text-[#1a73e8] hover:underline"
                  title={t.target_url}
                >
                  {t.org_name}
                </a>
              ) : (
                <span className="truncate font-semibold text-[#202124]">
                  {t.org_name}
                </span>
              )}
              <span className="shrink-0 text-[#5f6368]">
                ({STATUS_DOT[t.status].label})
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {t.target_url ? (
                <a
                  href={t.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-[#dadce0] bg-[#f8f9fa] px-2.5 py-1 font-medium text-[#3c4043] hover:bg-[#e8f0fe] hover:text-[#1a73e8]"
                >
                  바로가기 ↗
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-2xl">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
          <h3 className="text-lg font-bold text-[#202124]">순찰지역 테이블</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-sm font-medium text-[#5f6368] hover:bg-[#f8f9fa]"
          >
            닫기
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* 정상 · 오류 · 일시정지 3개 버튼 + 갯수만 표시 */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: 'active', label: '정상', count: counts.active, dotClass: 'bg-[#22c55e]' },
                { key: 'error', label: '오류', count: counts.error, dotClass: 'bg-[#facc15]' },
                { key: 'paused', label: '일시정지', count: counts.paused, dotClass: 'bg-[#ef4444]' }
              ] as Array<{
                key: Exclude<PatrolFilterTab, 'all'>;
                label: string;
                count: number;
                dotClass: string;
              }>
            ).map((item) => {
              const selected = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab((prev) => (prev === item.key ? 'all' : item.key))}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    selected
                      ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]'
                      : 'border-[#dadce0] bg-white text-[#202124] hover:bg-[#f8f9fa]'
                  }`}
                >
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.dotClass}`} />
                  <span>
                    {item.label} {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 전국 공통 */}
          {showCommon ? (
            <div className="rounded-xl border border-[#dadce0] bg-white p-3.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedKey((prev) =>
                      prev === commonCell.key ? null : commonCell.key
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition ${
                    commonCell.errorCount + commonCell.pausedCount > 0
                      ? 'border-[#f5c2c0] bg-[#fff8f6] hover:bg-[#fef1ee]'
                      : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]'
                  } ${
                    selectedKey === commonCell.key
                      ? 'ring-2 ring-[#1a73e8] border-[#1a73e8]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-[#202124]">
                      전국 공통
                    </span>
                    <div className="flex items-center gap-1">
                      {commonCell.items.map((t) => (
                        <span
                          key={t.id}
                          title={`${t.org_name} (${STATUS_DOT[t.status].label})`}
                          className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT[t.status].dotClass}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#5f6368]">
                    {commonCell.items.length}곳{' '}
                    {selectedKey === commonCell.key ? '▴' : '▾'}
                  </span>
                </button>
              </div>
              {selectedKey === commonCell.key
                ? renderDetailBox(commonCell, '전국 공통')
                : null}
            </div>
          ) : null}

          {/* 시·도별 전국 지자체 격자형 표 */}
          {sidoSections.length === 0 && !showCommon ? (
            <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-8 text-center text-sm text-[#5f6368]">
              해당 상태의 지역이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-[#dadce0] overflow-hidden rounded-xl border border-[#dadce0] bg-white">
              {sidoSections.map((section) => {
                const selectedCellInSection = section.cells.find(
                  (c) => c.key === selectedKey
                );

                return (
                  <div key={section.sido} className="p-3.5">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#202124]">
                        {section.sido}
                      </span>
                      <span className="text-[11px] font-medium text-[#5f6368]">
                        활성 {section.activeRegionCount} / 전체 {section.cells.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
                      {section.cells.map((cell) => {
                        const isActive = cell.items.length > 0;
                        const hasProblem = cell.errorCount + cell.pausedCount > 0;
                        const isSelected = selectedKey === cell.key;

                        if (!isActive) {
                          return (
                            <div
                              key={cell.key}
                              className="flex items-center justify-center rounded-lg border border-[#e8eaed] bg-[#f1f3f4] px-2 py-2 text-center text-xs font-medium text-[#9aa0a6]"
                            >
                              {cell.sigungu}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={cell.key}
                            type="button"
                            onClick={() =>
                              setSelectedKey((prev) =>
                                prev === cell.key ? null : cell.key
                              )
                            }
                            className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center transition ${
                              hasProblem
                                ? 'border-[#f5c2c0] bg-[#fff8f6] text-[#202124] hover:bg-[#fef1ee]'
                                : 'border-[#dadce0] bg-white text-[#202124] hover:border-[#1a73e8] hover:bg-[#f8faff]'
                            } ${
                              isSelected
                                ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]'
                                : ''
                            }`}
                          >
                            <span className="text-xs font-bold leading-tight">
                              {cell.sigungu}
                            </span>
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {cell.items.map((t) => (
                                <span
                                  key={t.id}
                                  title={`${t.org_name} (${STATUS_DOT[t.status].label})`}
                                  className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[t.status].dotClass}`}
                                />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedCellInSection
                      ? renderDetailBox(
                          selectedCellInSection,
                          `${selectedCellInSection.sido} ${selectedCellInSection.sigungu}`
                        )
                      : null}
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
