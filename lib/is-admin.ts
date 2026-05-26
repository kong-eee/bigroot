/** profiles.is_admin 또는 서버 환경변수(쉼표 구분 UUID) */
export function isAdminUserId(
  userId: string | undefined | null,
  profileIsAdmin?: boolean | null
): boolean {
  if (!userId) return false;
  if (profileIsAdmin === true) return true;

  const raw = process.env.ADMIN_USER_IDS?.trim();
  if (!raw) return false;

  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids.includes(userId);
}
