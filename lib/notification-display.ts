import type { AppNotification } from '@/lib/notifications-client';

export function getNotificationHref(noti: AppNotification): string {
  if (noti.feedback_id) return `/feedback?focus=${noti.feedback_id}`;
  if (noti.post_id) return `/community?post=${noti.post_id}`;
  return '/community';
}

export function getNotificationMessage(noti: AppNotification): string {
  switch (noti.type) {
    case 'comment':
      return '댓글을 달았습니다.';
    case 'like':
      return '추천했습니다.';
    case 'feedback_new':
      return '새 문의·요청을 등록했습니다.';
    case 'feedback_reply':
      return '문의·요청에 답변했습니다.';
    default:
      return '알림이 있습니다.';
  }
}

export function getNotificationIcon(noti: AppNotification): string {
  switch (noti.type) {
    case 'comment':
      return '💬';
    case 'like':
      return '👍';
    case 'feedback_new':
      return '📩';
    case 'feedback_reply':
      return '✅';
    default:
      return '🔔';
  }
}

export function getNotificationContextTitle(noti: AppNotification): string | null {
  return noti.feedback_requests?.title ?? noti.posts?.title ?? null;
}
