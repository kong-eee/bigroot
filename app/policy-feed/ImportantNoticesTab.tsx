'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PolicyNoticeCategory, PolicyNoticeItem } from '@/lib/policy-notices/types';
import { getSavedPolicyRegion, savePolicyRegion } from '@/lib/policy-feed-storage';
import { YOUTH_SIDO_REGIONS, getYouthRegionBySido } from '@/lib/youth-center/regions';
import NoticeCard from './NoticeCard';

type FilterId = 'all' | PolicyNoticeCategory;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'rate', label: '금리·기금' },
  { id: 'recruitment', label: '모집·접수' },
  { id: 'official', label: '공식 안내' },
  { id: 'guide', label: '이용 가이드' },
];

export default function ImportantNoticesTab() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [sidoCode, setSidoCode] = useState('11');
  const [items, setItems] = useState<PolicyNoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    const saved = getSavedPolicyRegion();
    if (saved && YOUTH_SIDO_REGIONS.some((r) => r.sidoCode === saved)) {
      setSidoCode(saved);
    }
  }, []);

  const region = getYouthRegionBySido(sidoCode);

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/policy-notices?sido=${sidoCode}&_=${Date.now()}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error ?? '공지를 불러오지 못했습니다.');
        }
        setItems(data.items ?? []);
        setUpdatedAt(data.updatedAt ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sidoCode]
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRegionChange = (code: string) => {
    setSidoCode(code);
    savePolicyRegion(code);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const c = { rate: 0, recruitment: 0, official: 0, guide: 0 };
    for (const i of items) c[i.category] += 1;
    return c;
  }, [items]);

  const busy = loading || refreshing;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)]">내 지역 기준</p>
            <p className="text-sm font-black mt-1">
              {region?.name ?? '전국'} · 청년 모집 공지 우선 표시
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={busy}
            className="ui-btn-secondary text-xs px-4 py-2 min-h-0 disabled:opacity-50"
          >
            {busy ? '불러오는 중…' : '새로고침'}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {YOUTH_SIDO_REGIONS.map((r) => (
            <button
              key={r.sidoCode}
              type="button"
              onClick={() => onRegionChange(r.sidoCode)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition-colors ${
                sidoCode === r.sidoCode
                  ? 'bg-[var(--brand)] text-[var(--brand-on,#fff)] border-[var(--brand)]'
                  : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--brand)]'
              }`}
            >
              {r.shortName ?? r.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-xs font-black border transition-colors ${
              filter === f.id
                ? 'bg-[var(--brand)] text-[var(--brand-on,#fff)] border-[var(--brand)]'
                : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--brand)]'
            }`}
          >
            {f.label}
            {f.id !== 'all' && counts[f.id] > 0 && (
              <span className="ml-1 opacity-80">({counts[f.id]})</span>
            )}
          </button>
        ))}
      </div>

      {updatedAt && !loading && (
        <p className="text-xs font-bold text-[var(--text-secondary)]">
          공지 {items.length}건
          {` · ${new Date(updatedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}`}
        </p>
      )}

      <p className="text-xs font-medium text-[var(--text-muted)]">
        금리 변동·HF 공지·청년 주거 모집을 선별해 모았습니다. 빅루트는 정보 제공만 하며, 접수·신청은
        각 기관 사이트에서 진행하세요.
      </p>

      {error && (
        <div className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => load(true)}
            className="ui-btn-primary text-xs px-5 py-2 mt-4 min-h-0"
          >
            다시 불러오기
          </button>
        </div>
      )}

      {loading && (
        <p className="text-center py-16 font-bold text-[var(--text-muted)]">
          중요 공지를 불러오는 중…
        </p>
      )}

      {refreshing && items.length > 0 && (
        <p className="text-center py-2 text-xs font-bold text-[var(--text-muted)]">
          최신 공지를 다시 불러오는 중…
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="ui-card p-10 text-center">
          <p className="font-black">표시할 공지가 없습니다.</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            필터를 바꾸거나 새로고침해 보세요.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ul className={`space-y-4 ${refreshing ? 'opacity-60 pointer-events-none' : ''}`}>
          {filtered.map((item) => (
            <NoticeCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
