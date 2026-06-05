import { fetchBokBaseRate } from './bok';
import {
  demoLoanRates,
  fetchConformingRates,
  fetchDidimdolRates,
  fetchRentLoanRates,
  isHfApiConfigured,
} from './hf-client';
import type { LoanRateItem, LoanRatesResult } from './types';

export type { LoanRateCategory, LoanRateItem, LoanRatesResult, BokBaseRate } from './types';

export async function fetchLoanRatesBundle(): Promise<LoanRatesResult> {
  const baseRate = await fetchBokBaseRate();
  const configured = isHfApiConfigured();

  if (!configured) {
    const demo = demoLoanRates();
    return {
      baseRate,
      ...demo,
      configured: false,
      source: 'demo',
    };
  }

  const labels = ['디딤돌', '전세자금', '적격대출'] as const;
  const warnings: string[] = [];
  const buckets: LoanRateItem[][] = [[], [], []];

  const fetchers = [fetchDidimdolRates, fetchRentLoanRates, fetchConformingRates] as const;
  for (let i = 0; i < fetchers.length; i++) {
    try {
      buckets[i] = await fetchers[i]();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      warnings.push(`${labels[i]}: ${msg}`);
    }
  }

  const [didimdol, rent, conforming] = buckets;
  if (!conforming.length) {
    warnings.push(
      '적격대출: 공공데이터 서버에서 일시적으로 조회되지 않습니다. (전세·디딤돌은 정상)'
    );
  }
  const anyOk = didimdol.length + rent.length + conforming.length > 0;

  if (!anyOk && warnings.length === fetchers.length) {
    throw new Error(warnings[0] ?? 'HF API 호출에 실패했습니다.');
  }

  return {
    baseRate,
    didimdol,
    rent,
    conforming,
    configured: true,
    source: anyOk ? 'api' : 'partial',
    warnings: warnings.length ? warnings : undefined,
  };
}
