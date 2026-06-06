export type PolicyNoticeCategory = 'rate' | 'recruitment' | 'official' | 'guide';

export type PolicyNoticeItem = {
  id: string;
  category: PolicyNoticeCategory;
  title: string;
  summary: string;
  publishedAt: string;
  publishedLabel: string;
  source: string;
  url: string;
  severity: 'info' | 'warn' | 'alert';
  regionLabel?: string;
};

export type PolicyNoticeFeed = {
  items: PolicyNoticeItem[];
  configured: {
    youth: boolean;
    loan: boolean;
  };
  updatedAt: string;
};
