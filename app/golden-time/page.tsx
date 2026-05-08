'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function GoldenTimePage() {
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [step, setStep] = useState(1); // 1: 입력, 2: 결과 및 알림완료
  const [hasUsed, setHasUsed] = useState(false);
  const [isShortTerm, setIsShortTerm] = useState(false);

  // 종합 진단 및 알림 등록 핸들러
  const handleAction = () => {
    if (!expiryDate || !phoneNumber) return alert("만료일과 전화번호를 모두 입력해주세요.");
    setStep(2);
    // 여기서 나중에 DB 저장 API를 호출하면 됩니다!
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="p-6 bg-white border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">←</Link>
        <h1 className="text-xl font-black text-blue-600 tracking-tighter">Golden Time Guardian 🛡️</h1>
      </header>

      <main className="flex-1 p-5 md:p-8 max-w-2xl mx-auto w-full space-y-8">
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <h2 className="text-3xl font-black leading-tight tracking-tighter text-gray-800">
                복잡한 계약 만기,<br/>
                <span className="text-blue-600">근방이 대신 챙길게요.</span>
              </h2>
              <p className="text-gray-500 font-medium">만기일만 등록하면 골든타임을 문자로 알려드려요.</p>
            </div>

            <section className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 mb-3 ml-1 uppercase tracking-widest">언제가 계약 만기인가요?</label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none text-lg font-bold text-black focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 mb-3 ml-1 uppercase tracking-widest">알림 받을 전화번호</label>
                  <input type="tel" placeholder="010-0000-0000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none text-lg font-bold text-black focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="pt-4 border-t border-dashed space-y-3">
                   <p className="text-[11px] font-bold text-blue-600 ml-1">정확한 진단을 위한 추가 정보</p>
                   <button onClick={() => setHasUsed(!hasUsed)} className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all ${hasUsed ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600'}`}>
                     <span className="text-sm font-bold">갱신권을 이미 사용했나요?</span>
                     <span className="font-black">{hasUsed ? 'YES' : 'NO'}</span>
                   </button>
                   <button onClick={() => setIsShortTerm(!isShortTerm)} className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all ${isShortTerm ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600'}`}>
                     <span className="text-sm font-bold">1년 등 단기 계약인가요?</span>
                     <span className="font-black">{isShortTerm ? 'YES' : 'NO'}</span>
                   </button>
                </div>
              </div>

              <button onClick={handleAction} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl text-xl transition-all">
                무료 알림 & 진단 시작
              </button>
            </section>
          </>
        ) : (
          <div className="space-y-6 animate-fade-in">
             {/* 등록 완료 메시지 */}
             <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl text-center space-y-2">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-2xl font-black">알림 예약 완료!</h3>
                <p className="font-bold opacity-90 text-sm">{phoneNumber} 번호로<br/>만기 3개월/2개월 전 알림을 보내드릴게요.</p>
             </div>

             {/* 즉시 진단 리포트 */}
             <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                <h4 className="font-black text-gray-800 text-lg flex items-center gap-2">
                   <span className="text-blue-600">🛡️</span> 지금 바로 확인하는 권리 리포트
                </h4>
                <div className="p-5 bg-blue-50 rounded-2xl space-y-3">
                   <p className="text-sm font-bold text-blue-800 leading-relaxed">
                     {isShortTerm ? "📍 1년 계약이셔도 법적으로 2년 거주를 주장할 수 있습니다." : "📍 계약 기간 내에 갱신권을 사용할 준비를 하세요."}
                   </p>
                   <p className="text-[11px] text-blue-600 font-medium">
                     오늘 기준 골든타임까지 약 {Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) - 180}일 남았습니다.
                   </p>
                </div>
                <Link href="/legal-ai" className="block w-full py-4 bg-gray-900 text-white text-center font-bold rounded-2xl hover:bg-black transition-all">
                   AI에게 구체적인 상담 받기 🤖
                </Link>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}