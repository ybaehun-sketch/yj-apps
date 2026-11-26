export type WelfareCategory =
  | '돌봄/아동/청소년'
  | '어르신/건강'
  | '주거/난방비'
  | '소상공인/일자리'
  | '농림/축산/어업'
  | '생활/문화/법률'
  | '다문화';

export type SortOrder = 'region_keyword_first' | 'deadline' | 'latest';

export type AppTheme = 'light' | 'dark';

export interface WelfarePost {
  id: string;
  region_sido: string;
  region_sigungu: string;
  region_code: string;
  org_name: string;
  category: WelfareCategory;
  keywords: string[];
  app_title: string;
  app_summary_3lines: string;
  app_detail_summary: string;
  publish_to_blog: boolean;
  has_attachment_only: boolean;
  deadline_date: string | null;
  contact_phone: string | null;
  source_url: string;
  published_at: string | null;
}

export interface UserPreferences {
  regionSido: string;
  regionSigungu: string;
  regionCode: string;
  keywords: string[];
  sortOrder: SortOrder;
  hideExpired: boolean;
  largeText: boolean;
  cardLimit: 20 | 30 | 40;
  theme: AppTheme;
  notificationsEnabled?: boolean;
}
