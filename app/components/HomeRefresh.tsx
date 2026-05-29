'use client';

import Link from 'next/link';
import BrandTagline from './layout/BrandTagline';
import SiteFooter from './layout/SiteFooter';

const SERVICES = [
  { href: '/contract', icon: '📋', title: '계약전 체크', desc: '입주 전 꼭 확인할 항목을 단계별로 안내해요.' },
  { href: '/safety-check', icon: '🛡️', title: '안전진단', desc: '공시가·지역 정보로 보증금 리스크를 점검해요.' },
  { href: '/community', icon: '💬', title: '커뮤니티', desc: '비슷한 고민을 나누고 경험을 함께 모아요.' },
  { href: '/legal-ai', icon: '🤖', title: '근방 AI', desc: '주택임대차보호법 조문을 쉽게 풀어 드려요.' },
  { href: '/rights-guide', icon: '📖', title: '권리백과', desc: '알아두면 좋은 세입자 권리를 정리했어요.' },
  { href: '/rent-increase', icon: '📈', title: '임대료 진단', desc: '임대료 인상이 적정한지 확인해요.' },
  { href: '/golden-time', icon: '⏰', title: '골든타임', desc: '갱신·통보 등 중요 날짜를 챙겨요.' },
  { href: '/lease-timeline', icon: '📅', title: '내 타임라인', desc: '입주·만기·갱신·보증금 일정을 한눈에.' },
  { href: '/move-in-checklist', icon: '✅', title: '입주 체크', desc: '입주 당일~30일 필수 항목을 체크해요.' },
  { href: '/deposit-return', icon: '💸', title: '보증금 반환', desc: '퇴실·분쟁·임차권등기 단계별 가이드.' },
  { href: '/feedback', icon: '✉️', title: '문의·요청', desc: '원하는 기능·개선점을 알려 주세요.' },
];

export default function HomeRefresh() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <main>
        <section className="page-main pb-12 sm:pb-20">
          <div className="page-container page-container-wide">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs font-bold text-[var(--brand)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse" />
                  빅루트 BIGROOT
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                  세입자의
                  <br />
                  <span className="text-[var(--brand)]">든든한 뿌리,</span>
                  <br />
                  든든한 길.
                </h1>
                <BrandTagline showWordplay />
                <p className="text-base sm:text-lg font-medium text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto lg:mx-0">
                  
                  권리를 단단히 세우고, 
                  다음 선택까지 안내합니다. <br/>어려운 임대차, 혼자 고민하지 마세요.
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
                <p className="text-sm font-bold text-[var(--brand)]">빅루트에서 할 수 있는 것</p>
                <ul className="space-y-3 text-sm font-medium text-[var(--text-secondary)]">
                  <li className="flex gap-2">
                    <span className="text-[var(--brand)]">✓</span> 보증금·계약 권리
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--brand)]">✓</span> 절차·정보 안내
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--brand)]">✓</span> 모바일에서도 편한 화면
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--brand)]">✓</span> 커뮤니티와 근방 AI
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
      <SiteFooter />
    </div>
  );
}
