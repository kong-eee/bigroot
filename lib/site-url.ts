/** 배포 도메인 (예: https://bigroot.co.kr). OAuth·콜백·알림 링크에 사용 */
export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (configured) {
    try {
      return new URL(configured.startsWith('http') ? configured : `https://${configured}`).origin;
    } catch {
      /* fall through */
    }
  }
  return '';
}

/** 브라우저: canonical origin 우선, 없으면 현재 origin */
export function getClientSiteOrigin(): string {
  const configured = getSiteOrigin();
  if (configured) return configured;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function getAuthCallbackUrl(): string {
  const base = getClientSiteOrigin();
  return `${base}/auth/callback`;
}

/** middleware·callback: 요청 host가 vercel 기본 도메인이면 canonical로 교체 */
export function resolveRedirectOrigin(requestUrl: string): string {
  const canonical = getSiteOrigin();
  if (!canonical) return new URL(requestUrl).origin;

  try {
    const req = new URL(requestUrl);
    const canonicalHost = new URL(canonical).host;
    if (req.host !== canonicalHost && req.host.endsWith('.vercel.app')) {
      return canonical;
    }
    return req.origin;
  } catch {
    return canonical;
  }
}
