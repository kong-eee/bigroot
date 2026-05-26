import { parseVworldJson, resolveVworldApiKey, resolveVworldDomain, vworldFetch } from '@/lib/vworld';

type NedHousingRecord = Record<string, string>;

function normalizeNedField(data: {
  field?: NedHousingRecord | NedHousingRecord[];
  totalCount?: string | number;
}): NedHousingRecord[] {
  if (!data?.field) return [];
  return Array.isArray(data.field) ? data.field : [data.field];
}

async function fetchNedApartPage(
  request: Request,
  pnu: string,
  stdrYear: number,
  pageNo: number
): Promise<NedHousingRecord[]> {
  const apiKey = resolveVworldApiKey();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    key: apiKey,
    domain: resolveVworldDomain(request),
    pnu,
    format: 'json',
    stdrYear: String(stdrYear),
    numOfRows: '1000',
    pageNo: String(pageNo),
  });

  const url = `https://api.vworld.kr/ned/data/getApartHousingPriceAttr?${params}`;
  const res = await vworldFetch(url);
  const json = await parseVworldJson<{
    apartHousingPrices?: {
      resultCode?: string;
      resultMsg?: string;
      totalCount?: string | number;
      field?: NedHousingRecord | NedHousingRecord[];
    };
  }>(res);

  const root = json.apartHousingPrices;
  if (!root) return [];

  if (root.resultCode && root.resultCode !== '00') {
    if (root.resultCode === '03') return []; // no data
    throw new Error(root.resultMsg ?? 'V-WORLD 공동주택 공시가격 조회 실패');
  }

  return normalizeNedField(root);
}

export async function fetchVworldApartHousingPrices(
  request: Request,
  pnu: string
): Promise<NedHousingRecord[]> {
  const year = new Date().getFullYear();
  const years = [year, year - 1, year - 2];

  for (const stdrYear of years) {
    const all: NedHousingRecord[] = [];
    for (let page = 1; page <= 10; page++) {
      const batch = await fetchNedApartPage(request, pnu, stdrYear, page);
      if (!batch.length) break;
      all.push(...batch);
      if (batch.length < 1000) break;
    }
    if (all.length) return all;
  }

  return [];
}

export function mapVworldHousingRecord(record: NedHousingRecord) {
  const dong =
    record.dongNm?.trim() ||
    (record.floorNm ? `${record.floorNm}층` : '본동');
  const ho = record.hoNm?.trim() || '호명없음';
  const rawPrice = Number(record.pblntfPc ?? record.pblntfPclnd ?? 0);

  return {
    dong,
    ho,
    area: record.prvuseAr ?? '',
    price: rawPrice > 0 ? Math.round(rawPrice) : 0,
    buildingName: record.aphusNm?.trim() ?? '',
  };
}
