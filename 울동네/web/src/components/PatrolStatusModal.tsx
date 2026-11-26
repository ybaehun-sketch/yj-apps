'use client';

import { useMemo, useState } from 'react';
import { KOREA_REGIONS, normalizeSidoName } from '@/lib/koreaRegions';
import type { CrawlTarget } from '@/lib/types';

export type PatrolFilterTab = 'all' | 'active' | 'error' | 'paused' | 'reserve';

interface PatrolStatusModalProps {
  open: boolean;
  initialTab: PatrolFilterTab;
  initialRegion?: string;
  targets: CrawlTarget[];
  onClose: () => void;
  onTargetAdded?: (added: CrawlTarget[]) => void;
  onTargetUpdated?: (updated: CrawlTarget) => void;
  onTargetDeleted?: (id: string) => void;
}

interface RegionCellData {
  key: string;
  sido: string;
  sigungu: string;
  items: CrawlTarget[];
  activeCount: number;
  errorCount: number;
  pausedCount: number;
  reserveCount: number;
}

function isReserveNeeded(target: CrawlTarget): boolean {
  return Boolean(target.last_item_title?.startsWith('[예비순찰대 필요]'));
}

function getTargetDot(target: CrawlTarget): { label: string; dotClass: string } {
  if (target.status === 'paused') {
    return { label: '일시정지', dotClass: 'bg-[#ef4444]' };
  }
  if (target.status === 'error') {
    return { label: '오류', dotClass: 'bg-[#facc15]' };
  }
  if (isReserveNeeded(target)) {
    return { label: '예비순찰필요', dotClass: 'bg-[#9334e6]' };
  }
  return { label: '정상', dotClass: 'bg-[#22c55e]' };
}

function isCommonTarget(target: CrawlTarget) {
  return (
    target.region_sigungu === '전체' ||
    target.region_sido === '전국' ||
    (target.region_code === '00000' && !target.region_sigungu)
  );
}

function sortTargetsBySeverity(items: CrawlTarget[]) {
  const rank = (t: CrawlTarget) => {
    if (t.status === 'paused') return 0;
    if (t.status === 'error') return 1;
    if (isReserveNeeded(t)) return 2;
    return 3;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

function matchesTab(cell: RegionCellData, tab: PatrolFilterTab) {
  if (tab === 'all') return true;
  if (tab === 'active') return cell.activeCount > 0;
  if (tab === 'error') return cell.errorCount > 0;
  if (tab === 'paused') return cell.pausedCount > 0;
  if (tab === 'reserve') return cell.reserveCount > 0;
  return true;
}

export function PatrolStatusModal({
  open,
  initialTab,
  targets,
  onClose,
  onTargetAdded,
  onTargetUpdated,
  onTargetDeleted
}: PatrolStatusModalProps) {
  const [tab, setTab] = useState<PatrolFilterTab>(initialTab);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pasteUrl, setPasteUrl] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingUrl, setEditingUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [repatrollingTargetId, setRepatrollingTargetId] = useState<string | null>(null);
  const [modalNotice, setModalNotice] = useState('');

  const [lastOpen, setLastOpen] = useState(open);
  const [lastInitialTab, setLastInitialTab] = useState(initialTab);
  if (open !== lastOpen || initialTab !== lastInitialTab) {
    setLastOpen(open);
    setLastInitialTab(initialTab);
    if (open) {
      setTab(initialTab);
      setSelectedKey(null);
      setPasteUrl('');
      setEditingId(null);
      setModalNotice('');
    }
  }

  const counts = useMemo(
    () => ({
      active: targets.filter((t) => t.status === 'active').length,
      error: targets.filter((t) => t.status === 'error').length,
      paused: targets.filter((t) => t.status === 'paused').length,
      reserve: targets.filter(isReserveNeeded).length
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
      pausedCount: commonItems.filter((t) => t.status === 'paused').length,
      reserveCount: commonItems.filter(isReserveNeeded).length
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
          pausedCount: items.filter((t) => t.status === 'paused').length,
          reserveCount: items.filter(isReserveNeeded).length
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
            pausedCount: items.filter((t) => t.status === 'paused').length,
            reserveCount: items.filter(isReserveNeeded).length
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

  async function handleQuickAddUrl(cell: RegionCellData) {
    const trimmed = pasteUrl.trim();
    if (!trimmed) return;
    setAddingUrl(true);
    setModalNotice('');
    try {
      const res = await fetch('/api/admin/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region_sido: cell.sido,
          region_sigungu: cell.sigungu,
          target_url: trimmed
        })
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        target?: CrawlTarget;
        extraTarget?: CrawlTarget | null;
        error?: string;
      };
      if (!res.ok || !data.target) {
        setModalNotice(data.error || '게시판 추가에 실패했습니다.');
        return;
      }
      const added = data.extraTarget ? [data.target, data.extraTarget] : [data.target];
      onTargetAdded?.(added);
      setPasteUrl('');
      setModalNotice(
        data.extraTarget
          ? `'${data.target.org_name}' 및 프로그램홍보가 목록에 추가되었습니다.`
          : `'${data.target.org_name}'이(가) 목록에 추가되었습니다.`
      );
    } catch {
      setModalNotice('네트워크 오류로 추가하지 못했습니다.');
    } finally {
      setAddingUrl(false);
    }
  }

  async function handleSaveEditUrl(id: string) {
    const trimmedName = editingName.trim();
    const trimmedUrl = editingUrl.trim();
    if (!trimmedName || !trimmedUrl) {
      setModalNotice('이름과 주소를 모두 입력해 주세요.');
      return;
    }
    setSavingEdit(true);
    setModalNotice('');
    try {
      const res = await fetch('/api/admin/targets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, org_name: trimmedName, target_url: trimmedUrl })
      });
      const data = (await res.json()) as {
        ok?: boolean;
        target?: CrawlTarget;
        error?: string;
      };
      if (!res.ok || !data.target) {
        setModalNotice(data.error || '정보 수정에 실패했습니다.');
        return;
      }
      onTargetUpdated?.(data.target);
      setEditingId(null);
      setEditingName('');
      setEditingUrl('');
      setModalNotice(`'${data.target.org_name}' 이름과 주소가 수정되었습니다.`);
    } catch {
      setModalNotice('네트워크 오류로 수정하지 못했습니다.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteTarget(t: CrawlTarget) {
    if (!window.confirm(`'${t.org_name}'을(를) 순찰 목록에서 삭제할까요?`)) return;
    setModalNotice('');
    try {
      const res = await fetch('/api/admin/targets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id })
      });
      if (!res.ok) {
        setModalNotice('삭제에 실패했습니다.');
        return;
      }
      onTargetDeleted?.(t.id);
      setModalNotice(`'${t.org_name}'이(가) 삭제되었습니다.`);
    } catch {
      setModalNotice('네트워크 오류로 삭제하지 못했습니다.');
    }
  }

  async function handleRepatrolTarget(t: CrawlTarget) {
    setRepatrollingTargetId(t.id);
    setModalNotice(`'${t.org_name}' 재순찰을 시작했습니다. 잠시만 기다려 주세요...`);
    try {
      const res = await fetch('/api/admin/patrol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: t.id })
      });
      const data = (await res.json()) as {
        ok?: boolean;
        summary?: {
          createdPosts?: number;
          errors?: number;
        };
        updatedTargets?: CrawlTarget[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setModalNotice(data.error || `'${t.org_name}' 재순찰에 실패했습니다.`);
        return;
      }
      if (data.updatedTargets && data.updatedTargets.length > 0) {
        for (const updated of data.updatedTargets) {
          onTargetUpdated?.(updated);
        }
      }
      const created = data.summary?.createdPosts ?? 0;
      const errors = data.summary?.errors ?? 0;
      setModalNotice(
        errors > 0
          ? `'${t.org_name}' 재순찰 완료 — 접속이 어려워 예비순찰대 필요 상태로 표시되었습니다.`
          : `'${t.org_name}' 재순찰 완료 — 정상 확인 (새 소식 ${created}건 수집)`
      );
    } catch {
      setModalNotice('네트워크 오류로 재순찰하지 못했습니다.');
    } finally {
      setRepatrollingTargetId(null);
    }
  }

  async function handleTogglePauseTarget(t: CrawlTarget) {
    const nextStatus = t.status === 'paused' ? 'active' : 'paused';
    setModalNotice('');
    try {
      const res = await fetch('/api/admin/targets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, status: nextStatus })
      });
      const data = (await res.json()) as {
        ok?: boolean;
        target?: CrawlTarget;
        error?: string;
      };
      if (!res.ok || !data.target) {
        setModalNotice(data.error || '상태 변경에 실패했습니다.');
        return;
      }
      onTargetUpdated?.(data.target);
      setModalNotice(
        nextStatus === 'paused'
          ? `'${t.org_name}' 순찰이 일시정지되었습니다.`
          : `'${t.org_name}' 순찰이 다시 시작됩니다.`
      );
    } catch {
      setModalNotice('네트워크 오류로 상태를 변경하지 못했습니다.');
    }
  }

  const getRegionHomeLinks = (cell: RegionCellData) => {
    const cityItem = cell.items.find(
      (t) => t.source_type === 'WEB_BOARD' && t.target_url && !t.target_url.includes('familynet.or.kr')
    );
    const familyItem = cell.items.find(
      (t) => t.source_type === 'FAMILYNET' || t.target_url?.includes('familynet.or.kr')
    );

    let cityHome = `https://search.naver.com/search.naver?query=${encodeURIComponent(`${cell.sigungu}청 홈페이지`)}`;
    if (cityItem?.target_url) {
      try {
        cityHome = new URL(cityItem.target_url).origin;
      } catch {}
    }

    let familyHome = `https://search.naver.com/search.naver?query=${encodeURIComponent(`${cell.sigungu} 가족센터`)}`;
    if (familyItem?.target_url) {
      try {
        familyHome = new URL(familyItem.target_url).origin;
      } catch {}
    }

    return { cityHome, familyHome };
  };

  const renderDetailBox = (cell: RegionCellData, title: string) => {
    const isCommon = cell.sigungu === '전체';
    const { cityHome, familyHome } = getRegionHomeLinks(cell);

    return (
      <div className="mt-3 rounded-xl border border-[#dadce0] bg-[#fafafa] p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#202124]">
              {title} 상세현황 ({cell.items.length}곳)
            </span>
            {!isCommon ? (
              <>
                <a
                  href={cityHome}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-[#d2e3fc] bg-white px-2 py-0.5 text-[11px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe]"
                >
                  시군구청 홈 ↗
                </a>
                <a
                  href={familyHome}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-[#ceead6] bg-white px-2 py-0.5 text-[11px] font-medium text-[#137333] hover:bg-[#e6f4ea]"
                >
                  가족센터 홈 ↗
                </a>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setSelectedKey(null)}
            className="text-xs font-medium text-[#5f6368] hover:text-[#202124]"
          >
            접기 ▴
          </button>
        </div>

        {modalNotice ? (
          <div className="mb-2.5 rounded-lg border border-[#d2e3fc] bg-[#e8f0fe] px-3 py-1.5 text-xs font-medium text-[#1967d2]">
            {modalNotice}
          </div>
        ) : null}

        <div className="space-y-2">
          {cell.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#dadce0] bg-white px-3 py-3 text-center text-xs text-[#5f6368]">
              아직 등록된 게시판이 없습니다. 위 <strong>시군구청 홈 / 가족센터 홈</strong>에서 알짜 게시판 주소를 복사해 아래에 붙여넣어 주세요.
            </div>
          ) : (
            cell.items.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-[#e8eaed] bg-white px-3 py-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${getTargetDot(t).dotClass}`}
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
                      ({getTargetDot(t).label})
                    </span>
                    {t.last_item_title?.startsWith('[예비순찰대 필요]') ? (
                      <span
                        className="shrink-0 rounded bg-[#f3e8fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#7627bb]"
                        title="본순찰대 접속이 막혀 예비순찰대 활동이 필요한 곳입니다."
                      >
                        예비순찰대 필요
                      </span>
                    ) : t.last_item_title?.startsWith('[예비순찰대 완료]') ? (
                      <span
                        className="shrink-0 rounded bg-[#e8f0fe] px-1.5 py-0.5 text-[10px] font-semibold text-[#1967d2]"
                        title={t.last_item_title}
                      >
                        예비순찰대 완료
                      </span>
                    ) : t.last_item_title?.startsWith('[주소 점검 필요]') ? (
                      <span
                        className="shrink-0 rounded bg-[#fce8e6] px-1.5 py-0.5 text-[10px] font-semibold text-[#c5221f]"
                        title={t.last_item_title}
                      >
                        주소 점검 필요
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      disabled={repatrollingTargetId === t.id}
                      onClick={() => handleRepatrolTarget(t)}
                      className="rounded border border-[#d2e3fc] bg-[#e8f0fe] px-2 py-1 font-medium text-[#1967d2] hover:bg-[#d2e3fc] disabled:opacity-50"
                    >
                      {repatrollingTargetId === t.id ? '재순찰 중...' : '재순찰'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingId === t.id) {
                          setEditingId(null);
                          setEditingName('');
                          setEditingUrl('');
                        } else {
                          setEditingId(t.id);
                          setEditingName(t.org_name || '');
                          setEditingUrl(t.target_url || '');
                        }
                      }}
                      className="rounded border border-[#dadce0] bg-white px-2 py-1 font-medium text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124]"
                    >
                      {editingId === t.id ? '취소' : '이름·주소 수정'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePauseTarget(t)}
                      className={`rounded border px-2 py-1 font-medium ${
                        t.status === 'paused'
                          ? 'border-[#ceead6] bg-[#e6f4ea] text-[#137333] hover:bg-[#d2e3fc]'
                          : 'border-[#feefc3] bg-[#fef7e0] text-[#b06000] hover:bg-[#feefc3]'
                      }`}
                    >
                      {t.status === 'paused' ? '재개' : '일시정지'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTarget(t)}
                      className="rounded border border-[#fad2cf] bg-white px-2 py-1 font-medium text-[#c5221f] hover:bg-[#fce8e6]"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {editingId === t.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#f1f3f4] pt-2">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEditUrl(t.id);
                        }
                      }}
                      placeholder="기관·게시판 이름"
                      className="w-full sm:w-48 rounded border border-[#dadce0] px-2.5 py-1 text-xs"
                    />
                    <input
                      value={editingUrl}
                      onChange={(e) => setEditingUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEditUrl(t.id);
                        }
                      }}
                      placeholder="새 게시판 주소를 붙여넣으세요"
                      className="min-w-[200px] flex-1 rounded border border-[#dadce0] px-2.5 py-1 text-xs"
                    />
                    <button
                      type="button"
                      disabled={savingEdit}
                      onClick={() => handleSaveEditUrl(t.id)}
                      className="rounded bg-[#1a73e8] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1557b0] disabled:opacity-50"
                    >
                      {savingEdit ? '저장 중...' : '저장'}
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        {!isCommon ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#e8eaed] pt-3">
            <input
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickAddUrl(cell);
                }
              }}
              placeholder="여기에 알짜 게시판 주소를 복사해 붙여넣으세요 (지역·이름 자동 판별)"
              className="min-w-[240px] flex-1 rounded-lg border border-[#dadce0] bg-white px-3 py-1.5 text-xs"
            />
            <button
              type="button"
              disabled={addingUrl}
              onClick={() => handleQuickAddUrl(cell)}
              className="rounded-lg bg-[#1a73e8] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1557b0] disabled:opacity-50"
            >
              {addingUrl ? '판별 및 추가 중...' : '+ 목록에 추가'}
            </button>
          </div>
        ) : null}
      </div>
    );
  };

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
                { key: 'active', label: '정상', count: counts.active, dotClass: 'bg-[#22c55e]', isReserve: false },
                { key: 'error', label: '오류', count: counts.error, dotClass: 'bg-[#facc15]', isReserve: false },
                { key: 'paused', label: '일시정지', count: counts.paused, dotClass: 'bg-[#ef4444]', isReserve: false },
                ...(counts.reserve > 0 || tab === 'reserve'
                  ? [{ key: 'reserve' as const, label: '예비순찰필요', count: counts.reserve, dotClass: 'bg-[#9334e6]', isReserve: true }]
                  : [])
              ] as Array<{
                key: Exclude<PatrolFilterTab, 'all'>;
                label: string;
                count: number;
                dotClass: string;
                isReserve: boolean;
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
                      ? item.isReserve
                        ? 'border-[#9334e6] bg-[#f3e8fd] text-[#7627bb]'
                        : 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]'
                      : item.isReserve
                        ? 'border-[#d7aefb] bg-[#faf5ff] text-[#7627bb] hover:bg-[#f3e8fd]'
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
                      {commonCell.items.map((t) => {
                        const dot = getTargetDot(t);
                        return (
                          <span
                            key={t.id}
                            title={`${t.org_name} (${dot.label})`}
                            className={`inline-block h-2.5 w-2.5 rounded-full ${dot.dotClass}`}
                          />
                        );
                      })}
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
                        const hasReserve = cell.reserveCount > 0;
                        const isSelected = selectedKey === cell.key;

                        if (!isActive) {
                          return (
                            <button
                              key={cell.key}
                              type="button"
                              onClick={() => {
                                setModalNotice('');
                                setSelectedKey((prev) =>
                                  prev === cell.key ? null : cell.key
                                );
                              }}
                              className={`flex items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-medium transition ${
                                isSelected
                                  ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8] ring-2 ring-[#1a73e8]'
                                  : 'border-[#e8eaed] bg-[#f1f3f4] text-[#9aa0a6] hover:border-[#dadce0] hover:bg-[#e8eaed] hover:text-[#5f6368]'
                              }`}
                            >
                              {cell.sigungu}
                            </button>
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
                                : hasReserve
                                  ? 'border-[#d7aefb] bg-[#faf5ff] text-[#202124] hover:bg-[#f3e8fd]'
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
                              {cell.items.map((t) => {
                                const dot = getTargetDot(t);
                                return (
                                  <span
                                    key={t.id}
                                    title={`${t.org_name} (${dot.label})`}
                                    className={`inline-block h-2 w-2 rounded-full ${dot.dotClass}`}
                                  />
                                );
                              })}
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
