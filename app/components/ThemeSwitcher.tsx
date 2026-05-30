'use client';

import { useUiTheme } from '@/lib/theme-context';
import type { UiTheme } from '@/lib/ui-theme';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useUiTheme();

  const btn = (value: UiTheme, label: string) => (
    <button
      type="button"
      onClick={() => setTheme(value)}
      className={`px-3 py-2 rounded-full transition-colors ${
        theme === value
          ? 'bg-[var(--brand)] text-[var(--brand-on,#fff)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed bottom-4 right-4 z-[125] flex flex-col items-end gap-1"
      aria-label="UI 테마 선택"
    >
      <p className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-surface)]/90 px-2 py-0.5 rounded-md border border-[var(--border)]">
        이전 UI = 예전 화면 전체 복원
      </p>
      <div className="flex rounded-full border border-[var(--border)] bg-[var(--bg-surface)] p-1 shadow-lg text-xs font-bold">
        {btn('refresh', '새 UI')}
        {btn('classic', '이전 UI')}
      </div>
    </div>
  );
}
