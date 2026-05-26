'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RenewalCheckPage() {
  // 기존 상태값
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [hasUsed, setHasUsed] = useState<boolean>(false);
  const [isShortTerm, setIsShortTerm] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  // 🔔 알림 서비스를 위한 신규 상태값
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isAlarmAgreed, setIsAlarmAgreed] = useState<boolean>(false);

  // 종합 진단 로직 (기존과 동일)
  const diagnoseRights = () => {
    if (!expiryDate) return alert("계약 만료일을 선택해주세요.");

    const today = new Date();
    const end = new Date(expiryDate);
    
    const windowStart = new Date(end);
    windowStart.setMonth(windowStart.getMonth() - 6);
    const windowEnd = new Date(end);
    windowEnd.setMonth(windowEnd.getMonth() - 2);

    let mainTitle = "";
    let statusColor = "";
    let diagnosisPoints = [];
    let actionPlan = "";
    let implicitTip = "";

    if (isShortTerm) {
      diagnosisPoints.push("💡 법적으로 2년 미만 계약은 '2년'으로 간주됩니다. (제4조)");
    }

    if (hasUsed) {
      mainTitle = "협상 및 묵시적 갱신 기대";
      statusColor = "bg-orange-100 text-orange-700";
      diagnosisPoints.push("❌ 갱신요구권을 이미 사용한 상태입니다.");
      actionPlan = "집주인이 인상 요구를 한다면 '협의'가 필요하지만, 아무 말이 없다면 그대로 연장되는 '묵시적 갱신'을 기다려보세요.";
    } else {
      if (today >= windowStart && today <= windowEnd) {
        mainTitle = "지금이 골든타임입니다!";
        statusColor = "bg-emerald-600 text-white"; 
        diagnosisPoints.push("✅ 갱신요구권을 쓸 수 있는 법적 기간입니다.");
        actionPlan = "집주인이 증액을 요구하면 갱신권을 써서 5% 이내로 방어하세요. 만약 집주인이 조용하다면, 2개월 전까지 가만히 계시는 것이 '묵시적 갱신'에 유리할 수 있습니다.";
        implicitTip = "🤫 Tip: 집주인이 만료 2개월 전까지 아무 말이 없다면 임대료 인상 없는 '묵시적 갱신'이 됩니다. 섣불리 먼저 연락하기보다 상황을 지켜보는 것도 전략입니다.";
      } else if (today < windowStart) {
        mainTitle = "권리 행사 준비 단계";
        statusColor = "bg-blue-100 text-blue-700";
        const dDay = Math.ceil((windowStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        actionPlan = `아직 시기가 아닙니다. ${dDay}일 뒤부터 갱신권을 쓸 수 있으니 그때까지 집주인의 동태를 살피세요.`;
      } else {
        mainTitle = "법적 기한 경과";
        statusColor = "bg-red-50 text-red-600";
        diagnosisPoints.push("⚠️ 갱신권 행사 기간(만료 2개월 전)이 지났습니다.");
        actionPlan = "이미 기한이 지났으므로, 지금 집주인과 연락이 없다면 자동으로 '묵시적 갱신'이 되었을 가능성이 높습니다. 먼저 연락해서 긁어 부스럼을 만들지 마세요.";
      }
    }

    setResult({
      mainTitle,
      statusColor,
      diagnosisPoints,
      actionPlan,
      implicitTip,
      start: windowStart.toLocaleDateString(),
      end: windowEnd.toLocaleDateString(),
    });
  };

  // 🔔 알림 등록 실행 함수
  const registerAlarm = () => {
    if (!phoneNumber) return alert("알림을 받을 전화번호를 입력해주세요.");
    if (!isAlarmAgreed) return alert("알림 문자 발송을 위한 개인정보 동의가 필요합니다.");
    
    // 임시 알림창 (나중에 백엔드 API 연결 시 실제 데이터 전송 로직이 들어갈 자리입니다)
    alert(`[예약 완료] ${phoneNumber}\n\n입력하신 만기일 기준 3개월 전, 2개월 전에 맞춰 '근방'에서 카카오톡 알림을 보내드릴게요!`);
    setPhoneNumber(''); // 입력창 초기화
    setIsAlarmAgreed(false); // 체크박스 초기화
  };

  return (
    <div className="page-main flex flex-col">
      <header className="p-6 bg-white border-b flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">←</Link>
        <h1 className="text-xl font-black text-blue-600 tracking-tighter">GeunBang 진단 센터 🏥</h1>
      </header>

      <main className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
        {/* 1. 입력 섹션 */}
        <section className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 mb-3 ml-1 uppercase">현재 계약 만료일</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none text-lg font-bold text-black" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <span className="font-bold text-gray-700 text-sm">갱신권을 이미 사용했나요?</span>
              <button onClick={() => setHasUsed(!hasUsed)} 
                className={`w-12 h-7 rounded-full transition-all relative ${hasUsed ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${hasUsed ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <span className="font-bold text-gray-700 text-sm">2년 미만(1년 등) 단기 계약인가요?</span>
              <button onClick={() => setIsShortTerm(!isShortTerm)} 
                className={`w-12 h-7 rounded-full transition-all relative ${isShortTerm ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isShortTerm ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <button onClick={diagnoseRights} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl text-lg transition-all">
            종합 진단 결과보기
          </button>
        </section>

        {/* 2. 진단 결과 섹션 */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* 결과 카드 */}
            <div className={`p-8 rounded-[2.5rem] shadow-2xl ${result.statusColor} border border-black/5`}>
              <h3 className="text-2xl font-black mb-6 text-center tracking-tighter">{result.mainTitle}</h3>
              
              <div className="space-y-3 mb-6">
                {result.diagnosisPoints.map((point: string, i: number) => (
                  <div key={i} className="flex gap-2 bg-white/20 p-3 rounded-xl items-start">
                    <p className="font-bold text-xs leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/90 p-5 rounded-2xl text-gray-900 space-y-3 shadow-inner">
                <h4 className="font-black text-sm flex items-center gap-2 text-blue-600">🛡️ 실전 대응 가이드</h4>
                <p className="text-xs font-bold leading-relaxed text-gray-700">{result.actionPlan}</p>
                {result.implicitTip && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-[11px] font-black text-blue-800 leading-tight">
                      {result.implicitTip}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-around text-[10px] font-bold opacity-70 pt-4 border-t border-current border-opacity-10">
                <span>시작: {result.start}</span>
                <span>마감: {result.end}</span>
              </div>
            </div>

            {/* 필승 조언 카드 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100">
              <h4 className="font-black text-gray-800 flex items-center gap-2 text-sm mb-3">
                <span>💡</span> 근방 부동산의 '필승' 조언
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                "가장 좋은 연장은 임대료 인상 없는 <strong>묵시적 갱신</strong>입니다. 만약 만료 2개월 전까지 집주인이 조용하다면, 굳이 먼저 갱신권을 쓰겠다고 말할 필요가 없습니다. 가만히 있으면 자동으로 이전 조건 그대로 연장되니까요!"
              </p>
            </div>

            {/* 🚨 3. 신규 추가된 알림 예약 섹션 */}
            <div className="bg-white p-7 rounded-[2.5rem] border-2 border-blue-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-2xl text-xl">🔔</div>
                <div>
                  <h4 className="font-black text-gray-800 text-sm">골든타임 무료 알림 서비스</h4>
                  <p className="text-[11px] text-gray-500 font-medium mt-1">만기 3개월, 2개월 전 잊지 않게 문자를 보내드려요.</p>
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  type="tel" 
                  placeholder="전화번호 입력 (기호 없이 숫자만)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-bold text-black focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                />
                
                <div className="flex items-center gap-2 ml-1">
                  <input 
                    type="checkbox" 
                    id="agree" 
                    checked={isAlarmAgreed}
                    onChange={(e) => setIsAlarmAgreed(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="agree" className="text-[11px] text-gray-500 font-medium cursor-pointer">
                    개인정보 수집 및 알림 문자 발송에 동의합니다.
                  </label>
                </div>
                
                <button 
                  onClick={registerAlarm}
                  className="w-full py-4 bg-gray-900 text-white text-sm font-black rounded-2xl hover:bg-black transition-all shadow-md active:scale-95"
                >
                  알림 예약하기
                </button>
              </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}