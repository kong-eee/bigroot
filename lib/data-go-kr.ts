export function resolveDataGoKrKey(): string | null {
  const key =
    process.env.DATA_GO_KR_SERVICE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_DATA_GO_KR_KEY?.trim();
  if (!key || key === '여기에_V_WORLD_발급키_붙여넣기') return null;
  return key;
}

/** 공공데이터포털 인증키 — Decoding/Encoding 키 모두 URL에 1회만 인코딩 */
export function buildDataGoKrServiceKeyQuery(serviceKey: string): string {
  const decoded = serviceKey.includes('%') ? decodeURIComponent(serviceKey) : serviceKey;
  return `serviceKey=${encodeURIComponent(decoded)}`;
}

type HousingRecord = Record<string, unknown>;

function normalizeField(data: unknown): HousingRecord[] {
  if (!data || typeof data !== 'object') return [];
  const field = (data as { field?: unknown }).field;
  if (Array.isArray(field)) return field as HousingRecord[];
  if (field && typeof field === 'object') return [field as HousingRecord];
  return [];
}

async function fetchNsdiPage(
  path: string,
  serviceKey: string,
  pnu: string,
  stdrYear: number,
  pageNo: number
): Promise<HousingRecord[]> {
  const params = new URLSearchParams({
    serviceKey,
    pnu,
    stdrYear: String(stdrYear),
    format: 'json',
    numOfRows: '1000',
    pageNo: String(pageNo),
  });

  const url = `https://apis.data.go.kr/1611000/nsdi/${path}?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  if (!text.trim().startsWith('{')) {
    throw new Error(
      '공공데이터포털 API 응답 오류입니다. DATA_GO_KR_SERVICE_KEY(공동주택가격정보 활용신청)를 확인하세요.'
    );
  }

  const json = JSON.parse(text) as Record<string, unknown>;
  const response = json.response as
    | { body?: unknown; header?: { resultCode?: string; resultMsg?: string } }
    | undefined;
  const root =
    json.apartHousingPrices ??
    json.indvdHousingPrices ??
    response?.body ??
    json;

  if (typeof root !== 'object' || root === null) return [];

  const resultCode =
    (root as { resultCode?: string }).resultCode ??
    (json.response as { header?: { resultCode?: string } })?.header?.resultCode;
  if (resultCode && resultCode !== '00') {
    const msg =
      (root as { resultMsg?: string }).resultMsg ??
      (json.response as { header?: { resultMsg?: string } })?.header?.resultMsg;
    throw new Error(msg ?? '공공데이터포털 API 호출에 실패했습니다.');
  }

  return normalizeField(root);
}

async function fetchNsdiAll(
  path: string,
  serviceKey: string,
  pnu: string,
  stdrYear: number
): Promise<HousingRecord[]> {
  const all: HousingRecord[] = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await fetchNsdiPage(path, serviceKey, pnu, stdrYear, page);
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 1000) break;
  }
  return all;
}

export async function fetchHousingPriceRecords(
  pnu: string
): Promise<{ records: HousingRecord[]; source: 'apartment' | 'individual' } | null> {
  const serviceKey = resolveDataGoKrKey();
  if (!serviceKey) return null;

  const year = new Date().getFullYear();
  const years = [year, year - 1, year - 2];

  for (const stdrYear of years) {
    const apart = await fetchNsdiAll(
      'ApartHousingPriceService/attr/getApartHousingPriceAttr',
      serviceKey,
      pnu,
      stdrYear
    );
    if (apart.length) return { records: apart, source: 'apartment' };
  }

  for (const stdrYear of years) {
    const indvd = await fetchNsdiAll(
      'IndvdHousingPriceService/attr/getIndvdHousingPriceAttr',
      serviceKey,
      pnu,
      stdrYear
    );
    if (indvd.length) return { records: indvd, source: 'individual' };
  }

  return null;
}

export function mapHousingRecord(record: HousingRecord) {
  const dong = String(
    record.dongNm ?? record.dong_nm ?? record.dongName ?? record.dong ?? '동명없음'
  );
  const ho = String(record.hoNm ?? record.ho_nm ?? record.hoName ?? record.ho ?? '본건');

  const rawPrice = Number(
    record.pblntfPclnd ??
      record.pblntf_pclnd ??
      record.housePc ??
      record.house_pc ??
      record.indvdHousingPrice ??
      record.indvd_housing_price ??
      0
  );

  const areaRaw =
    record.prvuseAr ??
    record.prvuse_ar ??
    record.houseAr ??
    record.house_ar ??
    record.totar;

  let area: string | number = '';
  if (areaRaw != null && areaRaw !== '') {
    area = typeof areaRaw === 'number' ? areaRaw : String(areaRaw);
  }

  return {
    dong,
    ho,
    area,
    price: rawPrice > 0 ? Math.round(rawPrice) : 0,
    buildingName: String(record.aphusNm ?? record.aphus_nm ?? record.buldNm ?? ''),
  };
}
