import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hubGetAiKeyMonitor, hubTestAiKeyDeep, hubUpdateAiKeySpent, hubUpdateSharedAiWallet } from "@/lib/admin-hub.functions";
import type { AiKeyGroupId, AiKeyGroupSnapshot, AiKeyStatus } from "@/lib/ai-key-monitor.server";

function KeyStatusBadge({ status }: { status: AiKeyStatus }) {
  if (status === "healthy") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        정상 작동
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        <AlertTriangle className="h-3.5 w-3.5" />
        한도 주의
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
        <XCircle className="h-3.5 w-3.5" />
        연결 끊김
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      미연결
    </span>
  );
}

export function AiKeyMonitorCard() {
  const getMonitorFn = useServerFn(hubGetAiKeyMonitor);
  const deepTestFn = useServerFn(hubTestAiKeyDeep);
  const updateWalletFn = useServerFn(hubUpdateSharedAiWallet);
  const updateSpentFn = useServerFn(hubUpdateAiKeySpent);
  const qc = useQueryClient();

  const [intervalMinutes, setIntervalMinutes] = useState<number>(5);
  const [testingGroupId, setTestingGroupId] = useState<AiKeyGroupId | null>(null);

  const [editingWallet, setEditingWallet] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [thresholdInput, setThresholdInput] = useState("20");
  const [savingWallet, setSavingWallet] = useState(false);

  const [editingSpentGroup, setEditingSpentGroup] = useState<AiKeyGroupSnapshot | null>(null);
  const [spentInput, setSpentInput] = useState("");
  const [savingSpent, setSavingSpent] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["studio-ai-key-monitor"],
    queryFn: () => getMonitorFn(),
    refetchInterval: intervalMinutes * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleManualCheck = async () => {
    await refetch();
    toast.success("모든 AI 열쇠 연결 상태를 새로 확인했습니다.");
  };

  const handleDeepTest = async (group: AiKeyGroupSnapshot) => {
    setTestingGroupId(group.id);
    try {
      const res = await deepTestFn({ data: { groupId: group.id } });
      if (res.ok) {
        toast.success(`[${group.label}] ${res.message} (${res.latencyMs}ms)`);
      } else {
        toast.error(`[${group.label}] ${res.message}`);
      }
      await qc.invalidateQueries({ queryKey: ["studio-ai-key-monitor"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "테스트 중 오류가 발생했습니다.");
    } finally {
      setTestingGroupId(null);
    }
  };

  const openWalletEditor = () => {
    setBudgetInput(String(data?.totalBudgetKrw ?? 28000));
    setThresholdInput(String(data?.sharedWallet?.alertThresholdPercent ?? 20));
    setEditingWallet(true);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWallet(true);
    try {
      await updateWalletFn({
        data: {
          monthlyBudgetKrw: Number(budgetInput) || 0,
          alertThresholdPercent: Number(thresholdInput) || 20,
        },
      });
      toast.success("구글 AI 공동 충전금과 알림 기준을 저장했습니다.");
      setEditingWallet(false);
      await qc.invalidateQueries({ queryKey: ["studio-ai-key-monitor"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSavingWallet(false);
    }
  };

  const openSpentEditor = (group: AiKeyGroupSnapshot) => {
    setEditingSpentGroup(group);
    setSpentInput(String(group.spentKrw));
  };

  const handleSaveSpent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpentGroup) return;
    setSavingSpent(true);
    try {
      await updateSpentFn({
        data: {
          groupId: editingSpentGroup.id,
          estimatedSpentKrw: Number(spentInput) || 0,
        },
      });
      toast.success(`[${editingSpentGroup.label}] 이번 달 사용 추정치를 저장했습니다.`);
      setEditingSpentGroup(null);
      await qc.invalidateQueries({ queryKey: ["studio-ai-key-monitor"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSavingSpent(false);
    }
  };

  const lastCheckedLabel = data?.lastCheckedAt
    ? new Date(data.lastCheckedAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "-";

  const totalPercent = data?.totalRemainingPercent ?? 0;
  const totalLow = Boolean(data?.budgetWarning);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {/* 헤더: 제목 + 자동 점검 주기 선택 + 즉시 점검 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">구글 AI 열쇠 연결 현황 & 예상 잔액</h3>
            <p className="text-xs text-slate-500">
              추가 요금 없는 가벼운 신호 점검으로 열쇠 상태를 감시하고, 문제 시 텔레그램·이메일로 알립니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
            <Activity className="h-3.5 w-3.5 text-blue-600" />
            <span>자동 점검</span>
            <select
              aria-label="AI 열쇠 자동 점검 주기"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-900 outline-none"
            >
              <option value={1}>1분마다</option>
              <option value={5}>5분마다</option>
              <option value={15}>15분마다</option>
            </select>
          </div>

          <span className="text-xs text-slate-400">마지막 확인: {lastCheckedLabel}</span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualCheck}
            disabled={isFetching}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            지금 점검
          </Button>
        </div>
      </div>

      {/* 공동 지갑 예상 잔액 게이지 */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className={`h-4 w-4 ${totalLow ? "text-red-600" : "text-blue-600"}`} />
            <span className="text-xs font-semibold text-slate-800">구글 AI 공동 충전금 & 남은 예상 잔액</span>
            {totalLow && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                잔액 부족 주의
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-bold text-slate-900">
              {(data?.totalRemainingKrw ?? 0).toLocaleString()}원 남음{" "}
              <span className="text-xs font-normal text-slate-500">
                / 공동 충전 {(data?.totalBudgetKrw ?? 0).toLocaleString()}원 ({totalPercent}%)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openWalletEditor}
              className="h-7 gap-1 bg-white text-[11px]"
            >
              <SlidersHorizontal className="h-3 w-3" />
              충전금 수정
            </Button>
          </div>
        </div>
        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${
              totalLow ? "bg-red-500" : totalPercent <= 40 ? "bg-amber-500" : "bg-blue-600"
            }`}
            style={{ width: `${totalPercent}%` }}
          />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>이번 달 전체 사용 합계 {(data?.totalSpentKrw ?? 0).toLocaleString()}원</span>
          <span>긴급 알림 기준: 잔액 {data?.sharedWallet?.alertThresholdPercent ?? 20}% 이하</span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          ※ 3개 열쇠가 하나의 구글 결제 지갑(공동 충전금)을 함께 사용합니다. 아래 카드에서는 각 열쇠별 이번 달 사용 추정치를 보여줍니다.
        </p>
      </div>

      {/* 열쇠 그룹별 상태 카드 */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-500">AI 열쇠 신호를 확인하고 있습니다...</div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(data?.groups ?? []).map((group) => {
            return (
              <div
                key={group.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  group.status === "error"
                    ? "border-red-200 bg-red-50/20"
                    : group.status === "warning"
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900">{group.label}</h4>
                      <p className="mt-0.5 text-[11px] text-slate-500">{group.description}</p>
                    </div>
                    <KeyStatusBadge status={group.status} />
                  </div>

                  {/* 연결된 앱 배지 */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {group.apps.map((appName) => (
                      <span
                        key={appName}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {appName}
                      </span>
                    ))}
                  </div>

                  {/* 열쇠 식별자 및 신호 응답 */}
                  <div className="mt-3 space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">연결된 열쇠</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {group.keyMasked ?? "미등록"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">신호 상태</span>
                      <span className="text-right font-medium text-slate-700">
                        {group.latencyMs !== null ? `${group.latencyMs}ms` : "-"}
                      </span>
                    </div>
                    <p className="pt-0.5 text-[11px] text-slate-500">{group.statusMessage}</p>
                  </div>

                  {/* 열쇠별 이번 달 예상 사용량 */}
                  <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="whitespace-nowrap text-slate-600">이번 달 예상 사용</span>
                      <span className="whitespace-nowrap font-semibold text-slate-900">
                        {group.spentKrw.toLocaleString()}원{" "}
                        <span className="text-[11px] font-normal text-slate-500">({group.spentSharePercent}%)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 하단 액션 버튼 */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!group.configured || testingGroupId === group.id}
                    onClick={() => handleDeepTest(group)}
                    className="h-7 min-w-0 flex-1 gap-1 px-2 text-[11px]"
                    title="초경량 AI에게 한 글자만 물어 실제 응답 가능 여부를 확인합니다"
                  >
                    <Sparkles className="h-3 w-3 shrink-0 text-blue-600" />
                    <span className="truncate">
                      {testingGroupId === group.id ? "테스트 중..." : "실제 응답 테스트"}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openSpentEditor(group)}
                    className="h-7 shrink-0 gap-1 px-2 text-[11px]"
                  >
                    <SlidersHorizontal className="h-3 w-3 shrink-0" />
                    사용량 보정
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 공동 충전금 수정 모달 */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <form
            onSubmit={handleSaveWallet}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">구글 AI 공동 충전금 설정</h3>
              <p className="mt-1 text-xs text-slate-500">
                3개 열쇠가 함께 쓰는 구글 결제 계정의 총 충전 금액과 잔액 부족 알림 기준을 설정합니다.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">공동 충전 금액 / 월 예산 (원)</label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  긴급 알림 기준 (남은 잔액 % 이하일 때)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={80}
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingWallet(false)}>
                취소
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={savingWallet}>
                {savingWallet ? "저장 중..." : "저장하기"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 열쇠별 사용량 보정 모달 */}
      {editingSpentGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <form
            onSubmit={handleSaveSpent}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">[{editingSpentGroup.label}] 사용량 보정</h3>
              <p className="mt-1 text-xs text-slate-500">
                구글 결제 내역에서 확인하신 이번 달 사용 금액에 맞춰 추정치를 보정합니다.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">이번 달 사용한 금액 (원)</label>
              <Input
                type="number"
                min={0}
                step={100}
                value={spentInput}
                onChange={(e) => setSpentInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingSpentGroup(null)}>
                취소
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={savingSpent}>
                {savingSpent ? "저장 중..." : "저장하기"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
