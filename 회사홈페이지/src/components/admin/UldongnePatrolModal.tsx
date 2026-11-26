import { useMemo, useState } from "react";
import { KOREA_REGIONS, normalizeSidoName } from "@/lib/korea-regions";
import type { UldongneCrawlTarget } from "@/lib/studio-blocks/remote-bridge.server";

export type PatrolFilterTab = "all" | "active" | "error" | "paused" | "reserve";

interface UldongnePatrolModalProps {
  open: boolean;
  targets: UldongneCrawlTarget[];
  loading: boolean;
  errorMessage?: string | undefined;
  onClose: () => void;
}

interface RegionCellData {
  key: string;
  sido: string;
  sigungu: string;
  items: UldongneCrawlTarget[];
  activeCount: number;
  errorCount: number;
  pausedCount: number;
  reserveCount: number;
}

function isReserveNeeded(target: UldongneCrawlTarget): boolean {
  return Boolean(target.last_item_title?.startsWith("[예비순찰대 필요]"));
}

function getTargetDot(target: UldongneCrawlTarget): { label: string; dotClass: string } {
  if (target.status === "paused") return { label: "일시정지", dotClass: "bg-[#ef4444]" };
  if (target.status === "error") return { label: "오류", dotClass: "bg-[#facc15]" };
  if (isReserveNeeded(target)) return { label: "예비순찰필요", dotClass: "bg-[#9334e6]" };
  return { label: "정상", dotClass: "bg-[#22c55e]" };
}

function isCommonTarget(target: UldongneCrawlTarget) {
  return (
    target.region_sigungu === "전체" ||
    target.region_sido === "전국" ||
    (target.region_code === "00000" && !target.region_sigungu)
  );
}

function sortTargetsBySeverity(items: UldongneCrawlTarget[]) {
  const rank = (t: UldongneCrawlTarget) => {
    if (t.status === "paused") return 0;
    if (t.status === "error") return 1;
    if (isReserveNeeded(t)) return 2;
    return 3;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

function matchesTab(cell: RegionCellData, tab: PatrolFilterTab) {
  if (tab === "all") return true;
  if (tab === "active") return cell.activeCount > 0;
  if (tab === "error") return cell.errorCount > 0;
  if (tab === "paused") return cell.pausedCount > 0;
  if (tab === "reserve") return cell.reserveCount > 0;
  return true;
}

function buildCell(key: string, sido: string, sigungu: string, rawItems: UldongneCrawlTarget[]): RegionCellData {
  const items = sortTargetsBySeverity(rawItems);
  return {
    key,
    sido,
    sigungu,
    items,
    activeCount: items.filter((t) => t.status === "active").length,
    errorCount: items.filter((t) => t.status === "error").length,
    pausedCount: items.filter((t) => t.status === "paused").length,
    reserveCount: items.filter(isReserveNeeded).length,
  };
}

export function UldongnePatrolModal({
  open,
  targets,
  loading,
  errorMessage,
  onClose,
}: UldongnePatrolModalProps) {
  const [tab, setTab] = useState<PatrolFilterTab>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      active: targets.filter((t) => t.status === "active").length,
      error: targets.filter((t) => t.status === "error").length,
      paused: targets.filter((t) => t.status === "paused").length,
      reserve: targets.filter(isReserveNeeded).length,
    }),
    [targets],
  );

  const { commonCell, sidoSections } = useMemo(() => {
    const commonItems: UldongneCrawlTarget[] = [];
    const targetMap = new Map<string, UldongneCrawlTarget[]>();

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

    const common = buildCell("COMMON", "전국", "전국 공통", commonItems);
    const usedKeys = new Set<string>();

    const sections = KOREA_REGIONS.map((group) => {
      const cells: RegionCellData[] = group.sigungus.map((sigungu) => {
        const key = `${group.sido}::${sigungu}`;
        usedKeys.add(key);
        return buildCell(key, group.sido, sigungu, targetMap.get(key) ?? []);
      });

      for (const [key, rawItems] of targetMap.entries()) {
        if (!usedKeys.has(key) && key.startsWith(`${group.sido}::`)) {
          usedKeys.add(key);
          const sigungu = key.split("::")[1] ?? "";
          cells.push(buildCell(key, group.sido, sigungu, rawItems));
        }
      }

      const filteredCells = tab === "all" ? cells : cells.filter((c) => matchesTab(c, tab));
      const activeRegionCount = filteredCells.filter((c) => c.items.length > 0).length;
      const problemCount = filteredCells.reduce((sum, c) => sum + c.errorCount + c.pausedCount, 0);

      return { sido: group.sido, cells: filteredCells, activeRegionCount, problemCount };
    }).filter((s) => s.cells.length > 0);

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

  const showCommon = commonCell.items.length > 0 && matchesTab(commonCell, tab);

  const renderDetailBox = (cell: RegionCellData, title: string) => (
    <div className="mt-3 rounded-xl border border-[#d2e3fc] bg-[#f8fbff] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-[#202124]">
          {title} ({cell.items.length}곳)
        </h4>
        <button
          type="button"
          onClick={() => setSelectedKey(null)}
          className="text-xs font-medium text-[#5f6368] hover:text-[#202124]"
        >
          접기
        </button>
      </div>
      {cell.items.length === 0 ? (
        <p className="text-xs text-[#5f6368]">아직 등록된 순찰 대상이 없습니다.</p>
      ) : (
        <div className="divide-y divide-[#e8eaed] rounded-lg border border-[#dadce0] bg-white">
          {cell.items.map((t) => {
            const dot = getTargetDot(t);
            return (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-xs">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dot.dotClass}`} />
                    <span className="font-semibold text-[#202124]">{t.org_name}</span>
                    <span className="rounded bg-[#f1f3f4] px-1.5 py-0.5 text-[10px] text-[#5f6368]">{dot.label}</span>
                  </div>
                  {t.last_item_title && (
                    <p className="truncate text-[11px] text-[#5f6368]">{t.last_item_title}</p>
                  )}
                  <a
                    href={t.target_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[11px] text-[#1a73e8] hover:underline"
                  >
                    {t.target_url}
                  </a>
                </div>
                {t.last_checked_at && (
                  <span className="shrink-0 text-[11px] text-[#5f6368]">
                    {new Date(t.last_checked_at).toLocaleString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const filterPills: Array<{ key: Exclude<PatrolFilterTab, "all">; label: string; count: number; dotClass: string; isReserve: boolean }> = [
    { key: "active", label: "정상", count: counts.active, dotClass: "bg-[#22c55e]", isReserve: false },
    { key: "error", label: "오류", count: counts.error, dotClass: "bg-[#facc15]", isReserve: false },
    { key: "paused", label: "일시정지", count: counts.paused, dotClass: "bg-[#ef4444]", isReserve: false },
    ...(counts.reserve > 0 || tab === "reserve"
      ? [{ key: "reserve" as const, label: "예비순찰필요", count: counts.reserve, dotClass: "bg-[#9334e6]", isReserve: true }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#dadce0] px-6 py-4">
          <h3 className="text-lg font-bold text-[#202124]">순찰지역 테이블 ({targets.length}곳)</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-sm font-medium text-[#5f6368] hover:bg-[#f8f9fa]"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {loading ? (
            <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-8 text-center text-sm text-[#5f6368]">
              울동네 순찰지역 목록을 불러오는 중입니다...
            </div>
          ) : errorMessage ? (
            <div className="rounded-xl border border-[#f5c2c0] bg-[#fff8f6] p-6 text-center text-sm text-[#c5221f]">
              {errorMessage}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {filterPills.map((item) => {
                  const selected = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTab((prev) => (prev === item.key ? "all" : item.key))}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                        selected
                          ? item.isReserve
                            ? "border-[#9334e6] bg-[#f3e8fd] text-[#7627bb]"
                            : "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                          : item.isReserve
                            ? "border-[#d7aefb] bg-[#faf5ff] text-[#7627bb] hover:bg-[#f3e8fd]"
                            : "border-[#dadce0] bg-white text-[#202124] hover:bg-[#f8f9fa]"
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

              {showCommon && (
                <div className="rounded-xl border border-[#dadce0] bg-white p-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedKey((prev) => (prev === commonCell.key ? null : commonCell.key))}
                    className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition ${
                      commonCell.errorCount + commonCell.pausedCount > 0
                        ? "border-[#f5c2c0] bg-[#fff8f6] hover:bg-[#fef1ee]"
                        : "border-[#dadce0] bg-white hover:bg-[#f8f9fa]"
                    } ${selectedKey === commonCell.key ? "border-[#1a73e8] ring-2 ring-[#1a73e8]" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-[#202124]">전국 공통</span>
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
                      {commonCell.items.length}곳 {selectedKey === commonCell.key ? "▴" : "▾"}
                    </span>
                  </button>
                  {selectedKey === commonCell.key && renderDetailBox(commonCell, "전국 공통")}
                </div>
              )}

              {sidoSections.length === 0 && !showCommon ? (
                <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-8 text-center text-sm text-[#5f6368]">
                  해당 상태의 지역이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-[#dadce0] overflow-hidden rounded-xl border border-[#dadce0] bg-white">
                  {sidoSections.map((section) => {
                    const selectedCell = section.cells.find((c) => c.key === selectedKey);
                    return (
                      <div key={section.sido} className="p-3.5">
                        <div className="mb-2.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-[#202124]">{section.sido}</span>
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
                                  onClick={() => setSelectedKey((prev) => (prev === cell.key ? null : cell.key))}
                                  className={`flex items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-medium transition ${
                                    isSelected
                                      ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8] ring-2 ring-[#1a73e8]"
                                      : "border-[#e8eaed] bg-[#f1f3f4] text-[#9aa0a6] hover:border-[#dadce0] hover:bg-[#e8eaed] hover:text-[#5f6368]"
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
                                onClick={() => setSelectedKey((prev) => (prev === cell.key ? null : cell.key))}
                                className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center transition ${
                                  hasProblem
                                    ? "border-[#f5c2c0] bg-[#fff8f6] text-[#202124] hover:bg-[#fef1ee]"
                                    : hasReserve
                                      ? "border-[#d7aefb] bg-[#faf5ff] text-[#202124] hover:bg-[#f3e8fd]"
                                      : "border-[#dadce0] bg-white text-[#202124] hover:border-[#1a73e8] hover:bg-[#f8faff]"
                                } ${isSelected ? "border-[#1a73e8] ring-2 ring-[#1a73e8]" : ""}`}
                              >
                                <span className="text-xs font-bold leading-tight">{cell.sigungu}</span>
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
                        {selectedCell && renderDetailBox(selectedCell, `${section.sido} ${selectedCell.sigungu}`)}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
