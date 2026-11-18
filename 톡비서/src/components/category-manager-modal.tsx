import React from "react";
import { MaterialSymbol, IconButton } from "@/components/ui/material-symbol";
import { CustomCategories, type Plan } from "@/components/inbox-extras";
import { t as tr } from "@/lib/i18n";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  onUpgrade: () => void;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  plan,
  onUpgrade,
}: CategoryManagerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-60 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-card shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <MaterialSymbol name="label" size={18} weight={350} />
            </span>
            <h2 className="text-base font-bold text-foreground">{tr("카테고리 관리")}</h2>
          </div>
          <IconButton ariaLabel={tr("닫기")} onClick={onClose} className="h-8 w-8">
            <MaterialSymbol name="close" size={20} weight={350} />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <CustomCategories plan={plan} onUpgrade={onUpgrade} />
        </div>
      </div>
    </div>
  );
}
