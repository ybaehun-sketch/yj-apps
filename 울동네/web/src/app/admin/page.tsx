import { AdminDashboardClient } from '@/components/AdminDashboardClient';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  fetchAppPendingPosts,
  fetchAppPublishedPosts,
  fetchCrawlTargetsAdmin,
  fetchDraftPosts
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  const [drafts, appPendingPosts, appPosts, targets] = authed
    ? await Promise.all([
        fetchDraftPosts(),
        fetchAppPendingPosts(),
        fetchAppPublishedPosts(),
        fetchCrawlTargetsAdmin()
      ])
    : [[], [], [], []];

  return (
    <AdminDashboardClient
      initialAuthenticated={authed}
      initialDrafts={drafts}
      initialAppPendingPosts={appPendingPosts}
      initialAppPosts={appPosts}
      initialTargets={targets}
    />
  );
}
