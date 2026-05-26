'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// --- 임차인 유형별 고충 기반 데이터 (네이버/구글 실무 사례 반영) ---
const guideData = {
  residential: {
    title: "주택 임차인",
    description: "내 집보다 소중한 보증금과 거주권을 지키는 법",
    icon: "🏠",
    items: [
      { q: "계약갱신요구권 (2+2년)", a: "임차인은 1회에 한해 2년 연장을 요구할 수 있으며, 이때 임대인은 실거주 등 정당한 사유 없이 거절할 수 없습니다." },
      { q: "임대료 증액 5% 상한제", a: "갱신 시 보증금과 월세는 기존 금액의 5% 이내에서만 증액 가능합니다. (지자체 조례 확인 필요)" },
      { q: "묵시적 갱신과 해지권", a: "계약 만료 2개월 전까지 서로 통보가 없었다면 자동 연장되며, 임차인은 언제든 해지 통보 후 3개월 뒤 나갈 수 있습니다." },
      { q: "수선 및 유지 의무", a: "보일러, 누수 등 큰 수선은 임대인이, 소모품 교체 등 작은 수선은 임차인이 부담하는 것이 원칙입니다." },
      { q: "보증금 미반환 대응", a: "만기 후에도 보증금을 못 받는다면 '임차권등기명령'을 신청해야 이사 가더라도 대항력이 유지됩니다." }
    ]
  },
  commercial: {
    title: "상가 임차인",
    description: "장사하는 분들의 생존권, 10년의 권리를 지키는 법",
    icon: "🏪",
    items: [
      { q: "계약갱신요구권 (최대 10년)", a: "사무실과 마찬가지로 최초 계약일로부터 총 10년 동안 계약 연장을 요구할 권리가 법적으로 보장됩니다." },
      { q: "권리금 회수 기회 보호", a: "임대인은 계약 종료 6개월 전부터 임차인이 신규 임차인으로부터 권리금을 받는 것을 방해할 수 없습니다." },
      { q: "차임 연체와 해지 (3기)", a: "월세가 3회분(3개월 치)에 달하도록 밀릴 경우 10년 갱신권이 사라지고 즉시 해지 사유가 되니 주의해야 합니다." },
      { q: "재건축과 퇴거 보상", a: "계약서에 구체적인 재건축 계획이 고지되지 않았다면, 단순히 건물이 낡았다는 이유로 임차인을 쫓아낼 수 없습니다." },
      { q: "환산보증금 초과 시 주의사항", a: "보증금 규모가 크더라도 10년 갱신권과 권리금 보호는 적용되지만, 임대료 증액 5% 제한은 적용되지 않을 수 있습니다." }
    ]
  },
  office: {
    title: "사무실/기업",
    description: "효율적인 업무 환경과 불합리한 비용 지출을 막는 법",
    icon: "🏢",
    items: [
      { q: "사무실도 10년 보호 대상인가요?", a: "네, 사업자 등록이 가능한 영리 목적의 사무실이라면 상가임대차법에 따라 동일하게 10년 갱신권을 보장받습니다." },
      { q: "관리비 인상의 투명성", a: "관리비는 실비 정산이 원칙입니다. 갑작스러운 대폭 인상 시 세부 내역을 요구하고 협의할 권리가 있습니다." },
      { q: "원상복구 범위의 명확화", a: "입주 당시 설치된 시설물까지만 철거하는 것이 기본이나, 특약에 따라 범위가 달라지니 계약서의 원상복구 조항이 핵심입니다." },
      { q: "부가세 별도 및 세금계산서", a: "임대료에 부가세가 포함인지 별도인지 명확히 하고, 사업자로서 세금계산서를 정상 발급받아야 경비 처리가 가능합니다." },
      { q: "제소전 화해조약 주의", a: "계약 시 '제소전 화해'를 요구받는 경우가 많습니다. 독소 조항(무조건 즉시 퇴거 등)이 없는지 전문가 검토가 필수입니다." }
    ]
  }
};

export default function RightsGuidePage() {
  const [activeTab, setActiveTab] = useState<keyof typeof guideData>('residential');

  return (
    <div className="page-main pb-24">
      {/* 고정 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 p-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">←</Link>
          <h1 className="text-xl font-black text-gray-900 tracking-tighter">임차인 권리 백과 🛡️</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* 선택 탭: 3개 카테고리 균형 배치 */}
        <div className="flex bg-white p-1.5 rounded-[2.5rem] shadow-sm border border-gray-100">
          {(Object.keys(guideData) as Array<keyof typeof guideData>).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-4 rounded-[2rem] flex flex-col items-center gap-1 transition-all duration-300 ${
                activeTab === key 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{guideData[key].icon}</span>
              <span className="text-[11px] font-black tracking-tight">{guideData[key].title}</span>
            </button>
          ))}
        </div>

        {/* 현재 탭 설명 배너 */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 text-center space-y-2 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{guideData[activeTab].title} 가이드</h2>
          <p className="text-sm text-gray-500 font-bold leading-relaxed">
            {guideData[activeTab].description}
          </p>
        </div>

        {/* 핵심 리포트 리스트 */}
        <div className="space-y-4">
          {guideData[activeTab].items.map((item, i) => (
            <div key={i} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-blue-600 font-black text-sm">
                  Q
                </div>
                <div className="space-y-3 pt-1">
                  <h3 className="text-lg font-black text-gray-800 leading-snug group-hover:text-blue-600 transition-colors">
                    {item.q}
                  </h3>
                  <div className="p-5 bg-gray-50 rounded-[1.5rem] text-sm text-gray-600 leading-relaxed font-medium">
                    {item.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 헬프 센터 연결 */}
        <div className="relative overflow-hidden bg-gray-900 p-10 rounded-[3rem] text-white text-center">
          <div className="relative z-10 space-y-5">
            <h3 className="text-xl font-black tracking-tight leading-tight">
              {guideData[activeTab].title}님,<br/>더 자세한 상담이 필요하신가요?
            </h3>
            <p className="text-xs text-gray-400 font-bold opacity-80 leading-relaxed">
              빅루트 AI가 법률 데이터와 실제 판례를 바탕으로<br/>태근 님의 상황을 즉시 진단해 드립니다.
            </p>
            <Link 
              href="/legal-ai" 
              className="inline-block w-full py-5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-[2rem] transition-all shadow-2xl shadow-blue-900/50 text-base"
            >
              실시간 AI 상담소 입장 🤖
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
      </main>
    </div>
  );
}