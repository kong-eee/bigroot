export type NavLink = {
  href: string;
  label: string;
  highlight?: boolean;
};

export type NavGroup = {
  label: string;
  links: NavLink[];
};

export type NavBarItem =
  | { type: 'link'; link: NavLink }
  | { type: 'group'; group: NavGroup };

/** 상단 단독 메뉴 (드롭다운 밖) — 대분류 뒤에 배치 */
export const NAV_STANDALONE: NavLink[] = [
  { href: '/golden-time', label: '골든타임' },
  { href: '/community', label: '커뮤니티' },
  { href: '/feedback', label: '문의·요청' },
];

/** 데스크톱 상단 — 대분류 + 소분류 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: '계약',
    links: [
      { href: '/contract', label: '계약전 체크', highlight: true },
      { href: '/property-visit', label: '임장 체크', highlight: true },
      { href: '/safety-check', label: '안전진단', highlight: true },
      { href: '/rent-increase', label: '임대료진단' },
    ],
  },
  {
    label: '내 임대차',
    links: [
      { href: '/lease-timeline', label: '내 타임라인', highlight: true },
      { href: '/move-in-checklist', label: '입주 체크' },
      { href: '/deposit-return', label: '보증금 반환' },
    ],
  },
  {
    label: '정보·도움',
    links: [
      { href: '/rights-guide', label: '권리백과' },
      { href: '/legal-ai', label: '빅루트 AI' },
      { href: '/policy-feed', label: '청년·기금 피드', highlight: true },
    ],
  },
];

/** 데스크톱·모바일: 계약 → 내 임대차 → 정보·도움 → 골든타임 → 커뮤니티 → 문의·요청 */
export const NAV_BAR_ITEMS: NavBarItem[] = [
  ...NAV_GROUPS.map((group) => ({ type: 'group' as const, group })),
  ...NAV_STANDALONE.map((link) => ({ type: 'link' as const, link })),
];

/** @deprecated — NAV_GROUPS 사용 */
export const NAV_PRIMARY: NavLink[] = NAV_GROUPS[0].links;

/** @deprecated — NAV_GROUPS 사용 */
export const NAV_LEASE: NavLink[] = NAV_GROUPS[1].links;

/** @deprecated — NAV_GROUPS 사용 */
export const NAV_MORE: NavLink[] = NAV_GROUPS[2].links;

/** 모바일·전체 메뉴 */
export const NAV_ALL: NavLink[] = [
  ...NAV_GROUPS.flatMap((g) => g.links),
  ...NAV_STANDALONE,
];
