import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { PERSONAS, type PersonaId } from "@/lib/tarot";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { deleteReading } from "@/lib/tarot.functions";

const readingsQuery = queryOptions({
  queryKey: ["readings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("readings")
      .select("id, title, persona, prescription, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/readings")({
  head: () => ({
    meta: [
      { title: "나의 상담 기록 — 찻잔 타로" },
      { name: "description", content: "지난 타로 상담 대화를 다시 열어보세요." },
      { property: "og:title", content: "나의 상담 기록 — 찻잔 타로" },
      { property: "og:description", content: "지난 타로 상담 대화를 다시 열어보세요." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(readingsQuery),
  component: Readings,
});

function Readings() {
  const { data } = useSuspenseQuery(readingsQuery);
  const qc = useQueryClient();
  const deleteReadingFn = useServerFn(deleteReading);
  const [target, setTarget] = useState<{ id: string; title: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!target) return;
    setBusy(true);
    try {
      await deleteReadingFn({ data: { readingId: target.id } });
      qc.setQueryData(["readings"], (old: typeof data | undefined) => old?.filter((x) => x.id !== target.id));
      qc.removeQueries({ queryKey: ["reading", target.id] });
      toast.success("상담 기록을 지웠어요");
      setTarget(null);
    } catch {
      toast.error("삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-3xl px-5 pb-16">
      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 상담을 지울까요?</AlertDialogTitle>
            <AlertDialogDescription>
              "{target?.title}" 대화가 모두 사라지고 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void remove();
              }}
            >
              {busy ? "지우는 중…" : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">나의 상담 기록</h1>
        <Button asChild>
          <Link to="/">+ 새 상담</Link>
        </Button>
      </div>
      {data.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">아직 상담 기록이 없어요. 첫 고민을 들려주세요 🍵</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((r) => {
            const p = PERSONAS[r.persona as PersonaId] ?? PERSONAS.sister;
            return (
              <li key={r.id} className="relative">
                <Link
                  to="/reading/$id"
                  params={{ id: r.id }}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-4 pr-12 shadow-warm transition hover:-translate-y-0.5"
                >
                  <span className="shrink-0 text-3xl">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif font-bold">{r.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.prescription ? `💊 ${r.prescription}` : `${p.name}와의 상담`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(r.updated_at).toLocaleDateString("ko-KR")}
                  </span>
                </Link>
                <button
                  onClick={() => setTarget({ id: r.id, title: r.title })}
                  aria-label="상담 삭제"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
