import type { Metadata } from 'next';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  fetchAppPendingPosts,
  fetchAppPublishedPosts,
  fetchCrawlTargetsAdmin,
  fetchDraftPosts,
  fetchPatrolBriefingsAdmin
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '관리자 검수실 | 울동네',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  const [drafts, appPendingPosts, appPosts, targets, briefings] = authed
    ? await Promise.all([
        fetchDraftPosts(),
        fetchAppPendingPosts(),
        fetchAppPublishedPosts(),
        fetchCrawlTargetsAdmin(),
        fetchPatrolBriefingsAdmin()
      ])
    : [[], [], [], [], []];

  return (
    <AdminDashboardClient
      initialAuthenticated={authed}
      initialDrafts={drafts}
      initialAppPendingPosts={appPendingPosts}
      initialAppPosts={appPosts}
      initialTargets={targets}
      initialBriefings={briefings}
    />
  );
}
