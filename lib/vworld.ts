export function resolveVworldApiKey(): string | null {
  const sanitize = (value?: string): string | null => {
    if (!value) return null;
    const cleaned = value.trim().replace(/^["']|["']$/g, '').replace(/\s/g, '');
    if (!cleaned || cleaned === '여기에_V_WORLD_발급키_붙여넣기') return null;
    return cleaned;
  };

  return sanitize(process.env.VWORLD_API_KEY);
}

/** 브이월드 개발자센터에 등록한 서비스 URL (NED·검색 API domain 파라미터) */
export function getVworldRegisteredDomain(request?: Request): string | null {
  const explicit = process.env.VWORLD_REGISTERED_DOMAIN?.trim();
  if (explicit) return normalizeDomain(explicit);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return normalizeDomain(production);

  if (request) {
    const origin = getRequestOrigin(request);
    if (origin && !isLocalhostDomain(origin)) return origin;
  }

  return null;
}

/** NED·검색·2D데이터 API용 domain (localhost는 등록되지 않으면 제외) */
export function getVworldApiDomainCandidates(request: Request): string[] {
  const candidates: string[] = [];
  const add = (value: string | null | undefined) => {
    if (!value) return;
    const normalized = normalizeDomain(value);
    if (!candidates.includes(normalized)) candidates.push(normalized);
  };

  const requestOrigin = getRequestOrigin(request);
  if (requestOrigin && !isLocalhostDomain(requestOrigin)) {
    add(requestOrigin);
  }

  add(getVworldRegisteredDomain(request));

  if (process.env.VERCEL) {
    add(getVercelOrigin());
  } else {
    const configured = process.env.VWORLD_DOMAIN?.trim();
    if (configured && !isLocalhostDomain(configured)) {
      add(configured);
    }
    add(getVercelOrigin());
  }

  const withoutLocalhost = candidates.filter((d) => !isLocalhostDomain(d));
  if (withoutLocalhost.length) return withoutLocalhost;

  if (candidates.length) return candidates;
  return ['http://localhost:3000'];
}

export function vworldKeySetupHint(): string {
  if (process.env.VERCEL) {
    return (
      'Vercel → Settings → Environment Variables에 VWORLD_API_KEY를 추가하고 Redeploy 하세요.'
    );
  }
  return '.env.local에 VWORLD_API_KEY(브이월드 발급)를 설정하세요.';
}

function normalizeDomain(domain: string): string {
  const trimmed = domain.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isLocalhostDomain(domain: string): boolean {
  try {
    const host = new URL(normalizeDomain(domain)).hostname;
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
    return normalizeDomain(production);
  }

  const preview = process.env.VERCEL_URL?.trim();
  if (preview) {
    return normalizeDomain(preview);
  }

  return null;
}

/** @deprecated getVworldApiDomainCandidates 사용 */
export function getVworldDomainCandidates(request: Request): string[] {
  return getVworldApiDomainCandidates(request);
}

export function resolveVworldDomain(request: Request): string {
  return getVworldApiDomainCandidates(request)[0];
}

export async function vworldFetch(url: string, init?: RequestInit): Promise<Response> {
  const bases = [url];
  if (
    !process.env.VERCEL &&
    url.startsWith('https://api.vworld.kr')
  ) {
    bases.push(url.replace('https://api.vworld.kr', 'http://api.vworld.kr'));
  }

  const timeoutMs = process.env.VERCEL ? 6000 : 12000;

  let lastError: unknown;
  for (const targetUrl of bases) {
    try {
      return await fetch(targetUrl, {
        ...init,
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'BIGROOT/1.0',
          ...(init?.headers ?? {}),
        },
        signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
      });
    } catch (error: unknown) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    if (lastError.name === 'TimeoutError' || lastError.name === 'AbortError') {
      throw new Error('V-WORLD API 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
    }
    if (lastError.message === 'fetch failed') {
      throw new Error(
        'V-WORLD API 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      );
    }
  }
  throw lastError;
}

export async function parseVworldJson<T>(res: Response): Promise<T> {
  const text = (await res.text()).trim();
  if (!text) throw new Error('V-WORLD API가 빈 응답을 반환했습니다.');

  if (text.startsWith('<')) {
    const messageMatch =
      text.match(/<message>([^<]*)<\/message>/i) ??
      text.match(/<errmsg>([^<]*)<\/errmsg>/i) ??
      text.match(/<description>([^<]*)<\/description>/i);
    throw new Error(
      messageMatch?.[1]?.trim() ??
        'V-WORLD API가 XML 오류를 반환했습니다. 브이월드 개발자센터에 배포 URL이 등록됐는지 확인하세요.'
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

  if (text?.includes('인증키') || text?.includes('INCORRECT_KEY') || text?.includes('INVALID_KEY')) {
    return (
      `${text} — 브이월드 개발자센터 서비스 URL에 ${domainHint} 이 등록됐는지, ` +
      'Vercel의 VWORLD_API_KEY가 로컬과 동일한지 확인하세요.'
    );
  }
  if (text?.toLowerCase().includes('domain')) {
    return (
      `${text} — 브이월드 개발자센터 서비스 URL에 ${domainHint} 을 등록하세요.`
    );
  }
  return text ?? 'V-WORLD API 요청에 실패했습니다.';
}
