'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [tempNickname, setTempNickname] = useState('');
  const [gender, setGender] = useState<'남성' | '여성' | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 🔔 알림 관련 상태
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  useEffect(() => {
    // 🚨 카카오톡 인앱 브라우저 강제 탈출 스크립트 전역 보호
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
        fetchProfileAndNoti(user.id);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) initAuth();
      else {
        setNickname(''); setTempNickname(''); setGender(null); setNotifications([]); setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileAndNoti = async (userId: string) => {
    // 👤 프로필 로드
    const { data: profile } = await supabase.from('profiles').select('nickname, gender').eq('id', userId).single();
    if (profile) {
      const dbNickname = profile.nickname || '';
      setNickname(dbNickname);
      setTempNickname(dbNickname);
      setGender(profile.gender as '남성' | '여성' || null);
    }
    if (!profile?.nickname || !profile?.gender) {
      setShowModal(true);
    }

    // 🔔 알림 목록 로드
    const { data: notis } = await supabase
      .from('notifications')
      .select(`*, actor:profiles!notifications_actor_id_fkey(nickname), posts(title)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (notis) {
      setNotifications(notis);
      setUnreadCount(notis.filter((n: any) => !n.is_read).length);
    }
  };

  const saveProfile = async () => {
    if (!tempNickname.trim() || !gender) return alert("정보를 모두 입력해주세요.");
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, nickname: tempNickname, gender: gender, updated_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === '23505') alert("이미 사용 중인 닉네임입니다.");
      else alert(`오류: ${error.message}`);
    } else {
      setNickname(tempNickname); setShowModal(false); fetchProfileAndNoti(user.id);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setUnreadCount(0);
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: `${window.location.origin}` }
    });
  };

  return (
    <>
      {/* 🎁 전역 온보딩 모달 */}
      {showModal && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-12 shadow-2xl space-y-10 border border-white/20 relative">
            <div className="text-center space-y-3">
              <div className="text-3xl">🌱</div>
              <h2 className="text-3xl font-black tracking-tight">반가워요!</h2>
              <p className="text-slate-500 font-medium text-sm">정보를 입력하고 빅루트를 시작해 보세요.</p>
            </div>
            <div className="space-y-6">
              <input type="text" placeholder="닉네임 입력" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-base" />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setGender('남성')} className={`py-4 rounded-2xl font-black border-2 transition-all ${gender === '남성' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white text-slate-400 border-slate-150'}`}>남성</button>
                <button onClick={() => setGender('여성')} className={`py-4 rounded-2xl font-black border-2 transition-all ${gender === '여성' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white text-slate-400 border-slate-150'}`}>여성</button>
              </div>
            </div>
            <button onClick={saveProfile} className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-black text-lg">설정 완료하기</button>
          </div>
        </div>
      )}

      {/* 🌐 글로벌 공통 상단 네비게이션 바 */}
      <nav className="fixed top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#007AFF] rounded-xl flex items-center justify-center text-white font-black text-xl">B</div>
              <span className="text-2xl font-[1000] tracking-tighter text-slate-900">BIG<span className="text-[#007AFF]">ROOT</span></span>
            </Link>
            <div className="hidden lg:flex items-center gap-10 text-[15px] font-bold text-slate-500">
              <Link href="/contract" className="hover:text-[#007AFF] transition-colors text-blue-600">계약전 체크!🔥</Link>
              <Link href="/community" className="hover:text-[#007AFF] transition-colors">커뮤니티</Link>
              <Link href="/rights-guide" className="hover:text-[#007AFF] transition-colors">권리백과</Link>
              <Link href="/rent-increase" className="hover:text-[#007AFF] transition-colors">임대료진단</Link>
              <Link href="/golden-time" className="hover:text-[#007AFF] transition-colors">골든타임</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 🔔 글로벌 알림 아이콘 벨 */}
            {user && (
              <div className="relative">
                <button onClick={() => { setShowNotiDropdown(!showNotiDropdown); if(!showNotiDropdown) markAllAsRead(); }} className="p-2.5 bg-white border border-slate-200 hover:border-slate-400 rounded-xl shadow-sm text-base relative">
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full ring-2 ring-white">
                      {unreadCount > 5 ? '5++' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotiDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 py-2">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                      <span className="font-black text-xs text-slate-800">최신 알림 센터</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto text-xs">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 text-center py-8 font-medium">알림이 없습니다. 🌱</p>
                      ) : (
                        notifications.map((noti) => (
                          <div key={noti.id} className={`p-3.5 border-b border-slate-50 last:border-0 flex gap-2 items-start ${!noti.is_read ? 'bg-blue-50/40' : ''}`}>
                            <span>{noti.type === 'comment' ? '💬' : '👍'}</span>
                            <div className="space-y-0.5 flex-1">
                              <p className="text-slate-700 font-medium"><span className="font-black text-slate-900">{noti.actor?.nickname || '세입자'}</span>님이 {noti.type === 'comment' ? '댓글을 달았습니다.' : '내 글을 추천했습니다.'}</p>
                              <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">원문: {noti.posts?.title}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 👤 로그인 / 회원 정보 락커 */}
            {user ? (
              <div className="flex items-center gap-4">
                {nickname && (
                  <Link href="/mypage" className="text-sm font-black text-slate-700 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 hover:border-blue-500 transition-all">
                    {nickname} 님
                  </Link>
                )}
                <button onClick={() => supabase.auth.signOut()} className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">로그아웃</button>
              </div>
            ) : (
              <button onClick={loginWithGoogle} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-[#007AFF] transition-all">시작하기</button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}