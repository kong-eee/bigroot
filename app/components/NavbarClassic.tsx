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
import {
  getNotificationContextTitle,
  getNotificationHref,
  getNotificationIcon,
  getNotificationMessage,
} from '@/lib/notification-display';
import { NAV_BAR_ITEMS, NAV_GROUPS, NAV_STANDALONE } from '@/lib/nav-links';
import NavDropdown from './NavDropdown';
import ClassicBrandLogo from './ClassicBrandLogo';
import SiteSearch from './SiteSearch';
import LoginModal from './LoginModal';
import ProfileOnboardingModal from './ProfileOnboardingModal';
import {
  isProfileOnboardingComplete,
  parseInterestTypes,
  toggleInterest,
} from '@/lib/profile-interests';
import type { GoldenPropertyType } from '@/lib/golden-time-schedule';
import { usePathname } from 'next/navigation';

function formatUnreadBadge(count: number): string | null {
  if (count <= 0) return null;
  if (count > 5) return '5+';
  return String(count);
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [tempNickname, setTempNickname] = useState('');
  const [gender, setGender] = useState<'남성' | '여성' | null>(null);
  const [interestTypes, setInterestTypes] = useState<GoldenPropertyType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 🔔 알림 관련 상태
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  const notiContainerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const { notifications: list, unreadCount: count, transientError } = await fetchNotifications();
    if (!transientError) {
      setNotifications(list);
      setUnreadCount(count);
    }
  }, []);

  const fetchProfileAndNoti = useCallback(
    async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, gender, interest_types')
        .eq('id', userId)
        .single();
      if (profile) {
        const dbNickname = profile.nickname?.trim() || '';
        setNickname(dbNickname);
        setTempNickname(dbNickname);
        setGender((profile.gender as '남성' | '여성') || null);
        setInterestTypes(parseInterestTypes(profile.interest_types));
      } else {
        setNickname('');
        setTempNickname('');
        setGender(null);
        setInterestTypes([]);
      }
      if (!isProfileOnboardingComplete(profile)) {
        setShowModal(true);
      }
      await loadNotifications();
    },
    [loadNotifications]
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

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
        setInterestTypes([]);
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
    const tick = () => {
      if (document.visibilityState === 'visible') void loadNotifications();
    };
    const interval = window.setInterval(tick, 15000);
    const onVisible = () => tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
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
    if (interestTypes.length === 0) return alert('관심 분야(주택·상가)를 하나 이상 선택해 주세요.');
    
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: tempNickname, gender, interestTypes }),
    });
    const data = await res.json();

    if (!data.success) {
      if (res.status === 409) alert("이미 사용 중인 닉네임입니다. 😭");
      else alert(data.error || `오류가 발생했습니다.`);
    } else {
      setNickname(tempNickname);
      setInterestTypes(parseInterestTypes(data.profile?.interestTypes));
      setShowModal(false);
      fetchProfileAndNoti(user.id);
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

  const handleNotificationClick = async (noti: AppNotification) => {
    setShowNotiDropdown(false);

    if (!noti.is_read) {
      try {
        await markNotificationsRead(noti.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === noti.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }

    router.push(getNotificationHref(noti));
  };

  const badgeLabel = formatUnreadBadge(unreadCount);

  return (
    <>
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        variant="classic"
      />
      <ProfileOnboardingModal
        open={showModal && Boolean(user)}
        variant="classic"
        nickname={tempNickname}
        gender={gender}
        interestTypes={interestTypes}
        onNicknameChange={setTempNickname}
        onGenderChange={setGender}
        onInterestToggle={(type) => setInterestTypes((prev) => toggleInterest(prev, type))}
        onSave={() => void saveProfile()}
        onSkip={() => {
          setTempNickname(nickname);
          setShowModal(false);
        }}
      />

      {/* 🌐 글로벌 공통 상단 네비게이션 바 (가림 원천 차단 무적 치트키 z-[100] 부여) */}
      <nav className="fixed top-0 left-0 right-0 z-[100] w-full bg-[var(--bg-surface)]/90 backdrop-blur-xl border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center gap-2 sm:gap-3">
          <ClassicBrandLogo
            size="sm"
            href="/"
            className="shrink-0 min-w-0 [&_img]:h-9 [&_img]:w-9 sm:[&_img]:h-12 sm:[&_img]:w-12"
          />

          <div className="hidden md:flex xl:hidden flex-1 min-w-0 max-w-md mx-1 justify-center">
            <SiteSearch variant="full" />
          </div>

          <div className="hidden xl:flex flex-1 min-w-0 items-center justify-center gap-x-2 2xl:gap-x-3 text-sm font-bold text-[var(--text-secondary)]">
            {NAV_GROUPS.map((group) => (
              <NavDropdown
                key={group.label}
                label={group.label}
                links={group.links}
                pathname={pathname}
                variant="classic"
              />
            ))}
            <div
              className="flex items-center gap-x-4 2xl:gap-x-6 ml-1 pl-4 2xl:pl-6 border-l border-[var(--border)]"
              aria-label="바로가기"
            >
              {NAV_STANDALONE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap px-1 hover:text-[var(--brand)] transition-colors ${
                    pathname === item.href ? 'text-[var(--brand)]' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            <div className="md:hidden">
              <SiteSearch variant="icon" />
            </div>
            <div className="hidden xl:block">
              <SiteSearch variant="icon" />
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative" ref={notiContainerRef}>
                  <button
                    type="button"
                    onClick={openNotifications}
                    aria-label="알림"
                    className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--brand)] rounded-xl shadow-sm text-base relative"
                  >
                    🔔
                    {badgeLabel && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white font-black text-[9px] px-1 rounded-full ring-2 ring-white leading-none">
                        {badgeLabel}
                      </span>
                    )}
                  </button>

                  {showNotiDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl rounded-2xl z-[110] py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-[var(--border)] flex justify-between items-center">
                        <span className="font-black text-xs text-[var(--text-primary)]">최신 알림 센터</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto text-xs text-[var(--text-primary)]">
                        {notifications.length === 0 ? (
                          <p className="text-[var(--text-muted)] text-center py-8 font-medium">알림이 없습니다. 🌱</p>
                        ) : (
                          notifications.map((noti) => (
                            <button
                              key={noti.id}
                              type="button"
                              onClick={() => handleNotificationClick(noti)}
                              className={`w-full text-left p-3.5 border-b border-[var(--border)] last:border-0 flex gap-2 items-start hover:bg-[var(--bg-muted)] transition-colors ${!noti.is_read ? 'bg-[var(--brand-soft)]' : ''}`}
                            >
                              <span>{getNotificationIcon(noti)}</span>
                              <div className="space-y-0.5 flex-1">
                                <p className="text-[var(--text-secondary)] font-medium">
                                  <span className="font-black text-[var(--text-primary)]">
                                    {noti.actor?.nickname || '세입자'}
                                  </span>
                                  님이 {getNotificationMessage(noti)}
                                </p>
                                {getNotificationContextTitle(noti) && (
                                  <p className="text-[10px] text-[var(--text-muted)] font-bold truncate max-w-[200px]">
                                    {getNotificationContextTitle(noti)}
                                  </p>
                                )}
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
                    className="text-sm font-black text-[var(--text-primary)] bg-[var(--bg-muted)] px-4 py-2.5 rounded-2xl border border-[var(--border)] hover:border-[var(--brand)] transition-all"
                  >
                    {nickname} 님
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-xs font-black text-[var(--brand)] bg-[var(--brand-soft)] px-4 py-2.5 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-all"
                  >
                    🌱 닉네임 설정하기
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => supabase.auth.signOut()}
                  className="text-sm font-bold text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[var(--text-primary)] text-white rounded-2xl text-sm font-black hover:bg-[var(--brand)] hover:text-[var(--brand-on,#fff)] transition-all"
              >
                로그인
              </button>
            )}

            <button
              type="button"
              className="xl:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-lg"
              aria-label="메뉴"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

      </nav>

      {menuOpen && (
        <div className="mobile-nav-panel xl:hidden fixed inset-0 z-[90] bg-[var(--bg-surface)] overflow-y-auto pb-28 pt-[var(--nav-height)] border-t border-[var(--border)]">
          <div className="p-4 space-y-4 min-h-full">
            {NAV_BAR_ITEMS.map((item) =>
              item.type === 'group' ? (
                <div key={item.group.label}>
                  <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                    {item.group.label}
                  </p>
                  <div className="space-y-0.5">
                    {item.group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block py-3 px-4 rounded-xl text-[15px] font-bold ${
                          pathname === link.href
                            ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.link.href}
                  href={item.link.href}
                  className={`block py-3 px-4 rounded-xl text-[15px] font-bold ${
                    pathname === item.link.href
                      ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
                  }`}
                >
                  {item.link.label}
                </Link>
              )
            )}
            {user && nickname && (
              <Link
                href="/mypage"
                className="block py-3 px-4 rounded-xl text-[15px] font-bold text-[var(--text-primary)] border-t border-[var(--border)] mt-2"
              >
                {nickname} · 마이페이지
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}