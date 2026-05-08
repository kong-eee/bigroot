'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RentIncreasePage() {
  const [oldDeposit, setOldDeposit] = useState<number>(0);
  const [oldRent, setOldRent] = useState<number>(0);
  const [newDeposit, setNewDeposit] = useState<number>(0);
  const [baseRate, setBaseRate] = useState<number>(3.5);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/base-rate')
      .then(res => res.json())
      .then(data => {
        setBaseRate(data.baseRate);
        setLoading(false);
      });
  }, []);

  // 숫자를 콤마 형식 문자열로 (1000 -> "1,000")
  const toComma = (num: number) => {
    if (!num && num !== 0) return '';
    return num.toLocaleString();
  };

  // 콤마 문자열을 숫자로 ("1,000" -> 1000)
  const fromComma = (str: string) => {
    const num = Number(str.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const calculate = () => {
    if (oldDeposit === 0 && oldRent === 0) return alert("기존 임대료를 입력해주세요.");

    // 🚨 렌트홈 정밀 산식 (1원 오차 해결의 핵심)
    const rate = (baseRate + 2.0) / 100;

    // 1. 기존 환산보증금 산출
    const oldConverted = oldDeposit + (oldRent * 12 / rate);
    
    // 2. 5% 증액 한도 산출
    const targetConverted = oldConverted * 1.05;
    
    // 3. 새 보증금 적용 후 월세 산출
    const inputNewDeposit = newDeposit || oldDeposit;
    const maxRentResult = (targetConverted - inputNewDeposit) * rate / 12;

    // 4. 결과 저장 (Math.round를 사용하여 렌트홈과 1원 단위까지 일치시킴)
    setResult({
      calculationRate: (rate * 100).toFixed(2),
      oldConverted: Math.floor(oldConverted),
      targetConverted: Math.floor(targetConverted),
      maxRent: Math.round(maxRentResult), // 여기서 반올림을 해야 894,792가 나옵니다!
      increaseRate: 5.0
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="p-6 bg-white border-b flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-xl font-black text-blue-600">GeunBang RentHome 🏠</h1>
      </header>

      <main className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
        <div className="bg-blue-600 p-6 rounded-3xl text-white flex justify-between items-center shadow-lg">
          <div className="space-y-1">
            <p className="text-blue-100 text-xs font-bold uppercase">Base Rate</p>
            <p className="font-bold">한국은행 기준금리</p>
          </div>
          <span className="text-3xl font-black">{loading ? '...' : baseRate}%</span>
        </div>

        <section className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 space-y-7">
          <div className="space-y-5">
            {/* 입력창: 글자색 text-black으로 강화, 콤마 포맷 적용 */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">기존 임대보증금 (원)</label>
              <input 
                type="text"
                value={toComma(oldDeposit)}
                onChange={(e) => setOldDeposit(fromComma(e.target.value))}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-black text-black placeholder:text-gray-300"
                placeholder="10,000,000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">기존 월 임대료 (원)</label>
              <input 
                type="text"
                value={toComma(oldRent)}
                onChange={(e) => setOldRent(fromComma(e.target.value))}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-black text-black placeholder:text-gray-300"
                placeholder="850,000"
              />
            </div>
            <div className="pt-5 border-t border-dashed">
              <label className="block text-xs font-bold text-blue-600 mb-2 ml-1">변경 후 임대보증금 (원)</label>
              <input 
                type="text"
                value={toComma(newDeposit)}
                onChange={(e) => setNewDeposit(fromComma(e.target.value))}
                className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-black text-black placeholder:text-blue-300"
                placeholder="보증금 변경 시 입력"
              />
            </div>
          </div>

          <button onClick={calculate} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl transition-all text-xl">
            5% 상한액 계산하기
          </button>
        </section>

        {/* 결과 섹션: Optional Chaining(?.)을 적용하여 에러 원천 차단 */}
        {result && (
          <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-xs font-bold mb-2">인상률 5.0% 적용 결과</span>
              <h4 className="text-lg font-bold opacity-90">인상 가능한 최대 월세</h4>
              <p className="text-5xl font-black mt-2 tracking-tighter">
                {result.maxRent?.toLocaleString()} <span className="text-2xl font-medium">원</span>
              </p>
            </div>
            
            <div className="bg-black/10 p-6 rounded-2xl text-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="opacity-70">기존 환산보증금</span>
                <span className="font-bold">{result.oldConverted?.toLocaleString()} 원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">5% 인상 후 한도</span>
                <span className="font-bold text-yellow-300">{result.targetConverted?.toLocaleString()} 원</span>
              </div>
            </div>

            <p className="text-[10px] text-blue-200 text-center leading-relaxed opacity-60">
              민간임대주택에 관한 특별법 제44조 기준 산식을 준수합니다.<br/>
              본 결과는 참고용이며 실제 계약 시 전문가의 확인을 권장합니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}