'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type FeedbackRow = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  profiles?: { nickname: string | null } | null;
};

export default function FeedbackPage() {
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

    const { data: rows, error } = await supabase
      .from('feedback_requests')
      .select('id, author_id, title, content, is_public, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('문의 목록 로드 실패:', error.message, error);
      setLoadError(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const list = rows ?? [];
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
    fetchItems();
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-6 pt-28 font-sans text-slate-900">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">문의 · 요청</h2>
          <p className="text-sm text-slate-500 font-bold leading-relaxed">
            만들어 주세요, 수정해 주세요 같은 의견을 남겨 주세요. 로그인·닉네임 설정 후 작성할 수
            있으며, 전체공개/비공개를 선택할 수 있어요.
            {isAdmin && (
              <span className="block mt-1 text-amber-700">
                운영자 모드: 비공개 글을 포함해 모든 문의를 볼 수 있습니다.
              </span>
            )}
          </p>
        </div>

        <div className="relative bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          {!isAllowed && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm p-6 text-center">
              <p className="font-black text-slate-700 mb-3">글쓰기는 로그인 + 닉네임 설정 후 가능해요</p>
              <Link
                href="/"
                className="px-5 py-2.5 bg-[#007AFF] text-white rounded-xl font-black text-sm"
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
              className="px-6 py-3 bg-[#007AFF] text-white rounded-xl font-black text-sm hover:bg-blue-700"
            >
              등록하기
            </button>
          </div>
          <p className="text-xs text-slate-400 font-bold">
            비공개는 작성자와 운영자만 볼 수 있어요. 전체공개는 다른 이용자도 목록에서 볼 수
            있습니다.
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
              Supabase에서 20260527200000_feedback_rls_and_profiles_fk.sql 을 실행해 주세요.
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
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2"
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
                  <p className="text-sm text-slate-600 font-bold whitespace-pre-wrap leading-relaxed">
                    {row.content}
                  </p>
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
