export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string;
  post_id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  posts?: { title: string } | null;
  actor?: { nickname: string };
};

export async function fetchNotifications(): Promise<{
  notifications: AppNotification[];
  unreadCount: number;
}> {
  const res = await fetch('/api/notifications', { cache: 'no-store' });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || '알림을 불러오지 못했습니다.');
  }

  return {
    notifications: data.notifications ?? [],
    unreadCount: data.unreadCount ?? 0,
  };
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

export async function markNotificationsRead() {
  const res = await fetch('/api/notifications', { method: 'PATCH' });
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
