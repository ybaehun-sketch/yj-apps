import React from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { t as tr } from "@/lib/i18n";

interface SuggestionChipsProps {
  chips?: string[];
  onSelect: (text: string) => void;
  className?: string;
}

const DEFAULT_CHIPS = [
  "이번 달 스샷 몇 개야?",
  "캘린더에 등록된 일정 찾아줘",
  "최근 저장한 메모 보여줘",
  "영수증이나 카드 내역 있어?",
];

export function SuggestionChips({
  chips = DEFAULT_CHIPS,
  onSelect,
  className = "",
}: SuggestionChipsProps) {
  if (!chips || chips.length === 0) return null;

  return (
    <div
      className={`no-scrollbar flex items-center gap-1.5 overflow-x-auto px-4 py-1.5 select-none ${className}`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {chips.map((chip, idx) => {
        const label = tr(chip);
        return (
          <button
            key={`${chip}-${idx}`}
            type="button"
            onClick={() => onSelect(label)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-2xs backdrop-blur-xs transition-all hover:border-sky-400 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 active:scale-95"
          >
            <MaterialSymbol name="subdirectory_arrow_right" size={14} weight={400} className="text-muted-foreground" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
