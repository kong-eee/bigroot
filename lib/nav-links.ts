export type NavLink = {
  href: string;
  label: string;
  highlight?: boolean;
};

/** 데스크톱 상단에 항상 표시 */
export const NAV_PRIMARY: NavLink[] = [
  { href: '/contract', label: '계약전 체크', highlight: true },
  { href: '/safety-check', label: '안전진단', highlight: true },
  { href: '/community', label: '커뮤니티' },
  { href: '/rights-guide', label: '권리백과' },
  { href: '/golden-time', label: '골든타임' },
];

/** 드롭다운: 내 임대차 */
export const NAV_LEASE: NavLink[] = [
  { href: '/lease-timeline', label: '내 타임라인', highlight: true },
  { href: '/move-in-checklist', label: '입주 체크' },
  { href: '/deposit-return', label: '보증금 반환' },
];

/** 드롭다운: 더보기 */
export const NAV_MORE: NavLink[] = [
  { href: '/feedback', label: '문의·요청' },
  { href: '/legal-ai', label: '근방 AI' },
  { href: '/rent-increase', label: '임대료진단' },
];

/** 모바일·전체 메뉴 */
export const NAV_ALL: NavLink[] = [...NAV_PRIMARY, ...NAV_LEASE, ...NAV_MORE];
