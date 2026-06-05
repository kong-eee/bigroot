import { fetchBokBaseRate } from './bok';
import {
  demoLoanRates,
  fetchConformingRates,
  fetchDidimdolRates,
  fetchRentLoanRates,
  isHfApiConfigured,
} from './hf-client';
import type { LoanRatesResult } from './types';

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

  const results = await Promise.allSettled([
    fetchDidimdolRates(),
    fetchRentLoanRates(),
    fetchConformingRates(),
  ]);

  const labels = ['디딤돌', '전세자금', '적격대출'] as const;
  const warnings: string[] = [];

  const didimdol = results[0].status === 'fulfilled' ? results[0].value : [];
  const rent = results[1].status === 'fulfilled' ? results[1].value : [];
  const conforming = results[2].status === 'fulfilled' ? results[2].value : [];

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      warnings.push(`${labels[i]}: ${msg}`);
    }
  });

  const anyOk = didimdol.length + rent.length + conforming.length > 0;
  const allFailed = results.every((r) => r.status === 'rejected');

  if (allFailed) {
    const firstErr = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    throw firstErr.reason;
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
