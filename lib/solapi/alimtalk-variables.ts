import {
  formatGoldenDateKo,
  getRenewalWindow,
  type GoldenPropertyType,
} from '@/lib/golden-time-schedule';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://bigroot.vercel.app/golden-time';

/** Solapi·카카오에 등록할 템플릿 변수명과 동일해야 합니다 */
export const ALIMTALK_VARIABLE_KEYS = [
  '#{안내제목}',
  '#{안내내용}',
  '#{유형}',
  '#{만기일}',
  '#{기한일}',
  '#{통보시작}',
  '#{통보마감}',
  '#{링크}',
] as const;

function slotCopy(
  slot: 1 | 2 | 3,
  propertyType: GoldenPropertyType,
  endLabel: string
): { title: string; body: string } {
  if (slot === 1) {
    return {
      title: '갱신·해지 통보 가능 시작',
      body: `만기 6개월 전부터 집주인·건물주에게 재계약·해지 의사를 전달할 수 있습니다. ${propertyType} 임대차 기준으로 미리 준비하세요.`,
    };
  }
  if (slot === 2) {
    return {
      title: `갱신·통보 마감 ${endLabel} 전 (7일 남음)`,
      body: `통보 마감이 다가왔습니다. 문자·카톡 등으로 의사를 남기고, 묵시적 갱신 여부를 점검하세요.`,
    };
  }
  return {
    title: '오늘이 갱신·통보 마감일',
    body: `오늘 밤 12시까지 의사가 도달해야 합니다. 기한을 넘기면 묵시적 갱신될 수 있으니 꼭 확인하세요.`,
  };
}

export function buildAlimtalkVariables(
  propertyType: GoldenPropertyType,
  contractEndDate: string,
  slot: 1 | 2 | 3,
  remindOn: string
): Record<string, string> {
  const { windowStart, windowEnd } = getRenewalWindow(contractEndDate, propertyType);
  const endLabel = propertyType === '상가' ? '1개월' : '2개월';
  const { title, body } = slotCopy(slot, propertyType, endLabel);

  return {
    '#{안내제목}': title,
    '#{안내내용}': body,
    '#{유형}': propertyType,
    '#{만기일}': formatGoldenDateKo(contractEndDate),
    '#{기한일}': formatGoldenDateKo(remindOn),
    '#{통보시작}': formatGoldenDateKo(windowStart),
    '#{통보마감}': formatGoldenDateKo(windowEnd),
    '#{링크}': SITE_URL.replace(/^https?:\/\//, ''),
  };
}

/** 카카오 심사용 — Solapi 대시보드에 그대로 등록 */
export const KAKAO_TEMPLATE_DRAFT = `[빅루트 골든타임]

#{안내제목}

임대차 유형: #{유형}
계약 만기: #{만기일}
오늘 안내일: #{기한일}
통보 가능 기간: #{통보시작} ~ #{통보마감}

#{안내내용}

자세히 보기
#{링크}`;
