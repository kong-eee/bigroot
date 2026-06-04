'use client';

import { useState } from 'react';
import PageHero from '@/app/components/layout/PageHero';
import PageShell from '@/app/components/layout/PageShell';
import YouthPolicyTab from './YouthPolicyTab';

type TabId = 'youth' | 'loan' | 'notices';

const TABS: { id: TabId; label: string; ready: boolean }[] = [
  { id: 'youth', label: '① 지역 청년정책', ready: true },
  { id: 'loan', label: '② 기금·대출 금리', ready: false },
  { id: 'notices', label: '③ 중요 공지', ready: false },
];

export default function PolicyFeedPage() {
  const [tab, setTab] = useState<TabId>('youth');

  return (
    <PageShell wide>
      <PageHero
        badge="Policy Feed"
        title={
          <>
            청년 주거·기금
            <br />
            <span className="text-[var(--brand)]">변동 알림 센터</span>
          </>
        }
        description="내 지역 청년 주거 정책과 기금·대출 변동을 한곳에서 확인합니다. (1단계: 지역 청년정책 피드)"
      />

      <div className="ui-tab-bar mb-8 max-w-3xl mx-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`ui-tab flex-none ${tab === t.id ? 'ui-tab-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'youth' && <YouthPolicyTab />}

      {tab === 'loan' && (
        <div className="ui-card p-10 text-center max-w-xl mx-auto">
          <p className="font-black text-lg">기금·대출 금리 변동</p>
          <p className="text-sm text-[var(--text-secondary)] mt-3 font-medium">
            한국주택금융공사·기금e든든 API 연동 후 이 탭에 금리 타임라인을 표시할 예정입니다.
          </p>
        </div>
      )}

      {tab === 'notices' && (
        <div className="ui-card p-10 text-center max-w-xl mx-auto">
          <p className="font-black text-lg">중요 공지</p>
          <p className="text-sm text-[var(--text-secondary)] mt-3 font-medium">
            금리 인상·모집 공고 등 선별 공지를 모아 보여 줄 예정입니다.
          </p>
        </div>
      )}
    </PageShell>
  );
}
