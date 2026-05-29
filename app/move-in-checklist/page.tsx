'use client';

import { useUiTheme } from '@/lib/theme-context';
import MoveInChecklistClassic from './MoveInChecklistClassic';
import MoveInChecklistRefresh from './MoveInChecklistRefresh';

export default function MoveInChecklistPage() {
  const { theme } = useUiTheme();
  return theme === 'classic' ? <MoveInChecklistClassic /> : <MoveInChecklistRefresh />;
}
