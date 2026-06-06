import { fetchLoanRatesBundle } from '@/lib/housing-fund';
import { CONFORMING_REFERENCE_NOTE } from '@/lib/housing-fund/conforming-fallback';
import { fetchYouthPolicies, isYouthCenterApiConfigured } from '@/lib/youth-center/client';
import { getYouthApiCode, getYouthRegionBySido } from '@/lib/youth-center/regions';
import { getCuratedNotices } from './curated';
import type { PolicyNoticeCategory, PolicyNoticeFeed, PolicyNoticeItem } from './types';

export type { PolicyNoticeCategory, PolicyNoticeFeed, PolicyNoticeItem } from './types';

const RECRUIT_KEYWORDS =
  /모집|공고|접수|마감|신청|선발|모집공고|공모|지원사업|임대|입주|청약|추첨/i;

function formatDateLabel(iso: string): string {
  if (!iso || iso === '상시') return '상시';
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return iso;
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function noticeFromYouthPolicy(policy: {
  id: string;
  title: string;
  summary: string;
  orgName: string;
  regionLabel: string;
  period: string;
  applyUrl: string;
  detailUrl: string;
}): PolicyNoticeItem {
  const url = policy.applyUrl || policy.detailUrl || 'https://www.youthcenter.go.kr/';
  return {
    id: `youth-${policy.id}`,
    category: 'recruitment',
    title: policy.title,
    summary: policy.summary || policy.period || '청년 주거 지원 사업',
    publishedAt: new Date().toISOString().slice(0, 10),
    publishedLabel: policy.period || '모집·접수 확인',
    source: policy.orgName || '온통청년',
    url,
    severity: 'alert',
    regionLabel: policy.regionLabel,
  };
}

function loanRateNotices(
  bundle: Awaited<ReturnType<typeof fetchLoanRatesBundle>>
): PolicyNoticeItem[] {
  const out: PolicyNoticeItem[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (bundle.baseRate.value != null) {
    out.push({
      id: 'loan-bok-base',
      category: 'rate',
      title: `한국은행 기준금리 ${bundle.baseRate.value}%`,
      summary:
        bundle.baseRate.source === 'api'
          ? 'ECOS 최신 기준금리입니다. 변동금리 대출·전세대출 상환 부담 참고용으로 확인하세요.'
          : '기준금리 API 미연동 — 참고용 기본값입니다.',
      publishedAt: bundle.baseRate.asOf?.slice(0, 10) ?? today,
      publishedLabel: bundle.baseRate.asOf
        ? formatDateLabel(bundle.baseRate.asOf.slice(0, 10))
        : '참고',
      source: '한국은행 ECOS',
      url: 'https://ecos.bok.or.kr/',
      severity: 'info',
    });
  }

  if (bundle.rent.length > 0) {
    const sample = bundle.rent[0];
    out.push({
      id: 'loan-rent-summary',
      category: 'rate',
      title: `전세자금대출 금리 ${bundle.rent.length}건 조회됨`,
      summary: `최근 항목: ${sample.institution} · ${sample.summary}. ② 탭에서 은행별 상세 금리를 볼 수 있습니다.`,
      publishedAt: today,
      publishedLabel: '실시간 조회',
      source: 'HF 공공데이터',
      url: '/policy-feed',
      severity: 'info',
    });
  }

  if (bundle.conforming.length > 0) {
    const ref = bundle.conformingSource === 'reference';
    out.push({
      id: 'loan-conforming-summary',
      category: 'rate',
      title: ref
        ? `적격대출 참고 금리 ${bundle.conforming.length}건`
        : `적격대출 금리 ${bundle.conforming.length}건 조회됨`,
      summary: ref
        ? CONFORMING_REFERENCE_NOTE
        : `${bundle.conforming[0].productName} 등 HF 적격대출 금리가 조회되었습니다.`,
      publishedAt: today,
      publishedLabel: ref ? '참고' : '실시간 조회',
      source: 'HF 공공데이터',
      url: '/policy-feed',
      severity: ref ? 'warn' : 'info',
    });
  } else if (bundle.conformingUnavailable) {
    out.push({
      id: 'loan-conforming-down',
      category: 'official',
      title: '적격대출 API 일시 오류',
      summary: bundle.conformingUnavailable,
      publishedAt: today,
      publishedLabel: '안내',
      source: 'HF 공공데이터',
      url: 'https://www.data.go.kr/data/15082047/openapi.do',
      severity: 'warn',
    });
  }

  return out;
}

function dedupeNotices(items: PolicyNoticeItem[]): PolicyNoticeItem[] {
  const seen = new Set<string>();
  const out: PolicyNoticeItem[] = [];
  for (const item of items) {
    const key = `${item.category}-${item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function fetchPolicyNotices(sidoCode = '11'): Promise<PolicyNoticeFeed> {
  const curated = getCuratedNotices();
  const dynamic: PolicyNoticeItem[] = [];

  let youthConfigured = isYouthCenterApiConfigured();
  let loanConfigured = false;

  try {
    const bundle = await fetchLoanRatesBundle();
    loanConfigured = bundle.configured;
    dynamic.push(...loanRateNotices(bundle));
  } catch {
    /* loan notices optional */
  }

  if (youthConfigured) {
    try {
      const youthRegionCode = getYouthApiCode(sidoCode);
      const region = getYouthRegionBySido(sidoCode);
      const [local, national] = await Promise.all([
        fetchYouthPolicies({
          sidoCode,
          youthRegionCode,
          scope: 'local',
          page: 1,
          pageSize: 30,
        }),
        fetchYouthPolicies({
          sidoCode,
          youthRegionCode,
          scope: 'national',
          page: 1,
          pageSize: 20,
        }),
      ]);

      const merged = [...local.items, ...national.items];
      for (const policy of merged) {
        const text = `${policy.title} ${policy.summary} ${policy.period}`;
        if (!RECRUIT_KEYWORDS.test(text)) continue;
        dynamic.push(noticeFromYouthPolicy(policy));
        if (dynamic.filter((n) => n.category === 'recruitment' && n.id.startsWith('youth-')).length >= 8) {
          break;
        }
      }

      if (region?.name) {
        for (const item of dynamic) {
          if (item.category === 'recruitment' && !item.regionLabel) {
            item.regionLabel = region.name;
          }
        }
      }
    } catch {
      youthConfigured = false;
    }
  }

  const items = dedupeNotices([...dynamic, ...curated]).sort((a, b) => {
    const severityOrder = { alert: 0, warn: 1, info: 2 };
    const s = severityOrder[a.severity] - severityOrder[b.severity];
    if (s !== 0) return s;
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  return {
    items,
    configured: { youth: youthConfigured, loan: loanConfigured },
    updatedAt: new Date().toISOString(),
  };
}
