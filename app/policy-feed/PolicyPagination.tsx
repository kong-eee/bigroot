'use client';

type PolicyPaginationProps = {
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
};

function pageNumbers(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
}

export default function PolicyPagination({
  page,
  totalPages,
  loading,
  onPageChange,
}: PolicyPaginationProps) {
  if (totalPages <= 1) return null;

  const nums = pageNumbers(page, totalPages);

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5 pt-2"
      aria-label="정책 목록 페이지"
    >
      <button
        type="button"
        disabled={loading || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="min-w-[2.5rem] px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-bold disabled:opacity-40 hover:border-[var(--text-primary)]"
      >
        이전
      </button>

      {nums.map((n, i) => {
        const prev = nums[i - 1];
        const gap = prev != null && n - prev > 1;
        return (
          <span key={n} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-[var(--text-muted)]">…</span>}
            <button
              type="button"
              disabled={loading}
              onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`min-w-[2.5rem] px-2 py-2 rounded-lg border text-xs font-black transition-colors ${
                n === page
                  ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-on,#fff)]'
                  : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--brand)]'
              }`}
            >
              {n}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        disabled={loading || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="min-w-[2.5rem] px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-bold disabled:opacity-40 hover:border-[var(--text-primary)]"
      >
        다음
      </button>
    </nav>
  );
}
