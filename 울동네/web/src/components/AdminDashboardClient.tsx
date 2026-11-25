'use client';

import { useMemo, useState } from 'react';
import type { CrawlTarget, WelfarePost } from '@/lib/types';
import { AppPublishCalendarModal } from './AppPublishCalendarModal';
import { PatrolStatusModal, type PatrolFilterTab } from './PatrolStatusModal';

interface AdminDashboardClientProps {
  initialAuthenticated: boolean;
  initialDrafts: WelfarePost[];
  initialAppPendingPosts: WelfarePost[];
  initialAppPosts: WelfarePost[];
  initialTargets: CrawlTarget[];
}

export function AdminDashboardClient({
  initialAuthenticated,
  initialDrafts,
  initialAppPendingPosts,
  initialAppPosts,
  initialTargets
}: AdminDashboardClientProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [drafts, setDrafts] = useState<WelfarePost[]>(initialDrafts);
  const [appPendingPosts, setAppPendingPosts] = useState<WelfarePost[]>(initialAppPendingPosts);
  const [showAppPending, setShowAppPending] = useState(false);
  const [showAppPublished, setShowAppPublished] = useState(false);
  const [appPosts, setAppPosts] = useState<WelfarePost[]>(initialAppPosts);
  const [targets, setTargets] = useState<CrawlTarget[]>(initialTargets);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');
  const [patrolModalOpen, setPatrolModalOpen] = useState(false);
  const [patrolModalTab, setPatrolModalTab] = useState<PatrolFilterTab>('all');
  const [patrolModalRegion, setPatrolModalRegion] = useState<string>('ALL');
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [expandedDraftIds, setExpandedDraftIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (initialDrafts.length > 0) {
      initial[initialDrafts[0].id] = true;
    }
    return initial;
  });

  function toggleDraftExpand(postId: string) {
    setExpandedDraftIds((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }

  const [expandedAppPostIds, setExpandedAppPostIds] = useState<Record<string, boolean>>({});

  function toggleAppPostExpand(postId: string) {
    setExpandedAppPostIds((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }

  function renderAppPostDetail(post: WelfarePost) {
    return (
      <div className="mt-3 space-y-2.5 rounded-lg border border-[#e8eaed] bg-[#f8f9fa] p-3.5 text-xs text-[#3c4043]">
        <div>
          <div className="font-semibold text-[#202124]">핵심 요약</div>
          <p className="mt-1 whitespace-pre-line leading-relaxed text-[#3c4043]">
            {post.app_summary_3lines}
          </p>
        </div>
        {post.app_detail_summary ? (
          <div className="border-t border-[#e8eaed] pt-2.5">
            <div className="font-semibold text-[#202124]">상세 안내</div>
            <p className="mt-1 whitespace-pre-line leading-relaxed text-[#3c4043]">
              {post.app_detail_summary}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#e8eaed] pt-2.5 text-[#5f6368]">
          <span>
            <strong className="text-[#3c4043]">마감일:</strong>{' '}
            {post.deadline_date ?? '상시 또는 본문 확인'}
          </span>
          {post.contact_phone ? (
            <span>
              <strong className="text-[#3c4043]">문의처:</strong> {post.contact_phone}
            </span>
          ) : null}
          {post.source_url ? (
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1a73e8] hover:underline"
            >
              공식 원문 보기 ↗
            </a>
          ) : null}
        </div>
        {post.keywords && post.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {post.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-[#dadce0] bg-white px-2 py-0.5 text-[11px] text-[#5f6368]"
              >
                #{kw}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  function openPatrolModal(tab: PatrolFilterTab, region = 'ALL') {
    setPatrolModalTab(tab);
    setPatrolModalRegion(region);
    setPatrolModalOpen(true);
  }

  const [showErrorTargets, setShowErrorTargets] = useState(false);

  // 가장 최근 한국시간 새벽 5시(05:00 KST) 최종 순찰 시점 계산
  const latestDawnPosts = useMemo(() => {
    const nowUtcMs = Date.now();
    const kstOffsetMs = 9 * 60 * 60 * 1000;
    const kstNow = new Date(nowUtcMs + kstOffsetMs);
    const cutoffKst = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
        4,
        55,
        0,
        0
      )
    );
    if (kstNow.getUTCHours() < 5) {
      cutoffKst.setUTCDate(cutoffKst.getUTCDate() - 1);
    }
    const cutoffUtcMs = cutoffKst.getTime() - kstOffsetMs;

    return appPosts.filter((post) => {
      const ts = post.app_published_at || post.published_at || post.created_at;
      if (!ts) return false;
      const timeMs = Date.parse(ts);
      return !Number.isNaN(timeMs) && timeMs >= cutoffUtcMs;
    });
  }, [appPosts]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setLoginError(err.error || '로그인에 실패했습니다.');
      return;
    }

    setAuthenticated(true);
    window.location.reload();
  }

  async function handleLogout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthenticated(false);
    setPassword('');
  }

  async function handlePostAction(
    post: WelfarePost,
    action: 'publish' | 'publish_app' | 'reject' | 'hide_app' | 'save'
  ) {
    setBusyId(post.id);
    setToast('');
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          updates: {
            app_title: post.app_title,
            app_summary_3lines: post.app_summary_3lines,
            app_detail_summary: post.app_detail_summary,
            blog_title: post.blog_title,
            blog_content_md: post.blog_content_md,
            publish_to_blog: post.publish_to_blog,
            deadline_date: post.deadline_date,
            contact_phone: post.contact_phone
          }
        })
      });

      const data = (await res.json()) as {
        ok?: boolean;
        post?: WelfarePost;
        error?: string;
        fcm?: { sentCount: number; skipped: boolean } | null;
      };

      if (!res.ok) {
        setToast(data.error || '처리에 실패했습니다.');
        return;
      }

      if (action === 'publish' || action === 'reject') {
        setDrafts((prev) => prev.filter((item) => item.id !== post.id));
        setToast(action === 'publish' ? '웹 블로그에 발행되었습니다.' : '블로그 초안이 반려되었습니다.');
      } else if (action === 'publish_app') {
        setAppPendingPosts((prev) => prev.filter((item) => item.id !== post.id));
        const approvedPost = data.post ?? {
          ...post,
          app_status: 'published',
          app_published_at: new Date().toISOString()
        };
        setAppPosts((prev) => [approvedPost, ...prev]);
        setToast('모바일 앱에 즉시 발행되었습니다.');
      } else if (action === 'hide_app') {
        setAppPosts((prev) => prev.filter((item) => item.id !== post.id));
        setAppPendingPosts((prev) => prev.filter((item) => item.id !== post.id));
        setToast('모바일 앱 노출에서 제외했습니다.');
      } else {
        setToast('수정 내용이 저장되었습니다.');
      }
    } finally {
      setBusyId(null);
    }
  }

  function updateDraftField<K extends keyof WelfarePost>(
    id: string,
    key: K,
    value: WelfarePost[K]
  ) {
    setDrafts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-[#dadce0] bg-white p-8">
        <h1 className="text-xl font-bold text-[#202124]">울동네 관리자 로그인</h1>
        <p className="mt-1 text-sm text-[#5f6368]">
          아침 5분 검토 및 순찰대 관리를 위해 비밀번호를 입력해 주세요.
        </p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
            className="w-full rounded-lg border border-[#dadce0] px-3.5 py-2.5 text-sm outline-none focus:border-[#1a73e8]"
            required
          />
          {loginError ? <p className="text-sm text-[#d93025]">{loginError}</p> : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-[#1a73e8] py-2.5 text-sm font-semibold text-white hover:bg-[#1557b0]"
          >
            로그인
          </button>
        </form>
      </div>
    );
  }

  const activeCount = targets.filter((t) => t.status === 'active').length;
  const errorCount = targets.filter((t) => t.status === 'error').length;
  const pausedCount = targets.filter((t) => t.status === 'paused').length;
  const reserveCount = targets.filter((t) =>
    t.last_item_title?.startsWith('[예비순찰대 필요]')
  ).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dadce0] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#202124]">울동네 데이터 수집 관제센터</h1>
          <p className="text-sm text-[#5f6368]">
            모바일 앱은 AI가 자동 발행·알림을 처리하며, 이곳에서는 하루 최대 2~3건의 블로그 초안만 검토해 수정·반려·발행합니다.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-[#dadce0] px-3.5 py-2 text-sm font-medium text-[#5f6368] hover:bg-[#f8f9fa]"
        >
          로그아웃
        </button>
      </div>

      {toast ? (
        <div className="rounded-lg border border-[#d2e3fc] bg-[#f8fbff] px-4 py-3 text-sm font-medium text-[#1a73e8]">
          {toast}
        </div>
      ) : null}

      {/* 1. AI 순찰대 현황 및 타겟 등록 */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#202124]">AI 순찰대 현황</h2>
          <button
            type="button"
            onClick={() => openPatrolModal('all', 'ALL')}
            className="rounded-lg border border-[#d2e3fc] bg-[#f8fbff] px-3.5 py-1.5 text-xs font-semibold text-[#1a73e8] hover:bg-[#e8f0fe]"
          >
            순찰지역 테이블 보기 ({targets.length}곳)
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => openPatrolModal('active')}
            className="rounded-xl border border-[#dadce0] bg-white p-4 text-left transition hover:border-[#1a73e8] hover:bg-[#f8fbff]"
          >
            <div className="text-xs text-[#5f6368]">정상 순찰 중</div>
            <div className="mt-1 text-2xl font-bold text-[#1a73e8]">{activeCount}곳</div>
          </button>
          <button
            type="button"
            onClick={() => openPatrolModal('reserve')}
            className={`rounded-xl border p-4 text-left transition ${
              reserveCount > 0
                ? 'border-[#d7aefb] bg-[#faf5ff] hover:border-[#9334e6] hover:bg-[#f3e8fd]'
                : 'border-[#dadce0] bg-white hover:border-[#9334e6] hover:bg-[#faf5ff]'
            }`}
          >
            <div className="text-xs text-[#7627bb]">예비순찰필요</div>
            <div className="mt-1 text-2xl font-bold text-[#9334e6]">{reserveCount}곳</div>
          </button>
          <button
            type="button"
            onClick={() => openPatrolModal('error')}
            className="rounded-xl border border-[#dadce0] bg-white p-4 text-left transition hover:border-[#d93025] hover:bg-[#fef7f6]"
          >
            <div className="text-xs text-[#5f6368]">오류(3회 실패)</div>
            <div className="mt-1 text-2xl font-bold text-[#d93025]">{errorCount}곳</div>
          </button>
          <button
            type="button"
            onClick={() => openPatrolModal('paused')}
            className="rounded-xl border border-[#dadce0] bg-white p-4 text-left transition hover:border-[#5f6368] hover:bg-[#f8f9fa]"
          >
            <div className="text-xs text-[#5f6368]">일시 정지</div>
            <div className="mt-1 text-2xl font-bold text-[#5f6368]">{pausedCount}곳</div>
          </button>
        </div>

        {errorCount > 0 ? (
          <div className="rounded-xl border border-[#fad2cf] bg-[#fce8e6] p-4">
            <button
              type="button"
              onClick={() => setShowErrorTargets((prev) => !prev)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-bold text-[#c5221f]">
                확인이 필요한 순찰 대상 ({errorCount}곳)
              </span>
              <span className="text-xs font-semibold text-[#c5221f]">
                {showErrorTargets ? '접기 ▴' : '펼치기 ▾'}
              </span>
            </button>
            {showErrorTargets ? (
              <ul className="mt-3 space-y-2 border-t border-[#fad2cf] pt-3 text-sm">
                {targets
                  .filter((t) => t.status === 'error')
                  .map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {t.org_name} ({t.region_sigungu}) - 실패 {t.fail_count}회
                        {t.last_item_title?.startsWith('[주소 점검 필요]') ? (
                          <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-xs font-semibold text-[#c5221f]">
                            {t.last_item_title}
                          </span>
                        ) : t.last_item_title?.startsWith('[예비순찰대 필요]') ? (
                          <span
                            className="ml-2 rounded bg-[#f3e8fd] px-1.5 py-0.5 text-xs font-semibold text-[#7627bb]"
                            title="본순찰대 접속이 막혀 예비순찰대 출동이 필요한 곳입니다."
                          >
                            예비순찰대 필요 (본순찰대 접속 실패)
                          </span>
                        ) : null}
                      </span>
                      <a
                        href={t.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-[#fad2cf] bg-white px-2 py-0.5 text-xs font-medium text-[#c5221f] hover:bg-[#fff8f7]"
                      >
                        바로가기 ↗
                      </a>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* 2. 검토 대기 초안 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#202124]">
            검토 대기 초안 ({drafts.length}건)
          </h2>
        </div>

        {drafts.length === 0 ? (
          <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-8 text-center text-sm text-[#5f6368]">
            현재 검토 대기 중인 초안이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((post, idx) => {
              const isExpanded = expandedDraftIds[post.id] ?? idx === 0;
              return (
              <div
                key={post.id}
                className="rounded-xl border border-[#dadce0] bg-white p-5 space-y-4"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleDraftExpand(post.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDraftExpand(post.id);
                    }
                  }}
                  className={`flex cursor-pointer flex-wrap items-center justify-between gap-2 ${
                    isExpanded ? 'border-b border-[#dadce0] pb-3' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded bg-[#e8f0fe] px-2 py-0.5 font-semibold text-[#1a73e8]">
                        {post.region_sigungu}
                      </span>
                      <span className="rounded bg-[#f1f3f4] px-2 py-0.5 text-[#202124]">
                        {post.category}
                      </span>
                      <span className="text-[#5f6368]">
                        AI 확신도: <strong>{post.ai_confidence}점</strong>
                      </span>
                      {post.has_attachment_only ? (
                        <span className="rounded bg-[#fef7e0] px-2 py-0.5 font-medium text-[#b06000]">
                          첨부파일 위주 공고
                        </span>
                      ) : null}
                    </div>
                    {!isExpanded ? (
                      <div className="truncate pt-1 text-sm font-bold text-[#202124]">
                        {post.blog_title || post.app_title}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <a
                      href={post.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium text-[#1a73e8] hover:underline"
                    >
                      원문 확인 ↗
                    </a>
                    <span className="rounded-md border border-[#dadce0] bg-[#f8f9fa] px-2.5 py-1 text-xs font-semibold text-[#3c4043]">
                      {isExpanded ? '접기 ▴' : '펼쳐보기 ▾'}
                    </span>
                  </div>
                </div>

                {isExpanded ? (
                  <>
                <div>
                  <label className="block text-xs font-bold text-[#1a73e8]">
                    블로그 글 제목 (웹 매거진 노출용)
                  </label>
                  <input
                    value={post.blog_title ?? ''}
                    onChange={(e) => updateDraftField(post.id, 'blog_title', e.target.value)}
                    placeholder="블로그 제목을 입력해 주세요"
                    className="mt-1 w-full rounded-lg border border-[#dadce0] px-3.5 py-2.5 text-base font-bold text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1a73e8]">
                      블로그 본문 초안 (AI 글맛 · 꿀팁 · 서류 체크리스트)
                    </label>
                    <span className="text-xs text-[#5f6368]">
                      {(post.blog_content_md ?? '').length.toLocaleString()}자
                    </span>
                  </div>
                  <textarea
                    rows={14}
                    value={post.blog_content_md ?? ''}
                    onChange={(e) =>
                      updateDraftField(post.id, 'blog_content_md', e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-[#dadce0] bg-[#fcfcfd] px-3.5 py-3 text-sm leading-relaxed text-[#202124] focus:border-[#1a73e8] focus:bg-white focus:outline-none"
                  />
                </div>

                <details className="rounded-lg border border-[#dadce0] bg-[#f8f9fa] p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[#5f6368]">
                    참고: 모바일 앱 카드 요약 · 마감일 · 문의처 펼치기
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#5f6368]">
                          앱 카드 제목 (30자 이내)
                        </label>
                        <input
                          value={post.app_title}
                          onChange={(e) => updateDraftField(post.id, 'app_title', e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-[#5f6368]">
                            마감일 (YYYY-MM-DD)
                          </label>
                          <input
                            value={post.deadline_date ?? ''}
                            onChange={(e) =>
                              updateDraftField(post.id, 'deadline_date', e.target.value || null)
                            }
                            placeholder="예: 2026-12-31"
                            className="mt-1 w-full rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#5f6368]">
                            문의 전화
                          </label>
                          <input
                            value={post.contact_phone ?? ''}
                            onChange={(e) =>
                              updateDraftField(post.id, 'contact_phone', e.target.value || null)
                            }
                            placeholder="예: 033-430-0000"
                            className="mt-1 w-full rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5f6368]">
                        앱 3줄 요약
                      </label>
                      <textarea
                        rows={3}
                        value={post.app_summary_3lines}
                        onChange={(e) =>
                          updateDraftField(post.id, 'app_summary_3lines', e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </details>

                <div className="flex items-center gap-2">
                  <input
                    id={`blog-${post.id}`}
                    type="checkbox"
                    checked={post.publish_to_blog}
                    onChange={(e) =>
                      updateDraftField(post.id, 'publish_to_blog', e.target.checked)
                    }
                  />
                  <label htmlFor={`blog-${post.id}`} className="text-sm text-[#202124]">
                    웹 매거진에도 함께 발행하기 (체크 해제 시 모바일 앱에만 노출)
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button
                    disabled={busyId === post.id}
                    onClick={() => handlePostAction(post, 'reject')}
                    className="rounded-lg border border-[#fad2cf] px-3.5 py-2 text-sm font-medium text-[#c5221f] hover:bg-[#fce8e6]"
                  >
                    반려하기
                  </button>
                  <button
                    disabled={busyId === post.id}
                    onClick={() => handlePostAction(post, 'save')}
                    className="rounded-lg border border-[#dadce0] px-3.5 py-2 text-sm font-medium text-[#202124] hover:bg-[#f8f9fa]"
                  >
                    수정 저장
                  </button>
                  <button
                    disabled={busyId === post.id}
                    onClick={() => handlePostAction(post, 'publish')}
                    className="rounded-lg bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1557b0]"
                  >
                    {busyId === post.id ? '처리 중...' : '블로그 발행하기'}
                  </button>
                </div>
                  </>
                ) : null}
              </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. 애매한 구간(70~84점) 앱 검토 대기 */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#202124]">
              앱 검토 대기 ({appPendingPosts.length}건)
            </h2>
            <span className="rounded bg-[#fef7e0] px-2 py-0.5 text-xs font-semibold text-[#b06000]">
              70~84점 애매 구간
            </span>
          </div>
          {appPendingPosts.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowAppPending((prev) => !prev)}
              className="rounded-lg border border-[#dadce0] bg-white px-3 py-1 text-xs font-semibold text-[#3c4043] hover:bg-[#f8f9fa]"
            >
              {showAppPending ? '접기 ▴' : '펼쳐서 검토하기 ▾'}
            </button>
          ) : null}
        </div>

        {appPendingPosts.length === 0 ? (
          <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-5 text-center text-sm text-[#5f6368]">
            현재 검토 대기 중인 70~84점 앱 소식이 없습니다.
          </div>
        ) : showAppPending ? (
          <div className="divide-y divide-[#dadce0] rounded-xl border border-[#dadce0] bg-white">
            {appPendingPosts.map((post) => {
              const isExpanded = Boolean(expandedAppPostIds[post.id]);
              return (
                <div key={post.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f6368]">
                        <span className="rounded bg-[#fef7e0] px-2 py-0.5 font-medium text-[#b06000]">
                          {post.region_sigungu}
                        </span>
                        <span>{post.category}</span>
                        <span className="font-semibold text-[#b06000]">확신도 {post.ai_confidence}점</span>
                        <span>· {post.org_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAppPostExpand(post.id)}
                        className="mt-1 text-left text-sm font-bold text-[#202124] hover:text-[#1a73e8]"
                      >
                        {post.app_title}
                      </button>
                      {!isExpanded ? (
                        <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-[#5f6368]">
                          {post.app_summary_3lines}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleAppPostExpand(post.id)}
                        className="rounded-lg border border-[#dadce0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3c4043] hover:bg-[#f8f9fa]"
                      >
                        {isExpanded ? '접기 ▴' : '자세히 ▾'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === post.id}
                        onClick={() => handlePostAction(post, 'publish_app')}
                        className="rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1557b0] disabled:opacity-50"
                      >
                        앱에 발행
                      </button>
                      <button
                        type="button"
                        disabled={busyId === post.id}
                        onClick={() => handlePostAction(post, 'hide_app')}
                        className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-xs font-medium text-[#5f6368] hover:bg-[#f8f9fa]"
                      >
                        제외
                      </button>
                    </div>
                  </div>
                  {isExpanded ? renderAppPostDetail(post) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAppPending(true)}
            className="w-full rounded-xl border border-[#feefc3] bg-[#fef7e0]/60 px-4 py-3 text-left text-xs font-medium text-[#b06000] hover:bg-[#fef7e0]"
          >
            애매한 구간(70~84점)으로 보류된 {appPendingPosts.length}건이 있습니다. 클릭해서 확인 후 앱에 바로 올리실 수 있습니다.
          </button>
        )}
      </section>

      {/* 4. 모바일 앱 AI 자동 발행 현황 */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#202124]">
              모바일 앱 자동 발행 현황 ({latestDawnPosts.length}건)
            </h2>
            <button
              type="button"
              onClick={() => setCalendarModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#dadce0] bg-white px-2.5 py-1 text-xs font-semibold text-[#3c4043] hover:border-[#1a73e8] hover:bg-[#f8fbff] hover:text-[#1a73e8]"
              title="날짜별 발행 현황 달력 보기"
            >
              <span aria-hidden="true">📅</span>
              <span>달력</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5f6368]">
              최근 새벽 5시 최종 순찰 이후 신규 발행 (지난 기록은 달력에서 확인)
            </span>
            {latestDawnPosts.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowAppPublished((prev) => !prev)}
                className="rounded-lg border border-[#dadce0] bg-white px-3 py-1 text-xs font-semibold text-[#3c4043] hover:bg-[#f8f9fa]"
              >
                {showAppPublished ? '접기 ▴' : '펼쳐서 보기 ▾'}
              </button>
            ) : null}
          </div>
        </div>

        {latestDawnPosts.length === 0 ? (
          <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-6 text-center text-sm text-[#5f6368]">
            최근 새벽 5시 순찰 이후 새로 자동 발행된 카드가 없습니다. (지난 발행 내역은 위 달력에서 확인하실 수 있습니다.)
          </div>
        ) : showAppPublished ? (
          <div className="divide-y divide-[#dadce0] rounded-xl border border-[#dadce0] bg-white">
            {latestDawnPosts.map((post) => {
              const isExpanded = Boolean(expandedAppPostIds[post.id]);
              return (
                <div key={post.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f6368]">
                        <span className="rounded bg-[#e8f0fe] px-2 py-0.5 font-medium text-[#1a73e8]">
                          {post.region_sigungu}
                        </span>
                        <span>{post.category}</span>
                        <span>확신도 {post.ai_confidence}점</span>
                        <span>· {post.org_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAppPostExpand(post.id)}
                        className="mt-1 text-left text-sm font-bold text-[#202124] hover:text-[#1a73e8]"
                      >
                        {post.app_title}
                      </button>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleAppPostExpand(post.id)}
                        className="rounded-lg border border-[#dadce0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3c4043] hover:bg-[#f8f9fa]"
                      >
                        {isExpanded ? '접기 ▴' : '자세히 ▾'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === post.id}
                        onClick={() => handlePostAction(post, 'hide_app')}
                        className="rounded-lg border border-[#dadce0] px-3 py-1.5 text-xs font-medium text-[#5f6368] hover:bg-[#f8f9fa]"
                      >
                        앱에서 숨기기
                      </button>
                    </div>
                  </div>
                  {isExpanded ? renderAppPostDetail(post) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAppPublished(true)}
            className="w-full rounded-xl border border-[#d2e3fc] bg-[#f8fbff] p-4 text-left text-xs font-medium text-[#1a73e8] hover:bg-[#e8f0fe]"
          >
            최근 새벽 5시 순찰 이후 자동 발행된 {latestDawnPosts.length}건이 있습니다. 클릭해서 확인하거나 앱에서 숨김 처리하실 수 있습니다.
          </button>
        )}
      </section>

      <PatrolStatusModal
        open={patrolModalOpen}
        initialTab={patrolModalTab}
        initialRegion={patrolModalRegion}
        targets={targets}
        onClose={() => setPatrolModalOpen(false)}
        onTargetAdded={(added) => setTargets((prev) => [...prev, ...added])}
        onTargetUpdated={(updated) =>
          setTargets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        }
        onTargetDeleted={(id) => setTargets((prev) => prev.filter((t) => t.id !== id))}
      />

      <AppPublishCalendarModal
        open={calendarModalOpen}
        posts={appPosts}
        busyId={busyId}
        onClose={() => setCalendarModalOpen(false)}
        onHidePost={(post) => handlePostAction(post, 'hide_app')}
      />
    </div>
  );
}
