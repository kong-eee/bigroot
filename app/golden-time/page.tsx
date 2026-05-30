'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageHero from '@/app/components/layout/PageHero';
import PageShell from '@/app/components/layout/PageShell';
import { supabase } from '@/lib/supabase';
import {
  buildKakaoShareText,
  buildReminderSchedule,
  formatGoldenDateKo,
  getRenewalWindow,
  type GoldenPropertyType,
} from '@/lib/golden-time-schedule';

type SavedReminder = {
  phone: string;
  slots: { remindOn: string; label: string; sentAt?: string | null }[];
};

export default function GoldenTimePage() {
  const [activeTab, setActiveTab] = useState<'residential' | 'commercial'>('residential');
  const [expiryDate, setExpiryDate] = useState<string>('');

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState<SavedReminder | null>(null);
  const [loadingReminder, setLoadingReminder] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const propertyType: GoldenPropertyType = activeTab === 'residential' ? '주택' : '상가';

  const calculatedDates = useMemo(() => {
    if (!expiryDate) return null;
    const { windowStart, windowEnd } = getRenewalWindow(expiryDate, propertyType);
    const start = formatGoldenDateKo(windowStart);
    const limit = formatGoldenDateKo(windowEnd);
    return {
      start,
      limit,
      isOver: new Date() > new Date(windowEnd),
    };
  }, [expiryDate, propertyType]);

  const previewSchedule = useMemo(() => {
    if (!expiryDate) return [];
    return buildReminderSchedule(expiryDate, propertyType);
  }, [expiryDate, propertyType]);

  const loadReminder = useCallback(async () => {
    setLoadingReminder(true);
    try {
      const res = await fetch('/api/golden-time/reminders', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.reminder) {
        setSaved({
          phone: data.reminder.phone,
          slots: data.reminder.slots ?? [],
        });
        setExpiryDate(data.reminder.contractEndDate);
        setActiveTab(data.reminder.propertyType === '상가' ? 'commercial' : 'residential');
        setPhone(data.reminder.phone);
      } else {
        setSaved(null);
      }
    } catch {
      setSaved(null);
    } finally {
      setLoadingReminder(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ? { id: u.id } : null);
      if (u) void loadReminder();
      else setLoadingReminder(false);
    });
  }, [loadReminder]);

  const milestones = {
    residential: [
      {
        time: '계약 체결 후 30일 이내',
        title: '주택 임대차 신고 (필수)',
        desc: '보증금 6천만 원 또는 월세 30만 원 초과 시 의무입니다. 신고 시 확정일자가 자동으로 부여되어 내 보증금을 지키는 첫 관문입니다.',
        warning: '미신고 또는 거짓 신고 시 최대 100만 원의 과태료가 부과됩니다.',
      },
      {
        time: '만기 6~2개월 전',
        title: '계약갱신요구권 행사',
        desc: calculatedDates
          ? `${calculatedDates.limit}까지 반드시 임대인에게 의사가 도달해야 합니다. 1회에 한해 2년 더 살 수 있는 권리입니다.`
          : "임대인에게 '더 살겠다'는 의사를 명확히 전달해야 하는 골든타임입니다.",
        warning:
          "이 기간을 하루라도 넘기면 '묵시적 갱신'이 되어 임대인이 실거주를 이유로 나가라고 할 때 대응이 어렵습니다.",
      },
      {
        time: '묵시적 갱신 중 상시',
        title: '중도 해지 통보',
        desc: '계약이 자동 연장된 상태라면 임차인은 언제든 해지를 통보할 수 있습니다. 통보 후 3개월 뒤에 법적 효력이 발생합니다.',
        warning:
          '통보 후 3개월간은 월세를 내야 하며, 그 이후에야 보증금 반환 및 임차권등기 신청이 가능합니다.',
      },
      {
        time: '계약 종료 직후',
        title: '임차권등기명령 신청',
        desc: '만기가 지났는데도 보증금을 돌려받지 못했다면, 이사를 가기 전 반드시 법원에 신청해야 내 순위가 유지됩니다.',
        warning:
          '등기가 완료되기 전(약 2주 소요)에 이사를 가거나 전입을 빼면 보증금 우선변제권이 상실됩니다.',
      },
    ],
    commercial: [
      {
        time: '사업 개시 전후',
        title: '사업자 등록 및 확정일자',
        desc: '상가 임차인도 관할 세무서에서 확정일자를 받아야 경매 시 후순위보다 먼저 보증금을 변제받을 수 있습니다.',
        warning: '사업자등록을 하지 않으면 상가임대차보호법의 대항력을 가질 수 없습니다.',
      },
      {
        time: '만기 6~1개월 전',
        title: '계약갱신요구권 (10년 보장)',
        desc: '최초 계약일부터 10년 동안 영업을 계속할 권리입니다. 주택보다 1개월 더 늦게까지 가능하지만 절대 늦으면 안 됩니다.',
        warning: '월세 3회 연체 이력이 있거나 무단 전대 시 10년의 권리가 소멸됩니다.',
      },
      {
        time: '만기 6개월 전 ~ 종료 시',
        title: '권리금 회수 기회 보호',
        desc: '신규 임차인을 임대인에게 주선하여 권리금을 받을 수 있는 기간입니다. 임대인이 방해하면 손해배상 청구가 가능합니다.',
        warning: '종료 후에는 보호받기 어려우므로 반드시 종료 전에 신규 임차인을 주선해야 합니다.',
      },
      {
        time: '상시 주의',
        title: '3기 차임 연체 경고',
        desc: '월세 3개월 치에 달하는 금액이 밀리지 않도록 관리하세요. 3기가 되는 순간 모든 권리가 박탈됩니다.',
        warning:
          '한 번이라도 3기에 달한 적이 있다면 나중에 다 갚더라도 임대인이 갱신을 거절할 수 있습니다.',
      },
    ],
  };

  const registerReminder = async () => {
    if (!expiryDate) return alert('계약 만기일을 먼저 입력해 주세요.');
    if (!user) return alert('알림 예약은 로그인 후 이용할 수 있습니다.');
    if (!phone.trim()) return alert('휴대폰 번호를 입력해 주세요.');
    if (!consent) return alert('개인정보·알림 발송 동의가 필요합니다.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/golden-time/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractEndDate: expiryDate,
          propertyType,
          phone,
          consent: true,
        }),
      });
      const data = await res.json();
      if (!data.success) {
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
      setShowForm(false);
      alert(
        `알림 예약이 완료되었습니다.\n\n${data.schedule.length}회 카카오 알림톡으로 안내드릴 예정입니다.`
      );
    } catch {
      alert('네트워크 오류로 예약하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelReminder = async () => {
    if (!confirm('골든타임 알림 예약을 취소할까요?')) return;
    const res = await fetch('/api/golden-time/reminders', { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setSaved(null);
      setPhone('');
      setConsent(false);
      alert('알림 예약이 취소되었습니다.');
    } else {
      alert(data.error || '취소에 실패했습니다.');
    }
  };

  const shareToKakao = async () => {
    if (!expiryDate) return alert('만기일을 입력해 주세요.');
    const normalized = phone.replace(/\D/g, '') || saved?.phone || '01000000000';
    const text = buildKakaoShareText(expiryDate, propertyType, normalized);
    try {
      await navigator.clipboard.writeText(text);
      alert(
        '일정 안내 문구를 복사했습니다.\n카카오톡을 열어 「나와의 채팅」 또는 메모장에 붙여넣어 두세요.\n\n자동 문자 발송은 예약 완료 후 해당 날짜에 전송됩니다.'
      );
    } catch {
      prompt('아래 내용을 복사해 카카오톡에 붙여넣기 하세요.', text);
    }
  };

  return (
    <PageShell>
      <PageHero
        badge="골든타임"
        title="권리 골든타임"
        description="갱신·통보·신고 등 놓치면 안 되는 날짜를 미리 챙겨 보세요."
      />
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex bg-white p-1.5 rounded-[2.5rem] shadow-sm border border-gray-100">
          <button
            type="button"
            onClick={() => {
              setActiveTab('residential');
              if (!saved) setExpiryDate('');
            }}
            className={`flex-1 py-4 rounded-[2rem] flex flex-col items-center gap-1 transition-all ${activeTab === 'residential' ? 'bg-blue-600 text-white shadow-xl' : 'text-gray-400'}`}
          >
            <span className="text-2xl">🏠</span>
            <span className="text-[11px] font-black">주택 임차인</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('commercial');
              if (!saved) setExpiryDate('');
            }}
            className={`flex-1 py-4 rounded-[2rem] flex flex-col items-center gap-1 transition-all ${activeTab === 'commercial' ? 'bg-orange-500 text-white shadow-xl' : 'text-gray-400'}`}
          >
            <span className="text-2xl">🏪</span>
            <span className="text-[11px] font-black">상가 / 사무실</span>
          </button>
        </div>

        <section className="bg-white p-8 rounded-[3rem] shadow-lg border-2 border-slate-900 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-gray-900">계약 만기일 입력</h2>
            <p className="text-xs text-gray-400 font-bold">법원 판례 기준 정확한 기한을 계산합니다.</p>
          </div>

          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={!!saved}
            className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none font-black text-2xl text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all text-center disabled:opacity-60"
          />

          {calculatedDates && (
            <div
              className={`p-6 rounded-[2.5rem] text-center ${calculatedDates.isOver ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}
            >
              <p className="text-[10px] font-black text-gray-400 uppercase mb-2">
                갱신요구권 행사 가능 기간
              </p>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400">{calculatedDates.start} 부터</span>
                <span
                  className={`text-xl font-black ${calculatedDates.isOver ? 'text-red-600' : 'text-blue-600'}`}
                >
                  {calculatedDates.limit} 밤 12시까지
                </span>
              </div>
              {calculatedDates.isOver && (
                <p className="text-[11px] text-red-500 font-black mt-3">
                  🚨 이미 기한이 지났습니다! 묵시적 갱신 여부를 확인하세요.
                </p>
              )}
            </div>
          )}
        </section>

        <div className="relative space-y-6 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {milestones[activeTab].map((item, i) => (
            <div key={item.title} className="relative pl-12 group">
              <div
                className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-gray-50 flex items-center justify-center z-10 transition-all ${
                  i === 1
                    ? activeTab === 'residential'
                      ? 'bg-blue-600 scale-110 shadow-lg'
                      : 'bg-orange-500 scale-110 shadow-lg'
                    : 'bg-gray-300'
                }`}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>

              <div
                className={`bg-white p-7 rounded-[2.5rem] shadow-sm border ${i === 1 ? 'border-blue-200 ring-4 ring-blue-50/50' : 'border-gray-100'}`}
              >
                <span
                  className={`inline-block px-3 py-1 rounded-full text-[10px] font-black mb-3 ${
                    i === 1 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {item.time}
                </span>
                <h3 className="text-lg font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4">{item.desc}</p>
                <div
                  className={`p-4 rounded-2xl border-l-4 ${i === 3 || i === 1 ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-600'}`}
                >
                  <p className="text-[11px] font-black leading-relaxed">⚠️ {item.warning}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`p-8 rounded-[3rem] text-center relative overflow-hidden space-y-5 ${
            activeTab === 'residential' ? 'bg-gray-900' : 'bg-gray-900'
          }`}
        >
          <div className="relative z-10 space-y-4">
            <p className="text-white text-sm font-bold opacity-80">
              놓치기 쉬운 골든타임, 카카오 알림톡으로 알려 드릴게요
            </p>

            {loadingReminder ? (
              <p className="text-white/60 text-xs font-bold">예약 정보 확인 중...</p>
            ) : saved ? (
              <div className="bg-white/10 rounded-2xl p-5 text-left space-y-3">
                <p className="text-white font-black text-sm">✅ 예약 완료 ({saved.phone})</p>
                <ul className="space-y-2">
                  {saved.slots.map((s) => (
                    <li key={s.remindOn} className="text-[11px] text-white/90 font-medium">
                      · {formatGoldenDateKo(s.remindOn)} — {s.label.replace('[빅루트] ', '')}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={shareToKakao}
                    className={`w-full py-3 rounded-xl font-black text-sm ${
                      activeTab === 'residential'
                        ? 'bg-blue-600 text-white'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    카카오톡에 일정 복사하기 📋
                  </button>
                  <button
                    type="button"
                    onClick={cancelReminder}
                    className="w-full py-2 text-white/70 text-xs font-bold underline"
                  >
                    예약 취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!user && (
                  <p className="text-amber-200 text-xs font-bold">
                    로그인 후 예약할 수 있습니다.{' '}
                    <Link href="/" className="underline">
                      홈에서 로그인
                    </Link>
                  </p>
                )}

                {(showForm || !user) && expiryDate && previewSchedule.length > 0 && user && (
                  <div className="bg-white rounded-2xl p-5 text-left space-y-4 text-gray-900">
                    <p className="text-xs font-black text-gray-500">보내 드릴 날짜 (미리보기)</p>
                    <ul className="space-y-1">
                      {previewSchedule.map((s) => (
                        <li key={s.remindOn} className="text-[11px] font-medium text-gray-600">
                          {formatGoldenDateKo(s.remindOn)}
                        </li>
                      ))}
                    </ul>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="01012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm"
                    />
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="text-[10px] font-medium text-gray-500 leading-relaxed">
                        휴대폰 번호 수집·보관 및 골든타임 카카오 알림톡 발송에 동의합니다. SMS
                        대체 발송은 하지 않습니다.
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  disabled={submitting || !expiryDate || previewSchedule.length === 0}
                  onClick={() => {
                    if (!user) {
                      alert('로그인이 필요합니다.');
                      return;
                    }
                    if (!showForm) {
                      setShowForm(true);
                      return;
                    }
                    void registerReminder();
                  }}
                  className={`w-full py-5 rounded-[2rem] font-black transition-all shadow-xl text-lg disabled:opacity-50 ${
                    activeTab === 'residential'
                      ? 'bg-blue-600 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {submitting
                    ? '저장 중...'
                    : showForm
                      ? '카카오 알림톡 예약 완료 🔔'
                      : '카카오 알림톡 예약 🔔'}
                </button>

                {showForm && (
                  <button
                    type="button"
                    onClick={shareToKakao}
                    className="w-full py-3 rounded-xl bg-white/10 text-white text-sm font-bold"
                  >
                    예약 전 · 일정만 카톡에 복사하기
                  </button>
                )}
              </>
            )}
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <p className="text-center text-[10px] text-gray-400 font-medium px-4 leading-relaxed">
          자동 발송은 Solapi + 카카오 알림톡 연동 후 해당 날짜 오전(한국시간)에 전송됩니다. 설정
          방법은 프로젝트 <code className="text-gray-500">docs/SOLAPI_KAKAO_SETUP.md</code> 를
          참고하세요.
        </p>
      </div>
    </PageShell>
  );
}
