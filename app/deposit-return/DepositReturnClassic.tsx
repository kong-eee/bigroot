'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DEPOSIT_RETURN_PHASES, OFFICIAL_LINKS } from '@/lib/deposit-return-guide-data';

export default function DepositReturnClassic() {
  const [active, setActive] = useState(0);
  const phase = DEPOSIT_RETURN_PHASES[active];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-4xl mx-auto px-6 pt-28">
        <header className="text-center mb-12">
          <span className="text-xs font-black text-[#007AFF] tracking-widest">DEPOSIT RETURN</span>
          <h1 className="text-4xl md:text-5xl font-[1000] mt-2">
            보증금 반환 <span className="text-[#007AFF]">가이드</span>
          </h1>
          <p className="text-slate-500 font-bold mt-4 max-w-lg mx-auto">
            퇴실부터 임차권등기까지, 단계별 대응 방법을 안내합니다.
          </p>
        </header>

        <p className="text-xs font-bold text-slate-500 bg-white border border-slate-100 rounded-2xl p-4 mb-8 text-center">
          정보 제공 목적이며 법률 자문이 아닙니다. 중요 결정은 전문 기관과 상담하세요.
        </p>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {DEPOSIT_RETURN_PHASES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              className={`px-5 py-2.5 rounded-full text-xs font-black transition-all ${
                active === i
                  ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              {p.phase}
            </button>
          ))}
        </div>

        {phase && (
          <article className="bg-white rounded-[2.5rem] border-2 border-slate-50 p-10 shadow-xl space-y-8">
            <div>
              <h2 className="text-2xl font-black">{phase.title}</h2>
              <p className="text-slate-500 font-bold mt-2">{phase.summary}</p>
            </div>
            {phase.steps.map((step) => (
              <div key={step.id} className="border-t border-slate-100 pt-6 space-y-3">
                <h3 className="text-lg font-black text-[#007AFF]">{step.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">{step.body}</p>
                <ul className="space-y-2">
                  {step.actions.map((a) => (
                    <li
                      key={a}
                      className="flex gap-2 text-sm font-bold text-slate-700 before:content-['✓'] before:text-[#007AFF]"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
                {step.warning && (
                  <p className="text-sm font-black text-orange-600 bg-orange-50 p-4 rounded-2xl">
                    {step.warning}
                  </p>
                )}
              </div>
            ))}
          </article>
        )}

        <div className="mt-12 bg-slate-900 text-white rounded-[2.5rem] p-8 space-y-4">
          <h3 className="font-black text-lg">도움 받을 곳</h3>
          {OFFICIAL_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block text-blue-400 font-black text-sm hover:underline"
              {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-10">
          <Link
            href="/lease-timeline"
            className="px-8 py-4 bg-[#007AFF] text-white font-black rounded-2xl"
          >
            타임라인
          </Link>
          <Link
            href="/legal-ai"
            className="px-8 py-4 bg-white border-2 border-slate-100 font-black rounded-2xl"
          >
            근방 AI
          </Link>
        </div>
      </div>
    </div>
  );
}
