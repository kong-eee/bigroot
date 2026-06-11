'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SearchResult = {
  id: string;
  pageLabel: string;
  section: string;
  snippet: string;
  href: string;
  source: 'page' | 'community';
};

type SiteSearchProps = {
  variant?: 'icon' | 'compact' | 'full';
  className?: string;
};

export default function SiteSearch({ variant = 'icon', className = '' }: SiteSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/site-search?q=${encodeURIComponent(trimmed)}&limit=20`);
      const body = (await res.json()) as { results?: SearchResult[] };
      setResults(body.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void runSearch(query), 200);
    return () => window.clearTimeout(timer);
  }, [open, query, runSearch]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const openSearch = () => setOpen(true);

  const trigger =
    variant === 'full' ? (
      <button
        type="button"
        onClick={openSearch}
        className={`flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-left text-sm font-bold text-[var(--text-muted)] hover:border-[var(--brand)] ${className}`}
      >
        <span aria-hidden>🔍</span>
        <span className="truncate">기능·가이드 검색</span>
        <span className="ml-auto hidden lg:inline text-[10px] font-black opacity-60">Ctrl+K</span>
      </button>
    ) : variant === 'compact' ? (
      <button
        type="button"
        onClick={openSearch}
        aria-label="검색"
        className={`flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 text-xs font-bold text-[var(--text-muted)] hover:border-[var(--brand)] max-w-[14rem] lg:max-w-xs ${className}`}
      >
        <span aria-hidden>🔍</span>
        <span className="truncate">검색</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={openSearch}
        aria-label="검색"
        className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-base hover:border-[var(--brand)] ${className}`}
      >
        🔍
      </button>
    );

  return (
    <>
      {trigger}

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-start justify-center bg-black/40 p-4 pt-[calc(var(--nav-height)+0.75rem)] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={inputId}
          onClick={close}
        >
          <div
            className="ui-card w-full max-w-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
              <span className="text-lg" aria-hidden>
                🔍
              </span>
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="보증금, 갱신, 전입신고, 골든타임…"
                className="ui-input flex-1 border-0 bg-transparent px-0 py-1 text-sm font-bold shadow-none focus:ring-0"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={close}
                className="text-xs font-black text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                닫기
              </button>
            </div>

            <div className="max-h-[min(24rem,55vh)] overflow-y-auto">
              {loading && (
                <p className="px-4 py-8 text-center text-sm font-bold text-[var(--text-muted)]">
                  검색 중…
                </p>
              )}
              {!loading && query.trim() && results.length === 0 && (
                <p className="px-4 py-8 text-center text-sm font-bold text-[var(--text-muted)]">
                  검색 결과가 없습니다.
                </p>
              )}
              {!loading && !query.trim() && (
                <p className="px-4 py-6 text-xs font-bold text-[var(--text-muted)]">
                  페이지·가이드·커뮤니티 글에서 검색합니다.
                </p>
              )}
              {!loading &&
                results.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      close();
                      router.push(row.href);
                    }}
                    className="block w-full border-b border-[var(--border)] px-4 py-3 text-left last:border-0 hover:bg-[var(--bg-muted)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[var(--brand)]">
                        {row.pageLabel}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">
                        {row.section}
                      </span>
                      {row.source === 'community' && (
                        <span className="text-[10px] font-black text-emerald-600">커뮤니티</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-bold text-[var(--text-primary)] leading-snug">
                      {row.snippet}
                    </p>
                  </button>
                ))}
            </div>

            <div className="border-t border-[var(--border)] px-4 py-2 text-[10px] font-bold text-[var(--text-muted)]">
              Enter로 이동 · Esc 닫기 ·{' '}
              <Link href="/community" className="text-[var(--brand)] hover:underline" onClick={close}>
                커뮤니티
              </Link>
              에서 더 찾기
            </div>
          </div>
        </div>
      )}
    </>
  );
}
