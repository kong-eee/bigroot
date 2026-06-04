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

  const toggleDetail = () => {
    if (hasDetail) setDetailOpen((v) => !v);
  };

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

      {hasDetail ? (
        <button
          type="button"
          onClick={toggleDetail}
          className="w-full text-left rounded-xl -mx-1 px-1 py-1 transition-colors hover:bg-[var(--bg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          aria-expanded={detailOpen}
          aria-label={detailOpen ? '상세 내용 접기' : '상세 내용 펼치기'}
        >
          <h3 className="text-base sm:text-lg font-black leading-snug text-[var(--text-primary)]">
            {policy.title}
          </h3>
          {policy.summary && (
            <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] leading-relaxed line-clamp-3">
              {policy.summary}
            </p>
          )}
          <p className="mt-2 text-[11px] font-bold text-[var(--text-muted)]">
            {detailOpen ? '▲ 접기' : '▼ 제목·요약을 눌러 지원 대상·내용 보기'}
          </p>
        </button>
      ) : (
        <>
          <h3 className="text-base sm:text-lg font-black leading-snug text-[var(--text-primary)]">
            {policy.title}
          </h3>
          {policy.summary && (
            <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] leading-relaxed line-clamp-3">
              {policy.summary}
            </p>
          )}
        </>
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
          onClick={(e) => e.stopPropagation()}
        >
          온통청년에서 보기 →
        </Link>
      )}
    </li>
  );
}
