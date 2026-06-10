'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FEEDBACK_MIGRATION_SQL } from '@/lib/feedback-migration-sql';
import { notifyNavbarRefresh } from '@/lib/notifications-client';
import PageHero from '@/app/components/layout/PageHero';

type FeedbackRow = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  is_public: boolean;
  content_masked?: boolean;
  admin_reply?: string | null;
  replied_at?: string | null;
  created_at: string;
  profiles?: { nickname: string | null } | null;
};

function FeedbackPageContent() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<{
    nickname?: string | null;
    is_admin?: boolean | null;
  } | null>(null);
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [schemaReady, setSchemaReady] = useState<boolean | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const searchParams = useSearchParams();
  const focusId = searchParams.get('focus');

  const isAllowed = Boolean(user && profile?.nickname?.trim());
  const isAdmin = profile?.is_admin === true;

  const loadAuth = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    setUser(authUser ? { id: authUser.id } : null);
    if (authUser) {
      const { data: pf } = await supabase
        .from('profiles')
        .select('nickname, is_admin')
        .eq('id', authUser.id)
        .single();
      setProfile(pf);
    } else {
      setProfile(null);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const { data: rows, error } = await supabase.rpc('list_feedback_requests');

    if (error) {
      console.error('문의 목록 로드 실패:', error.message, error);
      setLoadError(
        error.message.includes('list_feedback_requests')
          ? '목록 함수가 없습니다. Supabase에서 20260527300000_feedback_list_masked.sql 을 실행해 주세요.'
          : error.message
      );
      setItems([]);
      setLoading(false);
      return;
    }

    const list = (rows as Omit<FeedbackRow, 'profiles'>[]) ?? [];
    const authorIds = [...new Set(list.map((r) => r.author_id))];
    let nicknameById = new Map<string, string | null>();

    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', authorIds);
      nicknameById = new Map(
        (profiles ?? []).map((p) => [p.id, p.nickname as string | null])
      );
    }

    setItems(
      list.map((row) => ({
        ...row,
        profiles: { nickname: nicknameById.get(row.author_id) ?? null },
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, user?.id, profile?.is_admin]);

  useEffect(() => {
    if (!isAdmin) {
      setSchemaReady(null);
      return;
    }
    let cancelled = false;
    fetch('/api/feedback/schema-status')
      .then((res) => res.json())
      .then((body: { ready?: boolean }) => {
        if (!cancelled) setSchemaReady(body.ready === true);
      })
      .catch(() => {
        if (!cancelled) setSchemaReady(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!focusId || loading) return;
    const el = document.getElementById(`feedback-${focusId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, loading, items.length]);

  const visibleItems = items.filter((row) => {
    if (filter === 'mine' && user) return row.author_id === user.id;
    return true;
  });

  const handleSubmit = async () => {
    if (!isAllowed || !user) return alert('로그인 후 닉네임을 설정해야 글을 쓸 수 있어요.');

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle) return alert('제목을 입력해 주세요.');
    if (trimmedContent.length < 2) {
      return alert('내용을 2자 이상 입력해 주세요. (이전 DB 설정은 5자 이상이었을 수 있어요)');
    }

    const { error } = await supabase.from('feedback_requests').insert({
      author_id: user.id,
      title: trimmedTitle,
      content: trimmedContent,
      is_public: isPublic,
    });

    if (error) {
      if (
        error.code === '23514' &&
        error.message.includes('feedback_requests_content_check')
      ) {
        alert(
          '내용이 너무 짧아요. 2자 이상 입력해 주세요.\n\nSupabase에서 migrations/20260527100000_feedback_constraints_relax.sql 을 실행하면 해결됩니다.'
        );
      } else {
        alert(`등록 실패: ${error.message}`);
      }
      return;
    }

    setTitle('');
    setContent('');
    setIsPublic(true);
    alert('문의·요청이 등록되었습니다. 감사합니다!');
    notifyNavbarRefresh();
    fetchItems();
  };

  const handleAdminReply = async (row: FeedbackRow) => {
    if (!isAdmin || !user) return;
    const text = (replyDrafts[row.id] ?? '').trim();
    if (text.length < 2) return alert('답변을 2자 이상 입력해 주세요.');

    setReplyingId(row.id);
    try {
      const res = await fetch('/api/feedback/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: row.id, reply: text }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        error?: string;
        needsMigration?: boolean;
      };

      if (!res.ok || !body.success) {
        if (body.needsMigration) {
          setSchemaReady(false);
          alert(
            '답변 컬럼이 DB에 없습니다.\n\nSupabase 대시보드 → SQL Editor에서 페이지 상단 안내의 SQL을 실행한 뒤 다시 시도해 주세요.'
          );
        } else {
          alert(`답변 저장 실패: ${body.error ?? res.statusText}`);
        }
        return;
      }

      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      setSchemaReady(true);
      notifyNavbarRefresh();
      alert('답변이 등록되었습니다. 작성자에게 알림이 전송됩니다.');
      fetchItems();
    } catch (e) {
      alert(`답변 저장 실패: ${e instanceof Error ? e.message : '네트워크 오류'}`);
    } finally {
      setReplyingId(null);
    }
  };

  const copyMigrationSql = async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_MIGRATION_SQL);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    } catch {
      alert('복사에 실패했습니다. Supabase SQL Editor에 supabase/migrations/20260530000000_feedback_notifications.sql 내용을 붙여넣어 주세요.');
    }
  };

  const toggleVisibility = async (row: FeedbackRow) => {
    if (!user || row.author_id !== user.id) return;
    const { error } = await supabase
      .from('feedback_requests')
      .update({ is_public: !row.is_public })
      .eq('id', row.id);
    if (error) alert(`변경 실패: ${error.message}`);
    else fetchItems();
  };

  const handleDelete = async (row: FeedbackRow) => {
    if (!user) return;
    if (row.author_id !== user.id && !isAdmin) return;
    if (!confirm('이 글을 삭제할까요?')) return;
    const { error } = await supabase.from('feedback_requests').delete().eq('id', row.id);
    if (error) alert(`삭제 실패: ${error.message}`);
    else fetchItems();
  };

  return (
    <div className="page-main flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-6">
        <PageHero
          badge="문의·요청"
          title="문의 · 요청"
          description={
            <>
              만들어 주세요, 수정해 주세요 같은 의견을 남겨 주세요. 로그인·닉네임 설정 후 작성할 수
              있으며, 전체공개/비공개를 선택할 수 있어요.
              {isAdmin && (
                <span className="block mt-2 text-amber-700 font-bold">
                  운영자 모드: 비공개 글을 포함해 모든 문의를 볼 수 있습니다.
                </span>
              )}
            </>
          }
        />

        {isAdmin && schemaReady === false && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-3 shadow-sm">
            <p className="text-sm font-black text-amber-900">
              답변 기능을 쓰려면 DB 마이그레이션이 필요합니다
            </p>
            <p className="text-xs font-bold text-amber-800 leading-relaxed">
              Supabase 대시보드 → SQL Editor → 아래 SQL 복사 후 Run. 실행 후 이 페이지를 새로고침하세요.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyMigrationSql()}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg text-xs font-black hover:bg-amber-800"
              >
                {sqlCopied ? '복사됨!' : '마이그레이션 SQL 복사'}
              </button>
              <a
                href="https://supabase.com/dashboard/project/udmqxqzirpolosamzotb/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-black hover:bg-amber-100"
              >
                Supabase SQL Editor 열기
              </a>
            </div>
          </div>
        )}

        <div className="relative bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          {!isAllowed && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm p-6 text-center">
              <p className="font-black text-slate-700 mb-3">글쓰기는 로그인 + 닉네임 설정 후 가능해요</p>
              <Link
                href="/"
                className="px-5 py-2.5 bg-[var(--brand)] text-white rounded-xl font-black text-sm"
              >
                홈에서 로그인하기
              </Link>
            </div>
          )}

          <input
            type="text"
            placeholder="제목 (예: 안전진단에 ○○ 기능 추가 요청)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold outline-none focus:border-blue-500"
            maxLength={120}
          />
          <textarea
            placeholder="어떤 기능을 원하시는지, 어떤 부분을 고쳐야 하는지 구체적으로 적어 주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold outline-none resize-y focus:border-blue-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`px-4 py-2 rounded-lg text-xs font-black ${
                  isPublic ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                }`}
              >
                전체공개
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`px-4 py-2 rounded-lg text-xs font-black ${
                  !isPublic ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                }`}
              >
                비공개
              </button>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-3 bg-[var(--brand)] text-white rounded-xl font-black text-sm hover:bg-[var(--brand-hover)]"
            >
              등록하기
            </button>
          </div>
          <p className="text-xs text-slate-400 font-bold">
            비공개 글도 제목은 목록에 보이고, 내용은 작성자·운영자만 볼 수 있어요.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black border ${
              filter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            전체
          </button>
          {user && (
            <button
              type="button"
              onClick={() => setFilter('mine')}
              className={`px-4 py-2 rounded-xl text-xs font-black border ${
                filter === 'mine'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              내 글
            </button>
          )}
        </div>

        {loadError && (
          <p className="text-center text-red-500 font-bold py-4 text-sm">
            목록을 불러오지 못했습니다: {loadError}
            <br />
            <span className="text-slate-500 font-bold">
              Supabase에서 feedback 관련 migration SQL을 실행해 주세요.
            </span>
          </p>
        )}
        {loading ? (
          <p className="text-center text-slate-400 font-bold py-8">불러오는 중…</p>
        ) : visibleItems.length === 0 ? (
          <p className="text-center text-slate-400 font-bold py-8">
            {loadError ? '위 오류를 해결한 뒤 새로고침해 주세요.' : '아직 문의가 없어요.'}
          </p>
        ) : (
          <ul className="space-y-4">
            {visibleItems.map((row) => {
              const isMine = user?.id === row.author_id;
              return (
                <li
                  key={row.id}
                  id={`feedback-${row.id}`}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-2 ${
                    focusId === row.id ? 'border-[var(--brand)] ring-2 ring-[var(--brand-soft)]' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-400">
                      {row.profiles?.nickname || '세입자'}
                    </span>
                    {row.is_public ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        전체공개
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                        비공개{isAdmin ? ' · 운영자 열람' : ''}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-300 ml-auto">
                      {new Date(row.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900">{row.title}</h3>
                  <p
                    className={`text-sm font-bold whitespace-pre-wrap leading-relaxed ${
                      row.content_masked
                        ? 'text-slate-400 italic bg-slate-50 rounded-xl px-4 py-3 border border-dashed border-slate-200'
                        : 'text-slate-600'
                    }`}
                  >
                    {row.content}
                  </p>
                  {row.admin_reply && (
                    <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
                      <p className="text-[10px] font-black text-blue-600">운영자 답변</p>
                      <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {row.admin_reply}
                      </p>
                      {row.replied_at && (
                        <p className="text-[10px] text-slate-400 font-bold">
                          {new Date(row.replied_at).toLocaleString('ko-KR')}
                        </p>
                      )}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-3 pt-3 border-t border-dashed border-slate-200 space-y-2">
                      <p className="text-[10px] font-black text-amber-700">운영자 답변 작성</p>
                      <textarea
                        placeholder="작성자에게 전달할 답변을 입력하세요."
                        value={replyDrafts[row.id] ?? row.admin_reply ?? ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 resize-y"
                      />
                      <button
                        type="button"
                        disabled={replyingId === row.id}
                        onClick={() => void handleAdminReply(row)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black hover:bg-slate-800 disabled:opacity-50"
                      >
                        {replyingId === row.id ? '저장 중…' : row.admin_reply ? '답변 수정' : '답변 등록'}
                      </button>
                    </div>
                  )}

                  {(isMine || isAdmin) && (
                    <div className="flex gap-2 pt-2">
                      {isMine && (
                        <button
                          type="button"
                          onClick={() => toggleVisibility(row)}
                          className="text-xs font-black text-blue-600 hover:underline"
                        >
                          {row.is_public ? '비공개로 변경' : '전체공개로 변경'}
                        </button>
                      )}
                      {(isMine || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="text-xs font-black text-red-500 hover:underline"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="page-main flex items-center justify-center p-8">
          <p className="text-slate-400 font-bold">불러오는 중…</p>
        </div>
      }
    >
      <FeedbackPageContent />
    </Suspense>
  );
}
