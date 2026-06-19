'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageHero from '@/app/components/layout/PageHero';
import PageShell from '@/app/components/layout/PageShell';
import { supabase } from '@/lib/supabase';
import { getVisitChecklistItemIds } from '@/lib/property-visit-checklist-data';
import {
  checklistProgress,
  formatWon,
  type PropertyVisit,
} from '@/lib/property-visit-types';
import type { GoldenPropertyType } from '@/lib/golden-time-schedule';
import VisitComparePanel from './VisitComparePanel';
import VisitEditorPanel from './VisitEditorPanel';

type ViewMode = 'list' | 'edit' | 'compare';
type FilterType = 'all' | GoldenPropertyType;

export default function PropertyVisitPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterType>('all');
  const [editing, setEditing] = useState<PropertyVisit | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [schemaHint, setSchemaHint] = useState(false);

  const loadAuth = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    setUser(authUser ? { id: authUser.id } : null);
  }, []);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const qs = filter === 'all' ? '' : `?propertyType=${encodeURIComponent(filter)}`;
    const res = await fetch(`/api/property-visits${qs}`);
    const data = await res.json();
    if (!data.success) {
      setLoadError(data.error || '목록을 불러오지 못했습니다.');
      setSchemaHint(String(data.error || '').includes('property_visits'));
      setVisits([]);
    } else {
      setVisits(data.visits as PropertyVisit[]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    void fetchVisits();
  }, [fetchVisits, user?.id]);

  const compareVisits = useMemo(
    () => visits.filter((v) => compareIds.has(v.id)),
    [visits, compareIds]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size >= 3) {
        alert('한 번에 최대 3개까지 비교할 수 있습니다.');
        return prev;
      } else next.add(id);
      return next;
    });
  };

  const openNew = () => {
    setEditing(null);
    setView('edit');
  };

  const openEdit = (visit: PropertyVisit) => {
    setEditing(visit);
    setView('edit');
  };

  const handleSaved = (visit: PropertyVisit) => {
    setEditing(visit);
    setVisits((prev) => {
      const idx = prev.findIndex((v) => v.id === visit.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = visit;
        return next;
      }
      return [visit, ...prev];
    });
  };

  return (
    <PageShell wide>
      <PageHero
        badge="임장 체크"
        title={
          <>
            현장에서 본 것,
            <br />
            <span className="text-[var(--brand)]">빠짐없이 기록하세요</span>
          </>
        }
        description="주택·상가 임장 때 주소, 금액, 향, 체크리스트, 사진을 저장하고 나중에 비교할 수 있습니다."
      />

      {!user ? (
        <div className="ui-card p-8 text-center space-y-4">
          <p className="text-lg font-black">로그인하면 임장 기록이 계정에 저장됩니다.</p>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            여러 매물을 방문할 때마다 적어 두고, 관심·보류·제외로 정리해 보세요.
          </p>
          <p className="text-sm font-bold text-[var(--text-muted)]">
            상단 <span className="text-[var(--brand)]">로그인</span> 버튼을 눌러 시작하세요.
          </p>
        </div>
      ) : view === 'compare' ? (
        <VisitComparePanel visits={compareVisits} onClose={() => setView('list')} />
      ) : view === 'edit' ? (
        <VisitEditorPanel
          visit={editing}
          userId={user.id}
          onSaved={handleSaved}
          onCancel={() => setView('list')}
          onDeleted={() => {
            if (editing) {
              setVisits((prev) => prev.filter((v) => v.id !== editing.id));
              setCompareIds((prev) => {
                const next = new Set(prev);
                next.delete(editing.id);
                return next;
              });
            }
            setEditing(null);
            setView('list');
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="ui-tab-bar">
              {(
                [
                  ['all', '전체'],
                  ['주택', '🏠 주택'],
                  ['상가', '🏪 상가'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={filter === value ? 'ui-tab ui-tab-active' : 'ui-tab'}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {compareIds.size >= 2 && (
                <button
                  type="button"
                  onClick={() => setView('compare')}
                  className="ui-btn-secondary text-sm px-4 py-2"
                >
                  비교 ({compareIds.size})
                </button>
              )}
              <button type="button" onClick={openNew} className="ui-btn-primary text-sm px-5 py-2">
                + 새 임장
              </button>
            </div>
          </div>

          {schemaHint && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
              Supabase SQL Editor에서{' '}
              <code className="text-xs">supabase/migrations/20260602000000_property_visits.sql</code>{' '}
              을 실행해 주세요.
            </div>
          )}

          {loadError && !schemaHint && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="ui-card p-10 text-center font-bold text-[var(--text-secondary)]">
              불러오는 중…
            </div>
          ) : visits.length === 0 ? (
            <div className="ui-card p-10 text-center space-y-4">
              <p className="text-lg font-black">아직 임장 기록이 없습니다.</p>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                매물을 보러 갈 때마다 주소·금액·체크리스트를 적어 두면 계약 전에 비교하기 좋습니다.
              </p>
              <button type="button" onClick={openNew} className="ui-btn-primary text-sm px-5 py-2">
                첫 임장 기록하기
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visits.map((visit) => {
                const ids = getVisitChecklistItemIds(visit.propertyType);
                const { done, total, pct } = checklistProgress(visit.checklist, ids);
                const selected = compareIds.has(visit.id);

                return (
                  <li key={visit.id} className="ui-card p-5 space-y-4 hover:border-[var(--brand)] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(visit)}
                        className="text-left flex-1 min-w-0"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-[var(--bg-muted)]">
                            {visit.propertyType}
                          </span>
                          {visit.isFavorite && <span aria-label="즐겨찾기">⭐</span>}
                          {visit.decision && (
                            <span className="text-xs font-black px-2 py-0.5 rounded-full border border-[var(--brand)] text-[var(--brand)]">
                              {visit.decision}
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-lg mt-2 truncate">{visit.title}</h3>
                        {visit.address && (
                          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1 truncate">
                            {visit.address}
                          </p>
                        )}
                      </button>
                      <label className="flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCompare(visit.id)}
                          className="accent-[var(--brand)]"
                        />
                        비교
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[var(--text-secondary)]">
                      <div>임장일: {visit.visitedAt}</div>
                      <div>
                        별점: {visit.overallScore ? `${visit.overallScore}점` : '-'}
                      </div>
                      <div>보증금: {formatWon(visit.depositWon)}</div>
                      <div>월세: {formatWon(visit.monthlyRentWon)}</div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-black">
                        <span>체크리스트</span>
                        <span className="text-[var(--brand)]">
                          {done}/{total}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--brand)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-medium text-[var(--text-muted)]">
                      <span>사진 {visit.photos.length}장</span>
                      <button
                        type="button"
                        onClick={() => openEdit(visit)}
                        className="font-black text-[var(--brand)]"
                      >
                        열기 →
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-center text-xs font-medium text-[var(--text-muted)]">
            계약 전 체크는 <Link href="/contract" className="text-[var(--brand)] font-bold">계약전 체크</Link>
            에서, 안전 진단은 <Link href="/safety-check" className="text-[var(--brand)] font-bold">안전진단</Link>
            에서 이어서 확인하세요.
          </p>
        </div>
      )}
    </PageShell>
  );
}
