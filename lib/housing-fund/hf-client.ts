import { buildDataGoKrServiceKeyQuery, resolveDataGoKrKey } from '@/lib/data-go-kr';
import {
  formatApplyDate,
  parseDataGoKrResponse,
  pickField,
  rateRowsFromObject,
} from './parse';
import type { LoanRateCategory, LoanRateItem } from './types';

const HF_BASE = 'http://apis.data.go.kr/B551408';

export function isHfApiConfigured(): boolean {
  return resolveDataGoKrKey() != null;
}

async function fetchHfPage(
  path: string,
  pageNo: number,
  numOfRows: number
): Promise<{ items: Record<string, unknown>[]; totalCount: number }> {
  const serviceKey = resolveDataGoKrKey();
  if (!serviceKey) {
    throw new Error('DATA_GO_KR_SERVICE_KEY가 설정되지 않았습니다.');
  }

  const params = new URLSearchParams({
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    dataType: 'json',
  });

  const url = `${HF_BASE}${path}?${buildDataGoKrServiceKeyQuery(serviceKey)}&${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  if (!text.trim().startsWith('{')) {
    throw new Error('HF API 응답 형식 오류입니다. 공공데이터포털 활용신청·인증키를 확인하세요.');
  }

  const json = JSON.parse(text) as Record<string, unknown>;
  return parseDataGoKrResponse(json);
}

async function fetchHfAll(path: string, maxRows = 200): Promise<Record<string, unknown>[]> {
  const pageSize = 100;
  const all: Record<string, unknown>[] = [];
  let page = 1;
  let total = Infinity;

  while (all.length < maxRows && all.length < total && page <= 5) {
    const { items, totalCount } = await fetchHfPage(path, page, pageSize);
    total = totalCount;
    if (!items.length) break;
    all.push(...items);
    if (items.length < pageSize) break;
    page += 1;
  }

  return all.slice(0, maxRows);
}

function mapConforming(row: Record<string, unknown>, index: number): LoanRateItem {
  const applyRaw = pickField(row, ['applyDy', 'applyDate', 'bssYm']);
  const { iso, label } = formatApplyDate(applyRaw);
  const productName = pickField(row, ['productNm', 'productName']) || '적격대출';
  const rows = rateRowsFromObject(row, [
    { key: 'interest_10y', label: '10년' },
    { key: 'interest_15y', label: '15년' },
    { key: 'interest_20y', label: '20년' },
    { key: 'interest_30y', label: '30년' },
  ]);

  return {
    id: `conforming-${applyRaw}-${index}`,
    category: 'conforming',
    productName,
    institution: pickField(row, ['callCenter']) || '한국주택금융공사',
    applyDate: iso,
    applyDateLabel: label,
    rows,
    summary:
      rows.length > 0
        ? rows.map((r) => `${r.label} ${r.value}`).join(' · ')
        : '금리 정보 확인 중',
  };
}

function mapRent(row: Record<string, unknown>, index: number): LoanRateItem {
  const applyRaw = pickField(row, ['bssYm', 'applyDy', 'bssYmEnd']);
  const { iso, label } = formatApplyDate(applyRaw);
  const bank = pickField(row, ['organld', 'organId', 'organNm', 'bankNm']) || '금융기관';
  const rows = rateRowsFromObject(row, [
    { key: 'interest4_1', label: '적용금리1' },
    { key: 'interest4_2', label: '적용금리2' },
    { key: 'interest3_1', label: '가산금리1' },
    { key: 'interest3_2', label: '가산금리2' },
  ]);

  const ratio = pickField(row, ['interest1_1', 'interest1_2']);
  const summaryParts = [
    ratio ? `보증비율 ${ratio}%` : '',
    rows[0] ? `적용 ${rows[0].value}` : '',
  ].filter(Boolean);

  return {
    id: `rent-${bank}-${applyRaw}-${index}`,
    category: 'rent',
    productName: '전세자금대출 금리',
    institution: bank,
    applyDate: iso,
    applyDateLabel: label,
    rows,
    summary: summaryParts.join(' · ') || '전세자금대출 금리',
  };
}

function formatDidimdolRateKey(key: string): string {
  const m = key.match(/^interest_(\d+)y(?:_(\d+))?$/i);
  if (m) {
    const years = m[1];
    const income = m[2];
    return income
      ? `${years}년 (소득 ${Number(income).toLocaleString('ko-KR')}만원 이하)`
      : `${years}년`;
  }
  return key.replace(/^interest_/i, '').replace(/_/g, ' ');
}

function mapDidimdol(row: Record<string, unknown>, index: number): LoanRateItem {
  const applyRaw = pickField(row, ['applyDy', 'bssYm', 'dataDate', 'announceDate']);
  const { iso, label } = formatApplyDate(applyRaw);
  const productName = pickField(row, ['productNm', 'loanNm']) || '디딤돌대출';

  const rows = rateRowsFromObject(row, [
    { key: 'interest_10y', label: '10년' },
    { key: 'interest_15y', label: '15년' },
    { key: 'interest_20y', label: '20년' },
    { key: 'interest_30y', label: '30년' },
  ]);

  for (const [key, val] of Object.entries(row)) {
    if (!/^interest_/i.test(key)) continue;
    const v = String(val ?? '').trim();
    if (!v || v === '0') continue;
    const already = rows.some((r) => r.value === `${v}%`);
    if (already) continue;
    const label = formatDidimdolRateKey(key);
    rows.push({ label, value: `${v}%` });
  }

  return {
    id: `didimdol-${applyRaw}-${index}`,
    category: 'didimdol',
    productName,
    institution: '한국주택금융공사',
    applyDate: iso,
    applyDateLabel: label,
    rows,
    summary:
      rows.length > 0
        ? rows.map((r) => `${r.label} ${r.value}`).join(' · ')
        : '디딤돌 기준금리',
  };
}

function sortByDateDesc(items: LoanRateItem[]): LoanRateItem[] {
  return [...items].sort((a, b) => b.applyDate.localeCompare(a.applyDate));
}

function dedupeByKey(items: LoanRateItem[]): LoanRateItem[] {
  const seen = new Set<string>();
  const out: LoanRateItem[] = [];
  for (const item of items) {
    const key = `${item.category}-${item.productName}-${item.institution}-${item.summary}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** 공공데이터 15082028 — didimdol-info (didimdol-list 아님) */
const DIDIMDOL_PATH = '/didimdol-loan-rate/didimdol-info';

export async function fetchDidimdolRates(): Promise<LoanRateItem[]> {
  const raw = await fetchHfAll(DIDIMDOL_PATH, 120);
  return sortByDateDesc(dedupeByKey(raw.map(mapDidimdol)));
}

export async function fetchRentLoanRates(): Promise<LoanRateItem[]> {
  const raw = await fetchHfAll('/rent-loan-rate-info/rate-list', 150);
  return sortByDateDesc(dedupeByKey(raw.map(mapRent)));
}

export async function fetchConformingRates(): Promise<LoanRateItem[]> {
  const raw = await fetchHfAll('/conforming-loan-rate/conforming-list', 80);
  return sortByDateDesc(dedupeByKey(raw.map(mapConforming)));
}

export function demoLoanRates(): {
  didimdol: LoanRateItem[];
  rent: LoanRateItem[];
  conforming: LoanRateItem[];
} {
  const today = new Date().toISOString().slice(0, 10);
  const label = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    didimdol: [
      {
        id: 'demo-didimdol-1',
        category: 'didimdol',
        productName: '디딤돌 (연소득 4천만원 이하, 예시)',
        institution: '한국주택금융공사',
        applyDate: today,
        applyDateLabel: label,
        rows: [
          { label: '10년', value: '3.20%' },
          { label: '15년', value: '3.30%' },
          { label: '20년', value: '3.40%' },
        ],
        summary: '10년 3.20% · 15년 3.30% · 20년 3.40%',
      },
    ],
    rent: [
      {
        id: 'demo-rent-1',
        category: 'rent',
        productName: '전세자금대출 금리',
        institution: 'OO은행 (예시)',
        applyDate: today,
        applyDateLabel: label,
        rows: [{ label: '적용금리', value: '2.8%' }],
        summary: '보증비율 90% · 적용 2.8%',
      },
    ],
    conforming: [
      {
        id: 'demo-conforming-1',
        category: 'conforming',
        productName: 'IBK 장기고정금리 모기지론 (예시)',
        institution: '한국주택금융공사',
        applyDate: today,
        applyDateLabel: label,
        rows: [
          { label: '10년', value: '3.48%' },
          { label: '20년', value: '3.58%' },
        ],
        summary: '10년 3.48% · 20년 3.58%',
      },
    ],
  };
}
