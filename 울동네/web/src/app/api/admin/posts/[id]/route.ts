import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { sendFcmTopicsForPost } from '@/lib/fcm';
import { updateWelfarePostAdmin } from '@/lib/supabase';
import type { WelfarePost } from '@/lib/types';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    action: 'publish' | 'archive' | 'save';
    updates?: Partial<
      Pick<
        WelfarePost,
        | 'app_title'
        | 'app_summary_3lines'
        | 'app_detail_summary'
        | 'blog_title'
        | 'blog_content_md'
        | 'publish_to_blog'
        | 'deadline_date'
        | 'contact_phone'
      >
    >;
  };

  const patch: Partial<WelfarePost> = { ...(body.updates ?? {}) };

  if (body.action === 'publish') {
    patch.status = 'published';
    patch.published_at = new Date().toISOString();
  } else if (body.action === 'archive') {
    patch.status = 'archived';
  }

  const updated = await updateWelfarePostAdmin(id, patch);

  let fcmResult: { sentCount: number; skipped: boolean; topics: string[] } | null = null;
  if (body.action === 'publish') {
    try {
      fcmResult = await sendFcmTopicsForPost(updated);
    } catch (err) {
      console.error('FCM 발송 실패 (글 발행은 완료됨):', err);
    }
  }

  return NextResponse.json({ ok: true, post: updated, fcm: fcmResult });
}
