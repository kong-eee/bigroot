export function resolveVworldApiKey(): string | null {
  const key = process.env.VWORLD_API_KEY?.trim();
  if (key && key !== '여기에_V_WORLD_발급키_붙여넣기') return key;

  // 공공데이터포털 키는 V-WORLD 2D데이터 API와 호환되지 않음
  const legacy = process.env.NEXT_PUBLIC_DATA_GO_KR_KEY?.trim();
  if (legacy && legacy !== '여기에_V_WORLD_발급키_붙여넣기') return legacy;

  return null;
}

function normalizeDomain(domain: string): string {
  return domain.replace(/\/+$/, '');
}

export function resolveVworldDomain(request: Request): string {
  const configured = process.env.VWORLD_DOMAIN?.trim();
  if (configured) return normalizeDomain(configured);

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

export function extractVworldError(json: {
  response?: { status?: string; error?: { text?: string; message?: string; code?: string } };
}): string | null {
  const status = json.response?.status;
  if (!status || status === 'OK') return null;

  const text = json.response?.error?.text ?? json.response?.error?.message;
  if (text?.includes('인증키')) {
    return (
      `${text} — 브이월드(vworld.kr)에서 발급한 2D데이터 API 키인지, ` +
      `개발자센터에 등록한 URL(${process.env.VWORLD_DOMAIN ?? 'http://localhost:3000'})과 ` +
      'VWORLD_DOMAIN이 일치하는지 확인하세요.'
    );
  }
  return text ?? 'V-WORLD API 요청에 실패했습니다.';
}
