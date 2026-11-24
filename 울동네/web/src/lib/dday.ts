export interface DdayInfo {
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
}

/**
 * 한국 시간(Asia/Seoul) 오늘 날짜를 기준으로 마감일까지 남은 디데이 정보를 계산합니다.
 */
export function getDdayInfo(deadlineDate: string | null): DdayInfo | null {
  if (!deadlineDate) return null;

  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadlineDate.trim());
  if (!parsed) return null;

  const kstTodayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  const [ty, tm, td] = kstTodayStr.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const targetUtc = Date.UTC(Number(parsed[1]), Number(parsed[2]) - 1, Number(parsed[3]));
  const diffDays = Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: '마감됨', isUrgent: false, isExpired: true };
  }
  if (diffDays === 0) {
    return { label: 'D-Day', isUrgent: true, isExpired: false };
  }
  return {
    label: `D-${diffDays}`,
    isUrgent: diffDays <= 7,
    isExpired: false
  };
}
