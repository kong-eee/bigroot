import type { SupabaseClient } from '@supabase/supabase-js';
import { toAuthPhoneE164Kr, type GoldenPropertyType } from '@/lib/golden-time-schedule';
import { formatAuthDisplayName, parseInterestTypes } from '@/lib/profile-interests';

type AuthAdmin = SupabaseClient['auth']['admin'];

export type AuthProfileSyncPatch = {
  phone010?: string;
  nickname?: string;
  interestTypes?: GoldenPropertyType[];
};

function resolveNickname(
  patch: AuthProfileSyncPatch,
  meta: Record<string, unknown>
): string {
  if (patch.nickname?.trim()) return patch.nickname.trim();
  if (typeof meta.nickname === 'string' && meta.nickname.trim()) return meta.nickname.trim();
  if (typeof meta.full_name === 'string' && meta.full_name.trim()) return meta.full_name.trim();
  return '';
}

function resolveInterests(
  patch: AuthProfileSyncPatch,
  meta: Record<string, unknown>
): GoldenPropertyType[] {
  if (patch.interestTypes !== undefined) return patch.interestTypes;
  return parseInterestTypes(meta.interest_types);
}

export async function syncAuthUserProfile(
  admin: AuthAdmin,
  userId: string,
  patch: AuthProfileSyncPatch
): Promise<{ phone?: boolean; displayName?: boolean; interests?: boolean }> {
  const result: { phone?: boolean; displayName?: boolean; interests?: boolean } = {};
  const hasMeta =
    Boolean(patch.nickname?.trim()) || patch.interestTypes !== undefined;
  const hasPhone = Boolean(patch.phone010);

  if (!hasMeta && !hasPhone) return result;

  const { data: existing, error: readError } = await admin.getUserById(userId);
  if (readError) {
    console.error('auth user read failed:', readError);
    return result;
  }

  const meta = { ...(existing.user?.user_metadata ?? {}) } as Record<string, unknown>;
  const updates: {
    phone?: string;
    phone_confirm?: boolean;
    user_metadata?: Record<string, unknown>;
  } = {};

  const nickname = resolveNickname(patch, meta);
  const interests = resolveInterests(patch, meta);

  if (patch.nickname?.trim()) {
    meta.nickname = patch.nickname.trim();
    result.displayName = true;
  }

  if (patch.interestTypes !== undefined) {
    meta.interest_types = patch.interestTypes;
    meta.interest_housing = patch.interestTypes.includes('주택');
    meta.interest_commercial = patch.interestTypes.includes('상가');
    result.interests = true;
  }

  const displayLabel = formatAuthDisplayName(nickname, interests);
  if (displayLabel) {
    meta.display_name = displayLabel;
    meta.full_name = displayLabel;
    result.displayName = true;
  }

  if (hasMeta || displayLabel) updates.user_metadata = meta;

  if (patch.phone010) {
    updates.phone = toAuthPhoneE164Kr(patch.phone010);
    updates.phone_confirm = true;
    result.phone = true;
  }

  const { error } = await admin.updateUserById(userId, updates);
  if (error) {
    console.error('auth profile sync failed:', error);
    return {};
  }

  return result;
}

/** @deprecated use syncAuthUserProfile */
export async function syncAuthUserPhone(
  admin: AuthAdmin,
  userId: string,
  phone010: string
): Promise<boolean> {
  const r = await syncAuthUserProfile(admin, userId, { phone010 });
  return Boolean(r.phone);
}

/** @deprecated use syncAuthUserProfile */
export async function syncAuthUserDisplayName(
  admin: AuthAdmin,
  userId: string,
  nickname: string
): Promise<boolean> {
  const r = await syncAuthUserProfile(admin, userId, { nickname });
  return Boolean(r.displayName);
}
