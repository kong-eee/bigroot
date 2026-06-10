export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string;
  post_id: string | null;
  feedback_id?: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  posts?: { title: string } | null;
  feedback_requests?: { title: string } | null;
  actor?: { nickname: string };
};

export type FetchNotificationsResult = {
  notifications: AppNotification[];
  unreadCount: number;
  /** 네트워크·서버 일시 오류 (dev HMR, 재컴파일 등) */
  transientError?: boolean;
};

export async function fetchNotifications(): Promise<FetchNotificationsResult> {
  try {
    const res = await fetch('/api/notifications', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        notifications: [],
        unreadCount: 0,
        transientError: true,
      };
    }

    return {
      notifications: data.notifications ?? [],
      unreadCount: data.unreadCount ?? 0,
    };
  } catch {
    // fetch 자체 실패(TypeError: Failed to fetch) — Supabase 권한 오류와 무관
    return { notifications: [], unreadCount: 0, transientError: true };
  }
}

export async function createNotification(payload: {
  target_user_id: string;
  post_id: string;
  type: 'comment' | 'like';
}) {
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || '알림 저장 실패');
  }
  return data;
}

export async function markNotificationsRead(notificationId?: string) {
  const res = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationId ? { id: notificationId } : {}),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || '읽음 처리 실패');
  }
}

export function notifyNavbarRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bigroot:notifications-changed'));
  }
}
