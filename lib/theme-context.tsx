'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { UI_THEME_KEY, type UiTheme } from '@/lib/ui-theme';

type ThemeContextValue = {
  theme: UiTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** @deprecated ThemeProvider 제거됨. layout data-theme="classic" 사용 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'classic');
    localStorage.setItem(UI_THEME_KEY, 'classic');
  }, []);

  const value = useMemo(() => ({ theme: 'classic' as const }), []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useUiTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'classic' };
  return ctx;
}
