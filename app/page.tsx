'use client';

import React from 'react';
import Link from 'next/link';

// --- 데이터 설정 ---
const userData = {
  name: '태근 님',
  activeCases: 2,
  documents: 8,
  guardianStatus: '활성화',
};

const quickActions = [
  { 
    icon: '📈', 
    title: '임대료 인상 진단', 
    desc: '5% 제한 및 환산액 확인', 
    bgColor: 'bg-blue-50', 
    textColor: 'text-blue-700', 
    href: '/rent-increase' 
  },
  { 
    icon: '💬', 
    title: '법률 AI 상담', 
    desc: '24시간 즉시 답변', 
    bgColor: 'bg-purple-50', 
    textColor: 'text-purple-700', 
    href: '/legal-ai' 
  },
  { 
    icon: '🛡️', 
    title: '권리 백과', 
    desc: '세입자 보호법 핵심 요약', 
    bgColor: 'bg-orange-50', 
    textColor: 'text-orange-700', 
    href: '/rights-guide' 
  },
  { 
    icon: '📂', 
    title: '내 서류 관리', 
    desc: '계약서 및 내용증명 보관', 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-700', 
    href: '/documents' 
  },
];

// --- 컴포넌트 ---

const DesktopNavbar = () => (
  <nav className="hidden md:block bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 left-0 right-0 z-50">
    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="text-xl font-black text-blue-600 flex items-center gap-2 tracking-tighter">
        <span>🌳</span> Big Root
      </div>
      <div className="flex items-center gap-8 text-sm font-bold text-gray-500">
        <Link href="/" className="text-blue-600">홈</Link>
        <Link href="/community" className="hover:text-blue-600 transition-colors">커뮤니티</Link>
        <Link href="/legal-ai" className="hover:text-blue-600 transition-colors">AI 상담</Link>
        <Link href="#" className="hover:text-blue-600 transition-colors">마이페이지</Link>
      </div>
    </div>
  </nav>
);

const MobileNavbar = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 md:hidden z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
    <div className="grid grid-cols-4 text-center">
      <Link href="/" className="flex flex-col items-center gap-1 text-blue-600">
        <div className="text-xl">🏠</div>
        <p className="text-[10px] font-black">홈</p>
      </Link>
      <Link href="/community" className="flex flex-col items-center gap-1 text-gray-400">
        <div className="text-xl">💬</div>
        <p className="text-[10px] font-black">커뮤니티</p>
      </Link>
      <Link href="/legal-ai" className="flex flex-col items-center gap-1 text-gray-400">
        <div className="text-xl">🤖</div>
        <p className="text-[10px] font-black">AI상담</p>
      </Link>
      <div className="flex flex-col items-center gap-1 text-gray-400">
        <div className="text-xl">⚙️</div>
        <p className="text-[10px] font-black">더보기</p>
      </div>
    </div>
  </nav>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNavbar />
      
      <main className="pt-6 pb-24 md:pt-32 md:pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 왼쪽 영역: 유저 정보 + 퀵 액션 */}
            <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
              
              <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-3xl font-black tracking-tight">{userData.name}</h1>
                      <p className="text-blue-100 text-sm mt-1 opacity-80 font-bold">빅루트 가디언 보호 중</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">🛡️</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl text-center">
                      <p className="text-[10px] text-blue-100 mb-1 font-bold uppercase tracking-wider">진행 사건</p>
                      <p className="text-2xl font-black">{userData.activeCases}건</p>
                    </div>
                    <div className="bg-emerald-400 p-4 rounded-3xl text-blue-900 text-center">
                      <p className="text-[10px] text-blue-800 mb-1 font-bold uppercase tracking-wider">가디언 상태</p>
                      <p className="text-2xl font-black">{userData.guardianStatus}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 빠른 도구 그리드 */}
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, i) => (
                  <Link key={i} href={action.href} className={`${action.bgColor} p-6 rounded-[32px] border-2 border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group`}>
                    <div className="bg-white w-12 h-12 flex items-center justify-center rounded-2xl mb-5 shadow-sm group-hover:scale-110 transition-transform text-2xl">{action.icon}</div>
                    <p className={`font-black text-sm ${action.textColor} tracking-tight`}>{action.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-bold">{action.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* 오른쪽 영역: 메인 피드 */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. 골든타임 알림 배너 */}
              <Link href="/golden-time" className="block group">
                <div className="bg-white p-8 rounded-[40px] border-2 border-emerald-100 shadow-xl shadow-emerald-50 flex flex-col md:flex-row items-center gap-6 hover:border-emerald-300 transition-all overflow-hidden relative">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform">⏳</div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-black text-gray-900 mb-1">놓치면 안 되는 '골든타임'</h3>
                    <p className="text-xs text-gray-500 font-medium mb-3">무료 알림 등록하고 내 권리를 지키세요.</p>
                    <span className="inline-block bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg">알림 신청하기 →</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 text-emerald-50 opacity-10 text-8xl font-black">ROOT</div>
                </div>
              </Link>

              {/* 2. 🚨 신규: 커뮤니티 바로가기 배너 */}
              <Link href="/community" className="block group">
                <div className="bg-white p-8 rounded-[40px] border-2 border-yellow-100 shadow-xl shadow-yellow-50 flex flex-col md:flex-row items-center gap-6 hover:border-yellow-300 transition-all overflow-hidden relative">
                  <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">💬</div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-black text-gray-900 mb-1">빅루트 세입자 커뮤니티</h3>
                    <p className="text-xs text-gray-500 font-medium mb-3">나와 비슷한 고민을 가진 사람들의 해결법</p>
                    <span className="inline-block bg-yellow-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg">함께 고민 나누기 →</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 text-yellow-50 opacity-10 text-8xl font-black">ROUTE</div>
                </div>
              </Link>

              {/* 최근 리포트/활동 */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">실시간 가디언 리포트</h2>
                  <button className="text-xs font-bold text-blue-600">전체보기</button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { title: '계약 만기 알림', desc: '태근 님의 만기일이 90일 앞으로 다가왔습니다. 갱신권을 확인하세요.', status: '알림', color: 'bg-blue-50 text-blue-600' },
                    { title: '신규 질문 등록', desc: '커뮤니티에 "도배 비용 청구" 관련 새로운 질문이 올라왔습니다.', status: '커뮤니티', color: 'bg-yellow-50 text-yellow-600' }
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black mb-3 ${item.color}`}>{item.status}</span>
                      <h4 className="font-bold text-gray-800 mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <MobileNavbar />
    </div>
  );
}