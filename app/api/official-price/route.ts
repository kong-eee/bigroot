import { NextResponse } from 'next/server';
import {
  fetchHousingPriceRecords,
  mapHousingRecord,
  resolveDataGoKrKey,
} from '@/lib/data-go-kr';
import {
  getVworldApiDomainCandidates,
  parseVworldJson,
  resolveVworldApiKey,
  vworldKeySetupHint,
  vworldFetch,
} from '@/lib/vworld';
import {
  fetchVworldApartHousingPrices,
  fetchVworldIndvdHousingPrices,
  mapVworldHousingRecord,
} from '@/lib/vworld-housing';
import { buildPnu } from '@/lib/pnu';

type VworldSearchItem = {
  address?: { pnu?: string; bldnm?: string };
  id?: string;
};

type VworldRoom = {
  id: string;
  dong: string;
  ho: string;
  area: number | string;
  price: number;
};

function extractPnu(item: VworldSearchItem): string | null {
  const fromAddress = item.address?.pnu;
  if (fromAddress && /^\d{19}$/.test(fromAddress)) return fromAddress;

  const fromId = item.id;
  if (fromId && /^\d{19}$/.test(fromId)) return fromId;

  return null;
}

function parseSearchItems(data: {
  reply?: { status?: string; record?: { items?: VworldSearchItem[] } };
  response?: { status?: string; result?: { items?: VworldSearchItem[] } };
}): VworldSearchItem[] | undefined {
  if (data.reply?.status === 'OK') return data.reply.record?.items;
  if (data.response?.status === 'OK') return data.response.result?.items;
  return undefined;
}

async function searchAddressPnu(
  apiKey: string,
  queryAddress: string,
  domains: string[]
): Promise<{ item: VworldSearchItem; pnu: string } | null> {
  const domainList = process.env.VERCEL ? domains : domains;
  const categories = ['parcel', 'road'] as const;

  for (const domain of domainList) {
    for (const category of categories) {
      const params = new URLSearchParams({
        key: apiKey,
        domain,
        service: 'search',
        request: 'search',
        version: '2.0',
        query: queryAddress,
        type: 'address',
        category,
        format: 'json',
        size: '10',
        page: '1',
      });

      try {
        const res = await vworldFetch(`https://api.vworld.kr/req/search?${params}`);
        const data = await parseVworldJson<Parameters<typeof parseSearchItems>[0]>(res);
        const item = parseSearchItems(data)?.[0];
        const pnu = item ? extractPnu(item) : null;
        if (item && pnu) return { item, pnu };
      } catch {
        /* try next domain/category */
      }
    }
  }
  return null;
}

async function fetchCadastralFallback(
  apiKey: string,
  domain: string,
  pnu: string
): Promise<VworldRoom | null> {
  const params = new URLSearchParams({
    key: apiKey,
    service: 'data',
    request: 'GetFeature',
    version: '2.0',
    data: 'LP_PA_CBND_BUBUN',
    domain,
    format: 'json',
    geometry: 'false',
    attribute: 'true',
    size: '1',
    page: '1',
    attrFilter: `pnu:=:${pnu}`,
  });

  const res = await vworldFetch(`https://api.vworld.kr/req/data?${params}`);
  const json = await parseVworldJson<{
    response?: {
      result?: {
        featureCollection?: {
          features?: Array<{ properties?: Record<string, unknown> }>;
        };
      };
    };
  }>(res);

  const props = json.response?.result?.featureCollection?.features?.[0]?.properties;
  const jiga = Number(props?.jiga ?? 0);
  if (!jiga) return null;

  return {
    id: 'land_jiga',
    dong: '본건',
    ho: props?.jibun ? String(props.jibun) : '필지',
    area: '-',
    price: Math.round(jiga),
  };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const dongCode = searchParams.get('dongCode');
  const jibun = searchParams.get('jibun') ?? searchParams.get('detail');

  if (!address && !(dongCode && jibun)) {
    return NextResponse.json(
      {
        success: false,
        error: '주소(address) 또는 dongCode+jibun 파라미터가 필요합니다.',
      },
      { status: 400 }
    );
  }

  try {
    const vworldKey = resolveVworldApiKey();
    if (!vworldKey) {
      return NextResponse.json(
        {
          success: false,
          error: `V-WORLD API 키가 없습니다. ${vworldKeySetupHint()}`,
        },
        { status: 500 }
      );
    }

    const domains = getVworldApiDomainCandidates(request);
    const queryAddress = address?.trim() ?? '';

    let item: VworldSearchItem | null = null;
    let pnu: string | null = null;

    if (queryAddress) {
      const found = await searchAddressPnu(vworldKey, queryAddress, domains);
      if (found) {
        item = found.item;
        pnu = found.pnu;
      }
    }

    if (!pnu && dongCode && jibun) {
      pnu = buildPnu(dongCode, jibun);
      if (pnu && !item) item = { address: { pnu } };
    }

    if (!pnu) {
      return NextResponse.json(
        {
          success: false,
          error:
            '번지 형식을 확인해 주세요. 예: 143 또는 143-12 (산번지는 산123-4)',
        },
        { status: 400 }
      );
    }
    let buildingName = item?.address?.bldnm || '';

    const collectRooms = async (targetPnu: string): Promise<VworldRoom[]> => {
      const rooms: VworldRoom[] = [];
      const seenIds = new Set<string>();

      const addRoom = (mapped: {
        dong: string;
        ho: string;
        area: string | number;
        price: number;
        buildingName?: string;
      }) => {
        if (!buildingName && mapped.buildingName) buildingName = mapped.buildingName;
        const uniqueId = `${mapped.dong}_${mapped.ho}`;
        if (!seenIds.has(uniqueId) && mapped.price > 0) {
          seenIds.add(uniqueId);
          rooms.push({
            id: uniqueId,
            dong: mapped.dong,
            ho: mapped.ho,
            area: mapped.area,
            price: mapped.price,
          });
        }
      };

      const vworldRooms = await fetchVworldApartHousingPrices(request, targetPnu);
      for (const record of vworldRooms) {
        addRoom(mapVworldHousingRecord(record));
      }

      if (!rooms.length) {
        const indvdRooms = await fetchVworldIndvdHousingPrices(request, targetPnu);
        for (const record of indvdRooms) {
          addRoom(mapVworldHousingRecord(record));
        }
      }

      if (!rooms.length && resolveDataGoKrKey()) {
        const housing = await fetchHousingPriceRecords(targetPnu);
        if (housing?.records.length) {
          for (const record of housing.records) {
            addRoom(mapHousingRecord(record));
          }
        }
      }

      if (!rooms.length) {
        const domainList = process.env.VERCEL ? domains.slice(0, 1) : domains;
        for (const domain of domainList) {
          try {
            const fallback = await fetchCadastralFallback(vworldKey, domain, targetPnu);
            if (fallback) {
              rooms.push(fallback);
              break;
            }
          } catch {
            /* try next domain */
          }
        }
      }

      return rooms;
    };

    let uniqueRooms = await collectRooms(pnu);

    if (!uniqueRooms.length && dongCode && jibun) {
      const builtPnu = buildPnu(dongCode, jibun);
      if (builtPnu && builtPnu !== pnu) {
        pnu = builtPnu;
        uniqueRooms = await collectRooms(pnu);
      }
    }

    if (!uniqueRooms.length) {
      if (!buildingName && item?.address?.pnu) {
        buildingName = String(item.address.pnu);
      }
      return NextResponse.json(
        {
          success: false,
          error:
            '이 주소는 호실별 공동주택 공시가격이 없습니다. (빌라·단독주택은 공공데이터에 호실 단위 가격이 없을 수 있습니다.) 하단에서 공시가격을 직접 입력해 주세요.',
        },
        { status: 404 }
      );
    }

    uniqueRooms.sort((a, b) =>
      a.ho.localeCompare(b.ho, undefined, { numeric: true })
    );

    return NextResponse.json({
      success: true,
      buildingName: buildingName || '(건물명 없음)',
      rooms: uniqueRooms,
      notice:
        uniqueRooms.length === 1 && uniqueRooms[0].id === 'land_jiga'
          ? '호실별 공시가격 대신 필지 공시지가(참고값)를 표시했습니다.'
          : undefined,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 서버 오류';
    return NextResponse.json(
      { success: false, error: `서버 통신 실패: ${message}` },
      { status: 500 }
    );
  }
}
