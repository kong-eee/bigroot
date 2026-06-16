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
  isGoldenDeadlinePassed,
  type GoldenPropertyType,
} from '@/lib/golden-time-schedule';
import { parseInterestTypes } from '@/lib/profile-interests';

type SavedReminder = {
  phone: string;
  contractEndDate?: string;
  slots: { remindOn: string; label: string; sentAt?: string | null }[];
};

type ReminderMap = Partial<Record<GoldenPropertyType, SavedReminder>>;

type TemplateDraftItem = {
  slot: 1 | 2 | 3;
  label: string;
  draft: string;
};

type AlimtalkConfig = {
  sendEnabled: boolean;
  status: 'pending_template' | 'ready_to_send' | 'missing_credentials';
  message: string;
  templateDrafts?: TemplateDraftItem[];
};

const ALIMTALK_STEPS = [
  { n: '1', title: '만기일 입력', desc: '계약 종료일을 선택하세요' },
  { n: '2', title: '기한 자동 계산', desc: '갱신·통보 가능 기간을 보여 드려요' },
  { n: '3', title: '카톡 알림 예약', desc: '중요 날짜에 알림톡 3회 발송' },
] as const;

const REMINDER_LABELS = [
  { slot: 1, title: '통보 가능 시작', desc: '만기 6개월 전 — 갱신·해지 의사를 낼 수 있는 날' },
  { slot: 2, title: '마감 7일 전', desc: '통보 마감이 다가왔을 때 한 번 더 안내' },
  { slot: 3, title: '마감일 당일', desc: '오늘 밤 12시까지 의사가 도달해야 하는 날' },
] as const;

export default function GoldenTimePage() {
  const [activeTab, setActiveTab] = useState<'residential' | 'commercial'>('residential');
  const [expiryDate, setExpiryDate] = useState<string>('');

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profilePhone, setProfilePhone] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [savedByType, setSavedByType] = useState<ReminderMap>({});
  const [loadingReminder, setLoadingReminder] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alimtalk, setAlimtalk] = useState<AlimtalkConfig | null>(null);
  const [contracts, setContracts] = useState<{ housing: string | null; commercial: string | null }>({
    housing: null,
    commercial: null,
  });
  const [interestTypes, setInterestTypes] = useState<GoldenPropertyType[]>([]);

  const showHousingTab = interestTypes.includes('주택');
  const showCommercialTab = interestTypes.includes('상가');
  const hasInterestSelection = interestTypes.length > 0;

  const propertyType: GoldenPropertyType = activeTab === 'residential' ? '주택' : '상가';
  const saved = savedByType[propertyType] ?? null;

  const resolveExpiryForTab = useCallback(
    (
      tab: 'residential' | 'commercial',
      map: ReminderMap,
      contractDates: { housing: string | null; commercial: string | null }
    ) => {
      const pt: GoldenPropertyType = tab === 'residential' ? '주택' : '상가';
      if (map[pt]?.contractEndDate) return map[pt]!.contractEndDate!;
      if (tab === 'residential' && contractDates.housing) return contractDates.housing;
      if (tab === 'commercial' && contractDates.commercial) return contractDates.commercial;
      return '';
    },
    []
  );

  const switchTab = (tab: 'residential' | 'commercial') => {
    setActiveTab(tab);
    setExpiryDate(resolveExpiryForTab(tab, savedByType, contracts));
    setConsent(false);
  };

  useEffect(() => {
    if (showCommercialTab && !showHousingTab) setActiveTab('commercial');
    if (showHousingTab && !showCommercialTab) setActiveTab('residential');
  }, [showHousingTab, showCommercialTab]);

  const accent = activeTab === 'residential' ? 'blue' : 'orange';

  const calculatedDates = useMemo(() => {
    if (!expiryDate) return null;
    const { windowStart, windowEnd } = getRenewalWindow(expiryDate, propertyType);
    return {
      start: formatGoldenDateKo(windowStart),
      limit: formatGoldenDateKo(windowEnd),
      isOver: isGoldenDeadlinePassed(windowEnd),
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
      if (data.success) {
        const contractDates = {
          housing: data.contracts?.housing ?? null,
          commercial: data.contracts?.commercial ?? null,
        };
        setProfilePhone(data.profilePhone ?? null);
        setContracts(contractDates);
        const interests = parseInterestTypes(data.interestTypes);
        setInterestTypes(interests);

        const map: ReminderMap = {};
        for (const r of data.reminders ?? []) {
          const pt = r.propertyType as GoldenPropertyType;
          map[pt] = {
            phone: r.phone,
            contractEndDate: r.contractEndDate,
            slots: r.slots ?? [],
          };
        }
        setSavedByType(map);

        const initialTab: 'residential' | 'commercial' = interests.includes('상가')
          ? interests.includes('주택')
            ? map['주택'] || contractDates.housing
              ? 'residential'
              : map['상가'] || contractDates.commercial
                ? 'commercial'
                : 'residential'
            : 'commercial'
          : interests.includes('주택')
            ? 'residential'
            : map['주택'] || contractDates.housing
              ? 'residential'
              : map['상가'] || contractDates.commercial
                ? 'commercial'
                : 'residential';
        setActiveTab(initialTab);
        setExpiryDate(resolveExpiryForTab(initialTab, map, contractDates));
      } else {
        setSavedByType({});
      }
    } catch {
      setSavedByType({});
    } finally {
      setLoadingReminder(false);
    }
  }, [resolveExpiryForTab]);

  useEffect(() => {
    fetch('/api/golden-time/config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAlimtalk({
            sendEnabled: Boolean(data.sendEnabled),
            status: data.status,
            message: data.message ?? '',
            templateDrafts: data.templateDrafts,
          });
        }
      })
      .catch(() => setAlimtalk(null));
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ? { id: u.id } : null);
      if (u) void loadReminder();
      else setLoadingReminder(false);
    });
  }, [loadReminder]);

  const milestones = useMemo(
    () => ({
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
    }),
    [calculatedDates]
  );

  const registerReminder = async () => {
    if (!expiryDate) return alert('계약 만기일을 먼저 입력해 주세요.');
    if (!user) return alert('알림 예약은 로그인 후 이용할 수 있습니다.');
    if (!profilePhone) {
      alert('알림톡을 받으려면 마이페이지에서 본인 휴대폰 번호를 먼저 등록해 주세요.');
      window.location.href = '/mypage#notification-phone';
      return;
    }
    if (!consent) return alert('개인정보·알림 발송 동의가 필요합니다.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/golden-time/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractEndDate: expiryDate,
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
      setSavedByType((prev) => ({
        ...prev,
        [propertyType]: {
          phone: data.reminder.phone,
          contractEndDate: expiryDate,
          slots: data.schedule.map((s: { remindOn: string; label: string }) => ({
            remindOn: s.remindOn,
            label: s.label,
          })),
        },
      }));
      alert(
        data.alimtalk?.sendEnabled
          ? `${propertyType} 예약 완료! ${data.schedule.length}회 카카오 알림톡이 해당 날짜 오전 9시에 발송됩니다.`
          : `${propertyType} 예약 완료! ${data.schedule.length}회 일정이 저장되었습니다.`
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
      setSavedByType((prev) => {
        const next = { ...prev };
        delete next[propertyType];
        return next;
      });
      setConsent(false);
      alert(`${propertyType} 알림 예약이 취소되었습니다.`);
    } else {
      alert(data.error || '취소에 실패했습니다.');
    }
  };

  const shareToKakao = async () => {
    if (!expiryDate) return alert('만기일을 입력해 주세요.');
    const normalized = profilePhone?.replace(/\D/g, '') || saved?.phone || '01000000000';
    const text = buildKakaoShareText(expiryDate, propertyType, normalized);
    try {
      await navigator.clipboard.writeText(text);
      alert('일정 안내 문구를 복사했습니다.\n카카오톡 메모장에 붙여넣어 두세요.');
    } catch {
      prompt('아래 내용을 복사해 카카오톡에 붙여넣기 하세요.', text);
    }
  };

  const btnPrimary =
    accent === 'blue'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-orange-500 hover:bg-orange-600 text-white';

  return (
    <PageShell>
      <PageHero
        badge="카카오 알림톡 · 무료"
        title="갱신·통보 마감일 알림"
        description="「골든타임」은 임대차 계약에서 하루만 넘겨도 권리가 달라지는 마감일을 뜻합니다. 만기일만 입력하면 카카오 알림톡으로 3번 알려 드립니다."
      />

      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        {/* 골든타임이 뭔지 */}
        <section className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-3">
          <h2 className="text-base font-black text-amber-950 flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              ⏰
            </span>
            골든타임이란?
          </h2>
          <p className="text-sm text-amber-950/90 font-medium leading-relaxed">
            <strong>계약 갱신·해지 의사를 임대인에게 통보해야 하는 법정 기한</strong>입니다. 주택은
            만기 <strong>2개월 전</strong>, 상가는 <strong>1개월 전</strong> 밤 12시까지 의사가
            도달해야 합니다. 하루 늦으면 묵시적 갱신될 수 있어, 미리 알림을 받는 것이 안전합니다.
          </p>
        </section>

        {/* 3단계 안내 */}
        <div className="grid grid-cols-3 gap-2">
          {ALIMTALK_STEPS.map((s) => (
            <div
              key={s.n}
              className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm"
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white mb-2 ${
                  accent === 'blue' ? 'bg-blue-600' : 'bg-orange-500'
                }`}
              >
                {s.n}
              </span>
              <p className="text-[11px] font-black text-gray-900 leading-tight">{s.title}</p>
              <p className="text-[9px] text-gray-400 font-medium mt-1 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* 유형 선택 */}
        {user && !hasInterestSelection && (
          <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200 space-y-2">
            <p className="text-xs font-bold text-amber-900 leading-relaxed">
              골든타임 알림을 받으려면 먼저 관심 분야(주택·상가)를 선택해 주세요.
            </p>
            <Link href="/mypage" className="inline-block text-xs font-black underline text-amber-800">
              마이페이지에서 관심 분야 설정하기 →
            </Link>
          </div>
        )}

        {hasInterestSelection && showHousingTab && showCommercialTab && (
        <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm border border-gray-100">
          <button
            type="button"
            onClick={() => switchTab('residential')}
            className={`flex-1 py-3.5 rounded-[1.75rem] flex flex-col items-center gap-1 transition-all relative ${
              activeTab === 'residential' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-[11px] font-black">주택 (만기 2개월 전)</span>
            {savedByType['주택'] && (
              <span className="absolute top-2 right-3 text-[9px] font-black bg-white/90 text-blue-600 px-1.5 py-0.5 rounded-full">
                예약됨
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => switchTab('commercial')}
            className={`flex-1 py-3.5 rounded-[1.75rem] flex flex-col items-center gap-1 transition-all relative ${
              activeTab === 'commercial' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">🏪</span>
            <span className="text-[11px] font-black">상가 (만기 1개월 전)</span>
            {savedByType['상가'] && (
              <span className="absolute top-2 right-3 text-[9px] font-black bg-white/90 text-orange-600 px-1.5 py-0.5 rounded-full">
                예약됨
              </span>
            )}
          </button>
        </div>
        )}

        {hasInterestSelection && showHousingTab && !showCommercialTab && (
          <div className="bg-blue-600 text-white rounded-2xl py-4 text-center font-black text-sm">
            🏠 주택 임대차 골든타임
          </div>
        )}

        {hasInterestSelection && showCommercialTab && !showHousingTab && (
          <div className="bg-orange-500 text-white rounded-2xl py-4 text-center font-black text-sm">
            🏪 상가 임대차 골든타임
          </div>
        )}

        {/* 만기일 + 카톡 예약 (핵심) */}
        {(!user || hasInterestSelection) && (
        <section className="bg-white rounded-[2rem] shadow-lg border-2 border-slate-900 overflow-hidden">
          <div className={`px-6 py-4 ${accent === 'blue' ? 'bg-blue-600' : 'bg-orange-500'}`}>
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <span>💬</span> 카카오 알림톡 예약
            </h2>
            <p className="text-white/85 text-xs font-medium mt-1">
              만기일 입력 → 중요 날짜 3회 자동 안내 (오전 9시 발송)
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-500 mb-2">
                계약 만기일
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={!!saved}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-black text-xl text-slate-900 focus:ring-2 focus:ring-blue-500 text-center disabled:opacity-60"
              />
            </div>

            {calculatedDates && (
              <div
                className={`p-5 rounded-2xl text-center ${
                  calculatedDates.isOver
                    ? 'bg-red-50 border border-red-100'
                    : accent === 'blue'
                      ? 'bg-blue-50 border border-blue-100'
                      : 'bg-orange-50 border border-orange-100'
                }`}
              >
                <p className="text-[10px] font-black text-gray-500 mb-2">
                  갱신·해지 통보 가능 기간
                </p>
                <p className="text-xs font-bold text-gray-500">{calculatedDates.start} ~</p>
                <p
                  className={`text-lg font-black ${
                    calculatedDates.isOver ? 'text-red-600' : accent === 'blue' ? 'text-blue-700' : 'text-orange-600'
                  }`}
                >
                  {calculatedDates.limit} 밤 12시까지
                </p>
                {calculatedDates.isOver && (
                  <p className="text-[11px] text-red-600 font-black mt-2">
                    기한이 지났습니다. 묵시적 갱신 여부를 확인하세요.
                  </p>
                )}
              </div>
            )}

            {/* 알림 3회 미리보기 */}
            {previewSchedule.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black text-gray-700">보내 드릴 알림 (최대 3회)</p>
                <ul className="space-y-2">
                  {previewSchedule.map((s) => {
                    const meta = REMINDER_LABELS.find((r) => r.slot === s.slot);
                    return (
                      <li
                        key={s.remindOn}
                        className="flex gap-3 p-3 bg-[#FEE500]/15 border border-[#FEE500]/40 rounded-xl"
                      >
                        <span className="text-lg shrink-0" aria-hidden>
                          🔔
                        </span>
                        <div>
                          <p className="text-xs font-black text-gray-900">
                            {formatGoldenDateKo(s.remindOn)}
                            <span className="text-gray-500 font-bold ml-1">
                              · {meta?.title ?? s.label}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                            {meta?.desc}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {!expiryDate && (
              <p className="text-center text-sm text-gray-400 font-medium py-4">
                ↑ 만기일을 선택하면 알림 일정이 바로 표시됩니다
              </p>
            )}

            {/* 예약 UI */}
            {loadingReminder ? (
              <p className="text-center text-sm text-gray-400 font-bold py-4">예약 정보 확인 중...</p>
            ) : saved ? (
              <div className="space-y-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <p className="font-black text-emerald-900 text-sm">
                  ✅ {propertyType} 알림 예약 완료 · {saved.phone}
                </p>
                <p className="text-xs text-emerald-800/80 font-medium">
                  {alimtalk?.sendEnabled
                    ? '아래 날짜 오전 9시에 카카오 알림톡이 발송됩니다.'
                    : '일정이 저장되었습니다.'}
                </p>
                <ul className="space-y-1">
                  {saved.slots.map((s) => (
                    <li key={s.remindOn} className="text-xs font-medium text-emerald-900">
                      · {formatGoldenDateKo(s.remindOn)}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={shareToKakao}
                    className={`w-full py-3 rounded-xl font-black text-sm ${btnPrimary}`}
                  >
                    일정 카톡에 복사하기
                  </button>
                  <button
                    type="button"
                    onClick={cancelReminder}
                    className="text-xs font-bold text-emerald-700 underline"
                  >
                    예약 취소
                  </button>
                </div>
              </div>
            ) : (
              expiryDate &&
              previewSchedule.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  {!user && (
                    <p className="text-sm font-bold text-amber-700 bg-amber-50 rounded-xl p-3 text-center">
                      예약하려면{' '}
                      <Link href="/" className="underline font-black">
                        로그인
                      </Link>
                      이 필요합니다
                    </p>
                  )}
                  {user && !profilePhone && (
                    <div className="rounded-xl p-4 space-y-2 bg-amber-50 border border-amber-200">
                      <p className="text-xs font-bold leading-relaxed text-amber-900">
                        알림톡을 받으려면 마이페이지에서 본인 휴대폰 번호를 먼저 등록해 주세요.
                      </p>
                      <Link
                        href="/mypage#notification-phone"
                        className="inline-block text-xs font-black underline text-amber-800"
                      >
                        마이페이지에서 번호 등록하기 →
                      </Link>
                    </div>
                  )}
                  {user && profilePhone && (
                    <>
                      <p className="text-xs font-bold text-gray-600">
                        수신 번호: <span className="text-gray-900">{profilePhone}</span>
                        <span className="block text-[10px] mt-0.5 font-medium text-gray-400">
                          (마이페이지에서 변경)
                        </span>
                      </p>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="mt-1"
                        />
                        <span className="text-xs font-medium text-gray-600 leading-relaxed">
                          등록된 휴대폰 번호로 {propertyType} 골든타임 카카오 알림톡 발송에 동의합니다.
                        </span>
                      </label>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void registerReminder()}
                        className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all disabled:opacity-50 ${btnPrimary}`}
                      >
                        {submitting ? '저장 중...' : `🔔 ${propertyType} 카카오 알림톡 예약하기`}
                      </button>
                      <button
                        type="button"
                        onClick={shareToKakao}
                        className="w-full py-2.5 text-sm font-bold text-gray-500 underline"
                      >
                        예약 없이 일정만 복사하기
                      </button>
                    </>
                  )}
                </div>
              )
            )}

            {alimtalk?.sendEnabled && (
              <p className="text-[10px] text-center text-gray-400 font-medium">
                무료 · 언제든 예약 취소 가능 · SMS 대체 발송 없음
              </p>
            )}
          </div>
        </section>
        )}

        {/* 참고: 전체 일정 */}
        <section className="space-y-4">
          <div className="text-center space-y-1 pt-4">
            <h2 className="text-lg font-black text-gray-900">📚 임대차별 참고 일정</h2>
            <p className="text-xs text-gray-400 font-medium">
              알림 외에도 챙겨야 할 법적 절차입니다
            </p>
          </div>

          <div className="relative space-y-5 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {milestones[activeTab].map((item, i) => (
              <div key={item.title} className="relative pl-11">
                <div
                  className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    i === 1
                      ? accent === 'blue'
                        ? 'bg-blue-600 shadow-md'
                        : 'bg-orange-500 shadow-md'
                      : 'bg-gray-300'
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div
                  className={`bg-white p-5 rounded-2xl shadow-sm border ${
                    i === 1 ? 'border-blue-200 ring-2 ring-blue-50' : 'border-gray-100'
                  }`}
                >
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black mb-2 bg-gray-100 text-gray-500">
                    {item.time}
                  </span>
                  <h3 className="text-base font-black text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3">
                    {item.desc}
                  </p>
                  <p className="text-[10px] font-bold text-red-600 bg-red-50 rounded-lg p-2 leading-relaxed">
                    ⚠️ {item.warning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
