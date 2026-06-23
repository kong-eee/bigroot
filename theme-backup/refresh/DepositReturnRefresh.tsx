'use client';

import Link from 'next/link';
import { useState } from 'react';
import PageHero from '@/app/components/layout/PageHero';
import PageShell from '@/app/components/layout/PageShell';
import { DEPOSIT_RETURN_PHASES, OFFICIAL_LINKS } from '@/lib/deposit-return-guide-data';

export default function DepositReturnRefresh() {
  const [openPhase, setOpenPhase] = useState<string>(DEPOSIT_RETURN_PHASES[0]?.id ?? '');

  return (
    <PageShell>
      <PageHero
        badge="보증금 반환 · ROUTE"
        title={
          <>
            보증금 반환
            <br />
            <span className="text-[var(--brand)]">분쟁 대응 가이드</span>
          </>
        }
        description="퇴실 통보부터 내용증명·조정·임차권등기까지, 단계별로 무엇을 할지 정리했습니다."
      />

      <p className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg p-4 mb-8">
        본 내용은 일반 정보이며 법률 자문이 아닙니다. 구체적 사안은 법률구조공단(132) 등 전문 기관과
        상담하세요.
      </p>

      <div className="space-y-4 mb-10">
        {DEPOSIT_RETURN_PHASES.map((phase) => {
          const isOpen = openPhase === phase.id;
          return (
            <div key={phase.id} className="ui-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenPhase(isOpen ? '' : phase.id)}
                className="w-full p-5 text-left flex justify-between items-start gap-4 hover:bg-[var(--bg-muted)]/50 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-black text-[var(--brand)]">{phase.phase}</span>
                  <h2 className="font-black text-lg mt-1">{phase.title}</h2>
                  <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">{phase.summary}</p>
                </div>
                <span className="text-xl font-black text-[var(--text-muted)] shrink-0">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)]">
                  {phase.steps.map((step) => (
                    <div key={step.id} className="pt-4 space-y-2">
                      <h3 className="font-black text-sm">{step.title}</h3>
                      <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                        {step.body}
                      </p>
                      <ul className="text-xs font-bold text-[var(--text-primary)] space-y-1 list-disc list-inside">
                        {step.actions.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                      {step.warning && (
                        <p className="text-[11px] font-bold text-amber-700 bg-amber-50 rounded-lg p-2">
                          {step.warning}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section className="ui-card p-6 space-y-4 mb-8">
        <h2 className="font-black">도움 받을 곳</h2>
        <ul className="space-y-2">
          {OFFICIAL_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-sm font-bold text-[var(--brand)] hover:underline"
                {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/lease-timeline" className="ui-btn-primary text-sm text-center">
          내 타임라인
        </Link>
        <Link href="/legal-ai" className="ui-btn-secondary text-sm text-center">
          빅루트 AI
        </Link>
        <Link href="/feedback" className="ui-btn-secondary text-sm text-center">
          문의·요청
        </Link>
      </div>
    </PageShell>
  );
}
