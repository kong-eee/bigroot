'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import GoldenTimeKakaoReminder from '@/app/components/GoldenTimeKakaoReminder';
import {
  getRenewalWindow,
  todayKstIso,
  type GoldenPropertyType,
} from '@/lib/golden-time-schedule';

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

type Props = {
  propertyType: GoldenPropertyType;
  contractEndDate: string;
  userId: string;
  onSaved: () => void;
};

export default function MypageContractBlock({
  propertyType,
  contractEndDate,
  userId,
  onSaved,
}: Props) {
  const [dateInput, setDateInput] = useState(contractEndDate);
  const [editing, setEditing] = useState(!contractEndDate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDateInput(contractEndDate);
    setEditing(!contractEndDate);
  }, [contractEndDate]);

  const status = useMemo(() => {
    if (!contractEndDate) return null;
    const { windowStart, windowEnd } = getRenewalWindow(contractEndDate, propertyType);
    const today = parseLocalDate(todayKstIso());
    const start = parseLocalDate(windowStart);
    const end = parseLocalDate(windowEnd);
    const endDate = parseLocalDate(contractEndDate);

    if (today < start) {
      const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { label: `통보 시작까지 ${diff}일`, tone: 'muted' as const, windowStart, windowEnd };
    }
    if (today >= start && today <= end) {
      return { label: '지금 통보 가능 기간', tone: 'active' as const, windowStart, windowEnd };
    }
    if (today > end && today <= endDate) {
      return { label: '통보 기한 경과 · 묵시적 갱신 가능', tone: 'warn' as const, windowStart, windowEnd };
    }
    return { label: '계약 만기 경과', tone: 'muted' as const, windowStart, windowEnd };
  }, [contractEndDate, propertyType]);

  const saveDate = async () => {
    if (!dateInput) return alert('만기일을 선택해 주세요.');
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractEndDate: dateInput,
          propertyType,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '저장에 실패했습니다.');
        return;
      }
      setEditing(false);
      await onSaved();
      alert(`${propertyType} 만기일이 저장되었습니다.`);
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const icon = propertyType === '주택' ? '🏠' : '🛍️';
  const accent =
    propertyType === '주택'
      ? 'border-blue-200 bg-blue-50/50'
      : 'border-orange-200 bg-orange-50/50';

  return (
    <div className={`rounded-[2rem] border p-6 space-y-4 ${accent}`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-black text-slate-900">
          {icon} {propertyType} 임대차
        </h4>
        {contractEndDate && !editing && (
          <button
            type="button"
            onClick={() => {
              setDateInput(contractEndDate);
              setEditing(true);
            }}
            className="text-[11px] font-bold text-slate-500 underline"
          >
            만기일 변경
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-bold"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveDate()}
              className="flex-1 py-2.5 bg-[var(--brand)] text-white text-xs font-black rounded-xl disabled:opacity-50"
            >
              {saving ? '저장 중…' : '만기일 저장'}
            </button>
            {contractEndDate && (
              <button
                type="button"
                onClick={() => {
                  setDateInput(contractEndDate);
                  setEditing(false);
                }}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl"
              >
                취소
              </button>
            )}
          </div>
        </div>
      ) : contractEndDate ? (
        <div className="space-y-3">
          {status && (
            <div
              className={`p-3 rounded-xl text-center text-xs font-black ${
                status.tone === 'active'
                  ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                  : status.tone === 'warn'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {status.label}
            </div>
          )}
          <div className="text-sm font-bold text-slate-700 space-y-1">
            <p>
              통보 기간: {status?.windowStart} ~ {status?.windowEnd}
            </p>
            <p>만기일: {contractEndDate}</p>
          </div>
          <GoldenTimeKakaoReminder
            contractEndDate={contractEndDate}
            propertyType={propertyType}
            userId={userId}
            variant="light"
          />
        </div>
      ) : (
        <p className="text-xs font-bold text-slate-500">
          만기일을 저장하면 골든타임 알림을 예약할 수 있어요.
        </p>
      )}

      <Link
        href="/golden-time"
        className="block text-center text-[11px] font-bold text-[var(--brand)] underline"
      >
        골든타임 페이지에서 자세히 보기
      </Link>
    </div>
  );
}
