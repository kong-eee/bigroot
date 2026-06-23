const MOVE_IN_KEY = 'bigroot:move_in_date';
const CONTRACT_SIGNED_KEY = 'bigroot:contract_signed_date';
const CHECKLIST_PREFIX = 'bigroot:checklist:';

function datedKey(base: string, userId?: string) {
  return userId ? `${base}:${userId}` : base;
}

export function getMoveInDate(userId?: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(datedKey(MOVE_IN_KEY, userId)) || '';
}

export function setMoveInDate(date: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  const key = datedKey(MOVE_IN_KEY, userId);
  if (date) localStorage.setItem(key, date);
  else localStorage.removeItem(key);
}

export function getContractSignedDate(userId?: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(datedKey(CONTRACT_SIGNED_KEY, userId)) || '';
}

export function setContractSignedDate(date: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  const key = datedKey(CONTRACT_SIGNED_KEY, userId);
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
