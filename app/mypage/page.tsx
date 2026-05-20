'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pt-20">
      <main>
        {/* 프리미엄 히어로 섹션 */}
        <section className="relative pt-32 pb-40 px-8 overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-white rounded-full shadow-sm border border-slate-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs font-black text-blue-600 tracking-wider uppercase">대한민국 1위 세입자 권리 보호 플랫폼</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-[1000] text-slate-900 leading-[1.05] tracking-tight">
                세입자의<br />
                <span className="text-[#007AFF] inline-block mt-2">든든한 뿌리.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-500 font-bold leading-relaxed max-w-2xl mx-auto lg:mx-0">
                복잡한 부동산 법률과 불합리한 상황 속에서도<br className="hidden md:block" /> 
                당신의 소중한 보증금และ 권리를 단단하게 지켜드립니다.
              </p>
              <div className="flex flex-wrap gap-5 justify-center lg:justify-start">
                <Link href="/contract" className="px-12 py-6 bg-[#007AFF] text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-blue-200">계약 전 체크리스트 보기 📋</Link>
                <Link href="/community" className="px-12 py-6 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all">커뮤니티 구경하기</Link>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="w-[450px] h-[550px] bg-gradient-to-br from-blue-500 to-blue-700 rounded-[4rem] shadow-3xl rotate-3 flex items-center justify-center text-[10rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                🏠
                <div className="absolute bottom-10 left-10 right-10 bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/30 -rotate-3">
                    <p className="text-white text-lg font-black italic">{"\"내 집 마련 전까지, 내 권리부터!\""}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 전문 서비스 그리드 섹션 */}
        <section className="bg-white py-32 px-8 border-t border-slate-100">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h3 className="text-blue-600 font-black tracking-widest text-sm uppercase">Our Services</h3>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">전문가가 설계한 세입자 전용 솔루션</h2>
            </div>
            <div className="w-full">
              <Link href="/contract" className="group flex flex-col md:flex-row items-start md:items-center justify-between p-12 bg-blue-50/50 rounded-[3rem] border border-blue-100/60 hover:bg-white hover:border-blue-400 hover:shadow-2xl transition-all duration-500 gap-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">🔥</div>
                  <div className="space-y-2">
                    <div className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black tracking-widest uppercase">MUST WATCH</div>
                    <h4 className="text-3xl font-black text-slate-900">계약 전 필수 체크리스트</h4>
                    <p className="text-slate-500 font-bold leading-relaxed max-w-2xl">보증금을 안전하게 지키기 위해 무조건 확인해야 하는 유형별 핵심 가이드</p>
                  </div>
                </div>
                <div className="text-3xl text-blue-600 font-black group-hover:translate-x-3 transition-transform duration-300 shrink-0 hidden md:block">지금 확인하기 →</div>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <ServiceCard href="/community" icon="🗨️" title="커뮤니티" desc="부동산 고민, 임차인들과 전문가가 함께 답해드립니다." />
              <ServiceCard href="/rights-guide" icon="📖" title="권리백과" desc="세입자가 꼭 알아야 할 핵심 법규를 쉽게 풀어드립니다." />
              <ServiceCard href="/rent-increase" icon="📈" title="임대료 진단" desc="우리 집 임대료 인상이 적정한지 데이터로 정확히 분석합니다." />
              <ServiceCard href="/golden-time" icon="⏳" title="골든타임" desc="절대로 놓쳐선 안 될 임대차 중요 날짜를 정밀하게 추적합니다." />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ServiceCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="group p-8 bg-slate-50 rounded-[2.5rem] hover:border-blue-200 hover:bg-white hover:shadow-2xl transition-all duration-500 flex flex-col justify-between border border-transparent">
      <div>
        <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">{icon}</div>
        <h4 className="text-xl font-black text-slate-900 mb-3">{title}</h4>
        <p className="text-slate-500 font-bold leading-relaxed text-xs">{desc}</p>
      </div>
      <div className="pt-6 flex items-center gap-2 text-blue-600 text-xs font-black opacity-0 group-hover:opacity-100 transition-all">자세히 보기 <span>→</span></div>
    </Link>
  );
}