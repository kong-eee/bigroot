'use client';

import { useUiTheme } from '@/lib/theme-context';
import DepositReturnClassic from './DepositReturnClassic';
import DepositReturnRefresh from './DepositReturnRefresh';

export default function DepositReturnPage() {
  const { theme } = useUiTheme();
  return theme === 'classic' ? <DepositReturnClassic /> : <DepositReturnRefresh />;
}
