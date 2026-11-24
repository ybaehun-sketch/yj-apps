import { AdminDashboardClient } from '@/components/AdminDashboardClient';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  fetchAppPublishedPosts,
  fetchCrawlTargetsAdmin,
  fetchDraftPosts
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  const [drafts, appPosts, targets] = authed
    ? await Promise.all([
        fetchDraftPosts(),
        fetchAppPublishedPosts(),
        fetchCrawlTargetsAdmin()
      ])
    : [[], [], []];

  return (
    <AdminDashboardClient
      initialAuthenticated={authed}
      initialDrafts={drafts}
      initialAppPosts={appPosts}
      initialTargets={targets}
    />
  );
}
