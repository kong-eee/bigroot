'use client';

import { useUiTheme } from '@/lib/theme-context';
import HomeClassic from './components/HomeClassic';
import HomeRefresh from './components/HomeRefresh';

export default function Home() {
  const { theme } = useUiTheme();
  return theme === 'classic' ? <HomeClassic /> : <HomeRefresh />;
}
