export type GoldenPropertyType = '주택' | '상가';

export type GoldenReminderSlot = {
  slot: 1 | 2 | 3;
  remindOn: string;
  label: string;
};

function parseDate(iso: string): Date {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatGoldenDateKo(iso: string): string {
  return parseDate(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 갱신 통보 가능 시작·마감 (골든타임 페이지와 동일) */
export function getRenewalWindow(expiryDate: string, propertyType: GoldenPropertyType) {
  const end = parseDate(expiryDate);
  const windowStart = addMonths(end, -6);
  windowStart.setDate(windowStart.getDate() + 1);
  const windowEnd = addMonths(end, propertyType === '상가' ? -1 : -2);
  return { windowStart: toIso(windowStart), windowEnd: toIso(windowEnd), expiry: expiryDate };
}

/** 카톡/문자로 보낼 3회 알림 일정 (오늘 이후만) */
export function buildReminderSchedule(
  expiryDate: string,
  propertyType: GoldenPropertyType,
  today = new Date()
): GoldenReminderSlot[] {
  today.setHours(0, 0, 0, 0);
  const { windowStart, windowEnd } = getRenewalWindow(expiryDate, propertyType);
  const endLabel = propertyType === '상가' ? '1개월' : '2개월';

  const candidates: GoldenReminderSlot[] = [
    {
      slot: 1,
      remindOn: windowStart,
      label: `[빅루트] 갱신·해지 통보 가능 시작 (만기 6개월 전)`,
    },
    {
      slot: 2,
      remindOn: toIso(addDays(parseDate(windowEnd), -7)),
      label: `[빅루트] 갱신·통보 마감 ${endLabel} 전 — 7일 남음`,
    },
    {
      slot: 3,
      remindOn: windowEnd,
      label: `[빅루트] 오늘이 갱신·통보 마감일 (${endLabel} 전 밤 12시)`,
    },
  ];

  return candidates.filter((c) => parseDate(c.remindOn) >= today);
}

export function buildKakaoShareText(
  expiryDate: string,
  propertyType: GoldenPropertyType,
  phone: string
): string {
  const { windowStart, windowEnd } = getRenewalWindow(expiryDate, propertyType);
  const slots = buildReminderSchedule(expiryDate, propertyType);
  const lines = slots.map((s) => `· ${formatGoldenDateKo(s.remindOn)} — ${s.label.replace('[빅루트] ', '')}`);
  return [
    '🌱 빅루트 골든타임 알림 예약',
    '',
    `유형: ${propertyType}`,
    `만기일: ${formatGoldenDateKo(expiryDate)}`,
    `통보 가능: ${formatGoldenDateKo(windowStart)} ~ ${formatGoldenDateKo(windowEnd)}`,
    '',
    '아래 날짜에 카카오 알림톡으로 안내드립니다.',
    ...lines,
    '',
    `등록 번호: ${phone}`,
    'https://bigroot.vercel.app/golden-time',
  ].join('\n');
}

export function normalizePhoneKr(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (/^010\d{8}$/.test(digits)) return digits;
  if (/^8210\d{8}$/.test(digits)) return `0${digits.slice(2)}`;
  return null;
}
