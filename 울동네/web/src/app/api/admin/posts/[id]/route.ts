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
    action: 'publish' | 'publish_app' | 'archive' | 'reject' | 'hide_app' | 'save';
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
  const nowIso = new Date().toISOString();

  if (body.action === 'publish') {
    patch.blog_status = 'published';
    patch.blog_published_at = nowIso;
    patch.publish_to_blog = true;
    patch.status = 'published';
    patch.published_at = nowIso;
  } else if (body.action === 'publish_app') {
    patch.app_status = 'published';
    patch.app_published_at = nowIso;
    patch.status = 'published';
    patch.published_at = nowIso;
  } else if (body.action === 'reject' || body.action === 'archive') {
    patch.blog_status = 'rejected';
    patch.publish_to_blog = false;
  } else if (body.action === 'hide_app') {
    patch.app_status = 'hidden';
  }

  const updated = await updateWelfarePostAdmin(id, patch);

  let fcmResult: { sentCount: number; skipped: boolean; topics: string[] } | null = null;
  if (
    (body.action === 'publish' && updated.app_status !== 'published') ||
    body.action === 'publish_app'
  ) {
    try {
      fcmResult = await sendFcmTopicsForPost(updated);
    } catch (err) {
      console.error('FCM 발송 실패 (글 발행은 완료됨):', err);
    }
  }

  return NextResponse.json({ ok: true, post: updated, fcm: fcmResult });
}
