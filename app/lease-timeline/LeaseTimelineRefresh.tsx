'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import PageHero from '@/app/components/layout/PageHero';
import PageShell from '@/app/components/layout/PageShell';
import {
  buildLeaseTimeline,
  formatDateKo,
  TIMELINE_STATUS_LABEL,
  type PropertyType,
  type TimelineEvent,
} from '@/lib/lease-timeline';
import { useLeaseProfile } from '@/lib/use-lease-profile';

function StatusBadge({ status }: { status: TimelineEvent['status'] }) {
  const cls =
    status === 'done'
      ? 'bg-slate-100 text-slate-500'
      : status === 'now'
        ? 'bg-[var(--brand)] text-white'
        : status === 'soon'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-[var(--brand-soft)] text-[var(--brand)]';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${cls}`}>
      {TIMELINE_STATUS_LABEL[status]}
    </span>
  );
}

export default function LeaseTimelineRefresh() {
  const {
    user,
    loading,
    propertyType,
    contractEndDate,
    moveInDate,
    setPropertyType,
    setContractEndDate,
    setMoveInDateState,
    saveProfile,
  } = useLeaseProfile();

  const [typeInput, setTypeInput] = useState<PropertyType>('주택');
  const [endInput, setEndInput] = useState('');
  const [moveInput, setMoveInput] = useState('');
  const [editing, setEditing] = useState(false);

  const events = useMemo(
    () =>
      buildLeaseTimeline({
        propertyType,
        moveInDate: moveInDate || undefined,
        contractEndDate: contractEndDate || undefined,
      }),
    [propertyType, moveInDate, contractEndDate]
  );

  const openEdit = () => {
    setTypeInput(propertyType);
    setEndInput(contractEndDate);
    setMoveInput(moveInDate);
    setEditing(true);
  };

  const handleSave = async () => {
    const ok = await saveProfile({
      contractEndDate: endInput,
      propertyType: typeInput,
      moveInDate: moveInput,
    });
    if (ok) {
      setPropertyType(typeInput);
      setContractEndDate(endInput);
      setMoveInDateState(moveInput);
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="text-center py-20 font-black text-[var(--text-muted)] animate-pulse">
          불러오는 중...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <PageHero
        badge="내 임대차 · ROUTE"
        title={
          <>
            개인 임대차
            <br />
            <span className="text-[var(--brand)]">타임라인</span>
          </>
        }
        description="입주부터 갱신·만기·보증금 반환까지, 내 일정을 한눈에 보고 다음 행동을 정하세요."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="ui-card p-6 space-y-4">
            <h2 className="font-black text-base">일정 설정</h2>
            {!user && (
              <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                로그인하면 만기일이 마이페이지와 동기화됩니다. 입주일은 이 기기에 저장됩니다.
              </p>
            )}
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(['주택', '상가'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeInput(t)}
                      className={`py-2 rounded-lg text-xs font-black border ${
                        typeInput === t
                          ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      {t === '주택' ? '🏠 주택' : '🛍️ 상가'}
                    </button>
                  ))}
                </div>
                <label className="block text-[10px] font-black text-[var(--text-muted)]">
                  입주일
                  <input
                    type="date"
                    value={moveInput}
                    onChange={(e) => setMoveInput(e.target.value)}
                    className="mt-1 w-full p-2.5 rounded-lg border border-[var(--border)] text-sm font-bold"
                  />
                </label>
                <label className="block text-[10px] font-black text-[var(--text-muted)]">
                  계약 만기일
                  <input
                    type="date"
                    value={endInput}
                    onChange={(e) => setEndInput(e.target.value)}
                    className="mt-1 w-full p-2.5 rounded-lg border border-[var(--border)] text-sm font-bold"
                  />
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSave} className="ui-btn-primary flex-1 text-sm">
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="ui-btn-secondary text-sm px-4"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm font-medium">
                <p>
                  <span className="text-[var(--text-muted)]">유형</span>{' '}
                  <strong>{propertyType}</strong>
                </p>
                <p>
                  <span className="text-[var(--text-muted)]">입주</span>{' '}
                  <strong>{moveInDate ? formatDateKo(moveInDate) : '미설정'}</strong>
                </p>
                <p>
                  <span className="text-[var(--text-muted)]">만기</span>{' '}
                  <strong>{contractEndDate ? formatDateKo(contractEndDate) : '미설정'}</strong>
                </p>
                <button type="button" onClick={openEdit} className="ui-btn-primary w-full text-sm mt-2">
                  일정 입력·수정
                </button>
              </div>
            )}
          </div>
          <div className="ui-card p-5 space-y-2 text-sm">
            <p className="font-black">연결 메뉴</p>
            <Link href="/move-in-checklist" className="block text-[var(--brand)] font-bold hover:underline">
              입주 직후 체크리스트 →
            </Link>
            <Link href="/deposit-return" className="block text-[var(--brand)] font-bold hover:underline">
              보증금 반환·분쟁 가이드 →
            </Link>
            <Link href="/mypage" className="block text-[var(--text-secondary)] font-bold hover:underline">
              마이페이지
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2">
          {events.length === 0 ? (
            <div className="ui-card p-10 text-center text-[var(--text-secondary)] font-medium">
              입주일 또는 만기일을 입력하면 타임라인이 표시됩니다.
            </div>
          ) : (
            <ol className="relative border-l-2 border-[var(--border)] ml-3 space-y-6 pl-8">
              {events.map((ev) => (
                <li key={ev.id} className="relative">
                  <span
                    className={`absolute -left-[2.15rem] top-1 h-4 w-4 rounded-full border-2 border-white ${
                      ev.status === 'now'
                        ? 'bg-[var(--brand)] ring-4 ring-[var(--brand-soft)]'
                        : ev.status === 'done'
                          ? 'bg-slate-300'
                          : 'bg-[var(--brand-soft)]'
                    }`}
                  />
                  <div className="ui-card p-5 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={ev.status} />
                      <span
                        className={`text-[10px] font-black uppercase ${
                          ev.category === 'root' ? 'text-[var(--brand)]' : 'text-[var(--accent)]'
                        }`}
                      >
                        {ev.category === 'root' ? 'ROOT · 권리' : 'ROUTE · 절차'}
                      </span>
                      {ev.daysUntil > 0 && ev.status !== 'done' && (
                        <span className="text-[10px] font-bold text-[var(--text-muted)]">
                          D-{ev.daysUntil}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[var(--text-muted)]">{formatDateKo(ev.date)}</p>
                    <h3 className="font-black text-base">{ev.title}</h3>
                    <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                      {ev.description}
                    </p>
                    {ev.href && (
                      <Link href={ev.href} className="text-xs font-black text-[var(--brand)] hover:underline">
                        자세히 보기 →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </PageShell>
  );
}
