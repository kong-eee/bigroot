'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { YouthPolicyItem } from '@/lib/youth-center/types';

type YouthPolicyCardProps = {
  policy: YouthPolicyItem;
};

export default function YouthPolicyCard({ policy }: YouthPolicyCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const hasDetail = Boolean(policy.support || policy.orgName || policy.period);

  return (
    <li className="ui-card p-5 sm:p-6">
      <div className="flex flex-wrap gap-2 mb-2">
        {policy.orgType && (
          <span className="ui-badge ui-badge-brand text-[10px]">{policy.orgType}</span>
        )}
        {policy.orgName && !detailOpen && (
          <span className="ui-badge text-[10px] truncate max-w-[12rem]">{policy.orgName}</span>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-black leading-snug text-[var(--text-primary)]">
        {policy.title}
      </h3>

      {policy.summary && (
        <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] leading-relaxed line-clamp-3">
          {policy.summary}
        </p>
      )}

      {hasDetail && (
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="mt-3 text-xs font-bold text-[var(--text-primary)] underline-offset-2 hover:underline"
          aria-expanded={detailOpen}
        >
          {detailOpen ? '상세 접기' : '지원 대상·지원 내용 보기'}
        </button>
      )}

      {detailOpen && hasDetail && (
        <div className="mt-3 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm">
          {policy.support && (
            <div>
              <p className="text-xs font-black text-[var(--text-primary)] mb-1">지원 대상·내용</p>
              <p className="font-medium text-[var(--text-secondary)] whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                {policy.support}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-[var(--text-muted)]">
            {policy.orgName && <span>주관: {policy.orgName}</span>}
            {policy.period && <span>기간: {policy.period}</span>}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={policy.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn-primary text-sm px-4 py-2 min-h-0"
            >
              온통청년에서 보기
            </Link>
            {policy.applyUrl && policy.applyUrl !== policy.detailUrl && (
              <Link
                href={policy.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-btn-secondary text-sm px-4 py-2 min-h-0"
              >
                신청 링크
              </Link>
            )}
          </div>
        </div>
      )}

      {!detailOpen && (
        <Link
          href={policy.detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs font-bold text-[var(--brand)] hover:underline"
        >
          온통청년에서 보기 →
        </Link>
      )}
    </li>
  );
}
