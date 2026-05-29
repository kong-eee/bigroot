'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-700">
      
      {/* 💡 구조 최적화 안내: 
        상단 내비게이션 바(Navbar)와 온보딩 닉네임 설정 모달은 
        이미 app/layout.tsx에 공통 탑재되어 전 주소창에 실시간 작동 중이므로, 
        본 페이지에서는 중복 렌더링 충돌을 막기 위해 본문(main)과 푸터(footer)에만 집중합니다.
      */}

      <main className="pt-20">
        
        {/* 🚀 1. 프리미엄 히어로 섹션 */}
        <section className="relative pt-32 pb-40 px-8 overflow-hidden">
          {/* 우상단 은은한 프리미엄 블루 그라데이션 조명 오라 */}
          <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
          
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
            {/* 좌측: 타이틀 및 핵심 액션 버튼 그룹 */}
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
                복잡한 부동산 법률과 불합리한 상황 속에서도,<br className="hidden md:block" /> 
                당신의 소중한 보증금과 권리를 단단하게 지켜드립니다.
              </p>
              
              <div className="flex flex-wrap gap-5 justify-center lg:justify-start">
                <Link href="/community" className="px-12 py-6 bg-[#007AFF] text-white rounded-2xl font-black text-lg hover:scale-105 hover:shadow-2xl hover:shadow-blue-200 transition-all active:scale-95">
                  빅루트 시작하기
                </Link>
                <Link href="/rights-guide" className="px-12 py-6 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all">
                  권리백과 구경하기
                </Link>
              </div>
            </div>

            {/* 우측: 프리미엄 3D 회전 카드 가상 자산 코너 */}
            <div className="flex-1 relative">
              <div className="w-[450px] h-[550px] bg-gradient-to-br from-blue-500 to-blue-700 rounded-[4rem] shadow-3xl rotate-3 flex items-center justify-center text-[10rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                🏠
                <div className="absolute bottom-10 left-10 right-10 bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/30 -rotate-3">
                  <p className="text-white text-lg font-black italic">"내 집 마련 전까지, 내 권리부터!"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🏛️ 2. 전문 서비스 그리드 섹션 */}
        <section className="bg-white py-40 px-8 border-t border-slate-50">
          <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
              <h3 className="text-blue-600 font-black tracking-widest text-sm uppercase">Our Services</h3>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">전문가가 설계한 세입자 전용 솔루션</h2>
            </div>
            
            {/* ✅ 4열 가로 정렬 밸런스 완벽 복구 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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

            <div className="text-center space-y-4 pt-16">
              <h3 className="text-slate-400 font-black tracking-widest text-sm uppercase">My Lease</h3>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">내 임대차 관리</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

      {/* 🏢 3. 대기업 스타일 명품 푸터 고정 */}
      <footer className="py-20 px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <div className="text-3xl font-black tracking-tighter">BIG<span className="text-blue-500">ROOT</span></div>
            <p className="text-slate-400 font-medium max-w-xs">세입자가 당당한 세상을 위해 데이터와 법률로 뿌리를 내립니다.</p>
          </div>
          
          <div className="flex gap-20">
            <div className="space-y-4">
              <h5 className="font-black text-lg">서비스</h5>
              <div className="flex flex-col gap-2 text-slate-400 text-sm font-bold">
                <Link href="/community" className="hover:text-white transition-colors">커뮤니티</Link>
                <Link href="/rights-guide" className="hover:text-white transition-colors">권리백과</Link>
                <Link href="/rent-increase" className="hover:text-white transition-colors">임대료진단</Link>
                <Link href="/golden-time" className="hover:text-white transition-colors">골든타임</Link>
                <Link href="/lease-timeline" className="hover:text-white transition-colors">내 타임라인</Link>
                <Link href="/move-in-checklist" className="hover:text-white transition-colors">입주 체크</Link>
                <Link href="/deposit-return" className="hover:text-white transition-colors">보증금 반환</Link>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-lg">고객지원</h5>
              <div className="flex flex-col gap-2 text-slate-400 text-sm font-bold">
                <p className="hover:text-white transition-colors cursor-pointer">문의하기</p>
                <p className="hover:text-white transition-colors cursor-pointer">이용약관</p>
                <p className="hover:text-white transition-colors cursor-pointer">개인정보처리방침</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-slate-800 text-center text-slate-500 text-sm font-bold">
          &copy; 2026 빅루트. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// 🗂️ 하단 카드 반복 컴포넌트 추출
function ServiceCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="group p-12 bg-slate-50 rounded-[3rem] border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-2xl transition-all duration-500 flex flex-col justify-between min-h-[340px]">
      <div>
        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-4xl shadow-sm mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">{icon}</div>
        <h4 className="text-2xl font-black text-slate-900 mb-4">{title}</h4>
        <p className="text-slate-500 font-bold leading-relaxed text-sm">{desc}</p>
      </div>
      <div className="pt-8 flex items-center gap-2 text-blue-600 font-black opacity-0 group-hover:opacity-100 transition-opacity">
        자세히 보기 <span className="text-xl">→</span>
      </div>
    </Link>
  );
}