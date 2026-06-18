'use client';

import { useEffect } from 'react';
import { releasePageInteraction } from '@/lib/reset-stuck-ui';

/** bfcache·뒤로가기 후 모달 state·body 잠금 복구 (DOM 직접 제거 금지) */
export default function PageInteractionRecovery() {
  useEffect(() => {
    const recover = () => releasePageInteraction();

    recover();
    window.addEventListener('pageshow', recover);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') recover();
    });

    return () => {
      window.removeEventListener('pageshow', recover);
    };
  }, []);

  return null;
}
