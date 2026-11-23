export type WelfareCategory =
  | '돌봄/육아'
  | '어르신/건강'
  | '주거/난방비'
  | '소상공인/일자리'
  | '생활/문화';

export interface WelfarePost {
  id: string;
  target_id: string | null;
  external_id: string;
  region_sido: string;
  region_sigungu: string;
  region_code: string;
  org_name: string;
  category: WelfareCategory;
  keywords: string[];
  app_title: string;
  app_summary_3lines: string;
  app_detail_summary: string;
  blog_title: string | null;
  blog_content_md: string | null;
  persona_style_id: number | null;
  publish_to_blog: boolean;
  has_attachment_only: boolean;
  ai_confidence: number;
  auto_published: boolean;
  status: 'draft' | 'published' | 'archived';
  deadline_date: string | null;
  contact_phone: string | null;
  source_url: string;
  created_at: string;
  published_at: string | null;
}

export interface CrawlTarget {
  id: string;
  region_sido: string;
  region_sigungu: string;
  region_code: string;
  org_name: string;
  source_type: 'API_GOV24' | 'API_WELFARE' | 'WEB_BOARD' | 'FAMILYNET';
  target_url: string;
  status: 'active' | 'error' | 'paused';
  fail_count: number;
  last_item_title: string | null;
  last_checked_at: string | null;
}
