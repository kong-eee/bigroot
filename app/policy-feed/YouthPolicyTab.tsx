'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { YOUTH_SIDO_REGIONS, getYouthRegionBySido } from '@/lib/youth-center/regions';
import type { YouthPolicyItem, YouthPolicyScope } from '@/lib/youth-center/types';
import { getSavedPolicyRegion, savePolicyRegion } from '@/lib/policy-feed-storage';
import KoreaMap from './KoreaMap';

const SCOPES: { id: YouthPolicyScope; label: string; desc: string }[] = [
  { id: 'all', label: '전체', desc: '내 지역 + 전국(중앙) 정책' },
  { id: 'local', label: '내 지역', desc: '선택한 시·도·지자체 사업' },
  { id: 'national', label: '전국', desc: '중앙부처·전국 단위 사업' },
];

export default function YouthPolicyTab() {
  const [sidoCode, setSidoCode] = useState('11');
  const [scope, setScope] = useState<YouthPolicyScope>('all');
  const [items, setItems] = useState<YouthPolicyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const saved = getSavedPolicyRegion();
    if (saved && YOUTH_SIDO_REGIONS.some((r) => r.sidoCode === saved)) {
      setSidoCode(saved);
    }
  }, []);

  const region = getYouthRegionBySido(sidoCode);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `/api/youth-policies?sido=${sidoCode}&scope=${scope}&page=${nextPage}&pageSize=20`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error ?? '목록을 불러오지 못했습니다.');
        }
        setNotice(data.message ?? '');
        setHasMore(!!data.hasMore);
        setPage(nextPage);
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
        if (!append) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [sidoCode, scope]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const selectRegion = (code: string) => {
    setSidoCode(code);
    savePolicyRegion(code);
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-start">
        <div className="space-y-5">
          <div>
            <p className="ui-kicker mb-2">내 지역 선택</p>
            <h2 className="text-xl font-black">지도에서 시·도를 눌러 주세요</h2>
            <p className="text-sm font-medium text-[var(--text-secondary)] mt-2">
              선택:{' '}
              <span className="text-[var(--brand)] font-black">{region?.name ?? '—'}</span>
            </p>
          </div>
          <KoreaMap selectedSido={sidoCode} onSelect={selectRegion} />
          <div className="flex flex-wrap gap-2">
            {YOUTH_SIDO_REGIONS.map((r) => (
              <button
                key={r.sidoCode}
                type="button"
                onClick={() => selectRegion(r.sidoCode)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  sidoCode === r.sidoCode
                    ? 'bg-[var(--brand)] text-[var(--brand-on,#fff)] border-[var(--brand)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]'
                }`}
              >
                {r.shortName}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 min-w-0">
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id)}
                className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl border text-left transition-colors ${
                  scope === s.id
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)]'
                }`}
              >
                <span className="block text-sm font-black">{s.label}</span>
                <span className="block text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                  {s.desc}
                </span>
              </button>
            ))}
          </div>

          {notice && (
            <p className="text-xs font-medium text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--border)] rounded-xl p-4">
              {notice}
            </p>
          )}

          {error && (
            <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
              {error}
            </p>
          )}

          <p className="text-xs font-medium text-[var(--text-muted)]">
            주거 분야(온통청년) 정책 · 신청 조건은 원문에서 반드시 확인하세요. 빅루트는 정보 제공만
            합니다.
          </p>

          {loading && items.length === 0 ? (
            <p className="text-center py-16 font-bold text-[var(--text-muted)]">불러오는 중…</p>
          ) : items.length === 0 ? (
            <div className="ui-card p-10 text-center">
              <p className="font-black text-[var(--text-primary)]">표시할 정책이 없습니다.</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                다른 범위(전체/전국)를 선택하거나 지역을 바꿔 보세요.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((p) => (
                <li key={`${p.id}-${p.title}`} className="ui-card p-5 sm:p-6 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="ui-badge ui-badge-brand text-[10px]">
                      {p.orgType || '정책'}
                    </span>
                    {p.regionLabel && (
                      <span className="ui-badge text-[10px]">{p.regionLabel}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-black leading-snug">{p.title}</h3>
                  {p.summary && (
                    <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                      {p.summary}
                    </p>
                  )}
                  {p.support && (
                    <p className="text-xs font-bold text-[var(--brand)]">지원: {p.support}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-[var(--text-muted)]">
                    {p.orgName && <span>주관: {p.orgName}</span>}
                    {p.period && <span>기간: {p.period}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <Link
                      href={p.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ui-btn-primary text-sm px-4 py-2 min-h-0"
                    >
                      온통청년에서 보기
                    </Link>
                    {p.applyUrl && p.applyUrl !== p.detailUrl && (
                      <Link
                        href={p.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ui-btn-secondary text-sm px-4 py-2 min-h-0"
                      >
                        신청 링크
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <button
              type="button"
              disabled={loading}
              onClick={() => load(page + 1, true)}
              className="w-full ui-btn-secondary py-3 font-black disabled:opacity-50"
            >
              {loading ? '불러오는 중…' : '더 보기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
