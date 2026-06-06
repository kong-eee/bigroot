'use client';

import { useState } from 'react';
import type { LoanRateItem } from '@/lib/housing-fund/types';

const CATEGORY_LABEL: Record<LoanRateItem['category'], string> = {
  didimdol: '디딤돌',
  rent: '전세자금',
  conforming: '적격대출',
};

type LoanRateCardProps = {
  item: LoanRateItem;
};

export default function LoanRateCard({ item }: LoanRateCardProps) {
  const [open, setOpen] = useState(false);
  const hasDetail = item.rows.length > 0;

  return (
    <li className="ui-card p-5 sm:p-6">
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="ui-badge ui-badge-brand text-[10px]">
          {CATEGORY_LABEL[item.category]}
        </span>
        {item.institution && (
          <span className="ui-badge text-[10px] truncate max-w-[14rem]">
            {item.institution}
          </span>
        )}
        {item.isReference && (
          <span className="ui-badge text-[10px] bg-amber-100 text-amber-900 border-amber-200">
            참고
          </span>
        )}
        <span className="ui-badge text-[10px] text-[var(--text-muted)]">
          {item.applyDateLabel}
        </span>
      </div>

      {hasDetail ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left rounded-xl -mx-1 px-1 py-1 transition-colors hover:bg-[var(--bg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          aria-expanded={open}
        >
          <h3 className="text-base sm:text-lg font-black leading-snug text-[var(--text-primary)]">
            {item.productName}
          </h3>
          <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] leading-relaxed line-clamp-2">
            {item.summary}
          </p>
          <p className="mt-2 text-[11px] font-bold text-[var(--text-muted)]">
            {open ? '▲ 접기' : '▼ 눌러 만기별·상세 금리 보기'}
          </p>
        </button>
      ) : (
        <>
          <h3 className="text-base sm:text-lg font-black">{item.productName}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.summary}</p>
        </>
      )}

      {open && hasDetail && (
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {item.rows.map((r) => (
            <li
              key={`${r.label}-${r.value}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-center"
            >
              <p className="text-[10px] font-bold text-[var(--text-muted)]">{r.label}</p>
              <p className="text-sm font-black text-[var(--brand)] mt-0.5">{r.value}</p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
