'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// 가이드 데이터 (기존 데이터 유지)
const guideCategories = [
  {
    id: 'money', icon: '💰', title: '돈의 권리',
    content: [
      { q: "5% 인상, 무조건 해줘야 하나요?", a: "아닙니다. 5%는 법이 정한 '최대한도'일 뿐입니다. 주변 시세가 떨어졌거나 경제 상황이 어렵다면 동결이나 감액을 요구할 수도 있습니다." },
      { q: "전입신고는 왜 당일 바로 해야 하나요?", a: "내 보증금을 지켜주는 '대항력'은 전입신고 다음 날 0시부터 발생하기 때문입니다. 이사 당일 잔금을 치르자마자 전입신고와 확정일자를 꼭 받으세요." },
      { q: "월세 세액공제, 집주인 동의가 필요한가요?", a: "아니요, 필요 없습니다. 집주인 모르게 신청해도 연말정산 시 최대 15~17%까지 환급받을 수 있습니다. 단, 전입신고가 되어 있어야 합니다." }
    ]
  },
  {
    id: 'time', icon: '⏳', title: '시간의 권리',
    content: [
      { q: "1년만 계약했는데, 더 살 수 있나요?", a: "네! 법적으로 주택 임대차 계약은 최소 2년으로 보호받습니다. 1년 계약을 했더라도 세입자는 당당하게 2년 거주를 주장할 수 있습니다." },
      { q: "계약갱신요구권(2+2), 언제 써야 하나요?", a: "만기 6개월 전부터 2개월 전까지입니다. 빅루트의 '골든타임 가디언' 알림에 맞춰 집주인에게 의사를 전달하면 2년 더 거주가 보장됩니다." },
      { q: "묵시적 갱신이 되면 무엇이 좋은가요?", a: "임대료 인상 없이 이전 조건 그대로 연장되며, 세입자는 언제든 집주인에게 해지 통보를 하고 3개월 뒤에 나갈 수 있는 강력한 자유를 갖게 됩니다." }
    ]
  },
  {
    id: 'stay', icon: '🏠', title: '거주의 권리',
    content: [
      { q: "보일러가 고장 났는데 누가 고치나요?", a: "보일러, 수도관, 벽면 균열 같은 '구조적 결함'은 무조건 임대인(집주인) 책임입니다. 세입자는 고의 과실이 없다면 수리비를 낼 의무가 없습니다." },
      { q: "집주인이 갑자기 들어오겠다고 합니다.", a: "안 됩니다. 아무리 집주인이라도 세입자의 동의 없이 무단으로 들어오는 것은 '주거침입'에 해당합니다. 반드시 사전에 일정을 협의해야 합니다." }
    ]
  },
  {
    id: 'bye', icon: '🏃', title: '이별의 권리',
    content: [
      { q: "만기 전 이사 시 복비, 세입자가 내나요?", a: "판례상 원칙적으로는 임대인이 내야 하지만, 실무에서는 다음 세입자를 구해주고 복비를 부담하는 것이 관례입니다. 단, 계약서에 특약이 없다면 협상의 여지가 있습니다." },
      { q: "벽지 색이 변했는데 다 물어줘야 하나요?", a: "아니요. 시간이 흐르며 자연스럽게 변색되거나 닳는 '통상적인 마모'는 원상복구 대상이 아닙니다. 고의로 파손한 것이 아니라면 당당하게 거부하세요." }
    ]
  }
];

export default function RightsGuidePage() {
  const [activeTab, setActiveTab] = useState('money');
  const [searchQuery, setSearchQuery] = useState('');

  // 검색어에 따른 필터링 로직
  const filteredContent = useMemo(() => {
    if (!searchQuery) {
      return guideCategories.find(c => c.id === activeTab)?.content || [];
    }
    
    // 전체 카테고리에서 검색어와 매칭되는 질문/답변 찾기
    const allContent = guideCategories.flatMap(c => c.content);
    return allContent.filter(item => 
      item.q.includes(searchQuery) || item.a.includes(searchQuery)
    );
  }, [activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="p-6 bg-white border-b border-gray-100 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
        <Link href="/" className="hover:text-blue-600 transition-colors p-2 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-xl font-black text-blue-600 tracking-tighter">빅루트 권리 백과 🛡️</h1>
      </header>

      <main className="flex-1 p-5 md:p-8 max-w-3xl mx-auto w-full space-y-8">
        <div className="text-center md:text-left space-y-4">
          <h2 className="text-3xl font-black leading-tight tracking-tighter text-gray-800">
            무엇이 궁금하신가요?
          </h2>
          
          {/* 🔍 질문/검색 칸 추가 */}
          <div className="relative group">
            <input 
              type="text" 
              placeholder="예: 보일러 수리, 갱신권 거절, 복비..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-5 pl-14 bg-white border-2 border-transparent rounded-[2rem] shadow-xl shadow-blue-100/50 outline-none focus:border-blue-500 transition-all text-lg font-bold placeholder:text-gray-300"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-transform">🔍</div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 bg-gray-100 p-1 rounded-full text-xs text-gray-400 font-bold"
              >✕</button>
            )}
          </div>
        </div>

        {/* 검색 중일 때는 탭을 숨기고 결과를 보여줌 */}
        {!searchQuery ? (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {guideCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === cat.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'bg-white text-gray-400 hover:bg-gray-100'
                }`}
              >
                {cat.icon} {cat.title}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-bold text-blue-600 ml-2">
            '{searchQuery}' 검색 결과 ({filteredContent.length}건)
          </p>
        )}

        {/* 상세 내용 리스트 */}
        <div className="space-y-6 animate-fade-in">
          {filteredContent.length > 0 ? (
            filteredContent.map((item, index) => (
              <div key={index} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
                <div className="flex gap-4">
                  <span className="text-blue-600 font-black text-xl">Q.</span>
                  <h4 className="text-lg font-black text-gray-800 leading-tight">{item.q}</h4>
                </div>
                <div className="mt-5 pl-8 border-l-2 border-blue-50">
                  <p className="text-gray-600 font-medium leading-relaxed text-sm">{item.a}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-10 rounded-[2.5rem] text-center space-y-4">
              <div className="text-4xl">🤔</div>
              <p className="font-bold text-gray-400">찾으시는 질문이 없나요?<br/>직접 AI 상담원에게 물어보세요!</p>
              <Link href="/legal-ai" className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg">
                AI에게 질문하기
              </Link>
            </div>
          )}
        </div>

        {/* 하단 CTA */}
        <div className="bg-gray-900 p-8 rounded-[3rem] text-white text-center space-y-4 shadow-xl">
          <h3 className="text-xl font-bold">도움이 되셨나요?</h3>
          <p className="text-gray-400 text-xs leading-relaxed">
            더 구체적인 상황(계약서 검토 등)은<br/>
            빅루트 법률 AI가 1:1로 도와드릴 수 있습니다.
          </p>
          <Link href="/legal-ai" className="inline-block px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all">
            1:1 맞춤 상담 시작 🤖
          </Link>
        </div>
      </main>
    </div>
  );
}