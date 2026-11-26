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
import { hubGetAiKeyMonitor, hubTestAiKeyDeep, hubUpdateAiBudget } from "@/lib/admin-hub.functions";
import type { AiKeyGroupId, AiKeyGroupSnapshot, AiKeyStatus } from "@/lib/ai-key-monitor.server";

function KeyStatusBadge({ status }: { status: AiKeyStatus }) {
  if (status === "healthy") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        정상 작동
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        <AlertTriangle className="h-3.5 w-3.5" />
        한도 주의
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
        <XCircle className="h-3.5 w-3.5" />
        연결 끊김
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      미연결
    </span>
  );
}

export function AiKeyMonitorCard() {
  const getMonitorFn = useServerFn(hubGetAiKeyMonitor);
  const deepTestFn = useServerFn(hubTestAiKeyDeep);
  const updateBudgetFn = useServerFn(hubUpdateAiBudget);
  const qc = useQueryClient();

  const [intervalMinutes, setIntervalMinutes] = useState<number>(5);
  const [testingGroupId, setTestingGroupId] = useState<AiKeyGroupId | null>(null);
  const [editingGroup, setEditingGroup] = useState<AiKeyGroupSnapshot | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [spentInput, setSpentInput] = useState("");
  const [thresholdInput, setThresholdInput] = useState("20");
  const [savingBudget, setSavingBudget] = useState(false);

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

  const openBudgetEditor = (group: AiKeyGroupSnapshot) => {
    setEditingGroup(group);
    setBudgetInput(String(group.budget.monthlyBudgetKrw));
    setSpentInput(String(group.budget.estimatedSpentKrw));
    setThresholdInput(String(group.budget.alertThresholdPercent));
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    setSavingBudget(true);
    try {
      await updateBudgetFn({
        data: {
          groupId: editingGroup.id,
          monthlyBudgetKrw: Number(budgetInput) || 0,
          estimatedSpentKrw: Number(spentInput) || 0,
          alertThresholdPercent: Number(thresholdInput) || 20,
        },
      });
      toast.success(`[${editingGroup.label}] 충전 예산과 잔액 기준을 저장했습니다.`);
      setEditingGroup(null);
      await qc.invalidateQueries({ queryKey: ["studio-ai-key-monitor"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSavingBudget(false);
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
  const totalLow = totalPercent <= 20 && (data?.totalBudgetKrw ?? 0) > 0;

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

      {/* 전체 합산 예상 잔액 게이지 */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className={`h-4 w-4 ${totalLow ? "text-red-600" : "text-blue-600"}`} />
            <span className="text-xs font-semibold text-slate-800">전체 AI 충전 예산 대비 예상 잔액</span>
            {totalLow && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                잔액 부족 주의
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-slate-900">
            {(data?.totalRemainingKrw ?? 0).toLocaleString()}원 남음{" "}
            <span className="text-xs font-normal text-slate-500">
              / 총 예산 {(data?.totalBudgetKrw ?? 0).toLocaleString()}원 ({totalPercent}%)
            </span>
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
        <p className="mt-2 text-[11px] text-slate-500">
          ※ 구글은 열쇠별 실시간 잔액 조회를 공식 지원하지 않아, 입력하신 충전 금액에서 사용 추정치를 차감해 보여드립니다. 아래 각 카드에서 언제든 실제 잔액에 맞게 보정하실 수 있습니다.
        </p>
      </div>

      {/* 열쇠 그룹별 상태 카드 */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-500">AI 열쇠 신호를 확인하고 있습니다...</div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(data?.groups ?? []).map((group) => {
            const isLow = group.budgetWarning && group.budget.monthlyBudgetKrw > 0;
            return (
              <div
                key={group.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  group.status === "error"
                    ? "border-red-200 bg-red-50/20"
                    : group.status === "warning" || isLow
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
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

                  {/* 개별 예상 잔액 게이지 */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">예상 잔액</span>
                      <span className={`font-semibold ${isLow ? "text-red-600" : "text-slate-900"}`}>
                        {group.remainingKrw.toLocaleString()}원 ({group.remainingPercent}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          isLow ? "bg-red-500" : group.remainingPercent <= 40 ? "bg-amber-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${group.remainingPercent}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                      <span>사용 {group.budget.estimatedSpentKrw.toLocaleString()}원</span>
                      <span>알림 기준 {group.budget.alertThresholdPercent}% 이하</span>
                    </div>
                  </div>
                </div>

                {/* 하단 액션 버튼 */}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!group.configured || testingGroupId === group.id}
                    onClick={() => handleDeepTest(group)}
                    className="h-7 flex-1 gap-1 text-[11px]"
                    title="초경량 AI에게 한 글자만 물어 실제 응답 가능 여부를 확인합니다"
                  >
                    <Sparkles className="h-3 w-3 text-blue-600" />
                    {testingGroupId === group.id ? "테스트 중..." : "실제 응답 테스트"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openBudgetEditor(group)}
                    className="h-7 gap-1 text-[11px]"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    충전액 수정
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 충전 예산 / 잔액 보정 모달 */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <form
            onSubmit={handleSaveBudget}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">[{editingGroup.label}] 잔액 설정</h3>
              <p className="mt-1 text-xs text-slate-500">
                구글 결제 화면에서 확인하신 금액으로 맞추면 더 정확하게 알림을 받으실 수 있습니다.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">이번 달 충전 금액 / 예산 (원)</label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">지금까지 사용한 금액 (원)</label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={spentInput}
                  onChange={(e) => setSpentInput(e.target.value)}
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
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingGroup(null)}>
                취소
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={savingBudget}>
                {savingBudget ? "저장 중..." : "저장하기"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
