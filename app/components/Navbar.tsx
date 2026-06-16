'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  fetchNotifications,
  markNotificationsRead,
  type AppNotification,
} from '@/lib/notifications-client';
import {
  getNotificationContextTitle,
  getNotificationHref,
  getNotificationMessage,
} from '@/lib/notification-display';
import { NAV_BAR_ITEMS, NAV_GROUPS, NAV_STANDALONE } from '@/lib/nav-links';
import NavDropdown from './NavDropdown';
import BrandLogo from './BrandLogo';
import SiteSearch from './SiteSearch';
import LoginModal from './LoginModal';
import ProfileOnboardingModal from './ProfileOnboardingModal';
import {
  isProfileOnboardingComplete,
  parseInterestTypes,
  toggleInterest,
} from '@/lib/profile-interests';
import type { GoldenPropertyType } from '@/lib/golden-time-schedule';

function formatUnreadBadge(count: number): string | null {
  if (count <= 0) return null;
  if (count > 5) return '5+';
  return String(count);
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [tempNickname, setTempNickname] = useState('');
  const [gender, setGender] = useState<'남성' | '여성' | null>(null);
  const [interestTypes, setInterestTypes] = useState<GoldenPropertyType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('kakaotalk')) {
        window.location.href = `kakaotalk://web/openExternalApp?url=${encodeURIComponent(window.location.href)}`;
        return;
      }
    }

    const initAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        await fetchProfileAndNoti(authUser.id);
      }
    };
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchProfileAndNoti(user.id)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProfileAndNoti]);

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

  useEffect(() => {
    const onRefresh = () => loadNotifications();
    window.addEventListener('bigroot:notifications-changed', onRefresh);
    return () => window.removeEventListener('bigroot:notifications-changed', onRefresh);
  }, [loadNotifications]);

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

  const saveProfile = async () => {
    if (!tempNickname.trim()) return alert('닉네임을 입력해주세요!');
    if (!gender) return alert('성별을 선택해주세요!');
    if (interestTypes.length === 0) return alert('관심 분야(주택·상가)를 하나 이상 선택해 주세요.');

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: tempNickname,
        gender,
        interestTypes,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      if (res.status === 409) alert('이미 사용 중인 닉네임입니다.');
      else alert(data.error || `오류가 발생했습니다.`);
    } else {
      setNickname(tempNickname);
      setInterestTypes(parseInterestTypes(data.profile?.interestTypes));
      setShowModal(false);
      fetchProfileAndNoti(user.id);
      alert(`${tempNickname}님, 환영합니다!`);
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

  const linkClass = (href: string, highlight?: boolean) => {
    const active = pathname === href;
    return `block py-3 px-4 rounded-xl text-[15px] font-bold transition-colors ${
      active
        ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
        : highlight
          ? 'text-[var(--brand)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
    }`;
  };

  return (
    <>
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} variant="refresh" />
      <ProfileOnboardingModal
        open={showModal && Boolean(user)}
        variant="refresh"
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

      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-xl shadow-[0_1px_0_rgba(31,26,20,0.04)]">
        <div className="mx-auto flex h-[var(--nav-height)] max-w-7xl items-center gap-2 px-4 sm:px-6">
          <BrandLogo size="sm" className="shrink-0 min-w-0" />

          <div className="hidden md:flex xl:hidden flex-1 min-w-0 max-w-md mx-1 justify-center">
            <SiteSearch variant="full" />
          </div>

          <nav className="hidden xl:flex flex-1 min-w-0 items-center justify-center gap-1.5 2xl:gap-2">
            {NAV_GROUPS.map((group) => (
              <NavDropdown
                key={group.label}
                label={group.label}
                links={group.links}
                pathname={pathname}
                variant="refresh"
              />
            ))}
            <div
              className="flex items-center gap-x-5 ml-2 pl-5 border-l border-[var(--border)]"
              aria-label="바로가기"
            >
              {NAV_STANDALONE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${
                    pathname === item.href
                      ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                      : item.highlight
                        ? 'text-[var(--brand)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <div className="md:hidden">
              <SiteSearch variant="icon" />
            </div>
            <div className="hidden xl:block">
              <SiteSearch variant="icon" />
            </div>
            {user ? (
              <>
                <div className="relative" ref={notiContainerRef}>
                  <button
                    type="button"
                    onClick={openNotifications}
                    aria-label="알림"
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-lg"
                  >
                    🔔
                    {badgeLabel && (
                      <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                        {badgeLabel}
                      </span>
                    )}
                  </button>
                  {showNotiDropdown && (
                    <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] ui-card py-2 z-[110]">
                      <p className="px-4 py-2 text-xs font-black border-b border-[var(--border)]">
                        알림
                      </p>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                            알림이 없습니다
                          </p>
                        ) : (
                          notifications.map((noti) => (
                            <button
                              key={noti.id}
                              type="button"
                              onClick={() => handleNotificationClick(noti)}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-[var(--bg-muted)] ${
                                !noti.is_read ? 'bg-[var(--brand-soft)]' : ''
                              }`}
                            >
                              <span className="font-black">
                                {noti.actor?.nickname || '세입자'}
                              </span>
                              님이 {getNotificationMessage(noti)}
                              {getNotificationContextTitle(noti) && (
                                <span className="block text-[10px] text-[var(--text-muted)] font-bold mt-0.5 truncate">
                                  {getNotificationContextTitle(noti)}
                                </span>
                              )}
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
                    className="hidden sm:inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm font-bold"
                  >
                    {nickname}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="hidden sm:inline text-xs font-bold text-[var(--brand)]"
                  >
                    닉네임 설정
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => supabase.auth.signOut()}
                  className="hidden sm:inline text-xs font-bold text-[var(--text-muted)]"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="ui-btn-primary text-sm"
              >
                로그인
              </button>
            )}

            <button
              type="button"
              className="xl:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)]"
              aria-label="메뉴"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

      </header>

      {menuOpen && (
        <div className="mobile-nav-panel xl:hidden fixed inset-0 z-[90] bg-[var(--bg-surface)] overflow-y-auto pb-28 pt-[var(--nav-height)] border-t border-[var(--border)]">
          <nav className="p-3 space-y-4 min-h-full">
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
                        className={linkClass(link.href, link.highlight)}
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
                  className={linkClass(item.link.href, item.link.highlight)}
                >
                  {item.link.label}
                </Link>
              )
            )}
            {user && (
              <div className="pt-3 mt-3 border-t border-[var(--border)] space-y-2 px-4">
                {nickname && (
                  <Link href="/mypage" className="block font-bold text-[var(--text-primary)]">
                    {nickname} · 마이페이지
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => supabase.auth.signOut()}
                  className="text-sm font-bold text-[var(--text-muted)]"
                >
                  로그아웃
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
