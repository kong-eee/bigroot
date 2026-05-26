import { NextResponse } from 'next/server';
import { STATIC_SIDO_LIST } from '@/lib/korea-sido';
import {
  extractVworldError,
  getVworldDomainCandidates,
  parseVworldJson,
  resolveVworldApiKey,
  vworldKeySetupHint,
  vworldFetch,
} from '@/lib/vworld';

type RegionType = 'sido' | 'sigungu' | 'dong';

type RegionItem = { code: string; name: string };

/** V-WORLD attrFilter 허용 속성명 (데이터셋별로 다름) */
const REGION_CONFIG: Record<
  Exclude<RegionType, 'sido'>,
  {
    data: string;
    codeKey: string;
    nameKey: string;
    filterAttr: string;
  }
> = {
  sigungu: {
    data: 'LT_C_ADSIGG_INFO',
    codeKey: 'sig_cd',
    nameKey: 'sig_kor_nm',
    // 시도코드(11)는 sig_cd 앞자리와 같음 → sig_cd:like:11
    filterAttr: 'sig_cd',
  },
  dong: {
    data: 'LT_C_ADEMD_INFO',
    codeKey: 'emd_cd',
    nameKey: 'emd_kor_nm',
    // 시군구코드(11710)는 emd_cd 앞자리와 같음 → emd_cd:like:11710
    filterAttr: 'emd_cd',
  },
};

async function fetchRegionsFromVworld(
  request: Request,
  type: Exclude<RegionType, 'sido'>,
  parentCode: string
): Promise<RegionItem[]> {
  const apiKey = resolveVworldApiKey();
  if (!apiKey) {
    throw new Error(`V-WORLD API 키가 없습니다. ${vworldKeySetupHint()}`);
  }

  const config = REGION_CONFIG[type];
  const domainCandidates = getVworldDomainCandidates(request);
  let lastError: Error | null = null;

  for (const domain of domainCandidates) {
    try {
      const params = new URLSearchParams({
        key: apiKey,
        service: 'data',
        request: 'GetFeature',
        version: '2.0',
        data: config.data,
        domain,
        format: 'json',
        geometry: 'false',
        attribute: 'true',
        size: '1000',
        page: '1',
        attrFilter: `${config.filterAttr}:like:${parentCode}`,
      });

      const url = `https://api.vworld.kr/req/data?${params.toString()}`;
      const res = await vworldFetch(url, {
        headers: { Accept: 'application/json' },
      });

      const json = await parseVworldJson<{
        response?: {
          status?: string;
          error?: { text?: string; message?: string };
          result?: {
            featureCollection?: {
              features?: Array<{ properties?: Record<string, string> }>;
            };
          };
        };
      }>(res);

      const apiError = extractVworldError(json, request);
      if (apiError) {
        lastError = new Error(`${apiError} (domain: ${domain})`);
        continue;
      }

      const features = json.response?.result?.featureCollection?.features ?? [];
      const items: RegionItem[] = features
        .map((f) => ({
          code: f.properties?.[config.codeKey] ?? '',
          name: f.properties?.[config.nameKey] ?? '',
        }))
        .filter((item) => item.code && item.name);

      if (items.length) {
        return items.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      }
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error('V-WORLD API 호출 실패');
    }
  }

  throw lastError ?? new Error('행정구역 데이터를 불러오지 못했습니다.');
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as RegionType | null;
  const parent = searchParams.get('parent') ?? undefined;

  if (!type || !['sido', 'sigungu', 'dong'].includes(type)) {
    return NextResponse.json(
      { success: false, error: 'type 파라미터(sido|sigungu|dong)가 필요합니다.' },
      { status: 400 }
    );
  }

  if (type === 'sido') {
    return NextResponse.json({
      success: true,
      regions: [...STATIC_SIDO_LIST],
    });
  }

  if (!parent) {
    return NextResponse.json(
      { success: false, error: '시군구·동 조회 시 parent 코드가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    const regions = await fetchRegionsFromVworld(request, type, parent);
    return NextResponse.json({ success: true, regions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
