'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LoanRateCategory, LoanRateItem } from '@/lib/housing-fund/types';
import LoanRateCard from './LoanRateCard';

type FilterId = 'all' | LoanRateCategory;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'didimdol', label: '디딤돌' },
  { id: 'rent', label: '전세자금' },
  { id: 'conforming', label: '적격대출' },
];

export default function LoanRateTab() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [baseRate, setBaseRate] = useState<number | null>(null);
  const [baseRateSource, setBaseRateSource] = useState<'api' | 'fallback'>('fallback');
  const [items, setItems] = useState<LoanRateItem[]>([]);
  const [configured, setConfigured] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/loan-rates', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? '금리를 불러오지 못했습니다.');
      }
      setNotice(data.message ?? '');
      setConfigured(Boolean(data.configured));
      setBaseRate(data.baseRate?.value ?? null);
      setBaseRateSource(data.baseRate?.source ?? 'fallback');
      const merged: LoanRateItem[] = [
        ...(data.didimdol ?? []),
        ...(data.rent ?? []),
        ...(data.conforming ?? []),
      ];
      setItems(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const c = { didimdol: 0, rent: 0, conforming: 0 };
    for (const i of items) c[i.category] += 1;
    return c;
  }, [items]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="ui-card p-6 sm:p-8 border-[var(--brand)]/25 bg-[var(--brand-soft)]/30">
        <p className="text-xs font-bold text-[var(--text-muted)]">한국은행 기준금리</p>
        <p className="text-3xl sm:text-4xl font-black text-[var(--brand)] mt-1">
          {baseRate != null ? `${baseRate}%` : '—'}
        </p>
        <p className="text-xs font-medium text-[var(--text-secondary)] mt-2">
          {baseRateSource === 'api'
            ? 'ECOS 최신 기준금리 (참고)'
            : '기준금리 API 미연동 — 참고용 기본값'}
        </p>
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

      {notice && (
        <p className="text-xs font-medium text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--border)] rounded-xl p-4">
          {notice}
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1">
          {warnings.map((w) => (
            <li key={w}>· {w}</li>
          ))}
        </ul>
      )}

      {configured && items.length > 0 && (
        <p className="text-xs font-bold text-[var(--text-secondary)]">
          HF 실시간 금리 {items.length}건
          {updatedAt &&
            ` · ${new Date(updatedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}`}
        </p>
      )}

      {error && (
        <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
          {error}
          <button
            type="button"
            onClick={load}
            className="block mt-2 text-xs underline font-bold"
          >
            다시 불러오기
          </button>
        </p>
      )}

      <p className="text-xs font-medium text-[var(--text-muted)]">
        한국주택금융공사(HF) 공공데이터·한국은행 ECOS 기준입니다. 실제 대출 금리·우대는
        금융기관·기금e든든에서 확인하세요. 빅루트는 정보 제공만 합니다.
      </p>

      {loading && (
        <p className="text-center py-16 font-bold text-[var(--text-muted)]">
          금리 정보를 불러오는 중…
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="ui-card p-10 text-center">
          <p className="font-black">표시할 금리가 없습니다.</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            {configured
              ? '잠시 후 다시 불러오기를 눌러 보세요. 적격대출 API는 공공데이터 서버 오류 시 비어 있을 수 있습니다.'
              : '공공데이터포털 인증키를 설정한 뒤 HF API 활용신청을 확인해 주세요.'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ul className="space-y-4">
          {filtered.map((item) => (
            <LoanRateCard key={item.id} item={item} />
          ))}
        </ul>
      )}

      <p className="text-[11px] text-center text-[var(--text-muted)] font-medium">
        출처: HF 전세·적격(승인 API) · 한국은행 ECOS
      </p>
    </div>
  );
}
