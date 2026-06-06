import type { LoanRateItem } from './types';

/** 공공데이터 15082047 명세·HF 적격대출 참고 (API 장애 시 표시) */
const REFERENCE_ROWS = [
  { productName: 'IBK 장기고정금리 모기지론', institution: 'IBK기업은행', prodType: '기본형' },
  { productName: 'KB 국민주택기금 적격대출', institution: 'KB국민은행', prodType: '기본형' },
  { productName: '신한주택기금 적격대출', institution: '신한은행', prodType: '기본형' },
  { productName: '하나주택기금 적격대출', institution: '하나은행', prodType: '기본형' },
] as const;

/** data.go.kr 샘플 금리 (명세서 예시값 — 실시간 아님) */
const SAMPLE_RATES = [
  { label: '10년', value: '3.48%' },
  { label: '15년', value: '3.53%' },
  { label: '20년', value: '3.58%' },
  { label: '30년', value: '3.63%' },
];

const REFERENCE_APPLY = '2019-04-05';

export function getConformingReferenceRates(): LoanRateItem[] {
  const label = '2019년 4월 5일 (공공데이터 명세 예시)';
  return REFERENCE_ROWS.map((row, index) => ({
    id: `conforming-ref-${index}`,
    category: 'conforming' as const,
    productName: row.productName,
    institution: row.institution,
    applyDate: REFERENCE_APPLY,
    applyDateLabel: label,
    rows: SAMPLE_RATES,
    summary: SAMPLE_RATES.map((r) => `${r.label} ${r.value}`).join(' · '),
  }));
}

export const CONFORMING_REFERENCE_NOTE =
  'HF 적격대출 공공 API가 현재 오류(HTTP 500)입니다. 아래는 공공데이터 명세 예시·참고 금리이며, 상품은 HF에서 취급 잠정 중단 상태일 수 있습니다. 실제 금리는 취급 은행·기금e든든에서 확인하세요.';
