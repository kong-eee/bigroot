'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  buildReminderSchedule,
  formatGoldenDateKo,
  type GoldenPropertyType,
} from '@/lib/golden-time-schedule';

type SavedReminder = {
  phone: string;
  slots: { remindOn: string; label: string }[];
};

type Props = {
  contractEndDate: string;
  propertyType: GoldenPropertyType;
  userId: string | null;
  variant?: 'light' | 'dark';
};

export default function GoldenTimeKakaoReminder({
  contractEndDate,
  propertyType,
  userId,
  variant = 'light',
}: Props) {
  const [profilePhone, setProfilePhone] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState<SavedReminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendEnabled, setSendEnabled] = useState(false);

  const previewSchedule = useMemo(() => {
    if (!contractEndDate) return [];
    return buildReminderSchedule(contractEndDate, propertyType);
  }, [contractEndDate, propertyType]);

  const loadReminder = useCallback(async () => {
    if (!userId) {
      setSaved(null);
      setProfilePhone(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [reminderRes, profileRes] = await Promise.all([
        fetch(`/api/golden-time/reminders?propertyType=${encodeURIComponent(propertyType)}`, {
          cache: 'no-store',
        }),
        fetch('/api/profile', { cache: 'no-store' }),
      ]);
      const data = await reminderRes.json();
      const profileData = await profileRes.json();

      setProfilePhone(profileData.profile?.phone ?? data.profilePhone ?? null);

      if (data.success && data.reminder) {
        setSaved({
          phone: data.reminder.phone,
          slots: data.reminder.slots ?? [],
        });
      } else {
        setSaved(null);
      }
    } catch {
      setSaved(null);
    } finally {
      setLoading(false);
    }
  }, [userId, propertyType]);

  useEffect(() => {
    void loadReminder();
  }, [loadReminder, contractEndDate, propertyType]);

  useEffect(() => {
    fetch('/api/golden-time/config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setSendEnabled(Boolean(data.success && data.sendEnabled)))
      .catch(() => setSendEnabled(false));
  }, []);

  const registerReminder = async () => {
    if (!contractEndDate) return alert('계약 만기일을 먼저 입력해 주세요.');
    if (!userId) return alert('알림 예약은 로그인 후 이용할 수 있습니다.');
    if (!profilePhone) return;
    if (!consent) return alert('개인정보·알림 발송 동의가 필요합니다.');
    if (previewSchedule.length === 0) {
      return alert('알림을 보낼 날짜가 없습니다. 만기일을 다시 확인해 주세요.');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/golden-time/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractEndDate,
          propertyType,
          consent: true,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.code === 'PHONE_REQUIRED') {
          alert(data.error);
          window.location.href = '/mypage#notification-phone';
          return;
        }
        alert(data.error || '예약에 실패했습니다.');
        return;
      }
      setSaved({
        phone: data.reminder.phone,
        slots: data.schedule.map((s: { remindOn: string; label: string }) => ({
          remindOn: s.remindOn,
          label: s.label,
        })),
      });
      alert(
        data.alimtalk?.sendEnabled
          ? `예약 완료! ${data.schedule.length}회 카카오 알림톡이 해당 날짜 오전 9시에 발송됩니다.`
          : `예약 완료! ${data.schedule.length}회 일정이 저장되었습니다.`
      );
    } catch {
      alert('네트워크 오류로 예약하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelReminder = async () => {
    if (!confirm(`${propertyType} 골든타임 알림 예약을 취소할까요?`)) return;
    const res = await fetch(
      `/api/golden-time/reminders?propertyType=${encodeURIComponent(propertyType)}`,
      { method: 'DELETE' }
    );
    const data = await res.json();
    if (data.success) {
      setSaved(null);
      setConsent(false);
      alert('알림 예약이 취소되었습니다.');
    } else {
      alert(data.error || '취소에 실패했습니다.');
    }
  };

  if (!contractEndDate || previewSchedule.length === 0) return null;

  const isDark = variant === 'dark';
  const boxClass = isDark
    ? 'bg-[#FEE500]/10 border-[#FEE500]/30'
    : 'bg-[#FEE500]/15 border-[#FEE500]/40';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const btnClass = isDark
    ? 'w-full py-3.5 bg-[#FEE500] hover:bg-[#FDD835] text-slate-900 rounded-xl font-black text-sm shadow-lg transition-all disabled:opacity-50'
    : 'w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-lg transition-all disabled:opacity-50';

  return (
    <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          💬
        </span>
        <p className={`text-xs font-black ${textMain}`}>
          {propertyType} · 카카오 알림톡 예약
        </p>
      </div>

      {loading ? (
        <p className={`text-xs font-bold ${textMuted}`}>예약 정보 확인 중...</p>
      ) : saved ? (
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <p className={`text-xs font-black ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
            ✅ 예약 완료 · {saved.phone}
          </p>
          <p className={`text-[11px] font-medium ${isDark ? 'text-emerald-200/80' : 'text-emerald-800/80'}`}>
            {sendEnabled
              ? '아래 날짜 오전 9시에 카카오 알림톡이 발송됩니다.'
              : '일정이 저장되었습니다.'}
          </p>
          <ul className="space-y-0.5">
            {saved.slots.map((s) => (
              <li
                key={s.remindOn}
                className={`text-[11px] font-medium ${isDark ? 'text-emerald-100' : 'text-emerald-900'}`}
              >
                · {formatGoldenDateKo(s.remindOn)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void cancelReminder()}
            className={`text-[11px] font-bold underline ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}
          >
            예약 취소
          </button>
        </div>
      ) : !userId ? (
        <p
          className={`text-xs font-bold rounded-xl p-3 text-center ${
            isDark ? 'text-amber-200 bg-amber-500/10' : 'text-amber-700 bg-amber-50'
          }`}
        >
          예약하려면{' '}
          <Link href="/" className="underline font-black">
            로그인
          </Link>
          이 필요합니다
        </p>
      ) : !profilePhone ? (
        <div
          className={`rounded-xl p-4 space-y-2 ${
            isDark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
          }`}
        >
          <p className={`text-xs font-bold leading-relaxed ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
            알림톡을 받으려면 마이페이지에서 본인 휴대폰 번호를 먼저 등록해 주세요.
          </p>
          <Link
            href="/mypage#notification-phone"
            className={`inline-block text-xs font-black underline ${
              isDark ? 'text-amber-100' : 'text-amber-800'
            }`}
          >
            마이페이지에서 번호 등록하기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className={`space-y-1.5 p-3 rounded-xl border ${boxClass}`}>
            {previewSchedule.map((s) => (
              <li key={s.remindOn} className={`text-[11px] font-medium ${textMain}`}>
                🔔 {formatGoldenDateKo(s.remindOn)}
              </li>
            ))}
          </ul>
          <p className={`text-xs font-bold ${textMuted}`}>
            수신 번호: <span className={textMain}>{profilePhone}</span>
            <span className="block text-[10px] mt-0.5 font-medium">
              (마이페이지에서 변경)
            </span>
          </p>
          <label
            className={`flex items-start gap-2 cursor-pointer text-[11px] font-medium leading-relaxed ${textMuted}`}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            등록된 휴대폰 번호로 골든타임 카카오 알림톡 발송에 동의합니다.
          </label>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void registerReminder()}
            className={btnClass}
          >
            {submitting ? '저장 중...' : '🔔 카카오 알림톡 예약하기'}
          </button>
        </div>
      )}
    </div>
  );
}
