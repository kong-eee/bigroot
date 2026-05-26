'use client';

import { useEffect, useState } from 'react';
import { UI_THEME_KEY, isUiTheme, type UiTheme } from '@/lib/ui-theme';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<UiTheme>('refresh');

  useEffect(() => {
    const stored = localStorage.getItem(UI_THEME_KEY);
    if (isUiTheme(stored)) setTheme(stored);
  }, []);

  const apply = (next: UiTheme) => {
    setTheme(next);
    localStorage.setItem(UI_THEME_KEY, next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[125] flex rounded-full border border-[var(--border)] bg-[var(--bg-surface)] p-1 shadow-lg text-xs font-bold"
      role="group"
      aria-label="UI 테마 선택"
    >
      <button
        type="button"
        onClick={() => apply('refresh')}
        className={`px-3 py-2 rounded-full transition-colors ${
          theme === 'refresh'
            ? 'bg-[var(--brand)] text-white'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
        }`}
      >
        새 UI
      </button>
      <button
        type="button"
        onClick={() => apply('classic')}
        className={`px-3 py-2 rounded-full transition-colors ${
          theme === 'classic'
            ? 'bg-[var(--brand)] text-white'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
        }`}
      >
        이전 UI
      </button>
    </div>
  );
}
