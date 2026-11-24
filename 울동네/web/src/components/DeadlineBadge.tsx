import { getDdayInfo } from '@/lib/dday';

interface DeadlineBadgeProps {
  deadlineDate: string | null;
  prefix?: string;
}

/**
 * 마감일 옆에 디데이(D-Day) 배지를 함께 표시하는 공통 컴포넌트입니다.
 */
export function DeadlineBadge({ deadlineDate, prefix = '마감' }: DeadlineBadgeProps) {
  if (!deadlineDate) return null;

  const dday = getDdayInfo(deadlineDate);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={dday?.isExpired ? 'text-[#5f6368]' : 'text-[#d93025]'}>
        {prefix} {deadlineDate}
      </span>
      {dday ? (
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
            dday.isExpired
              ? 'bg-[#f1f3f4] text-[#5f6368]'
              : 'bg-[#fce8e6] text-[#d93025]'
          }`}
        >
          {dday.label}
        </span>
      ) : null}
    </span>
  );
}
