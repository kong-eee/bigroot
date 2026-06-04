'use client';

import { useCallback, useEffect, useState } from 'react';
import { YOUTH_SIDO_REGIONS, getYouthRegionBySido } from '@/lib/youth-center/regions';
import type { YouthPolicyItem, YouthPolicyScope } from '@/lib/youth-center/types';
import { getSavedPolicyRegion, savePolicyRegion } from '@/lib/policy-feed-storage';
import KoreaMap from './KoreaMap';
import PolicyPagination from './PolicyPagination';
import YouthPolicyCard from './YouthPolicyCard';

const PAGE_SIZE = 5;

const SCOPES: { id: YouthPolicyScope; label: string; desc: string }[] = [
  { id: 'national', label: '전국', desc: '중앙부처·전국 단위 사업' },
  { id: 'local', label: '내 지역', desc: '선택한 시·도·지자체 사업' },
];

function loadingLabel(scope: YouthPolicyScope, regionName?: string): string {
  if (scope === 'local') {
    return regionName
      ? `${regionName} 지역 정책을 불러오는 중입니다. 잠시만 기다려 주세요.`
      : '지역 정책을 불러오는 중입니다. 잠시만 기다려 주세요.';
  }
  return '불러오는 중…';
}

export default function YouthPolicyTab() {
  const [sidoCode, setSidoCode] = useState('11');
  const [scope, setScope] = useState<YouthPolicyScope>('national');
  const [items, setItems] = useState<YouthPolicyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const saved = getSavedPolicyRegion();
    if (saved && YOUTH_SIDO_REGIONS.some((r) => r.sidoCode === saved)) {
      setSidoCode(saved);
    }
  }, []);

  const region = getYouthRegionBySido(sidoCode);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const waitMessage = loadingLabel(scope, region?.name);

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `/api/youth-policies?sido=${sidoCode}&scope=${scope}&page=${nextPage}&pageSize=${PAGE_SIZE}`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error ?? '목록을 불러오지 못했습니다.');
        }
        setNotice(data.message ?? '');
        setTotalCount(data.totalCount ?? 0);
        setPage(nextPage);
        setItems(data.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
        setItems([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [sidoCode, scope]
  );

  useEffect(() => {
    setPage(1);
    load(1);
  }, [load]);

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page || loading) return;
    load(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectRegion = (code: string) => {
    if (code === sidoCode) return;
    setSidoCode(code);
    savePolicyRegion(code);
    if (scope === 'local') {
      setItems([]);
      setTotalCount(0);
      setError('');
    }
  };

  const selectScope = (next: YouthPolicyScope) => {
    if (next === scope) return;
    setScope(next);
    if (next === 'local') {
      setItems([]);
      setTotalCount(0);
    }
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
                onClick={() => selectScope(s.id)}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl border text-left transition-colors ${
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

          {!loading && totalCount > 0 && (
            <p className="text-xs font-bold text-[var(--text-secondary)]">
              총 {totalCount.toLocaleString('ko-KR')}건 · 페이지당 {PAGE_SIZE}건
              {totalPages > 1 && ` · ${totalPages}페이지`}
            </p>
          )}

          {loading && scope === 'local' && (
            <div
              className="ui-card p-10 text-center border-[var(--brand)]/30 bg-[var(--brand-soft)]/40"
              role="status"
              aria-live="polite"
            >
              <p className="font-black text-[var(--text-primary)]">{waitMessage}</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                지역별로 정책을 모으는 데 시간이 걸릴 수 있습니다.
              </p>
            </div>
          )}

          {loading && scope === 'national' && items.length === 0 && (
            <p className="text-center py-16 font-bold text-[var(--text-muted)]">{waitMessage}</p>
          )}

          {!loading && items.length === 0 && (
            <div className="ui-card p-10 text-center">
              <p className="font-black text-[var(--text-primary)]">표시할 정책이 없습니다.</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                {scope === 'local'
                  ? '다른 지역을 선택하거나 전국 탭에서 중앙 정책을 확인해 보세요.'
                  : '내 지역 탭에서 선택한 시·도 사업을 확인해 보세요.'}
              </p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <>
              <ul className="space-y-4">
                {items.map((p) => (
                  <YouthPolicyCard key={`${p.id}-${p.title}`} policy={p} />
                ))}
              </ul>
              {totalPages > 1 && (
                <PolicyPagination
                  page={page}
                  totalPages={totalPages}
                  loading={loading}
                  onPageChange={goToPage}
                />
              )}
            </>
          )}

          {loading && scope === 'national' && items.length > 0 && (
            <p className="text-center text-xs font-bold text-[var(--text-muted)]">{waitMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
