'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchNotifications,
  markNotificationsRead,
  type AppNotification,
} from '@/lib/notifications-client';

function formatUnreadBadge(count: number): string | null {
  if (count <= 0) return null;
  if (count > 5) return '5+';
  return String(count);
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [tempNickname, setTempNickname] = useState('');
  const [gender, setGender] = useState<'남성' | '여성' | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 🔔 알림 관련 상태
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  const notiContainerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const { notifications: list, unreadCount: count } = await fetchNotifications();
      setNotifications(list);
      setUnreadCount(count);
    } catch (error) {
      console.error('알림 불러오기 실패:', error);
    }
  }, []);

  const fetchProfileAndNoti = useCallback(
    async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, gender')
        .eq('id', userId)
        .single();
      if (profile) {
        const dbNickname = profile.nickname || '';
        setNickname(dbNickname);
        setTempNickname(dbNickname);
        setGender((profile.gender as '남성' | '여성') || null);
      }
      if (!profile?.nickname || !profile?.gender) {
        setShowModal(true);
      }
      await loadNotifications();
    },
    [loadNotifications]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('kakaotalk')) {
        window.location.href = `kakaotalk://web/openExternalApp?url=${encodeURIComponent(window.location.href)}`;
        return;
      }
    }

    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfileAndNoti(user.id);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfileAndNoti(session.user.id);
      else {
        setNickname('');
        setTempNickname('');
        setGender(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndNoti]);

  // 실시간 알림 리스너
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`realtime-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchProfileAndNoti(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProfileAndNoti, loadNotifications]);

  // 15초마다 알림 폴링 (Realtime 보조)
  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => loadNotifications(), 15000);
    return () => window.clearInterval(interval);
  }, [user, loadNotifications]);

  // 커뮤니티 댓글/좋아요 후 즉시 갱신
  useEffect(() => {
    const onRefresh = () => loadNotifications();
    window.addEventListener('bigroot:notifications-changed', onRefresh);
    return () => window.removeEventListener('bigroot:notifications-changed', onRefresh);
  }, [loadNotifications]);

  // 바깥 영역 클릭 시 닫힘
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiContainerRef.current && !notiContainerRef.current.contains(event.target as Node)) {
        if (showNotiDropdown) {
          setShowNotiDropdown(false);
          void markAllAsRead();
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotiDropdown]);

  const saveProfile = async () => {
    if (!tempNickname.trim()) return alert("닉네임을 입력해주세요!");
    if (!gender) return alert('성별을 선택해주세요!');
    
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, nickname: tempNickname, gender: gender, updated_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === '23505') alert("이미 사용 중인 닉네임입니다. 😭");
      else alert(`오류: ${error.message}`);
    } else {
      setNickname(tempNickname); setShowModal(false); fetchProfileAndNoti(user.id);
      alert(`${tempNickname}님, 환영합니다! 🌱`);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('읽음 처리 실패:', error);
    }
  };

  const openNotifications = async () => {
    const willOpen = !showNotiDropdown;
    if (willOpen) {
      await loadNotifications();
      setShowNotiDropdown(true);
    } else {
      setShowNotiDropdown(false);
      await markAllAsRead();
    }
  };

  const badgeLabel = formatUnreadBadge(unreadCount);

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: `${window.location.origin}` }
    });
  };

  return (
    <>
      {/* 🎁 전역 온보딩 모달 (z-[130] 격상) */}
      {showModal && user && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-12 shadow-2xl space-y-8 border border-slate-100 relative text-slate-900">
            <div className="text-center space-y-3">
              <div className="text-4xl">🌱</div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">반가워요!</h2>
              <p className="text-slate-500 font-bold text-sm leading-relaxed">정보를 입력하고 빅루트를 시작해 보세요.</p>
            </div>
            <div className="space-y-5">
              <input type="text" placeholder="사용할 닉네임을 입력하세요" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-black text-slate-900 placeholder:text-slate-400 text-base focus:bg-white focus:border-blue-500 transition-all" />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setGender('남성')} className={`py-4 rounded-2xl font-black text-base border transition-all ${gender === '남성' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}>남성</button>
                <button onClick={() => setGender('여성')} className={`py-4 rounded-2xl font-black text-base border transition-all ${gender === '여성' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}>여성</button>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <button onClick={saveProfile} className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-black text-lg">설정 완료하기</button>
              <button onClick={() => { setTempNickname(nickname); setShowModal(false); }} className="w-full text-center text-sm font-black text-slate-400 hover:text-slate-600 transition-colors py-1">나중에 할게요</button>
            </div>
          </div>
        </div>
      )}

      {/* 🌐 글로벌 공통 상단 네비게이션 바 (가림 원천 차단 무적 치트키 z-[100] 부여) */}
      <nav className="fixed top-0 left-0 right-0 z-[100] w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#007AFF] rounded-xl flex items-center justify-center text-white font-black text-xl">B</div>
              <span className="text-2xl font-[1000] tracking-tighter text-slate-900">BIG<span className="text-[#007AFF]">ROOT</span></span>
            </Link>
            
<div className="hidden lg:flex items-center gap-10 text-[15px] font-bold text-slate-500">
  <Link href="/contract" className="hover:text-[#007AFF] transition-colors text-blue-600">계약전 체크!🔥</Link>
  <Link href="/safety-check" className="hover:text-[#007AFF] transition-colors text-emerald-600 font-black">안전진단기 단독✨</Link> {/* ✅ 추가 */}
  <Link href="/community" className="hover:text-[#007AFF] transition-colors">커뮤니티</Link>
  <Link href="/rights-guide" className="hover:text-[#007AFF] transition-colors">권리백과</Link>
  <Link href="/rent-increase" className="hover:text-[#007AFF] transition-colors">임대료진단</Link>
  <Link href="/golden-time" className="hover:text-[#007AFF] transition-colors">골든타임</Link>
</div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative" ref={notiContainerRef}>
                  <button
                    type="button"
                    onClick={openNotifications}
                    aria-label="알림"
                    className="p-2.5 bg-white border border-slate-200 hover:border-slate-400 rounded-xl shadow-sm text-base relative"
                  >
                    🔔
                    {badgeLabel && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white font-black text-[9px] px-1 rounded-full ring-2 ring-white leading-none">
                        {badgeLabel}
                      </span>
                    )}
                  </button>

                  {showNotiDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[110] py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-black text-xs text-slate-800">최신 알림 센터</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto text-xs text-slate-900">
                        {notifications.length === 0 ? (
                          <p className="text-slate-400 text-center py-8 font-medium">알림이 없습니다. 🌱</p>
                        ) : (
                          notifications.map((noti) => (
                            <button
                              key={noti.id}
                              type="button"
                              onClick={() => {
                                setShowNotiDropdown(false);
                                if (noti.post_id) {
                                  router.push(`/community?post=${noti.post_id}`);
                                } else {
                                  router.push('/community');
                                }
                              }}
                              className={`w-full text-left p-3.5 border-b border-slate-50 last:border-0 flex gap-2 items-start hover:bg-slate-50 transition-colors ${!noti.is_read ? 'bg-blue-50/40' : ''}`}
                            >
                              <span>{noti.type === 'comment' ? '💬' : '👍'}</span>
                              <div className="space-y-0.5 flex-1">
                                <p className="text-slate-700 font-medium">
                                  <span className="font-black text-slate-900">
                                    {noti.actor?.nickname || '세입자'}
                                  </span>
                                  님이{' '}
                                  {noti.type === 'comment'
                                    ? '댓글을 달았습니다.'
                                    : '내 글을 추천했습니다.'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">
                                  원문: {noti.posts?.title || '게시글'}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {nickname ? (
                  <Link
                    href="/mypage"
                    className="text-sm font-black text-slate-700 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 hover:border-blue-500 transition-all"
                  >
                    {nickname} 님
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-xs font-black text-blue-500 bg-blue-50 px-4 py-2.5 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all"
                  >
                    🌱 닉네임 설정하기
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => supabase.auth.signOut()}
                  className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-[#007AFF] transition-all"
              >
                시작하기
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}