export type SourceType = 'API_GOV24' | 'API_WELFARE' | 'WEB_BOARD' | 'FAMILYNET';

export type TargetStatus = 'active' | 'error' | 'paused';

export type WelfareCategory =
  | '돌봄/육아'
  | '어르신/건강'
  | '주거/난방비'
  | '소상공인/일자리'
  | '생활/문화';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GEMINI_API_KEY: string;
  GOV24_API_KEY?: string;
  WELFARE_API_KEY?: string;
  WORKER_ADMIN_SECRET?: string;
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  GEMINI_SCAN_MODEL: string;
  GEMINI_WRITE_MODEL: string;
  AUTO_PUBLISH_ENABLED: string;
  APP_AUTO_PUBLISH_MIN_CONFIDENCE?: string;
  MAX_BLOG_DRAFTS_PER_DAY?: string;
  MAX_TARGETS_PER_RUN: string;
  MAX_NEW_POSTS_PER_TARGET: string;
}

export interface CrawlTarget {
  id: string;
  region_sido: string;
  region_sigungu: string;
  region_code: string;
  org_name: string;
  source_type: SourceType;
  target_url: string;
  last_page_hash: string | null;
  last_item_title: string | null;
  status: TargetStatus;
  fail_count: number;
  last_checked_at: string | null;
}

export interface ScannedNotice {
  title: string;
  date: string | null;
  detail_url: string;
}

export interface GeneratedWelfarePost {
  category: WelfareCategory;
  keywords: string[];
  app_title: string;
  app_summary_3lines: string;
  app_detail_summary: string;
  publish_to_blog: boolean;
  blog_title: string;
  blog_content_md: string;
  deadline_date: string | null;
  contact_phone: string | null;
  ai_confidence: number;
}

export interface WelfarePostInsert extends GeneratedWelfarePost {
  target_id: string;
  external_id: string;
  region_sido: string;
  region_sigungu: string;
  region_code: string;
  org_name: string;
  persona_style_id: number;
  has_attachment_only: boolean;
  auto_published: boolean;
  status: 'draft' | 'published';
  app_status: 'draft' | 'published' | 'hidden';
  app_published_at: string | null;
  blog_status: 'none' | 'draft' | 'published' | 'rejected';
  blog_published_at: string | null;
  source_url: string;
  published_at: string | null;
}
