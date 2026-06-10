'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';

const CHECKLIST = [
  '전입·확정일자·임대차 신고 타이밍',
  '만기·갱신·퇴거 골든타임 알림',
  '보증금 반환 분쟁 대응 루트',
];

export default function HomeRefresh() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] font-sans text-[var(--text-primary)] selection:bg-[var(--brand-soft)] selection:text-[var(--brand)]">
      <main className="pt-20">
        <section className="relative pt-28 pb-36 px-8 overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 w-[560px] h-[560px] bg-[var(--brand-soft)] rounded-full blur-3xl opacity-70 translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-[var(--accent-soft)] rounded-full blur-3xl opacity-80 -translate-x-1/4 translate-y-1/4" />

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
            <div className="flex-1 space-y-9 text-center lg:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <BrandLogo size="lg" href={null} showWordmark={false} />
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--bg-surface)] rounded-full shadow-sm border border-[var(--border)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand)]" />
                  </span>
                  <span className="text-xs font-black text-[var(--accent)] tracking-wider uppercase">
                    세입자 권리 · 뿌리부터
                  </span>
                </div>
              </div>

              <h1 className="ui-hero-title text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-[var(--text-primary)] leading-[1.08] md:leading-[1.05]">
                세입자의
                <br />
                <span className="text-[var(--brand)] inline-block mt-2">든든한 뿌리.</span>
              </h1>

              <p className="text-lg md:text-2xl text-[var(--text-secondary)] font-bold leading-relaxed max-w-2xl mx-auto lg:mx-0">
                복잡한 부동산 법률과 불합리한 상황 속에서도,
                <br className="hidden md:block" />
                당신의 소중한 보증금과 권리를 단단하게 지켜드립니다.
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  href="/community"
                  className="px-10 py-5 bg-[var(--brand)] text-[var(--brand-on)] rounded-2xl font-black text-lg hover:scale-105 hover:shadow-2xl hover:shadow-[var(--shadow-brand)] transition-all active:scale-95"
                >
                  커뮤니티
                </Link>
                <Link
                  href="/rights-guide"
                  className="px-10 py-5 bg-[var(--bg-surface)] text-[var(--text-primary)] border-2 border-[var(--border)] rounded-2xl font-black text-lg hover:bg-[var(--bg-muted)] hover:border-[var(--accent)] transition-all"
                >
                  권리백과 구경하기
                </Link>
              </div>
            </div>

            <div className="flex-1 w-full max-w-[450px] lg:max-w-none">
              <div className="ui-panel-dark p-8 sm:p-10 shadow-2xl rounded-[2.5rem] space-y-6 border border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-black tracking-widest uppercase text-white/50">
                    Live checklist
                  </p>
                  <span className="rounded-full bg-[var(--brand)] px-3 py-1 text-[10px] font-black text-[var(--brand-on)]">
                    READY
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black leading-snug">
                  오늘 할 일을
                  <br />
                  <span className="text-[var(--brand)]">한 화면</span>에.
                </p>
                <ul className="space-y-3 text-sm font-bold text-white/80">
                  {CHECKLIST.map((line) => (
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
                  className="block w-full text-center py-4 rounded-2xl bg-[var(--brand)] text-[var(--brand-on)] font-black text-base hover:bg-[var(--brand-hover)] transition-colors"
                >
                  입주 체크리스트 열기
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--bg-surface)] py-32 px-8 border-t border-[var(--border)]">
          <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
              <h3 className="text-[var(--accent)] font-black tracking-widest text-sm uppercase">
                Our Services
              </h3>
              <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">
                전문가가 설계한 세입자 전용 솔루션
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <ServiceCard
                href="/community"
                icon="🗨️"
                title="커뮤니티"
                desc="실시간으로 쏟아지는 부동산 고민, 같은 처지의 임차인들과 전문가가 함께 답해드립니다."
              />
              <ServiceCard
                href="/rights-guide"
                icon="📖"
                title="권리백과"
                desc="어려운 법률 용어는 이제 그만. 세입자가 꼭 알아야 할 핵심 법규를 쉽게 풀어드립니다."
              />
              <ServiceCard
                href="/rent-increase"
                icon="📈"
                title="임대료 진단"
                desc="우리 집 임대료 인상이 적정한지, 상한제 적용 대상인지 데이터로 정확히 분석합니다."
              />
              <ServiceCard
                href="/golden-time"
                icon="⏳"
                title="골든타임"
                desc="계약 갱신 요구권, 퇴거 통보 등 절대로 놓쳐선 안 될 임대차 중요 날짜를 정밀하게 추적합니다."
              />
            </div>

            <div className="text-center space-y-4 pt-12">
              <h3 className="text-[var(--text-muted)] font-black tracking-widest text-sm uppercase">
                My Lease
              </h3>
              <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]">
                내 임대차 관리
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <ServiceCard
                href="/lease-timeline"
                icon="📅"
                title="개인 타임라인"
                desc="입주부터 만기·갱신·보증금 반환까지 내 일정을 한 줄로 정리합니다."
              />
              <ServiceCard
                href="/move-in-checklist"
                icon="✅"
                title="입주 직후 체크"
                desc="전입신고, 하자 기록, 임대차 신고 등 입주 후 필수 항목을 단계별로 챙깁니다."
              />
              <ServiceCard
                href="/deposit-return"
                icon="💸"
                title="보증금 반환 가이드"
                desc="퇴실 통보부터 내용증명·분쟁조정·임차권등기까지 분쟁 대응 절차를 안내합니다."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-16 px-8 bg-[var(--text-primary)] text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-5">
            <BrandLogo size="md" href={null} className="[&_img]:brightness-110" />
            <p className="text-white/60 font-medium max-w-xs leading-relaxed">
              세입자가 당당한 세상을 위해 데이터와 법률로 뿌리를 내립니다.
            </p>
          </div>

          <div className="flex gap-16 sm:gap-20">
            <div className="space-y-4">
              <h5 className="font-black text-lg text-[var(--brand-soft)]">서비스</h5>
              <div className="flex flex-col gap-2 text-white/55 text-sm font-bold">
                <FooterLink href="/community">커뮤니티</FooterLink>
                <FooterLink href="/rights-guide">권리백과</FooterLink>
                <FooterLink href="/rent-increase">임대료진단</FooterLink>
                <FooterLink href="/golden-time">골든타임</FooterLink>
                <FooterLink href="/lease-timeline">내 타임라인</FooterLink>
                <FooterLink href="/move-in-checklist">입주 체크</FooterLink>
                <FooterLink href="/deposit-return">보증금 반환</FooterLink>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-lg text-[var(--brand-soft)]">고객지원</h5>
              <div className="flex flex-col gap-2 text-white/55 text-sm font-bold">
                <FooterLink href="/feedback">문의하기</FooterLink>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-white/10 text-center text-white/45 text-sm font-bold">
          &copy; 2026 빅루트. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group p-10 bg-[var(--bg-muted)] rounded-[2.5rem] border border-transparent hover:border-[var(--brand)] hover:bg-[var(--bg-surface)] hover:shadow-2xl transition-all duration-500 flex flex-col justify-between min-h-[300px]"
    >
      <div>
        <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-[var(--border)]">
          {icon}
        </div>
        <h4 className="text-xl font-black text-[var(--text-primary)] mb-3 group-hover:text-[var(--brand)] transition-colors">
          {title}
        </h4>
        <p className="text-[var(--text-secondary)] font-bold leading-relaxed text-sm">{desc}</p>
      </div>
      <div className="pt-6 flex items-center gap-2 text-[var(--accent)] font-black opacity-0 group-hover:opacity-100 group-hover:text-[var(--brand)] transition-all">
        자세히 보기 <span className="text-xl">→</span>
      </div>
    </Link>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="hover:text-[var(--brand-soft)] transition-colors">
      {children}
    </Link>
  );
}
