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

async function requestPolicies(page: number, pageSize: number): Promise<{
  items: Record<string, unknown>[];
  totalCount: number;
}> {
  const key = resolveYouthCenterApiKey();
  if (!key) {
    throw new Error('YOUTH_CENTER_API_KEY가 설정되지 않았습니다.');
  }

  const qs = new URLSearchParams({
    apiKeyNm: key,
    pageNum: String(page),
    pageSize: String(Math.min(pageSize, 100)),
    rtnType: 'json',
    lclsfNm: HOUSING_CATEGORY,
  });

  const res = await fetch(`${API_BASE}?${qs.toString()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`온통청년 API 오류 (HTTP ${res.status})`);
  }

  const body = await res.text();
  return parseYouthPolicyJson(body);
}

function applyScopeFilter(
  items: YouthPolicyItem[],
  scope: YouthPolicyScope,
  sidoCode?: string
): YouthPolicyItem[] {
  const region = sidoCode ? getYouthRegionBySido(sidoCode) : undefined;

  if (scope === 'national') {
    return items.filter((p) => isCentralPolicy(p.orgType, p.regionLabel, p.orgName));
  }

  if (scope === 'local' && region) {
    return items.filter(
      (p) =>
        !isCentralPolicy(p.orgType, p.regionLabel, p.orgName) &&
        policyMatchesSido(p, region.shortName, region.name)
    );
  }

  if (scope === 'all' && region) {
    return items.filter(
      (p) =>
        isCentralPolicy(p.orgType, p.regionLabel, p.orgName) ||
        policyMatchesSido(p, region.shortName, region.name)
    );
  }

  return items;
}

async function fetchPolicyPage(params: FetchParams): Promise<YouthPolicyListResult> {
  const key = resolveYouthCenterApiKey();
  if (!key) {
    return { ...demoPolicies(params), source: 'demo' };
  }

  const fetchSize =
    params.scope === 'local' || params.scope === 'all'
      ? Math.min(params.pageSize * 4, 100)
      : params.pageSize;

  const { items: raw, totalCount } = await requestPolicies(params.page, fetchSize);

  let mapped = raw.map(mapJsonPolicy).filter((p) => p.title);
  mapped = applyScopeFilter(mapped, params.scope, params.sidoCode);
  const items = mapped.slice(0, params.pageSize);

  const hasMore = params.page * fetchSize < totalCount || mapped.length > items.length;

  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    totalCount,
    hasMore,
    source: 'api',
  };
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

  if (options.scope === 'all') {
    const [localRes, nationalRes] = await Promise.all([
      fetchPolicyPage({
        page,
        pageSize: Math.ceil(pageSize / 2),
        sidoCode: options.sidoCode,
        scope: 'local',
      }),
      fetchPolicyPage({
        page,
        pageSize: Math.ceil(pageSize / 2),
        sidoCode: options.sidoCode,
        scope: 'national',
      }),
    ]);

    const seen = new Set<string>();
    const merged: YouthPolicyItem[] = [];
    for (const item of [...localRes.items, ...nationalRes.items]) {
      const dedupeKey = item.id || item.title;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      merged.push(item);
    }

    return {
      items: merged.slice(0, pageSize),
      page,
      pageSize,
      totalCount: localRes.totalCount + nationalRes.totalCount,
      hasMore: localRes.hasMore || nationalRes.hasMore,
      source: localRes.source === 'api' || nationalRes.source === 'api' ? 'api' : 'demo',
    };
  }

  return fetchPolicyPage({
    page,
    pageSize,
    sidoCode: options.sidoCode,
    scope: options.scope,
  });
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

  const filtered =
    params.scope === 'national'
      ? demos.filter((d) => d.orgType.includes('중앙'))
      : params.scope === 'local'
        ? demos.filter((d) => !d.orgType.includes('중앙'))
        : demos;

  return {
    items: filtered,
    page: params.page,
    pageSize: params.pageSize,
    totalCount: filtered.length,
    hasMore: false,
  };
}
