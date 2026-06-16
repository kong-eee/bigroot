import { createAdminSupabase } from '@/lib/supabase-admin';
import { parseInterestTypes } from '@/lib/profile-interests';
import { syncAuthUserProfile } from '@/lib/sync-auth-user';

type ProfileAuthRow = {
  nickname?: string | null;
  phone?: string | null;
  interest_types?: unknown;
};

export async function syncProfileToAuth(userId: string, profile: ProfileAuthRow) {
  const admin = createAdminSupabase();
  if (!admin) return null;

  const interests = parseInterestTypes(profile.interest_types);
  const nickname = profile.nickname?.trim() || undefined;
  const phone = profile.phone?.trim() || undefined;

  if (!nickname && !phone && interests.length === 0) return null;

  return syncAuthUserProfile(admin.auth.admin, userId, {
    nickname,
    phone010: phone,
    interestTypes: interests.length > 0 ? interests : [],
  });
}
