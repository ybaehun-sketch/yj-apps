import { AdminDashboardClient } from '@/components/AdminDashboardClient';
import { isAdminAuthenticated } from '@/lib/auth';
import { fetchCrawlTargetsAdmin, fetchDraftPosts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  const [drafts, targets] = authed
    ? await Promise.all([fetchDraftPosts(), fetchCrawlTargetsAdmin()])
    : [[], []];

  return (
    <AdminDashboardClient
      initialAuthenticated={authed}
      initialDrafts={drafts}
      initialTargets={targets}
    />
  );
}
