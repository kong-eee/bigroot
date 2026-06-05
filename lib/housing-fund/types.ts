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
};
