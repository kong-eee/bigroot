'use client';

import { useState } from 'react';
import Link from 'next/link';

type BuildingType = 'all' | 'multiverse' | 'multiparent' | 'officetel' | 'commercial';

export default function ContractGuidePage() {
  const [activeTab, setActiveTab] = useState<BuildingType>('all');

  return (
    <div className="page-main">
      
      {/* 🌐 상단 바 */}
      <nav className="fixed top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto w-full px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-[1000] tracking-tighter text-slate-900">
            BIG<span className="text-[#007AFF]">ROOT</span> <span className="text-slate-400 font-bold ml-1 text-sm">Guide</span>
          </Link>
          <Link href="/" className="text-sm font-black text-slate-500 hover:text-[#007AFF] transition-colors">메인 홈으로</Link>
        </div>
      </nav>

      {/* 🚀 히어로 섹션 */}
      <header className="pt-40 pb-16 px-6 text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-block px-4 py-1.5 bg-blue-50 text-[#007AFF] rounded-full text-xs font-black tracking-wider uppercase">Contract Checklist</div>
        <h1 className="text-4xl md:text-5xl font-[1000] text-slate-900 tracking-tight leading-tight">
          도장 찍기 직전,<br />
          <span className="text-[#007AFF]">이것만큼은 꼭 알고 하자!</span>
        </h1>
        <p className="text-slate-500 font-bold text-base md:text-lg leading-relaxed">
          내 소중한 보증금을 지키는 첫걸음은 계약서 작성 전에 시작됩니다.<br className="hidden md:block"/>
          건축물 유형별 실무 리포트와 필수 체크리스트 5가지를 확인하세요.
        </p>
      </header>

      {/* 🗂️ 건축물 분류 탭 시스템 */}
      <section className="max-w-5xl mx-auto px-6 mb-12">
        <div className="flex bg-white border border-slate-200/80 rounded-3xl p-2 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide gap-1">
          <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="🌏 공통 필수사항" />
          <TabButton active={activeTab === 'multiverse'} onClick={() => setActiveTab('multiverse')} label="🏢 다세대 (빌라/아파트)" />
          <TabButton active={activeTab === 'multiparent'} onClick={() => setActiveTab('multiparent')} label="🏡 다가구" />
          <TabButton active={activeTab === 'officetel'} onClick={() => setActiveTab('officetel')} label="🏙️ 오피스텔" />
          <TabButton active={activeTab === 'commercial'} onClick={() => setActiveTab('commercial')} label="🛍️ 상가 임대차" />
        </div>
      </section>

      {/* 📋 동적 체크리스트 메인 본문 */}
      <main className="max-w-5xl mx-auto px-6 pb-32">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-sm space-y-12 animate-in fade-in duration-300">
          
          {/* 1️⃣ [공통 분류] - 5가지 항목 */}
          {(activeTab === 'all') && (
            <div className="space-y-8">
              <SectionTitle title="🌏 전 국민 임차인 공통 5대 기본기" subtitle="어떤 부동산을 계약하든 기본적으로 뼈에 새겨야 할 리스크 방어 가이드입니다." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card icon="🛡️" title="대항력의 기본, 전입신고" desc="이사 당일 주민센터나 정부24에서 무조건 신청하세요. 주민등록과 실제 거주(점유)가 결합되어야 다음 날 0시부터 법적인 세입자 대항력이 생겨 집주인이 바뀌어도 쫓겨나지 않습니다." />
                <Card icon="📝" title="주택 임대차 신고 (확정일자 자동 부여)" desc="보증금 6천만 원 또는 월세 30만 원을 초과하면 계약 후 30일 이내에 무조건 신고해야 합니다. 이때 계약서를 첨부해 임대차 신고를 완료하면 법적 우선변제권을 보장하는 '확정일자'가 자동으로 부여됩니다." />
                <Card icon="📜" title="등기부등본 계약 당일 무조건 재발급" desc="공인중개사가 일주일 전에 떼어놓은 서류는 무효입니다. 계약금 넣기 직전, 중도금 날, 잔금 치르기 직전에 '당일 발급본'을 직접 확인하여 갑구(압류 등)와 을구(근저당 대출 등)의 변동 사항을 감시하세요." />
                <Card icon="💰" title="국세·지방세 완납증명서 요구" desc="집주인이 세금을 체납하면 세무서가 집을 압류해 경매로 넘기는데, 이때 발생하는 국세 우선 채권은 내 보증금보다 순위가 앞섭니다. 계약 전 임대인에게 세금 체납이 없음을 증명하는 서류를 당당히 요구하세요." />
                <Card icon="👤" title="실소유자 신원 및 계좌 검증" desc="계약하러 나온 사람이 등기부등본 갑구의 '진짜 주인'이 맞는지 신분증을 대조하고, 계약금 및 잔금은 반드시 그 소유자 본인 명의의 계좌로만 송금해야 법적으로 보호받습니다." />
              </div>
            </div>
          )}

          {/* 2️⃣ [다세대] 분류 - 5가지 항목 */}
          {activeTab === 'multiverse' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <SectionTitle title="🏢 다세대 주택 (빌라 / 아파트) 체크리스트" subtitle="각 호수마다 개별 주인이 따로 있는 공동주택입니다. 전세사기와 깡통전세 예방이 핵심입니다." />
              <div className="space-y-4">
                <BulletRow num="1" title="보증보험 가입 가능 금액 직접 계산하기 (공시가 126% 룰) ⭐" desc="HUG 보증보험은 아무 금액이나 가입시켜주지 않습니다. 해당 빌라의 올해 '공시가격'을 확인한 뒤, [공시가격 × 140% × 90%]를 계산하세요. 즉, 결론적으로 [공시가격의 126% 이내]로 전세 보증금이 책정되어 있어야만 훗날 보증보험 가입이 가능합니다. 이 금액을 넘어선 빌라는 절대 계약하면 안 됩니다." />
                <BulletRow num="2" title="매매가 대비 전세가 비율(전세가율) 검증" desc="빌라는 시세를 부풀리기 쉽습니다. 인근 매매가의 70~80%를 넘어서는 전세 계약은 집값이 조금만 떨어져도 보증금을 떼이는 깡통전세가 됩니다. 주변 국토부 실거래가 조회를 통해 실제 매매 시세를 꼼꼼히 비교하세요." />
                <BulletRow num="3" title="신탁등기 최신 진행 트렌드와 특약 대응" desc="등기부등본에 신탁회사가 소유자로 나와 있다면 주의해야 합니다. 요즘은 계약 전에 신탁사에서 사전동의서를 안 주는 경우가 많습니다. 이때는 계약서 특약에 '본 계약 후 임대인은 즉시 신탁회사에 임대차동의서를 신청하여 잔금일 전까지 임차인에게 제출한다. 거절되거나 미제출 시 계약은 무효로 하고 계약금은 즉시 반환한다'를 반드시 명시해야 합니다." />
                <BulletRow num="4" title="건축물대장 상 '위반건축물' 여부 조회" desc="건축물대장을 떼어보고 우측 상단에 노란색으로 '위반건축물' 표시가 되어 있다면 보증보험 가입이 원천적으로 불가능하므로 패스해야 합니다." />
                <BulletRow num="5" title="HUG 보증보험 거절 시 계약 해지 특약" desc="내 귀책사유가 아닌 임대인이나 주택 자체의 결함으로 HUG 가입이 거절될 상황을 방지해야 합니다. '임대인 또는 목적물의 하자로 인해 전세보증보험 가입이 불가능할 경우 본 계약은 해제되며, 임대인은 받은 돈을 즉시 반환한다'는 독소조항 방어 특약을 넣으세요." />
              </div>
            </div>
          )}

          {/* 3️⃣ [다가구] 분류 - 5가지 항목 */}
          {activeTab === 'multiparent' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <SectionTitle title="🏡 다가구 주택 체크리스트" subtitle="건물 전체 주인이 딱 1명이고 나는 그중 방 한 호실을 쓰는 형태입니다. 나보다 먼저 들어온 사람들의 돈이 내 순위를 결정합니다." />
              <div className="space-y-4">
                <BulletRow num="1" title="선순위 임차인 보증금 현황 파악 (최우선순위 ⭐)" desc="내가 들어가기 전, 이 건물에 먼저 살고 있는 세입자들의 보증금 총합을 알아야 합니다. 임대인에게 '확정일자 부여현황 제공 동의서'를 받아 동사무소에서 선순위 보증금 총액을 반드시 서류로 확인하세요. 말로만 들으면 사기 치기 쉽습니다." />
                <BulletRow num="2" title="건물 전체의 융자(근저당) 채권최고액 확인" desc="건물 등기부등본 을구에 적힌 대출금(채권최고액)과 1번에서 파악한 선순위 보증금들을 모두 더해보세요. 이 합산 금액이 건물 실제 시세의 60~70%를 초과한다면 경매 시 내 보증금은 전액 공중분해 될 수 있습니다." />
                <BulletRow num="3" title="토지 등기부등본과 건물 등기부등본 각각 열람" desc="아파트와 달리 다가구는 땅(토지)과 건물 주인이 다를 수 있고, 토지에만 어마어마한 대출이 걸려있는 경우가 허다합니다. 인터넷등기소에서 토지용, 건물용 등기부등본을 둘 다 따로 떼어서 대출 현황을 교차 검증해야 합니다." />
                <BulletRow num="4" title="소액임차인 최우선변제 금액 기준 확인" desc="최악의 상황에 건물이 경매로 넘어가더라도 법적으로 최우선해서 무조건 먼저 돌려주는 돈이 있습니다. 내가 계약하려는 보증금 액수가 주택임대차보호법상 지역별 소액임차인 범위 안에 들어오는지 미리 체크해 두면 최소한의 안전장치가 됩니다." />
                <BulletRow num="5" title="공동 관리비 명목 및 공과금 정산 명시" desc="다가구 원룸 건물은 숨은 관리비 덤탱이가 많습니다. 수도세, 인터넷, 전기세 등이 관리비에 어떻게 포함되는지 명확히 하고, 전 임차인이 남기고 간 공과금 체납액이 없는지 잔금일에 계량기를 찍어 중개사에게 정산을 요구해야 합니다." />
              </div>
            </div>
          )}

          {/* 4️⃣ [오피스텔] 분류 - 5가지 항목 */}
          {activeTab === 'officetel' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <SectionTitle title="🏙️ 오피스텔 체크리스트" subtitle="업무용 법인 계약이나 주택 수 산정 등 세금 회피용 꼼수 조항이 가장 많이 판치는 유형입니다." />
              <div className="space-y-4">
                <BulletRow num="1" title="전입신고 절대 불가 특약은 100% 거르기" desc="집주인이 세금을 아끼려고 '주거용 전입신고 금지, 적발 시 퇴거 및 배상' 같은 불법 특약을 넣자고 유도합니다. 전입신고를 안 하면 대항력이 전혀 없어 집이 매각되거나 경매에 넘어갈 때 내 소중한 보증금을 법적으로 단 1원도 돌려받지 못합니다." />
                <BulletRow num="2" title="잔금으로 근저당(기존 대출) 말소 동행 조건" desc="주인이 오피스텔을 살 때 받은 대출금을 내 잔금으로 갚는 조건이라면 무조건 특약을 적으세요. '임대인은 임차인의 잔금 수령과 동시에 기존 근저당권을 전액 상환하고 말소하며, 임차인은 은행에 동행할 수 있다'고 적고 당일 영수증을 받아내야 안전합니다." />
                <BulletRow num="3" title="소유주가 법인(회사)일 경우 필수 서류 검증" desc="법인 소유 오피스텔은 리스크가 큽니다. 법인등기부등본, 법인인감증명서, 대표자 신분증을 확인하고, 계약서에는 법인 인감도장이 찍혀야 합니다. 특히 법인의 임금체납이나 세금 압류는 순위가 빨라 경매 시 위험하니 세금 완납증명이 필수입니다." />
                <BulletRow num="4" title="관리비 부과 방식 및 주차 타워 비용 확인" desc="오피스텔은 전용률이 낮아 일반 아파트보다 공용 관리비가 폭탄 급으로 높게 나옵니다. 평균 평당 관리비를 관리사무소에 미리 전화해 확인하고, 주차 타워 이용 시 본인 차량 규격이 입차가 가능한지, 월 주차료가 별도인지 체크하세요." />
                <BulletRow num="5" title="기본 옵션 시설물 고장 수리 책임 한계 명시" desc="빌트인 냉장고, 세탁기, 에어컨 등 옵션이 많아 퇴거 시 원상복구 분쟁이 잦습니다. 계약 전 작동 여부를 영상으로 촬영해 두고, '노후화로 인한 기본 옵션의 고장 및 수리는 임대인의 비용으로 처리한다'는 조항을 명확히 명시해 두세요." />
              </div>
            </div>
          )}

          {/* 5️⃣ [상가 임대차] 분류 - 5가지 항목 */}
          {activeTab === 'commercial' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <SectionTitle title="🛍️ 상가 임대차 체크리스트" subtitle="매달 지출되는 고정비와 직결되며, 권리금 회수 및 영업 인허가 등 생계와 직결된 법률 조항입니다." />
              <div className="space-y-4">
                <BulletRow num="1" title="관할 세무서 사업자등록과 상가 '확정일자' 신청" desc="상가 임차인의 대항력은 건물을 인도받고 세무서에 '사업자등록'을 신청한 다음 날부터 생깁니다. 이때 상가 건물 임대차 계약서 원본을 들고 세무서장에게 '확정일자'까지 받아야만 건물이 경매로 넘어가도 보증금을 먼저 배당받습니다." />
                <BulletRow num="2" title="내 계약이 '환산보증금 한도'를 초과하는지 계산" desc="[보증금 + (월세 × 100)]을 계산해 보세요. 이 금액이 지역별 상가임대차보호법이 정한 환산보증금 기준 한도를 초과하면, 우선변제권 등 일부 핵심 보호 조항에서 제외되므로 계약 전 특약 보완을 중개사와 정밀하게 논의해야 합니다." />
                <BulletRow num="3" title="건축물 용도 매칭 및 행정처분 이력 조회" desc="내가 하려는 업종(예: 휴게음식점, 학원, 체육시설 등)이 해당 상가 건물의 '건축물대장 상 용도'와 맞는지 구청 위생과나 건축과에 확인해야 합니다. 전 임차인의 소방 위반이나 행정처분 이력이 남아있으면 내 명의로 영업 허가가 안 나옵니다." />
                <BulletRow num="4" title="원상복구 의무의 범위 명확히 선 긋기" desc="상가 분쟁 1위는 퇴거 시 인테리어 원상복구입니다. 내가 들어올 때 기본 공실 상태였는지, 전 사람의 시설을 그대로 이어받았는지 계약서에 사진을 첨부하고 '임차인은 입점 당시의 상태대로만 원상복구 의무를 진다'고 한계를 명확히 지어놔야 전 사람 인테리어까지 철거하는 독박을 안 씁니다." />
                <BulletRow num="5" title="권리금 회수 기회 보호 기간 숙지" desc="상가임대차보호법상 임대인은 임대차 기간이 끝나기 6개월 전부터 종료 시까지 임차인이 주선한 신규 임차인으로부터 권리금을 지급받는 것을 방해해서는 안 됩니다. 계약 기간 도중 임대료를 3달 치 이상 연체하면 이 강력한 권리금 보호 권리가 박탈되니 월세 관리에 주의하세요." />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 px-6 rounded-2xl font-black text-sm transition-all duration-300 ${
        active 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'bg-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-slate-100 pb-5 space-y-1.5">
      <h3 className="text-2xl font-[1000] text-slate-900 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-400 font-bold leading-relaxed">{subtitle}</p>
    </div>
  );
}

function Card({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-6 bg-slate-50 border border-slate-100/60 rounded-3xl space-y-3">
      <div className="text-2xl">{icon}</div>
      <h4 className="font-black text-lg text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function BulletRow({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50/70 transition-all">
      <div className="w-7 h-7 bg-blue-50 text-[#007AFF] font-black text-sm rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        {num}
      </div>
      <div className="space-y-1">
        <h4 className="font-black text-slate-900 text-base">{title}</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}