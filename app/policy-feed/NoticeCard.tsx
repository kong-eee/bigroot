'use client';

import Link from 'next/link';
import type { PolicyNoticeItem } from '@/lib/policy-notices/types';

const CATEGORY_LABEL: Record<PolicyNoticeItem['category'], string> = {
  rate: '금리·기금',
  recruitment: '모집·접수',
  official: '공식 안내',
  guide: '이용 가이드',
};

const SEVERITY_CLASS: Record<PolicyNoticeItem['severity'], string> = {
  alert: 'border-amber-300 bg-amber-50/80',
  warn: 'border-orange-200 bg-orange-50/60',
  info: 'border-[var(--border)]',
};

type NoticeCardProps = {
  item: PolicyNoticeItem;
};

export default function NoticeCard({ item }: NoticeCardProps) {
  const isExternal = item.url.startsWith('http');

  return (
    <li className={`ui-card p-5 sm:p-6 border ${SEVERITY_CLASS[item.severity]}`}>
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="ui-badge ui-badge-brand text-[10px]">
          {CATEGORY_LABEL[item.category]}
        </span>
        {item.regionLabel && (
          <span className="ui-badge text-[10px]">{item.regionLabel}</span>
        )}
        <span className="ui-badge text-[10px] text-[var(--text-muted)]">{item.source}</span>
      </div>

      <h3 className="text-base sm:text-lg font-black leading-snug text-[var(--text-primary)]">
        {item.title}
      </h3>
      <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
        {item.summary}
      </p>
      <p className="mt-3 text-[11px] font-bold text-[var(--text-muted)]">
        {item.publishedLabel}
      </p>

      {isExternal ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-xs font-black text-[var(--brand)] underline"
        >
          자세히 보기 ↗
        </a>
      ) : (
        <Link
          href={item.url}
          className="inline-block mt-4 text-xs font-black text-[var(--brand)] underline"
        >
          피드에서 보기 →
        </Link>
      )}
    </li>
  );
}
