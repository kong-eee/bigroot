'use client';

import Link from 'next/link';

const SERVICES = [
  {
    href: '/contract',
    icon: '📋',
    title: '계약전 체크',
    desc: '입주 전에 꼭 확인할 항목을 단계별로 안내해요.',
  },
  {
    href: '/safety-check',
    icon: '🛡️',
    title: '안전진단',
    desc: '우리 집 공시가·지역 정보로 보증금 리스크를 점검해요.',
  },
  {
    href: '/community',
    icon: '💬',
    title: '커뮤니티',
    desc: '비슷한 고민을 나누고 경험을 함께 모아요.',
  },
  {
    href: '/legal-ai',
    icon: '🤖',
    title: '근방 AI',
    desc: '주택임대차보호법 조문 기반으로 쉽게 설명해 드려요.',
  },
  {
    href: '/rights-guide',
    icon: '📖',
    title: '권리백과',
    desc: '알아두면 좋은 세입자 권리를 정리했어요.',
  },
  {
    href: '/rent-increase',
    icon: '📈',
    title: '임대료 진단',
    desc: '임대료 인상이 적정한지 데이터로 확인해요.',
  },
  {
    href: '/golden-time',
    icon: '⏰',
    title: '골든타임',
    desc: '갱신·통보 등 놓치면 안 되는 날짜를 챙겨요.',
  },
  {
    href: '/feedback',
    icon: '✉️',
    title: '문의·요청',
    desc: '원하는 기능이나 개선점을 알려 주세요.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <main>
        <section className="page-main pb-12 sm:pb-20">
          <div className="page-container page-container-wide">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs font-bold text-[var(--brand)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse" />
                  세입자를 위한 권리·정보 플랫폼
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                  어려운 임대차,
                  <br />
                  <span className="text-[var(--brand)]">함께 풀어가요.</span>
                </h1>
                <p className="text-base sm:text-lg font-medium text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto lg:mx-0">
                  법률 용어는 쉽게, 절차는 차근차근. 보증금과 계약 권리를 지키는 데 필요한
                  도구를 한곳에 모았습니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/safety-check" className="ui-btn-primary text-base px-6">
                    안전진단 시작하기
                  </Link>
                  <Link href="/community" className="ui-btn-secondary text-base px-6">
                    커뮤니티 둘러보기
                  </Link>
                </div>
              </div>

              <div className="ui-card p-6 sm:p-8 space-y-4">
                <p className="text-sm font-bold text-[var(--brand)]">오늘의 한 줄</p>
                <p className="text-lg sm:text-xl font-black leading-snug">
                  &ldquo;계약서에 적힌 내용보다, 법으로 보장되는 권리가 더 클 수 있어요.&rdquo;
                </p>
                <ul className="space-y-2 text-sm font-medium text-[var(--text-secondary)]">
                  <li className="flex gap-2">
                    <span className="text-[var(--brand)]">✓</span> 모바일에서도 편하게 이용
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--brand)]">✓</span> 전문 용어 대신 쉬운 설명
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--brand)]">✓</span> 세입자 커뮤니티·AI 상담
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-[var(--bg-surface)] border-y border-[var(--border)]">
          <div className="page-container page-container-wide space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black">무엇을 도와드릴까요?</h2>
              <p className="text-sm sm:text-base font-medium text-[var(--text-secondary)]">
                상황에 맞는 메뉴를 골라 보세요.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVICES.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="ui-card p-5 hover:border-[var(--brand)] transition-colors group min-h-[140px] flex flex-col"
                >
                  <span className="text-2xl mb-3">{s.icon}</span>
                  <h3 className="font-black text-base mb-1 group-hover:text-[var(--brand)]">
                    {s.title}
                  </h3>
                  <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed flex-1">
                    {s.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-4 bg-[var(--text-primary)] text-[var(--bg-muted)]">
        <div className="page-container page-container-wide flex flex-col sm:flex-row justify-between gap-8">
          <div className="space-y-2">
            <p className="text-xl font-black text-white">
              BIG<span className="text-[var(--brand-soft)]">ROOT</span>
            </p>
            <p className="text-sm font-medium max-w-xs">
              세입자가 당당한 세상을 위해, 데이터와 법률로 뿌리를 내립니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-8 text-sm font-bold">
            <div className="space-y-2">
              <p className="text-white">서비스</p>
              <Link href="/community" className="block hover:text-white">
                커뮤니티
              </Link>
              <Link href="/feedback" className="block hover:text-white">
                문의·요청
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-white">도구</p>
              <Link href="/safety-check" className="block hover:text-white">
                안전진단
              </Link>
              <Link href="/legal-ai" className="block hover:text-white">
                근방 AI
              </Link>
            </div>
          </div>
        </div>
        <p className="page-container page-container-wide mt-10 pt-6 border-t border-white/10 text-center text-xs font-medium">
          © 2026 빅루트
        </p>
      </footer>
    </div>
  );
}
