const REGION_KEY = 'bigroot-policy-feed-sido';

export function getSavedPolicyRegion(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REGION_KEY);
}

export function savePolicyRegion(sidoCode: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REGION_KEY, sidoCode);
}
