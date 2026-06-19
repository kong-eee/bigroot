import { NAV_ALL } from '@/lib/nav-links';
import { DEPOSIT_RETURN_PHASES } from '@/lib/deposit-return-guide-data';

export type SiteSearchEntry = {
  id: string;
  pageLabel: string;
  section: string;
  text: string;
  href: string;
  keywords?: string[];
};

const PAGE_LABELS: Record<string, string> = {
  '/': '홈',
  '/contract': '계약전 체크',
  '/property-visit': '임장 체크',
  '/safety-check': '안전진단',
  '/rent-increase': '임대료진단',
  '/lease-timeline': '내 타임라인',
  '/move-in-checklist': '입주 체크',
  '/deposit-return': '보증금 반환',
  '/rights-guide': '권리백과',
  '/legal-ai': '빅루트 AI',
  '/policy-feed': '청년·기금 피드',
  '/golden-time': '골든타임',
  '/community': '커뮤니티',
  '/feedback': '문의·요청',
  '/mypage': '마이페이지',
  '/renewal-check': '갱신권 진단',
};

function entry(
  id: string,
  href: string,
  section: string,
  text: string,
  keywords?: string[]
): SiteSearchEntry {
  return {
    id,
    pageLabel: PAGE_LABELS[href] ?? section,
    section,
    text,
    href,
    keywords,
  };
}

const STATIC_ENTRIES: SiteSearchEntry[] = [
  entry('home-hero', '/', '메인', '세입자의 든든한 뿌리. 보증금과 권리를 지켜드립니다.', ['빅루트', 'BIGROOT']),
  entry('home-community', '/', '바로가기', '커뮤니티에서 세입자들과 정보를 나눠 보세요.'),
  entry('home-rights', '/', '바로가기', '권리백과에서 임차인 권리를 확인하세요.'),

  entry('contract-common-1', '/contract', '공통 · 전입신고', '이사 당일 전입신고를 하면 대항력이 생겨 집주인이 바뀌어도 쫓겨나지 않습니다.', ['전입', '대항력']),
  entry('contract-common-2', '/contract', '공통 · 임대차 신고', '보증금 6천만 원 또는 월세 30만 원 초과 시 30일 이내 임대차 신고로 확정일자를 받으세요.', ['확정일자', '신고']),
  entry('contract-common-3', '/contract', '공통 · 등기부등본', '계약 당일 발급 등기부등본으로 갑구·을구 압류·근저당을 확인하세요.'),
  entry('contract-common-4', '/contract', '공통 · 세금', '임대인 국세·지방세 완납증명서로 세금 체납으로 인한 보증금 손실을 막으세요.'),
  entry('contract-multiverse-1', '/contract', '다세대 · 보증보험', '공시가격의 126% 이내 전세만 HUG 보증보험 가입이 가능합니다. 깡통전세 예방.', ['HUG', '공시가', '126%']),
  entry('contract-multiverse-2', '/contract', '다세대 · 전세가율', '인근 매매가 대비 전세가율 70~80%를 넘으면 위험 신호입니다.'),
  entry('contract-multiparent-1', '/contract', '다가구 · 선순위', '먼저 들어온 세입자 보증금 총액과 근저당을 합쳐 시세 60~70%를 넘지 않는지 확인하세요.'),
  entry('contract-officetel', '/contract', '오피스텔', '주거용 오피스텔은 주택임대차보호법, 업무용은 상가임대차보호법 적용 여부를 확인하세요.'),
  entry('contract-commercial', '/contract', '상가', '권리금·갱신권 10년·차임 3기 연체 시 해지 등 상가 임차인 권리를 체크하세요.', ['권리금']),

  entry('safety-1', '/safety-check', '안전진단', '다세대주택 주소로 공시가격을 조회하고 보증금 대비 안전 비율을 진단합니다.', ['공시가격', '다세대', '빌라']),
  entry('safety-2', '/safety-check', '안전진단', 'HUG 기준 공시가 126% 이내인지 보증금 안전 여부를 확인하세요.'),

  entry('rent-1', '/rent-increase', '임대료진단', '주택 갱신 시 보증금·월세 5% 상한으로 증액 가능 금액을 계산합니다.', ['5%', '갱신', '월세']),
  entry('rent-2', '/rent-increase', '임대료진단', '상가·비주거 임대료 인상 한도와 역산 시뮬레이션을 제공합니다.'),

  entry('timeline-1', '/lease-timeline', '내 타임라인', '계약 시작·만기·갱신 통보·퇴거 골든타임 일정을 한눈에 봅니다.', ['만기', '갱신']),
  entry('checklist-1', '/move-in-checklist', '입주 체크', '입주 전·당일·이후 단계별 체크리스트로 증거를 남기세요.', ['입주', '촬영']),
  entry('visit-1', '/property-visit', '임장 체크', '주택·상가 임장 시 주소, 금액, 향, 체크리스트, 사진을 기록하고 매물을 비교하세요.', ['임장', '매물', '비교', '체크리스트']),
  entry('renewal-1', '/renewal-check', '갱신권 진단', '계약갱신요구권 행사 가능 여부와 통보 기한을 진단합니다.', ['2+2', '갱신권']),

  entry('rights-r1', '/rights-guide', '주택 · 갱신권', '계약갱신요구권으로 1회 2년 연장을 요구할 수 있습니다. 정당한 사유 없이 거절 불가.', ['2+2년']),
  entry('rights-r2', '/rights-guide', '주택 · 5% 상한', '갱신 시 보증금·월세는 기존 금액의 5% 이내에서만 증액 가능합니다.'),
  entry('rights-r3', '/rights-guide', '주택 · 보증금', '보증금 미반환 시 임차권등기명령으로 이사 후에도 대항력을 유지할 수 있습니다.', ['임차권등기']),
  entry('rights-c1', '/rights-guide', '상가 · 10년', '상가 임차인은 최초 계약일로부터 10년까지 계약갱신요구권이 보장됩니다.'),
  entry('rights-c2', '/rights-guide', '상가 · 권리금', '계약 종료 6개월 전부터 권리금 회수를 방해할 수 없습니다.'),
  entry('rights-o1', '/rights-guide', '사무실 · 갱신', '사업자 등록 가능한 사무실도 상가임대차법으로 10년 갱신권을 보장받습니다.'),

  entry('legal-1', '/legal-ai', '빅루트 AI', '임대차·보증금·갱신·퇴거 관련 법률 질문에 AI가 답변합니다.', ['AI', '법률', '상담']),
  entry('policy-1', '/policy-feed', '청년 정책', '지역별 청년 주거·전세 지원 정책을 지도에서 찾아보세요.'),
  entry('policy-2', '/policy-feed', '대출 금리', '디딤돌·보금자리 등 정책대출 금리를 확인하세요.'),
  entry('policy-3', '/policy-feed', '중요 공지', '주택·임대차 관련 최신 공지와 뉴스를 모아봅니다.'),

  entry('golden-1', '/golden-time', '골든타임', '갱신 요구·해지 통보·퇴거 등 법정 기한을 계산하고 카카오 알림톡으로 받으세요.', ['알림톡', '카카오', '기한']),
  entry('golden-2', '/golden-time', '골든타임', '주택·상가 유형별 갱신·묵시적 갱신 골든타임을 안내합니다.'),

  entry('community-1', '/community', '커뮤니티', '세입자들이 보증금·계약·분쟁 경험을 나누는 게시판입니다.'),
  entry('feedback-1', '/feedback', '문의·요청', '기능 제안·버그 신고·운영자 문의를 남길 수 있습니다.'),
  entry('mypage-1', '/mypage', '마이페이지', '닉네임·계약 만기일·골든타임 알림·내 글을 관리합니다.'),
];

function navEntries(): SiteSearchEntry[] {
  return NAV_ALL.map((link) =>
    entry(`nav-${link.href}`, link.href, '메뉴', `${link.label} 페이지로 이동합니다.`, [link.label])
  );
}

function depositEntries(): SiteSearchEntry[] {
  const rows: SiteSearchEntry[] = [];
  for (const phase of DEPOSIT_RETURN_PHASES) {
    rows.push(
      entry(
        `deposit-${phase.id}`,
        '/deposit-return',
        `보증금 반환 · ${phase.title}`,
        `${phase.summary} ${phase.title}`,
        ['보증금', '반환', '퇴거']
      )
    );
    for (const step of phase.steps) {
      rows.push(
        entry(
          `deposit-${phase.id}-${step.id}`,
          '/deposit-return',
          `보증금 반환 · ${step.title}`,
          `${step.body} ${step.actions.join(' ')}${step.warning ? ` ${step.warning}` : ''}`,
          ['보증금', '반환']
        )
      );
    }
  }
  return rows;
}

let cached: SiteSearchEntry[] | null = null;

export function getSiteSearchIndex(): SiteSearchEntry[] {
  if (!cached) {
    cached = [...navEntries(), ...STATIC_ENTRIES, ...depositEntries()];
  }
  return cached;
}
