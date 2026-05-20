'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RentIncreasePage() {
  const [type, setType] = useState<'residential' | 'commercial'>('residential');
  const [baseRate, setBaseRate] = useState<number>(2.5); 
  
  // 현재 계약 정보
  const [depositStr, setDepositStr] = useState<string>('');
  const [rentStr, setRentStr] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  // ⭐️ 역산용 시뮬레이션 상태
  const [newDepositStr, setNewDepositStr] = useState<string>('');
  const [newRentStr, setNewRentStr] = useState<string>('');

  const formatNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseNumber = (val: string) => {
    return Number(val.replace(/,/g, '')) || 0;
  };

  const conversionRate = (baseRate + 2.0) / 100;

  // 메인 계산 함수
  const calculate = () => {
    const deposit = parseNumber(depositStr);
    const rent = parseNumber(rentStr);

    let currentConverted = 0;
    let maxConverted = 0;

    if (type === 'residential') {
      currentConverted = deposit + (rent * 12 / conversionRate);
      maxConverted = Math.floor(currentConverted * 1.05);
    } else {
      currentConverted = deposit + (rent * 100);
      maxConverted = Math.floor(currentConverted * 1.05);
    }

    setResult({
      currentConverted: Math.floor(currentConverted),
      maxConverted: maxConverted,
    });
    
    // 계산 버튼 누를 때 초기 시뮬레이션 값은 보증금 동결 기준으로 세팅
    setNewDepositStr(depositStr);
  };

  // ⭐️ 보증금을 바꿨을 때 최대 월세를 계산하는 함수
  const getPossibleRent = (targetDeposit: number) => {
    if (!result) return 0;
    if (type === 'residential') {
      return Math.floor(((result.maxConverted - targetDeposit) * conversionRate) / 12);
    } else {
      return Math.floor((result.maxConverted - targetDeposit) / 100);
    }
  };

  // ⭐️ 월세를 바꿨을 때 최대 보증금을 계산하는 함수
  const getPossibleDeposit = (targetRent: number) => {
    if (!result) return 0;
    if (type === 'residential') {
      return Math.floor(result.maxConverted - (targetRent * 12 / conversionRate));
    } else {
      return Math.floor(result.maxConverted - (targetRent * 100));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="p-6 bg-white border-b border-gray-100 flex items-center gap-4 sticky top-0 z-50">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">←</Link>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">임대료 인상 진단기</h1>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-6">
        {/* 유형 선택 및 금리 설정 섹션 (기존과 동일) */}
        <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm border border-gray-100">
          <button onClick={() => { setType('residential'); setResult(null); }}
            className={`flex-1 py-4 rounded-[1.8rem] font-black text-sm transition-all ${type === 'residential' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>
            🏠 주택 (주임사)
          </button>
          <button onClick={() => { setType('commercial'); setResult(null); }}
            className={`flex-1 py-4 rounded-[1.8rem] font-black text-sm transition-all ${type === 'commercial' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400'}`}>
            🏪 상가 / 사무실
          </button>
        </div>

        {type === 'residential' && (
          <div className="bg-blue-50 p-5 rounded-[2rem] border border-blue-100 flex items-center justify-between">
            <div className="pl-2">
              <p className="text-[10px] font-black text-blue-400 uppercase">한은 기준금리 (%)</p>
              <p className="text-xs font-bold text-blue-600">법정 전환율: {(baseRate + 2.0).toFixed(1)}%</p>
            </div>
            <input type="number" step="0.1" value={baseRate} onChange={(e) => setBaseRate(Number(e.target.value))}
              className="w-20 p-2 bg-white rounded-xl border-none text-center font-black text-slate-900 outline-none ring-2 ring-blue-200" />
          </div>
        )}

        {/* 현재 계약 정보 입력 */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 ml-2 uppercase">현재 보증금 (원)</label>
              <input type="text" placeholder="0" value={depositStr} onChange={(e) => setDepositStr(formatNumber(e.target.value))}
                className="w-full p-5 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-black text-xl text-slate-900 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 ml-2 uppercase">현재 월세 (원)</label>
              <input type="text" placeholder="0" value={rentStr} onChange={(e) => setRentStr(formatNumber(e.target.value))}
                className="w-full p-5 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-black text-xl text-slate-900 transition-all" />
            </div>
          </div>
          <button onClick={calculate} className={`w-full py-5 text-white font-black text-lg rounded-[2rem] shadow-xl transition-all active:scale-95 ${type === 'residential' ? 'bg-blue-600' : 'bg-orange-500'}`}>
            계산하기
          </button>
        </div>

        {/* 결과 및 시뮬레이션 섹션 */}
        {result && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white p-8 rounded-[3rem] border-2 border-gray-900 shadow-2xl space-y-6">
              <div className="text-center border-b pb-6 border-gray-100">
                <p className="text-[10px] font-black text-gray-400 mb-1 tracking-widest uppercase">Max Limit Report (5%)</p>
                <div className="flex justify-between items-center mt-4 px-2">
                    <span className="text-xs font-bold text-gray-400">현재 환산가액</span>
                    <span className="text-sm font-bold text-gray-600">{result.currentConverted.toLocaleString()} 원</span>
                </div>
                <div className="flex justify-between items-center mt-2 px-2">
                    <span className="text-sm font-bold text-gray-900">최대 증액 한도</span>
                    <span className="text-xl font-black text-red-500">{result.maxConverted.toLocaleString()} 원</span>
                </div>
              </div>

              {/* 🔄 역산 시뮬레이터 */}
              <div className="space-y-8">
                <div className="bg-slate-900 p-7 rounded-[2.5rem] space-y-5">
                  <h3 className="text-white text-center text-xs font-black tracking-widest uppercase opacity-60">조건 변경 시뮬레이션</h3>
                  
                  {/* 보증금 변경 시 월세 계산 */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-blue-400 ml-1">변경할 보증금을 입력해보세요</label>
                    <div className="relative">
                        <input type="text" placeholder="보증금 입력" value={newDepositStr} 
                            onChange={(e) => {
                                const val = formatNumber(e.target.value);
                                setNewDepositStr(val);
                                // 보증금 입력 시 월세 결과 업데이트
                                const possibleRent = getPossibleRent(parseNumber(val));
                                setNewRentStr(possibleRent.toLocaleString());
                            }}
                            className="w-full p-4 bg-slate-800 rounded-2xl border-none text-white font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                        <span className="absolute right-4 top-5 text-xs font-bold text-slate-500">원 일 때</span>
                    </div>
                    <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                        <p className="text-[10px] text-blue-300 font-bold mb-1">최대 월세 한도</p>
                        <p className="text-xl font-black text-blue-400">{getPossibleRent(parseNumber(newDepositStr)).toLocaleString()} <span className="text-xs">원</span></p>
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-800 w-full"></div>

                  {/* 월세 변경 시 보증금 계산 */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-orange-400 ml-1">변경할 월세를 입력해보세요</label>
                    <div className="relative">
                        <input type="text" placeholder="월세 입력" value={newRentStr} 
                            onChange={(e) => {
                                const val = formatNumber(e.target.value);
                                setNewRentStr(val);
                                // 월세 입력 시 보증금 결과 업데이트
                                const possibleDeposit = getPossibleDeposit(parseNumber(val));
                                setNewDepositStr(possibleDeposit.toLocaleString());
                            }}
                            className="w-full p-4 bg-slate-800 rounded-2xl border-none text-white font-black text-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                        />
                        <span className="absolute right-4 top-5 text-xs font-bold text-slate-500">원 일 때</span>
                    </div>
                    <div className="p-4 bg-orange-600/20 rounded-2xl border border-orange-500/30">
                        <p className="text-[10px] text-orange-300 font-bold mb-1">최대 보증금 한도</p>
                        <p className="text-xl font-black text-orange-400">{getPossibleDeposit(parseNumber(newRentStr)).toLocaleString()} <span className="text-xs">원</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-center text-gray-400 font-medium leading-relaxed">
                법적 인상 한도(5%) 내에서 보증금과 월세를 자유롭게 조정해본 결과입니다. <br/>
                조정 시 전환율이 정확히 적용되었는지 반드시 확인하세요.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}