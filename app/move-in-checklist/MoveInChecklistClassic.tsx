'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MOVE_IN_CHECKLIST } from '@/lib/move-in-checklist-data';
import { supabase } from '@/lib/supabase';
import { getChecklistDone, setChecklistItem } from '@/lib/tenant-lease-storage';

const SLUG = 'move-in';

export default function MoveInChecklistClassic() {
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

  const { total, completed, pct } = useMemo(() => {
    const items = MOVE_IN_CHECKLIST.flatMap((p) => p.items);
    const c = items.filter((i) => done[i.id]).length;
    const t = items.length;
    return { total: t, completed: c, pct: t ? Math.round((c / t) * 100) : 0 };
  }, [done]);

  const toggle = (id: string) => setDone(setChecklistItem(SLUG, id, !done[id], userId));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-3xl mx-auto px-6 pt-28">
        <header className="text-center mb-12">
          <span className="text-xs font-black text-[#007AFF] tracking-widest">MOVE-IN CHECKLIST</span>
          <h1 className="text-4xl font-[1000] mt-2">입주 직후 체크리스트</h1>
          <p className="text-slate-500 font-bold mt-3">입주 당일 ~ 30일, 권리의 뿌리를 세우세요.</p>
        </header>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl mb-10">
          <div className="flex justify-between font-black text-sm mb-3">
            <span>진행률</span>
            <span className="text-[#007AFF]">
              {completed}/{total} · {pct}%
            </span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#007AFF] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {MOVE_IN_CHECKLIST.map((phase) => (
          <section key={phase.id} className="mb-12">
            <h2 className="text-2xl font-black text-slate-900 mb-1">{phase.label}</h2>
            <p className="text-sm font-bold text-slate-400 mb-6">{phase.subtitle}</p>
            <div className="space-y-4">
              {phase.items.map((item) => (
                <label
                  key={item.id}
                  className="flex gap-4 bg-white p-6 rounded-3xl border-2 border-slate-50 cursor-pointer hover:border-blue-200 transition-all shadow-sm"
                >
                  <input
                    type="checkbox"
                    checked={!!done[item.id]}
                    onChange={() => toggle(item.id)}
                    className="h-6 w-6 accent-[#007AFF] mt-0.5"
                  />
                  <div>
                    <p className="font-black text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">{item.desc}</p>
                    {item.tip && (
                      <p className="text-xs font-black text-[#007AFF] mt-2">{item.tip}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </section>
        ))}

        <div className="text-center">
          <Link
            href="/lease-timeline"
            className="inline-block px-10 py-4 bg-[#007AFF] text-white font-black rounded-2xl hover:scale-105 transition-transform"
          >
            타임라인 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
