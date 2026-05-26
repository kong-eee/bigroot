import { NextResponse } from 'next/server';
import {
  fetchHousingPriceRecords,
  mapHousingRecord,
  resolveDataGoKrKey,
} from '@/lib/data-go-kr';
import {
  parseVworldJson,
  resolveVworldApiKey,
  resolveVworldDomain,
  vworldKeySetupHint,
  vworldFetch,
} from '@/lib/vworld';
import {
  fetchVworldApartHousingPrices,
  mapVworldHousingRecord,
} from '@/lib/vworld-housing';

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
  queryAddress: string
): Promise<{ item: VworldSearchItem; pnu: string } | null> {
  for (const category of ['parcel', 'road'] as const) {
    const params = new URLSearchParams({
      key: apiKey,
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

    const res = await vworldFetch(`https://api.vworld.kr/req/search?${params}`);
    const data = await parseVworldJson<Parameters<typeof parseSearchItems>[0]>(res);
    const item = parseSearchItems(data)?.[0];
    const pnu = item ? extractPnu(item) : null;
    if (item && pnu) return { item, pnu };
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { success: false, error: '주소가 누락되었습니다.' },
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

    const domain = resolveVworldDomain(request);
    const queryAddress = address.trim();

    const found = await searchAddressPnu(vworldKey, queryAddress);
    if (!found) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 주소의 필지번호(PNU)를 찾지 못했습니다. 번지를 다시 확인해 주세요.',
        },
        { status: 404 }
      );
    }

    const { item, pnu } = found;
    let buildingName = item.address?.bldnm || '';

    const uniqueRooms: VworldRoom[] = [];
    const seen = new Set<string>();

    const addRoom = (mapped: {
      dong: string;
      ho: string;
      area: string | number;
      price: number;
      buildingName?: string;
    }) => {
      if (!buildingName && mapped.buildingName) buildingName = mapped.buildingName;
      const uniqueId = `${mapped.dong}_${mapped.ho}`;
      if (!seen.has(uniqueId) && mapped.price > 0) {
        seen.add(uniqueId);
        uniqueRooms.push({
          id: uniqueId,
          dong: mapped.dong,
          ho: mapped.ho,
          area: mapped.area,
          price: mapped.price,
        });
      }
    };

    // 1) V-WORLD NED 공동주택 공시가격 (기존 VWORLD_API_KEY로 호실 조회 가능)
    const vworldRooms = await fetchVworldApartHousingPrices(request, pnu);
    for (const record of vworldRooms) {
      addRoom(mapVworldHousingRecord(record));
    }

    // 2) 공공데이터포털 키가 있으면 보조 조회
    if (!uniqueRooms.length && resolveDataGoKrKey()) {
      const housing = await fetchHousingPriceRecords(pnu);
      if (housing?.records.length) {
        for (const record of housing.records) {
          addRoom(mapHousingRecord(record));
        }
      }
    }

    // 3) 호실 데이터 없을 때만 필지 공시지가 참고값
    if (!uniqueRooms.length) {
      const fallback = await fetchCadastralFallback(vworldKey, domain, pnu);
      if (fallback) {
        uniqueRooms.push(fallback);
        if (!buildingName) buildingName = String(item.address?.bldnm || item.address?.pnu || '해당 필지');
      }
    }

    if (!uniqueRooms.length) {
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
