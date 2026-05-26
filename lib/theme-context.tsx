'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { UI_THEME_DEFAULT, UI_THEME_KEY, isUiTheme, type UiTheme } from '@/lib/ui-theme';

type ThemeContextValue = {
  theme: UiTheme;
  setTheme: (theme: UiTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<UiTheme>(UI_THEME_DEFAULT);

  useEffect(() => {
    const stored = localStorage.getItem(UI_THEME_KEY);
    const initial = isUiTheme(stored) ? stored : UI_THEME_DEFAULT;
    setThemeState(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const setTheme = useCallback((next: UiTheme) => {
    setThemeState(next);
    localStorage.setItem(UI_THEME_KEY, next);
    document.documentElement.setAttribute('data-theme', next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useUiTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useUiTheme must be used within ThemeProvider');
  return ctx;
}
