'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  buildLeaseTimeline,
  formatDateKo,
  TIMELINE_PHASE_LABEL,
  TIMELINE_PHASE_ORDER,
  TIMELINE_STATUS_LABEL,
  type PropertyType,
  type TimelineEvent,
  type TimelinePhase,
} from '@/lib/lease-timeline';
import { useLeaseProfile } from '@/lib/use-lease-profile';

function StatusPill({ status }: { status: TimelineEvent['status'] }) {
  const map = {
    done: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
    now: 'bg-[var(--brand)] text-[var(--brand-on,#fff)]',
    soon: 'bg-[var(--accent-soft)] text-[var(--accent)]',
    upcoming: 'bg-[var(--brand-soft)] text-[var(--brand)]',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${map[status]}`}>
      {TIMELINE_STATUS_LABEL[status]}
    </span>
  );
}

export default function LeaseTimelineClassic() {
  const {
    user,
    loading,
    propertyType,
    contractEndDate,
    contractSignedDate,
    moveInDate,
    setPropertyType,
    setContractEndDate,
    setContractSignedDateState,
    setMoveInDateState,
    saveProfile,
  } = useLeaseProfile();

  const [typeInput, setTypeInput] = useState<PropertyType>('주택');
  const [signedInput, setSignedInput] = useState('');
  const [moveInput, setMoveInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [editing, setEditing] = useState(false);

  const events = useMemo(
    () =>
      buildLeaseTimeline({
        propertyType,
        contractSignedDate: contractSignedDate || undefined,
        moveInDate: moveInDate || undefined,
        contractEndDate: contractEndDate || undefined,
      }),
    [propertyType, contractSignedDate, moveInDate, contractEndDate]
  );

  const eventsByPhase = useMemo(() => {
    const map: Record<TimelinePhase, TimelineEvent[]> = {
      contract: [],
      move_in: [],
      tenancy_end: [],
    };
    for (const ev of events) {
      map[ev.phase].push(ev);
    }
    return map;
  }, [events]);

  const openEdit = () => {
    setTypeInput(propertyType);
    setSignedInput(contractSignedDate);
    setMoveInput(moveInDate);
    setEndInput(contractEndDate);
    setEditing(true);
  };

  const handleSave = async () => {
    const ok = await saveProfile({
      contractEndDate: endInput,
      contractSignedDate: signedInput,
      propertyType: typeInput,
      moveInDate: moveInput,
    });
    if (ok) {
      setPropertyType(typeInput);
      setContractEndDate(endInput);
      setContractSignedDateState(signedInput);
      setMoveInDateState(moveInput);
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] pt-28 flex items-center justify-center font-black text-[var(--text-muted)]">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] pb-24">
      <div className="max-w-6xl mx-auto px-6 pt-28">
        <header className="text-center mb-14 space-y-4">
          <span className="inline-block px-4 py-1.5 bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-black rounded-full">
            MY LEASE TIMELINE
          </span>
          <h1 className="text-4xl md:text-5xl font-[1000] tracking-tight">
            개인 임대차 <span className="text-[var(--brand)]">타임라인</span>
          </h1>
          <p className="text-[var(--text-secondary)] font-bold max-w-2xl mx-auto leading-relaxed">
            계약서 작성 → 임대차 신고·확정일자 → 입주·전입신고 → 갱신·만기·보증금 반환까지 한눈에
            확인하세요.
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-10">
          <aside className="space-y-6">
            <div className="bg-[var(--text-primary)] text-white rounded-[2.5rem] p-8 shadow-2xl space-y-5">
              <h2 className="text-lg font-black">일정 설정</h2>
              {!user && (
                <p className="text-[11px] text-white/70 font-medium bg-white/10 p-3 rounded-xl">
                  로그인 시 만기일이 마이페이지와 동기화됩니다. 계약·입주일은 이 기기에 저장됩니다.
                </p>
              )}
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(['주택', '상가'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeInput(t)}
                        className={`py-2.5 rounded-xl text-xs font-black ${
                          typeInput === t ? 'bg-white text-[var(--text-primary)]' : 'bg-white/10 text-[var(--text-muted)]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black text-white/60">계약서 작성일</span>
                    <input
                      type="date"
                      value={signedInput}
                      onChange={(e) => setSignedInput(e.target.value)}
                      className="w-full p-3 rounded-xl bg-black/25 border border-white/15 text-sm font-bold"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black text-white/60">입주일</span>
                    <input
                      type="date"
                      value={moveInput}
                      onChange={(e) => setMoveInput(e.target.value)}
                      className="w-full p-3 rounded-xl bg-black/25 border border-white/15 text-sm font-bold"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black text-white/60">계약 만기일</span>
                    <input
                      type="date"
                      value={endInput}
                      onChange={(e) => setEndInput(e.target.value)}
                      className="w-full p-3 rounded-xl bg-black/25 border border-white/15 text-sm font-bold"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full py-3 bg-[var(--brand)] text-[var(--brand-on,#fff)] rounded-xl font-black text-sm"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-sm font-bold">
                  <p>{propertyType}</p>
                  <p>계약서 작성 {contractSignedDate || '미설정'}</p>
                  <p>입주 {moveInDate || '미설정'}</p>
                  <p>만기 {contractEndDate || '미설정'}</p>
                  <button
                    type="button"
                    onClick={openEdit}
                    className="w-full mt-3 py-3 bg-white/10 rounded-xl text-xs font-black hover:bg-white/20"
                  >
                    수정하기
                  </button>
                </div>
              )}
            </div>
            <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm space-y-2 text-sm font-black">
              <Link href="/contract" className="block text-[var(--brand)] hover:underline">
                계약전 체크
              </Link>
              <Link href="/move-in-checklist" className="block text-[var(--brand)] hover:underline">
                입주 체크리스트
              </Link>
              <Link href="/deposit-return" className="block text-[var(--brand)] hover:underline">
                보증금 반환 가이드
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-2 space-y-10">
            {events.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-12 text-center text-[var(--text-muted)] font-bold border border-[var(--border)]">
                계약서 작성일·입주일·만기일 중 하나 이상을 입력해 주세요.
              </div>
            ) : (
              TIMELINE_PHASE_ORDER.map((phase) => {
                const phaseEvents = eventsByPhase[phase];
                if (phaseEvents.length === 0) return null;
                return (
                  <section key={phase} className="space-y-4">
                    <h2 className="text-sm font-black text-[var(--text-secondary)] px-2">
                      {TIMELINE_PHASE_LABEL[phase]}
                    </h2>
                    {phaseEvents.map((ev) => (
                      <article
                        key={ev.id}
                        className="bg-white rounded-[2rem] border-2 border-[var(--border)] p-8 shadow-sm hover:border-[var(--brand)] transition-all"
                      >
                        <div className="flex flex-wrap gap-2 mb-3">
                          <StatusPill status={ev.status} />
                          <span className="text-[10px] font-black text-[var(--text-muted)]">
                            {formatDateKo(ev.date)}
                            {ev.daysUntil > 0 && ev.status !== 'done' ? ` · D-${ev.daysUntil}` : ''}
                          </span>
                        </div>
                        <h3 className="text-xl font-black mb-2">{ev.title}</h3>
                        <p className="text-[var(--text-secondary)] font-medium text-sm leading-relaxed">
                          {ev.description}
                        </p>
                        {ev.href && (
                          <Link
                            href={ev.href}
                            className="inline-block mt-4 text-xs font-black text-[var(--brand)] underline"
                          >
                            자세히 →
                          </Link>
                        )}
                      </article>
                    ))}
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
