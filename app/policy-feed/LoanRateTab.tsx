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

const MAX_FETCH_RETRIES = 3;
const RETRY_BASE_MS = 1500;
const FETCH_TIMEOUT_MS = 90_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableLoanError(message: string, status?: number): boolean {
  if (status === 502 || status === 503 || status === 504) return true;
  return /HTTP 500|fetch failed|failed to fetch|network|timeout|aborted|socket|ECONNRESET|불러오지 못했습니다/i.test(
    message
  );
}

async function fetchLoanRates(): Promise<{ res: Response; data: LoanRatesPayload }> {
  const res = await fetch(`/api/loan-rates?_=${Date.now()}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const data = (await res.json().catch(() => ({}))) as LoanRatesPayload;
  return { res, data };
}

type LoanRatesPayload = {
  success?: boolean;
  error?: string;
  message?: string;
  configured?: boolean;
  warnings?: string[];
  conformingUnavailable?: string;
  conformingSource?: 'api' | 'reference';
  conformingNote?: string;
  updatedAt?: string;
  baseRate?: { value?: number; source?: 'api' | 'fallback' };
  didimdol?: LoanRateItem[];
  rent?: LoanRateItem[];
  conforming?: LoanRateItem[];
};

function applyPayload(data: LoanRatesPayload, setters: {
  setNotice: (v: string) => void;
  setConfigured: (v: boolean) => void;
  setWarnings: (v: string[]) => void;
  setConformingUnavailable: (v: string) => void;
  setConformingSource: (v: 'api' | 'reference' | '') => void;
  setConformingNote: (v: string) => void;
  setUpdatedAt: (v: string) => void;
  setBaseRate: (v: number | null) => void;
  setBaseRateSource: (v: 'api' | 'fallback') => void;
  setItems: (v: LoanRateItem[]) => void;
}) {
  setters.setNotice(data.message ?? '');
  setters.setConfigured(Boolean(data.configured));
  setters.setWarnings(data.warnings ?? []);
  setters.setConformingUnavailable(data.conformingUnavailable ?? '');
  setters.setConformingSource(data.conformingSource ?? '');
  setters.setConformingNote(data.conformingNote ?? '');
  setters.setUpdatedAt(data.updatedAt ?? '');
  setters.setBaseRate(data.baseRate?.value ?? null);
  setters.setBaseRateSource(data.baseRate?.source ?? 'fallback');
  setters.setItems([
    ...(data.didimdol ?? []),
    ...(data.rent ?? []),
    ...(data.conforming ?? []),
  ]);
}

export default function LoanRateTab() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [baseRate, setBaseRate] = useState<number | null>(null);
  const [baseRateSource, setBaseRateSource] = useState<'api' | 'fallback'>('fallback');
  const [items, setItems] = useState<LoanRateItem[]>([]);
  const [configured, setConfigured] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [conformingUnavailable, setConformingUnavailable] = useState('');
  const [conformingSource, setConformingSource] = useState<'api' | 'reference' | ''>('');
  const [conformingNote, setConformingNote] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  const setters = useMemo(
    () => ({
      setNotice,
      setConfigured,
      setWarnings,
      setConformingUnavailable,
      setConformingSource,
      setConformingNote,
      setUpdatedAt,
      setBaseRate,
      setBaseRateSource,
      setItems,
    }),
    []
  );

  const load = useCallback(async (options?: { manual?: boolean }) => {
    const manual = options?.manual ?? false;
    const hasData = items.length > 0;

    if (manual || hasData) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    setRetrying(false);

    let lastMessage = '금리를 불러오지 못했습니다.';

    for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt++) {
      if (attempt > 0) {
        setRetrying(true);
        setError('');
        await sleep(RETRY_BASE_MS * attempt);
      }

      try {
        const { res, data } = await fetchLoanRates();
        if (!res.ok || !data.success) {
          lastMessage = data.error ?? '금리를 불러오지 못했습니다.';
          if (isRetryableLoanError(lastMessage, res.status) && attempt < MAX_FETCH_RETRIES - 1) {
            continue;
          }
          throw new Error(lastMessage);
        }

        applyPayload(data, setters);
        setRetrying(false);
        setLoading(false);
        setRefreshing(false);
        return;
      } catch (e) {
        const message = e instanceof Error ? e.message : '오류가 발생했습니다.';
        lastMessage = message;
        if (isRetryableLoanError(message) && attempt < MAX_FETCH_RETRIES - 1) {
          continue;
        }
        setError(
          attempt > 0
            ? `${message} (자동 재시도 후에도 불러오지 못했습니다.)`
            : message
        );
        if (!hasData) setItems([]);
        setRetrying(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }

    setError(lastMessage);
    setRetrying(false);
    setLoading(false);
    setRefreshing(false);
  }, [items.length, setters]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const c = { didimdol: 0, rent: 0, conforming: 0 };
    for (const i of items) c[i.category] += 1;
    return c;
  }, [items]);

  const busy = loading || refreshing || retrying;
  const showConformingError =
    filter === 'conforming' && conformingUnavailable && counts.conforming === 0;
  const showConformingReference =
    filter === 'conforming' && conformingSource === 'reference' && counts.conforming > 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="ui-card p-6 sm:p-8 border-[var(--brand)]/25 bg-[var(--brand-soft)]/30">
        <div className="flex items-start justify-between gap-4">
          <div>
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
          {configured && (
            <button
              type="button"
              onClick={() => load({ manual: true })}
              disabled={busy}
              className="ui-btn-secondary text-xs px-4 py-2 min-h-0 shrink-0 disabled:opacity-50"
            >
              {busy ? '불러오는 중…' : '새로고침'}
            </button>
          )}
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
            {f.id === 'conforming' && conformingSource === 'reference' && counts.conforming > 0 ? (
              <span className="ml-1 opacity-80">(참고 {counts.conforming})</span>
            ) : f.id === 'conforming' && conformingUnavailable && counts.conforming === 0 ? (
              <span className="ml-1 opacity-80">(조회 불가)</span>
            ) : (
              f.id !== 'all' &&
              counts[f.id] > 0 && <span className="ml-1 opacity-80">({counts[f.id]})</span>
            )}
          </button>
        ))}
      </div>

      {retrying && (
        <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4">
          공공데이터 서버 응답이 불안정합니다. 잠시 후 자동으로 다시 불러옵니다…
        </p>
      )}

      {notice && (
        <p className="text-xs font-medium text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--border)] rounded-xl p-4">
          {notice}
        </p>
      )}

      {conformingNote && conformingSource === 'reference' && !retrying && (
        <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4">
          {conformingNote}
        </p>
      )}

      {!retrying &&
        warnings.filter((w) => !(conformingSource === 'reference' && w.startsWith('적격대출:'))).length >
          0 && (
          <ul className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1">
            {warnings
              .filter((w) => !(conformingSource === 'reference' && w.startsWith('적격대출:')))
              .map((w) => (
                <li key={w}>· {w}</li>
              ))}
          </ul>
        )}

      {configured && (filter === 'all' ? items.length > 0 : filtered.length > 0 || conformingUnavailable) && (
        <p className="text-xs font-bold text-[var(--text-secondary)]">
          {filter === 'all'
            ? `HF 실시간 금리 ${items.length}건`
            : showConformingReference
              ? `적격대출 참고 금리 ${filtered.length}건`
              : showConformingError
                ? '적격대출 — 공공데이터 API 일시 오류'
                : `HF 실시간 금리 ${filtered.length}건`}
          {updatedAt &&
            ` · ${new Date(updatedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}`}
        </p>
      )}

      {error && !retrying && (
        <div className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => load({ manual: true })}
            disabled={busy}
            className="ui-btn-primary text-xs px-5 py-2 mt-4 min-h-0 disabled:opacity-50"
          >
            다시 불러오기
          </button>
        </div>
      )}

      <p className="text-xs font-medium text-[var(--text-muted)]">
        한국주택금융공사(HF) 공공데이터·한국은행 ECOS 기준입니다. 실제 대출 금리·우대는
        금융기관·기금e든든에서 확인하세요. 빅루트는 정보 제공만 합니다.
      </p>

      {loading && !items.length && (
        <p className="text-center py-16 font-bold text-[var(--text-muted)]">
          금리 정보를 불러오는 중…
        </p>
      )}

      {refreshing && items.length > 0 && (
        <p className="text-center py-4 text-xs font-bold text-[var(--text-muted)]">
          최신 금리를 다시 불러오는 중…
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="ui-card p-10 text-center">
          {showConformingError ? (
            <>
              <p className="font-black">적격대출 금리를 지금 불러올 수 없습니다</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">{conformingUnavailable}</p>
              <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed">
                <strong className="text-[var(--text-secondary)]">원인:</strong> HF 적격대출 API가
                공공데이터 서버에서 HTTP 500을 돌려줍니다. 빅루트·인증키 문제가 아니라
                전세·디딤돌만 정상인 상태입니다.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => load({ manual: true })}
                  disabled={busy}
                  className="ui-btn-primary text-sm px-6 py-2.5 min-h-0 disabled:opacity-50"
                >
                  {busy ? '다시 불러오는 중…' : '다시 불러오기'}
                </button>
                <a
                  href="https://www.data.go.kr/data/15082047/openapi.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-btn-secondary text-sm px-6 py-2.5 min-h-0"
                >
                  공공데이터포털 API 안내
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="font-black">표시할 금리가 없습니다.</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                {configured
                  ? '아래 버튼으로 다시 불러와 보세요.'
                  : '공공데이터포털 인증키를 설정한 뒤 HF API 활용신청을 확인해 주세요.'}
              </p>
              {configured && (
                <button
                  type="button"
                  onClick={() => load({ manual: true })}
                  disabled={busy}
                  className="ui-btn-primary text-sm px-6 py-2.5 mt-6 min-h-0 disabled:opacity-50"
                >
                  {busy ? '다시 불러오는 중…' : '다시 불러오기'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ul className={`space-y-4 ${refreshing ? 'opacity-60 pointer-events-none' : ''}`}>
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
