import {
  getVworldApiDomainCandidates,
  resolveVworldApiKey,
  vworldFetch,
} from '@/lib/vworld';

type NedHousingRecord = Record<string, string>;

type NedRoot = {
  resultCode?: string;
  resultMsg?: string;
  totalCount?: string | number;
  field?: NedHousingRecord | NedHousingRecord[];
};

function normalizeNedField(root: NedRoot): NedHousingRecord[] {
  if (!root?.field) return [];
  return Array.isArray(root.field) ? root.field : [root.field];
}

function extractNedRoot(json: Record<string, unknown>, key: string): NedRoot | null {
  const direct = json[key];
  if (direct && typeof direct === 'object') return direct as NedRoot;

  const response = json.response;
  if (response && typeof response === 'object') {
    const nested = (response as Record<string, unknown>)[key];
    if (nested && typeof nested === 'object') return nested as NedRoot;
    return response as NedRoot;
  }

  return null;
}

function isAuthOrDomainError(code?: string, message?: string): boolean {
  if (code === 'INCORRECT_KEY' || code === 'INVALID_KEY') return true;
  const msg = message?.toLowerCase() ?? '';
  return msg.includes('인증키') || msg.includes('domain') || msg.includes('도메인');
}

async function fetchNedPage(
  endpoint: string,
  responseKey: string,
  pnu: string,
  stdrYear: number,
  pageNo: number,
  domain: string
): Promise<{ records: NedHousingRecord[]; authError: boolean }> {
  const apiKey = resolveVworldApiKey();
  if (!apiKey) return { records: [], authError: true };

  const params = new URLSearchParams({
    key: apiKey,
    domain,
    pnu,
    format: 'json',
    stdrYear: String(stdrYear),
    numOfRows: '1000',
    pageNo: String(pageNo),
  });

  const url = `https://api.vworld.kr/ned/data/${endpoint}?${params}`;
  const res = await vworldFetch(url);
  const text = (await res.text()).trim();

  if (text.includes('INCORRECT_KEY') || text.includes('인증키 정보')) {
    return { records: [], authError: true };
  }
  if (!text.startsWith('{')) {
    throw new Error('V-WORLD NED API 응답 형식 오류');
  }

  const json = JSON.parse(text) as Record<string, unknown>;
  const root = extractNedRoot(json, responseKey);
  if (!root) return { records: [], authError: false };

  if (root.resultCode && root.resultCode !== '00') {
    if (root.resultCode === '03') return { records: [], authError: false };
    if (isAuthOrDomainError(root.resultCode, root.resultMsg)) {
      return { records: [], authError: true };
    }
    throw new Error(root.resultMsg ?? 'V-WORLD 공시가격 조회 실패');
  }

  return { records: normalizeNedField(root), authError: false };
}

async function fetchNedAllPages(
  endpoint: string,
  responseKey: string,
  pnu: string,
  stdrYear: number,
  domain: string
): Promise<{ records: NedHousingRecord[]; authError: boolean }> {
  const all: NedHousingRecord[] = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await fetchNedPage(endpoint, responseKey, pnu, stdrYear, page, domain);
    if (batch.authError) return batch;
    if (!batch.records.length) break;
    all.push(...batch.records);
    if (batch.records.length < 1000) break;
  }
  return { records: all, authError: false };
}

async function fetchNedHousingByEndpoint(
  request: Request,
  pnu: string,
  endpoint: string,
  responseKey: string
): Promise<{ records: NedHousingRecord[]; authFailed: boolean }> {
  const domains = getVworldApiDomainCandidates(request);
  const year = new Date().getFullYear();
  const years = [year, year - 1, year - 2];
  let authFailed = false;

  for (const stdrYear of years) {
    for (const domain of domains) {
      try {
        const result = await fetchNedAllPages(endpoint, responseKey, pnu, stdrYear, domain);
        if (result.authError) {
          authFailed = true;
          continue;
        }
        if (result.records.length) return { records: result.records, authFailed: false };
      } catch {
        /* try next domain/year */
      }
    }
  }

  return { records: [], authFailed };
}

export async function fetchVworldApartHousingPrices(
  request: Request,
  pnu: string
): Promise<NedHousingRecord[]> {
  const { records } = await fetchNedHousingByEndpoint(
    request,
    pnu,
    'getApartHousingPriceAttr',
    'apartHousingPrices'
  );
  return records;
}

export async function fetchVworldIndvdHousingPrices(
  request: Request,
  pnu: string
): Promise<NedHousingRecord[]> {
  const { records } = await fetchNedHousingByEndpoint(
    request,
    pnu,
    'getIndvdHousingPriceAttr',
    'indvdHousingPrices'
  );
  return records;
}

export async function fetchVworldHousingWithMeta(
  request: Request,
  pnu: string
): Promise<{ records: NedHousingRecord[]; authFailed: boolean }> {
  const apart = await fetchNedHousingByEndpoint(
    request,
    pnu,
    'getApartHousingPriceAttr',
    'apartHousingPrices'
  );
  if (apart.records.length) return apart;

  const indvd = await fetchNedHousingByEndpoint(
    request,
    pnu,
    'getIndvdHousingPriceAttr',
    'indvdHousingPrices'
  );
  return {
    records: indvd.records,
    authFailed: apart.authFailed && indvd.authFailed,
  };
}

export function mapVworldHousingRecord(record: NedHousingRecord) {
  const dong =
    record.dongNm?.trim() ||
    (record.floorNm ? `${record.floorNm}층` : '본동');
  const ho = record.hoNm?.trim() || '호명없음';
  const rawPrice = Number(
    record.pblntfPc ?? record.pblntfPclnd ?? record.housePc ?? 0
  );

  return {
    dong,
    ho,
    area: record.prvuseAr ?? record.houseAr ?? '',
    price: rawPrice > 0 ? Math.round(rawPrice) : 0,
    buildingName: record.aphusNm?.trim() ?? record.bldgNm?.trim() ?? '',
  };
}
