'use client';

import Link from 'next/link';
import SiteFooter from './layout/SiteFooter';

const TRUST = [
  { value: '10+', label: '세입자 전용 도구' },
  { value: '법률', label: '기반 정보 구조' },
  { value: '무료', label: '핵심 기능 이용' },
];

const FEATURED = [
  {
    href: '/safety-check',
    kicker: 'Flagship',
    title: '보증금 안전진단',
    desc: '공시가·지역 데이터로 전세 리스크를 숫자로 확인합니다.',
    cta: '진단 시작',
    large: true,
  },
  {
    href: '/contract',
    kicker: 'Before sign',
    title: '계약전 체크',
    desc: '입주 전에 놓치기 쉬운 필수 항목을 유형별로 정리했습니다.',
    cta: '체크리스트',
    large: false,
  },
  {
    href: '/golden-time',
    kicker: 'Deadline',
    title: '골든타임',
    desc: '갱신·통보·만기 등 놓치면 안 되는 날짜를 추적합니다.',
    cta: '일정 보기',
    large: false,
  },
];

const GROUPS = [
  {
    title: '내 임대차',
    subtitle: '일정과 절차를 한곳에서',
    items: [
      { href: '/lease-timeline', title: '타임라인', desc: '입주·만기·갱신·반환' },
      { href: '/move-in-checklist', title: '입주 체크', desc: '입주 후 30일 필수' },
      { href: '/deposit-return', title: '보증금 반환', desc: '퇴실·분쟁·등기 가이드' },
      { href: '/mypage', title: '마이페이지', desc: '만기일·알림·내 글' },
    ],
  },
  {
    title: '진단 · 도구',
    subtitle: '데이터와 AI로 판단',
    items: [
      { href: '/rent-increase', title: '임대료 진단', desc: '인상 한도 점검' },
      { href: '/legal-ai', title: '근방 AI', desc: '임대차법 조문 해설' },
      { href: '/renewal-check', title: '갱신 체크', desc: '갱신 요건 확인' },
    ],
  },
  {
    title: '정보 · 소통',
    subtitle: '권리와 경험을 연결',
    items: [
      { href: '/rights-guide', title: '권리백과', desc: '세입자 권리 정리' },
      { href: '/community', title: '커뮤니티', desc: '경험 나누기' },
      { href: '/feedback', title: '문의·요청', desc: '기능 제안' },
    ],
  },
];

export default function HomeRefresh() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <main>
        {/* Hero */}
        <section className="page-main relative overflow-hidden pb-16 sm:pb-24">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden
          >
            <div className="absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-[var(--brand)]/12 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-[var(--accent)]/10 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
          </div>

          <div className="page-container page-container-wide">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:items-center">
              <div className="space-y-8 text-center lg:text-left">
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <span className="ui-badge ui-badge-brand">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
                    BIGROOT · Tenant-first
                  </span>
                  <span className="ui-badge">법률 · 데이터 · 커뮤니티</span>
                </div>

                <h1 className="text-[2.25rem] sm:text-5xl lg:text-[3.25rem] font-black leading-[1.08] tracking-tight">
                  보증금과 권리,
                  <br />
                  <span className="text-[var(--brand)]">뿌리</span>
                  <span className="text-[var(--accent)]">부터</span> 단단하게.
                </h1>

                <p className="text-base sm:text-lg font-medium text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto lg:mx-0">
                  복잡한 임대차를 혼자 끌어안지 않아도 됩니다. 진단·일정·가이드로 다음
                  행동까지 연결해 드립니다.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link
                    href="/safety-check"
                    className="ui-btn-primary text-base px-7 shadow-[var(--shadow-brand)]"
                  >
                    안전진단 시작
                  </Link>
                  <Link href="/lease-timeline" className="ui-btn-secondary text-base px-7">
                    내 타임라인
                  </Link>
                </div>

                <dl className="grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0 pt-2">
                  {TRUST.map((t) => (
                    <div
                      key={t.label}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/80 px-3 py-3 text-center backdrop-blur-sm"
                    >
                      <dt className="text-lg sm:text-xl font-black text-[var(--brand)]">
                        {t.value}
                      </dt>
                      <dd className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] mt-0.5">
                        {t.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="ui-panel-dark p-6 sm:p-8 shadow-[var(--shadow-lg)] space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="ui-kicker text-white/50">Live checklist</p>
                  <span className="rounded-full bg-[var(--brand)] px-3 py-1 text-[10px] font-black text-[var(--brand-on)]">
                    READY
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black leading-snug">
                  오늘 할 일을
                  <br />
                  <span className="text-[var(--brand)]">한 화면</span>에.
                </p>
                <ul className="space-y-3 text-sm font-medium text-white/75">
                  {[
                    '전입·확정일자·임대차 신고 타이밍',
                    '만기·갱신·퇴거 골든타임 알림',
                    '보증금 반환 분쟁 대응 루트',
                  ].map((line) => (
                    <li key={line} className="flex gap-3 items-start">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--brand)] text-[10px] font-black text-[var(--brand-on)]">
                        ✓
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/move-in-checklist"
                  className="block w-full text-center py-3.5 rounded-xl bg-[var(--brand)] text-[var(--brand-on)] font-black text-sm hover:bg-[var(--brand-hover)] transition-colors"
                >
                  입주 체크리스트 열기
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="px-4 pb-16 sm:pb-20">
          <div className="page-container page-container-wide space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <p className="ui-kicker mb-2">Featured</p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  지금 바로 쓸 도구
                </h2>
              </div>
              <p className="text-sm font-medium text-[var(--text-muted)] max-w-xs">
                가장 많이 찾는 기능부터 연결했습니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FEATURED.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className={`ui-card ui-card-hover p-6 sm:p-7 flex flex-col min-h-[200px] group ${
                    f.large ? 'md:col-span-2 lg:col-span-2 lg:min-h-[220px]' : ''
                  }`}
                >
                  <span className="ui-kicker mb-3">{f.kicker}</span>
                  <h3
                    className={`font-black mb-2 group-hover:text-[var(--brand)] transition-colors ${
                      f.large ? 'text-2xl sm:text-3xl' : 'text-xl'
                    }`}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed flex-1">
                    {f.desc}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--accent)] group-hover:text-[var(--brand)] transition-colors">
                    {f.cta}
                    <span aria-hidden>→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Tool groups */}
        <section className="py-14 sm:py-20 px-4 bg-[var(--bg-surface)] border-y border-[var(--border)]">
          <div className="page-container page-container-wide space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <p className="ui-kicker">All tools</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                상황별로 골라 쓰세요
              </h2>
              <p className="text-sm sm:text-base font-medium text-[var(--text-secondary)]">
                임대차 여정 전체를 카테고리별로 정리했습니다.
              </p>
            </div>

            {GROUPS.map((group) => (
              <div key={group.title} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 border-b border-[var(--border)] pb-3">
                  <h3 className="text-lg font-black">{group.title}</h3>
                  <p className="text-sm font-medium text-[var(--text-muted)]">{group.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="ui-card ui-card-hover p-4 sm:p-5 group"
                    >
                      <h4 className="font-black text-base mb-1 group-hover:text-[var(--brand)] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs font-medium text-[var(--text-muted)]">{item.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="px-4 py-14 sm:py-16">
          <div className="page-container page-container-wide">
            <div className="rounded-[var(--radius-xl)] border border-[var(--border-strong,var(--border))] bg-[var(--text-primary)] px-6 py-10 sm:px-12 sm:py-12 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-8 shadow-[var(--shadow-lg)]">
              <div className="space-y-2">
                <p className="ui-kicker text-[var(--brand)]">Community</p>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  비슷한 고민, 함께 풀어요
                </h2>
                <p className="text-sm font-medium text-white/65 max-w-md">
                  실제 경험과 질문이 쌓이는 세입자 커뮤니티입니다.
                </p>
              </div>
              <Link
                href="/community"
                className="inline-flex shrink-0 ui-btn-primary text-base px-8 mt-6 sm:mt-0"
              >
                커뮤니티 가기
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
