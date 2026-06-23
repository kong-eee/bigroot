export type PropertyType = '주택' | '상가';

export type TimelineEventStatus = 'done' | 'now' | 'soon' | 'upcoming';

export type TimelineCategory = 'root' | 'route';

export type TimelinePhase = 'contract' | 'move_in' | 'tenancy_end';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: TimelineCategory;
  phase: TimelinePhase;
  href?: string;
  status: TimelineEventStatus;
  daysUntil: number;
}

function parseDate(iso: string): Date {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function eventStatus(eventDate: Date, today: Date): TimelineEventStatus {
  const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'done';
  if (diff === 0) return 'now';
  if (diff <= 14) return 'soon';
  return 'upcoming';
}

function daysUntil(eventDate: Date, today: Date): number {
  return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDateKo(iso: string): string {
  return parseDate(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const TIMELINE_PHASE_LABEL: Record<TimelinePhase, string> = {
  contract: '계약·신고',
  move_in: '입주·거주',
  tenancy_end: '만기·퇴실',
};

export function buildLeaseTimeline(input: {
  propertyType: PropertyType;
  contractSignedDate?: string;
  moveInDate?: string;
  contractEndDate?: string;
  today?: Date;
}): TimelineEvent[] {
  const today = input.today ?? new Date();
  today.setHours(0, 0, 0, 0);

  const events: Omit<TimelineEvent, 'status' | 'daysUntil'>[] = [];
  const notifyMonths = input.propertyType === '상가' ? 1 : 2;

  if (input.contractSignedDate) {
    const signed = parseDate(input.contractSignedDate);
    events.push({
      id: 'contract-signed',
      date: toIso(signed),
      title: '계약서 작성일',
      description:
        '계약금·잔금 일정, 특약, 등기부등본·임대인 계좌를 최종 확인한 날입니다. 이후 신고·입주 일정의 기준점이 됩니다.',
      category: 'root',
      phase: 'contract',
      href: '/contract',
    });

    const reportDeadline = addDays(signed, 30);
    events.push({
      id: 'lease-report-deadline',
      date: toIso(reportDeadline),
      title: '임대차 신고·확정일자 (계약일로부터 30일 이내)',
      description:
        input.propertyType === '주택'
          ? '보증금 6천만 원 또는 월세 30만 원을 초과하면 계약 체결일로부터 30일 이내에 주택 임대차 신고를 하세요. 신고와 함께 확정일자가 부여됩니다.'
          : '상가는 임대차 신고·확정일자와 사업자등록·권리금 관련 서류를 함께 챙기세요.',
      category: 'route',
      phase: 'contract',
      href: '/contract',
    });
  }

  if (input.moveInDate) {
    const moveIn = parseDate(input.moveInDate);
    events.push({
      id: 'move-in',
      date: toIso(moveIn),
      title: '입주일',
      description: '이사 당일부터 거주·점유가 시작됩니다. 계량기·하자 사진을 남기고 열쇠·비밀번호를 확인하세요.',
      category: 'root',
      phase: 'move_in',
      href: '/move-in-checklist',
    });
    events.push({
      id: 'move-report',
      date: toIso(moveIn),
      title: '전입신고 (입주 당일 권장)',
      description:
        input.propertyType === '주택'
          ? '주민센터·정부24에서 전입신고를 하면 다음 날 0시부터 대항력이 생깁니다. 주택 임대차 신고와 별도로 꼭 챙기세요.'
          : '주거 겸용 오피스텔 등은 전입신고 필요 여부를 확인하세요.',
      category: 'root',
      phase: 'move_in',
      href: '/move-in-checklist',
    });

    if (!input.contractSignedDate) {
      const fallbackReport = addDays(moveIn, 30);
      events.push({
        id: 'lease-report-deadline-fallback',
        date: toIso(fallbackReport),
        title: '임대차 신고 기한 참고 (입주 기준 +30일)',
        description:
          '정확한 기한은 계약서 작성일 기준 30일입니다. 계약서 작성일을 입력하면 더 정확한 일정을 볼 수 있어요.',
        category: 'route',
        phase: 'move_in',
        href: '/contract',
      });
    }
  }

  if (input.contractEndDate) {
    const end = parseDate(input.contractEndDate);
    const renewalStart = addMonths(end, -6);
    renewalStart.setDate(renewalStart.getDate() + 1);
    const renewalEnd = addMonths(end, -notifyMonths);
    const moveOutPrep = addMonths(end, -2);

    events.push({
      id: 'renewal-window-start',
      date: toIso(renewalStart),
      title: '갱신·해지 통보 가능 시작',
      description: `만기 6개월 전부터 ${input.propertyType === '상가' ? '건물주' : '집주인'}에게 재계약·해지 의사를 전달할 수 있습니다.`,
      category: 'route',
      phase: 'tenancy_end',
      href: '/golden-time',
    });
    events.push({
      id: 'renewal-window-end',
      date: toIso(renewalEnd),
      title: `갱신·해지 통보 마감 (만기 ${notifyMonths}개월 전)`,
      description: '이 날짜까지 의사가 도달하지 않으면 묵시적 갱신될 수 있습니다. 문자·카톡 등 증거를 남기세요.',
      category: 'route',
      phase: 'tenancy_end',
      href: '/renewal-check',
    });
    events.push({
      id: 'move-out-prep',
      date: toIso(moveOutPrep),
      title: '퇴실·보증금 반환 준비 (만기 2개월 전)',
      description: '나갈 예정이라면 통보 시점과 원상복구·하자 분쟁 대비를 시작하세요.',
      category: 'route',
      phase: 'tenancy_end',
      href: '/deposit-return',
    });
    events.push({
      id: 'contract-end',
      date: toIso(end),
      title: '계약 만기일',
      description: '만기에 보증금이 돌아오지 않으면 임차권등기명령 등 다음 절차를 검토하세요.',
      category: 'root',
      phase: 'tenancy_end',
      href: '/deposit-return',
    });
    const depositReturnHint = addDays(end, 1);
    events.push({
      id: 'deposit-return',
      date: toIso(depositReturnHint),
      title: '보증금 반환·분쟁 대응',
      description: '반환 지연 시 내용증명, 분쟁조정, 임차권등기 순서를 단계별로 확인하세요.',
      category: 'route',
      phase: 'tenancy_end',
      href: '/deposit-return',
    });
  }

  return events
    .map((e) => {
      const d = parseDate(e.date);
      return {
        ...e,
        status: eventStatus(d, today),
        daysUntil: daysUntil(d, today),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const TIMELINE_STATUS_LABEL: Record<TimelineEventStatus, string> = {
  done: '완료',
  now: '오늘',
  soon: '임박',
  upcoming: '예정',
};

export const TIMELINE_PHASE_ORDER: TimelinePhase[] = ['contract', 'move_in', 'tenancy_end'];
