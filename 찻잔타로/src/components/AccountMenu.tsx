import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/access";
import { deleteAccount } from "@/lib/account.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function AccountMenu({ user }: { user: User }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const del = useServerFn(deleteAccount);

  async function withdraw() {
    setBusy(true);
    try {
      await del();
      await supabase.auth.signOut();
      Object.keys(localStorage)
        .filter((k) => k.includes(user.id))
        .forEach((k) => localStorage.removeItem(k));
      toast("탈퇴가 완료되었어요. 그동안 찻잔 타로와 함께해 주셔서 고마워요 🍵");
      setTimeout(() => (window.location.href = "/"), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "탈퇴하지 못했어요.");
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="flex items-center gap-0.5 hover:text-foreground">
          내 계정 <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/readings">🍵 나의 상담</Link>
          </DropdownMenuItem>
          {isAdminEmail(user.email) && (
            <DropdownMenuItem asChild>
              <Link to="/admin">👑 운영자</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
          >
            🚪 로그아웃
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirm(true)} className="text-destructive focus:text-destructive">
            회원 탈퇴
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={(o) => !busy && setConfirm(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 찻잔 타로를 떠나시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              탈퇴하면 모든 상담 기록과 남은 찻잎·멤버십이 바로 지워지고 다시 되돌릴 수 없어요. 미사용 찻잎 환불을
              원하시면 탈퇴 전에 먼저 문의해 주세요. 결제 기록은 법에 따라 정해진 기간 동안만 보관돼요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>머무를게요</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void withdraw();
              }}
            >
              {busy ? "처리 중…" : "탈퇴하기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
