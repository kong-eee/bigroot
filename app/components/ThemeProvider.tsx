'use client';

import { useEffect } from 'react';
import { UI_THEME_DEFAULT, UI_THEME_KEY, isUiTheme } from '@/lib/ui-theme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem(UI_THEME_KEY);
    const theme = isUiTheme(stored) ? stored : UI_THEME_DEFAULT;
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return <>{children}</>;
}
