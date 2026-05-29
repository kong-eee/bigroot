const MOVE_IN_KEY = 'bigroot:move_in_date';
const CHECKLIST_PREFIX = 'bigroot:checklist:';

export function getMoveInDate(userId?: string): string {
  if (typeof window === 'undefined') return '';
  const key = userId ? `${MOVE_IN_KEY}:${userId}` : MOVE_IN_KEY;
  return localStorage.getItem(key) || '';
}

export function setMoveInDate(date: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  const key = userId ? `${MOVE_IN_KEY}:${userId}` : MOVE_IN_KEY;
  if (date) localStorage.setItem(key, date);
  else localStorage.removeItem(key);
}

export function getChecklistDone(slug: string, userId?: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  const key = `${CHECKLIST_PREFIX}${slug}${userId ? `:${userId}` : ''}`;
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function setChecklistItem(
  slug: string,
  itemId: string,
  done: boolean,
  userId?: string
): Record<string, boolean> {
  const prev = getChecklistDone(slug, userId);
  const next = { ...prev, [itemId]: done };
  if (typeof window !== 'undefined') {
    const key = `${CHECKLIST_PREFIX}${slug}${userId ? `:${userId}` : ''}`;
    localStorage.setItem(key, JSON.stringify(next));
  }
  return next;
}
