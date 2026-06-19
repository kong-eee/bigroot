import {
  formatGoldenDateKo,
  getRenewalWindow,
  type GoldenPropertyType,
} from '@/lib/golden-time-schedule';

const SITE_URL = (() => {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (base) return `${base.startsWith('http') ? base : `https://${base}`}/golden-time`;
  return 'https://bigroot.co.kr/golden-time';
})();

/** Solapi·카카오 템플릿 변수 (목적별 템플릿 공통) */
export const ALIMTALK_VARIABLE_KEYS = [
  '#{유형}',
  '#{만기일}',
  '#{기한일}',
  '#{통보시작}',
  '#{통보마감}',
  '#{링크}',
] as const;

/** 심사 시 변수 예시 — Solapi 등록 폼에 함께 기재 */
export const ALIMTALK_VARIABLE_EXAMPLES: Record<(typeof ALIMTALK_VARIABLE_KEYS)[number], string> =
  {
    '#{유형}': '주택',
    '#{만기일}': '2026년 8월 15일',
    '#{기한일}': '2026년 2월 15일',
    '#{통보시작}': '2026년 2월 15일',
    '#{통보마감}': '2026년 6월 15일',
    '#{링크}': 'bigroot.co.kr/golden-time',
  };

const HEADER = '[빅루트 임대차 갱신·통보 기한 알림]';

const CONSENT_BLOCK = `본 메시지는 빅루트 골든타임 서비스에서 고객님이 계약 만기일·휴대폰 번호를 등록하고 알림 수신에 동의·요청하신 경우에만 발송되는 임대차 계약갱신요구·해지통보 기한 정보 안내입니다. 등록하신 만기 일정 기준 최대 3회까지 발송될 수 있습니다.`;

const DETAIL_BLOCK = `임대차 유형: #{유형}
계약 만기: #{만기일}
오늘 안내일: #{기한일}
통보 가능 기간: #{통보시작} ~ #{통보마감}`;

const FOOTER = `자세히 보기
#{링크}`;

const SLOT_FIXED_BODY: Record<1 | 2 | 3, { sectionTitle: string; body: string }> = {
  1: {
    sectionTitle: '■ 갱신·해지 통보 가능 시작일 안내',
    body: '만기 6개월 전부터 임대인에게 재계약 또는 해지 의사를 통보할 수 있는 날입니다. 묵시적 갱신을 피하려면 통보 가능 기간 내 의사 표시를 준비하세요.',
  },
  2: {
    sectionTitle: '■ 갱신·통보 마감 임박 안내 (7일 전)',
    body: '통보 마감일이 7일 남았습니다. 임대인에게 갱신 또는 해지 의사를 전달했는지 확인하고, 미통보 시 묵시적 갱신 여부를 점검하세요.',
  },
  3: {
    sectionTitle: '■ 갱신·통보 마감일 당일 안내',
    body: '오늘이 갱신·해지 의사를 임대인에게 통보해야 하는 마감일입니다. 오늘 밤 12시까지 의사가 도달해야 하며, 기한 경과 시 묵시적 갱신될 수 있습니다.',
  },
};

export type KakaoTemplateSlotMeta = {
  slot: 1 | 2 | 3;
  label: string;
  draft: string;
};

function buildTemplateDraft(slot: 1 | 2 | 3): string {
  const { sectionTitle, body } = SLOT_FIXED_BODY[slot];
  return `${HEADER}

${CONSENT_BLOCK}

${sectionTitle}

${DETAIL_BLOCK}

${body}

${FOOTER}`;
}

/** 카카오 심사용 — 슬롯별 템플릿 3개를 Solapi에 각각 등록 */
export const KAKAO_TEMPLATE_DRAFTS: KakaoTemplateSlotMeta[] = ([1, 2, 3] as const).map(
  (slot) => ({
    slot,
    label:
      slot === 1
        ? '1회차 · 통보 가능 시작일'
        : slot === 2
          ? '2회차 · 통보 마감 7일 전'
          : '3회차 · 통보 마감일 당일',
    draft: buildTemplateDraft(slot),
  })
);

/** @deprecated 단일 템플릿 — 하위 호환. 신규 심사는 KAKAO_TEMPLATE_DRAFTS 3개 사용 */
export const KAKAO_TEMPLATE_DRAFT = KAKAO_TEMPLATE_DRAFTS[0].draft;

export function getKakaoTemplateDraft(slot: 1 | 2 | 3): string {
  return buildTemplateDraft(slot);
}

export function buildAlimtalkVariables(
  propertyType: GoldenPropertyType,
  contractEndDate: string,
  _slot: 1 | 2 | 3,
  remindOn: string
): Record<string, string> {
  const { windowStart, windowEnd } = getRenewalWindow(contractEndDate, propertyType);

  return {
    '#{유형}': propertyType,
    '#{만기일}': formatGoldenDateKo(contractEndDate),
    '#{기한일}': formatGoldenDateKo(remindOn),
    '#{통보시작}': formatGoldenDateKo(windowStart),
    '#{통보마감}': formatGoldenDateKo(windowEnd),
    '#{링크}': SITE_URL.replace(/^https?:\/\//, ''),
  };
}
