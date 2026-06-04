export type YouthPolicyScope = 'local' | 'national';

export type YouthPolicyItem = {
  id: string;
  title: string;
  summary: string;
  support: string;
  orgType: string;
  orgName: string;
  regionLabel: string;
  period: string;
  applyUrl: string;
  detailUrl: string;
};

export type YouthPolicyListResult = {
  items: YouthPolicyItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
  source: 'api' | 'demo';
};
