import { getYouthRegionBySido } from './regions';
import {
  isCentralPolicy,
  mapJsonPolicy,
  parseYouthPolicyJson,
  policyMatchesSido,
} from './parse';
import type { YouthPolicyItem, YouthPolicyListResult, YouthPolicyScope } from './types';

/** 온통청년 청년정책 API (2025+ JSON, apiKeyNm 파라미터) */
const API_BASE = 'https://www.youthcenter.go.kr/go/ythip/getPlcy';
const HOUSING_CATEGORY = '주거';
const API_BATCH_SIZE = 50;
const MAX_SCAN_PAGES = 30;
const UPSTREAM_MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resolveYouthCenterApiKey(): string | null {
  const key =
    process.env.YOUTH_CENTER_API_KEY?.trim() ??
    process.env.ONTONG_YOUTH_API_KEY?.trim();
  if (!key || key.includes('여기에') || key === '발급받은_인증키') return null;
  return key;
}

export function isYouthCenterApiConfigured(): boolean {
  return resolveYouthCenterApiKey() != null;
}

type FetchParams = {
  page: number;
  pageSize: number;
  sidoCode?: string;
  scope: YouthPolicyScope;
};

type RequestOptions = {
  page: number;
  pageSize: number;
  srchPolyBizSecd?: string;
};

async function requestPolicies(
  options: RequestOptions,
  attempt = 0
): Promise<{
  items: Record<string, unknown>[];
  totalCount: number;
}> {
  const key = resolveYouthCenterApiKey();
  if (!key) {
    throw new Error('YOUTH_CENTER_API_KEY가 설정되지 않았습니다.');
  }

  const qs = new URLSearchParams({
    apiKeyNm: key,
    pageNum: String(options.page),
    pageSize: String(Math.min(options.pageSize, 100)),
    rtnType: 'json',
    lclsfNm: HOUSING_CATEGORY,
  });

  if (options.srchPolyBizSecd) {
    qs.set('srchPolyBizSecd', options.srchPolyBizSecd);
  }

  try {
    const res = await fetch(`${API_BASE}?${qs.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`온통청년 API 오류 (HTTP ${res.status})`);
    }

    const body = await res.text();
    return parseYouthPolicyJson(body);
  } catch (e) {
    if (attempt < UPSTREAM_MAX_RETRIES - 1) {
      await sleep(800 * (attempt + 1));
      return requestPolicies(options, attempt + 1);
    }
    const message = e instanceof Error ? e.message : '온통청년 API 요청 실패';
    throw new Error(message.includes('fetch') ? 'fetch failed' : message);
  }
}

function isCentralItem(item: YouthPolicyItem): boolean {
  if (item.orgType === '중앙부처') return true;
  return isCentralPolicy(item.orgType, item.regionLabel, item.orgName);
}

function applyScopeFilter(
  items: YouthPolicyItem[],
  scope: YouthPolicyScope,
  sidoCode?: string
): YouthPolicyItem[] {
  const region = sidoCode ? getYouthRegionBySido(sidoCode) : undefined;

  if (scope === 'national') {
    return items.filter((p) => isCentralItem(p));
  }

  if (scope === 'local' && region) {
    return items.filter(
      (p) =>
        !isCentralItem(p) &&
        policyMatchesSido(p, region.shortName, region.name)
    );
  }

  return items;
}

function dedupePolicies(items: YouthPolicyItem[]): YouthPolicyItem[] {
  const seen = new Set<string>();
  const out: YouthPolicyItem[] = [];
  for (const item of items) {
    const key = item.id || item.title;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** API 전체를 훑은 뒤 scope·지역 필터를 적용한 실제 건수·페이지 슬라이스 */
async function scanFilteredPolicies(
  params: FetchParams,
  youthApiCode?: string
): Promise<{ items: YouthPolicyItem[]; totalCount: number }> {
  const useRegionParam = params.scope !== 'national' && Boolean(youthApiCode);
  const allFiltered: YouthPolicyItem[] = [];
  let apiPage = 1;
  let apiTotal = Infinity;

  while (apiPage <= MAX_SCAN_PAGES) {
    const { items: raw, totalCount } = await requestPolicies({
      page: apiPage,
      pageSize: API_BATCH_SIZE,
      srchPolyBizSecd: useRegionParam ? youthApiCode : undefined,
    });

    apiTotal = totalCount;

    let mapped = raw.map(mapJsonPolicy).filter((p) => p.title);
    mapped = applyScopeFilter(mapped, params.scope, params.sidoCode);
    allFiltered.push(...mapped);

    if (raw.length < API_BATCH_SIZE || apiPage * API_BATCH_SIZE >= apiTotal) {
      break;
    }
    apiPage += 1;
  }

  const unique = dedupePolicies(allFiltered);
  const totalCount = unique.length;
  const start = (params.page - 1) * params.pageSize;
  const items = unique.slice(start, start + params.pageSize);

  return { items, totalCount };
}

async function fetchPolicyPage(
  params: FetchParams,
  youthApiCode?: string
): Promise<YouthPolicyListResult> {
  const key = resolveYouthCenterApiKey();
  if (!key) {
    return { ...demoPolicies(params), source: 'demo' };
  }

  try {
    const { items, totalCount } = await scanFilteredPolicies(params, youthApiCode);
    const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));

    return {
      items,
      page: params.page,
      pageSize: params.pageSize,
      totalCount,
      hasMore: params.page < totalPages,
      source: 'api',
    };
  } catch {
    return { ...demoPolicies(params), source: 'demo' };
  }
}

export async function fetchYouthPolicies(options: {
  sidoCode: string;
  youthRegionCode?: string;
  scope: YouthPolicyScope;
  page?: number;
  pageSize?: number;
}): Promise<YouthPolicyListResult> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;

  return fetchPolicyPage(
    {
      page,
      pageSize,
      sidoCode: options.sidoCode,
      scope: options.scope,
    },
    options.youthRegionCode
  );
}

function demoPolicies(params: FetchParams): Omit<YouthPolicyListResult, 'source'> {
  const demos: YouthPolicyItem[] = [
    {
      id: 'demo-1',
      title: '청년 전세자금 대출 (예시)',
      summary: '무주택 청년의 주거비 부담을 줄이기 위한 대출 지원 정책입니다.',
      support: '전세 보증금 대출, 우대금리',
      orgType: '중앙부처',
      orgName: '국토교통부',
      regionLabel: '전국',
      period: '상시 모집 (예시)',
      applyUrl: 'https://www.youthcenter.go.kr/',
      detailUrl: 'https://www.youthcenter.go.kr/',
    },
    {
      id: 'demo-2',
      title: '청년 매입임대주택 입주자 모집 (예시)',
      summary: '지역 청년의 안정적인 주거를 위한 공공임대 주택 공급 사업입니다.',
      support: '임대료 시세 대비 저렴한 임대주택',
      orgType: '지자체',
      orgName: '광역·기초 지자체',
      regionLabel: '선택 지역',
      period: '공고별 상이 (예시)',
      applyUrl: 'https://www.youthcenter.go.kr/',
      detailUrl: 'https://www.youthcenter.go.kr/',
    },
  ];

  const region = params.sidoCode ? getYouthRegionBySido(params.sidoCode) : undefined;
  const filtered = applyScopeFilter(demos, params.scope, params.sidoCode).map((d) => {
    if (params.scope !== 'local' || !region) return d;
    return {
      ...d,
      regionLabel: region.name,
      orgName: `${region.name} (예시)`,
    };
  });

  const start = (params.page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);

  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    totalCount: filtered.length,
    hasMore: start + items.length < filtered.length,
  };
}
