'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHero from '@/app/components/layout/PageHero';
import PageShell from '@/app/components/layout/PageShell';
import { MOVE_IN_CHECKLIST } from '@/lib/move-in-checklist-data';
import { supabase } from '@/lib/supabase';
import { getChecklistDone, setChecklistItem } from '@/lib/tenant-lease-storage';

const SLUG = 'move-in';

export default function MoveInChecklistRefresh() {
  const [userId, setUserId] = useState<string | undefined>();
  const [done, setDone] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id);
    setDone(getChecklistDone(SLUG, user?.id));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { total, completed } = useMemo(() => {
    const items = MOVE_IN_CHECKLIST.flatMap((p) => p.items);
    const completedCount = items.filter((i) => done[i.id]).length;
    return { total: items.length, completed: completedCount };
  }, [done]);

  const pct = total ? Math.round((completed / total) * 100) : 0;

  const toggle = (id: string) => {
    const next = setChecklistItem(SLUG, id, !done[id], userId);
    setDone(next);
  };

  return (
    <PageShell>
      <PageHero
        badge="입주 직후 · ROOT"
        title={
          <>
            입주 직후
            <br />
            <span className="text-[var(--brand)]">체크리스트</span>
          </>
        }
        description="입주 당일부터 30일까지, 권리를 지키는 필수 항목을 순서대로 챙기세요."
      />

      <div className="ui-card p-6 mb-8 space-y-3">
        <div className="flex justify-between text-sm font-black">
          <span>진행률</span>
          <span className="text-[var(--brand)]">
            {completed}/{total} ({pct}%)
          </span>
        </div>
        <div className="h-3 rounded-full bg-[var(--bg-muted)] overflow-hidden">
          <div
            className="h-full bg-[var(--brand)] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs font-medium text-[var(--text-secondary)]">
          체크 상태는 이 기기(로그인 시 계정)에 저장됩니다.
        </p>
      </div>

      <div className="space-y-10">
        {MOVE_IN_CHECKLIST.map((phase) => (
          <section key={phase.id} className="space-y-4">
            <div>
              <h2 className="text-lg font-black">{phase.label}</h2>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{phase.subtitle}</p>
            </div>
            <ul className="space-y-3">
              {phase.items.map((item) => (
                <li key={item.id}>
                  <label className="ui-card p-4 flex gap-4 cursor-pointer hover:border-[var(--brand)] transition-colors">
                    <input
                      type="checkbox"
                      checked={!!done[item.id]}
                      onChange={() => toggle(item.id)}
                      className="mt-1 h-5 w-5 accent-[var(--brand)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm">{item.title}</p>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                      {item.tip && (
                        <p className="text-[11px] font-bold text-[var(--brand)] mt-2">{item.tip}</p>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 ui-card p-5 text-center space-y-3">
        <p className="text-sm font-bold">일정까지 한 번에 보려면</p>
        <Link href="/lease-timeline" className="ui-btn-primary text-sm">
          개인 임대차 타임라인 →
        </Link>
      </div>
    </PageShell>
  );
}
