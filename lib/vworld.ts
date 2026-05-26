export function resolveVworldApiKey(): string | null {
  const key = process.env.VWORLD_API_KEY?.trim();
  if (key && key !== '여기에_V_WORLD_발급키_붙여넣기') return key;

  const legacy = process.env.NEXT_PUBLIC_DATA_GO_KR_KEY?.trim();
  if (legacy && legacy !== '여기에_V_WORLD_발급키_붙여넣기') return legacy;

  return null;
}

export function vworldKeySetupHint(): string {
  if (process.env.VERCEL) {
    return (
      'Vercel 대시보드 → Project → Settings → Environment Variables에 ' +
      'VWORLD_API_KEY를 Production·Preview·Development 모두 추가한 뒤 재배포하세요.'
    );
  }
  return '.env.local에 VWORLD_API_KEY(브이월드 발급)를 설정하세요.';
}

function normalizeDomain(domain: string): string {
  return domain.replace(/\/+$/, '');
}

function isLocalhostDomain(domain: string): boolean {
  try {
    const host = new URL(domain).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return domain.includes('localhost') || domain.startsWith('127.');
  }
}

function getRequestOrigin(request: Request): string | null {
  try {
    const { origin } = new URL(request.url);
    if (origin && origin !== 'null') return normalizeDomain(origin);
  } catch {
    /* ignore */
  }

  const origin = request.headers.get('origin');
  if (origin) return normalizeDomain(origin);

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return normalizeDomain(new URL(referer).origin);
    } catch {
      /* ignore */
    }
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (host) {
    const proto =
      request.headers.get('x-forwarded-proto') ??
      (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
    return normalizeDomain(`${proto}://${host}`);
  }

  return null;
}

function getVercelOrigin(): string | null {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const host = production.replace(/^https?:\/\//, '');
    return normalizeDomain(`https://${host}`);
  }

  const preview = process.env.VERCEL_URL?.trim();
  if (preview) {
    const host = preview.replace(/^https?:\/\//, '');
    return normalizeDomain(`https://${host}`);
  }

  return null;
}

/**
 * V-WORLD domain 파라미터 — 요청 출처 기준 자동 결정.
 * VWORLD_DOMAIN이 localhost인데 Vercel에서 실행 중이면 요청 origin을 사용합니다.
 */
export function resolveVworldDomain(request: Request): string {
  const requestOrigin = getRequestOrigin(request);
  const configured = process.env.VWORLD_DOMAIN?.trim();

  if (configured) {
    const normalized = normalizeDomain(configured);
    const onVercel = Boolean(process.env.VERCEL);
    if (onVercel && isLocalhostDomain(normalized) && requestOrigin) {
      return requestOrigin;
    }
    if (!onVercel || !isLocalhostDomain(normalized)) {
      return normalized;
    }
  }

  if (requestOrigin) return requestOrigin;

  const vercelOrigin = getVercelOrigin();
  if (vercelOrigin) return vercelOrigin;

  return 'http://localhost:3000';
}

export async function parseVworldJson<T>(res: Response): Promise<T> {
  const text = (await res.text()).trim();
  if (!text) throw new Error('V-WORLD API가 빈 응답을 반환했습니다.');

  if (text.startsWith('<')) {
    const messageMatch =
      text.match(/<message>([^<]*)<\/message>/i) ??
      text.match(/<errmsg>([^<]*)<\/errmsg>/i);
    throw new Error(
      messageMatch?.[1]?.trim() ??
        'V-WORLD API가 XML 오류를 반환했습니다. domain·format=json을 확인하세요.'
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('V-WORLD API 응답을 JSON으로 파싱할 수 없습니다.');
  }
}

export function extractVworldError(
  json: {
    response?: { status?: string; error?: { text?: string; message?: string; code?: string } };
  },
  request?: Request
): string | null {
  const status = json.response?.status;
  if (!status || status === 'OK') return null;

  const text = json.response?.error?.text ?? json.response?.error?.message;
  const domainHint = request
    ? resolveVworldDomain(request)
    : process.env.VWORLD_DOMAIN ?? 'http://localhost:3000';

  if (text?.includes('인증키')) {
    return (
      `${text} — 브이월드 개발자센터에 등록한 URL과 일치하는지 확인하세요. ` +
      `(현재 domain: ${domainHint})`
    );
  }
  if (text?.toLowerCase().includes('domain')) {
    return (
      `${text} — 브이월드 개발자센터 서비스 URL에 ` +
      `${domainHint} (및 로컬용 http://localhost:3000)을 등록하세요.`
    );
  }
  return text ?? 'V-WORLD API 요청에 실패했습니다.';
}
