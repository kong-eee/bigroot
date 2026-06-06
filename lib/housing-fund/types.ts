export type LoanRateCategory = 'didimdol' | 'rent' | 'conforming';

export type LoanRateRow = {
  label: string;
  value: string;
};

export type LoanRateItem = {
  id: string;
  category: LoanRateCategory;
  productName: string;
  institution: string;
  applyDate: string;
  applyDateLabel: string;
  rows: LoanRateRow[];
  summary: string;
  /** API 장애 시 참고 데이터 표시 */
  isReference?: boolean;
};

export type BokBaseRate = {
  value: number;
  asOf?: string;
  source: 'api' | 'fallback';
};

export type LoanRatesResult = {
  baseRate: BokBaseRate;
  didimdol: LoanRateItem[];
  rent: LoanRateItem[];
  conforming: LoanRateItem[];
  configured: boolean;
  source: 'api' | 'partial' | 'demo';
  warnings?: string[];
  /** 적격대출 API만 실패하고 참고 데이터도 없을 때 */
  conformingUnavailable?: string;
  conformingSource?: 'api' | 'reference';
  conformingNote?: string;
};
