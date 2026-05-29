'use client';

import { useUiTheme } from '@/lib/theme-context';
import LeaseTimelineClassic from './LeaseTimelineClassic';
import LeaseTimelineRefresh from './LeaseTimelineRefresh';

export default function LeaseTimelinePage() {
  const { theme } = useUiTheme();
  return theme === 'classic' ? <LeaseTimelineClassic /> : <LeaseTimelineRefresh />;
}
