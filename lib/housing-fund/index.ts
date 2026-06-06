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



function fillEmptyBuckets(

  didimdol: LoanRateItem[],

  rent: LoanRateItem[],

  conforming: LoanRateItem[]

): { didimdol: LoanRateItem[]; rent: LoanRateItem[]; conforming: LoanRateItem[] } {

  const demo = demoLoanRates();

  return {

    didimdol: didimdol.length ? didimdol : demo.didimdol,

    rent: rent.length ? rent : demo.rent,

    conforming: conforming.length ? conforming : demo.conforming,

  };

}



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



  const warnings: string[] = [];



  const [didimdolResult, rentResult, conformingResult] = await Promise.allSettled([

    fetchDidimdolRates(),

    fetchRentLoanRates(),

    fetchConformingRates(),

  ]);



  let didimdol: LoanRateItem[] = [];

  let rent: LoanRateItem[] = [];

  let conforming: LoanRateItem[] = [];

  let conformingSource: 'api' | 'reference' | undefined;

  let conformingNote: string | undefined;



  if (didimdolResult.status === 'fulfilled') {

    didimdol = didimdolResult.value;

  } else {

    const msg =

      didimdolResult.reason instanceof Error

        ? didimdolResult.reason.message

        : String(didimdolResult.reason);

    warnings.push(`디딤돌: ${msg}`);

  }



  if (rentResult.status === 'fulfilled') {

    rent = rentResult.value;

  } else {

    const msg =

      rentResult.reason instanceof Error ? rentResult.reason.message : String(rentResult.reason);

    warnings.push(`전세자금: ${msg}`);

  }



  if (conformingResult.status === 'fulfilled') {

    conforming = conformingResult.value.items;

    conformingSource = conformingResult.value.source;

    conformingNote = conformingResult.value.note;

    if (conformingResult.value.source === 'reference') {

      warnings.push(`적격대출: ${conformingResult.value.note}`);

    }

  } else {

    const msg =

      conformingResult.reason instanceof Error

        ? conformingResult.reason.message

        : String(conformingResult.reason);

    warnings.push(`적격대출: ${msg}`);

  }



  const hadAnyLive = didimdol.length + rent.length + conforming.length > 0;
  const padded = fillEmptyBuckets(didimdol, rent, conforming);
  const usedFallback =
    padded.didimdol !== didimdol || padded.rent !== rent || padded.conforming !== conforming;

  if (usedFallback) {
    didimdol = padded.didimdol;
    rent = padded.rent;
    conforming = padded.conforming;
    warnings.push('HF API 일시 오류 — 비어 있는 항목은 예시·참고 금리로 대체했습니다.');
  }

  const conformingUnavailable =
    conforming.length === 0
      ? warnings.find((w) => w.startsWith('적격대출:'))?.replace(/^적격대출:\s*/, '')
      : undefined;

  return {
    baseRate,
    didimdol,
    rent,
    conforming,
    configured: true,
    source: hadAnyLive && !usedFallback ? 'api' : 'partial',

    warnings: warnings.length ? warnings : undefined,

    conformingUnavailable,

    conformingSource,

    conformingNote,

  };

}


