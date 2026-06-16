import type { GoldenPropertyType } from '@/lib/golden-time-schedule';

export const INTEREST_OPTIONS: GoldenPropertyType[] = ['주택', '상가'];

export function parseInterestTypes(raw: unknown): GoldenPropertyType[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is GoldenPropertyType => v === '주택' || v === '상가');
}

export function hasInterests(raw: unknown): boolean {
  return parseInterestTypes(raw).length > 0;
}

export function formatInterestsLabel(types: GoldenPropertyType[]): string {
  if (types.length === 0) return '미설정';
  return types.join(' · ');
}

export function toggleInterest(
  current: GoldenPropertyType[],
  type: GoldenPropertyType
): GoldenPropertyType[] {
  return current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
}

export function formatAuthDisplayName(
  nickname: string,
  interests: GoldenPropertyType[]
): string {
  const nick = nickname.trim();
  const interestLabel = formatInterestsLabel(interests);
  if (!nick && interests.length === 0) return '';
  if (!nick) return `[관심: ${interestLabel}]`;
  if (interests.length === 0) return nick;
  return `${nick} · ${interestLabel}`;
}

export function isProfileOnboardingComplete(profile: {
  nickname?: string | null;
  gender?: string | null;
  interest_types?: unknown;
} | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.nickname?.trim() && profile.gender && hasInterests(profile.interest_types)
  );
}
