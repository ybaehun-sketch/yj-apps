'use client';

import { useState } from 'react';
import type { CrawlTarget, WelfarePost } from '@/lib/types';

interface AdminDashboardClientProps {
  initialAuthenticated: boolean;
  initialDrafts: WelfarePost[];
  initialTargets: CrawlTarget[];
}

export function AdminDashboardClient({
  initialAuthenticated,
  initialDrafts,
  initialTargets
}: AdminDashboardClientProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [drafts, setDrafts] = useState<WelfarePost[]>(initialDrafts);
  const [targets, setTargets] = useState<CrawlTarget[]>(initialTargets);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');

  // 신규 타겟 폼 상태
  const [newTarget, setNewTarget] = useState({
    region_sido: '강원특별자치도',
    region_sigungu: '',
    region_code: '',
    org_name: '',
    source_type: 'WEB_BOARD' as CrawlTarget['source_type'],
    target_url: ''
  });

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
    action: 'publish' | 'archive' | 'save'
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
        error?: string;
        fcm?: { sentCount: number; skipped: boolean } | null;
      };

      if (!res.ok) {
        setToast(data.error || '처리에 실패했습니다.');
        return;
      }

      if (action === 'publish' || action === 'archive') {
        setDrafts((prev) => prev.filter((item) => item.id !== post.id));
        if (action === 'publish') {
          const fcmMsg = data.fcm?.skipped
            ? '푸시 설정 미등록으로 알림은 건너뛰었습니다.'
            : `모바일 푸시 ${data.fcm?.sentCount ?? 0}개 채널 발송 완료`;
          setToast(`발행 완료! (${fcmMsg})`);
        } else {
          setToast('보관함으로 이동했습니다.');
        }
      } else {
        setToast('임시 저장되었습니다.');
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

  async function handleAddTarget(e: React.FormEvent) {
    e.preventDefault();
    setToast('');
    const res = await fetch('/api/admin/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTarget)
    });
    const data = (await res.json()) as { ok?: boolean; target?: CrawlTarget; error?: string };
    if (!res.ok || !data.target) {
      setToast(data.error || '타겟 등록에 실패했습니다.');
      return;
    }
    setTargets((prev) => [...prev, data.target!]);
    setNewTarget({
      region_sido: '강원특별자치도',
      region_sigungu: '',
      region_code: '',
      org_name: '',
      source_type: 'WEB_BOARD',
      target_url: ''
    });
    setToast('새 순찰 대상이 등록되었습니다.');
  }

  async function handleResetTarget(id: string) {
    const res = await fetch('/api/admin/targets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      setTargets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'active', fail_count: 0 } : t))
      );
      setToast('타겟 상태를 정상으로 복구했습니다.');
    }
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

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dadce0] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#202124]">아침 5분 검토 어드민</h1>
          <p className="text-sm text-[#5f6368]">
            검토 대기 공고를 확인하고 [발행하기]를 누르면 웹과 모바일 앱 알림이 즉시 발송됩니다.
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
        <h2 className="text-lg font-bold text-[#202124]">AI 순찰대 현황</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#dadce0] bg-white p-4">
            <div className="text-xs text-[#5f6368]">정상 순찰 중</div>
            <div className="mt-1 text-2xl font-bold text-[#1a73e8]">{activeCount}곳</div>
          </div>
          <div className="rounded-xl border border-[#dadce0] bg-white p-4">
            <div className="text-xs text-[#5f6368]">오류(3회 실패)</div>
            <div className="mt-1 text-2xl font-bold text-[#d93025]">{errorCount}곳</div>
          </div>
          <div className="rounded-xl border border-[#dadce0] bg-white p-4">
            <div className="text-xs text-[#5f6368]">일시 정지</div>
            <div className="mt-1 text-2xl font-bold text-[#5f6368]">{pausedCount}곳</div>
          </div>
        </div>

        {errorCount > 0 ? (
          <div className="rounded-xl border border-[#fad2cf] bg-[#fce8e6] p-4">
            <div className="text-sm font-bold text-[#c5221f]">확인이 필요한 순찰 대상</div>
            <ul className="mt-2 space-y-2 text-sm">
              {targets
                .filter((t) => t.status === 'error')
                .map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <span>
                      {t.org_name} ({t.region_sigungu}) - 실패 {t.fail_count}회
                    </span>
                    <button
                      onClick={() => handleResetTarget(t.id)}
                      className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-[#c5221f] border border-[#fad2cf]"
                    >
                      다시 활성화
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        <form
          onSubmit={handleAddTarget}
          className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-5"
        >
          <div className="text-sm font-bold text-[#202124]">신규 순찰 대상(지자체) 간편 등록</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input
              placeholder="시·도 (예: 강원특별자치도)"
              value={newTarget.region_sido}
              onChange={(e) => setNewTarget({ ...newTarget, region_sido: e.target.value })}
              className="rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="시·군·구 (예: 춘천시)"
              value={newTarget.region_sigungu}
              onChange={(e) => setNewTarget({ ...newTarget, region_sigungu: e.target.value })}
              className="rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="지역코드 5자리 (예: 51110)"
              value={newTarget.region_code}
              onChange={(e) => setNewTarget({ ...newTarget, region_code: e.target.value })}
              className="rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="기관/게시판명 (예: 춘천시청 공지사항)"
              value={newTarget.org_name}
              onChange={(e) => setNewTarget({ ...newTarget, org_name: e.target.value })}
              className="rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
              required
            />
            <select
              value={newTarget.source_type}
              onChange={(e) =>
                setNewTarget({
                  ...newTarget,
                  source_type: e.target.value as CrawlTarget['source_type']
                })
              }
              className="rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
            >
              <option value="WEB_BOARD">지자체 게시판</option>
              <option value="FAMILYNET">가족센터 포털</option>
              <option value="API_GOV24">보조금24 API</option>
              <option value="API_WELFARE">복지로 API</option>
            </select>
            <input
              placeholder="게시판 목록 URL"
              value={newTarget.target_url}
              onChange={(e) => setNewTarget({ ...newTarget, target_url: e.target.value })}
              className="rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-3 rounded-lg bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1557b0]"
          >
            순찰 명단에 추가
          </button>
        </form>
      </section>

      {/* 2. 검토 대기함 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#202124]">
            검토 대기 공고 ({drafts.length}건)
          </h2>
        </div>

        {drafts.length === 0 ? (
          <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-8 text-center text-sm text-[#5f6368]">
            현재 검토 대기 중인 공고가 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {drafts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-[#dadce0] bg-white p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dadce0] pb-3">
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
                  <a
                    href={post.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#1a73e8] hover:underline"
                  >
                    원문 확인 ↗
                  </a>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#5f6368]">
                      앱 카드 제목 (30자 이내)
                    </label>
                    <input
                      value={post.app_title}
                      onChange={(e) => updateDraftField(post.id, 'app_title', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#dadce0] px-3 py-2 text-sm"
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
                        className="mt-1 w-full rounded-lg border border-[#dadce0] px-3 py-2 text-sm"
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
                        className="mt-1 w-full rounded-lg border border-[#dadce0] px-3 py-2 text-sm"
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
                    className="mt-1 w-full rounded-lg border border-[#dadce0] px-3 py-2 text-sm"
                  />
                </div>

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
                    onClick={() => handlePostAction(post, 'archive')}
                    className="rounded-lg border border-[#dadce0] px-3.5 py-2 text-sm font-medium text-[#5f6368] hover:bg-[#f8f9fa]"
                  >
                    숨기기(보관)
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
                    {busyId === post.id ? '처리 중...' : '발행하기 (앱 알림 발송)'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
