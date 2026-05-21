'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SafetyCheckPage() {
  // 탭 상태: 'villa' (다세대/연립/공시가 기준) | 'officetel' (오피스텔/KB시세 기준)
  const [propertyType, setPropertyType] = useState<'villa' | 'officetel'>('villa');
  
  // 입력값 상태
  const [address, setAddress] = useState('');
  const [jeonsePrice, setJeonsePrice] = useState<number | ''>('');
  const [officialPrice, setOfficialPrice] = useState<number | ''>(''); // 공시가격
  const [kbPrice, setKbPrice] = useState<number | ''>(''); // KB시세 하위평균가

  // API 로딩 및 결과 상태
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 🔍 공공데이터포털 공시가격 API 연동 시뮬레이션 기능
  const handleFetchOfficialPrice = async () => {
    if (!address.trim()) return alert("주소를 입력해 주세요!");
    
    setIsLoading(true);
    setResult(null);

    try {
      // 💡 [API 연동 가이드] 추후 국토교통부 공동주택가격 서비스 API 발급 후 아래 fetch를 활성화하세요.
      /*
      const serviceKey = '개인_API_인증키';
      const res = await fetch(`https://apis.data.go.kr/1613000/BldOfclPriceService/getGvdOfficPriceInfo?serviceKey=${serviceKey}&address=${encodeURIComponent(address)}`);
      const data = await res.json();
      // 가공 후 setOfficialPrice(data.price);
      */

      // API 통신 느낌을 주기 위한 가상 1초 대기 및 가짜 데이터 바인딩 (테스트용)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (propertyType === 'villa') {
        // 주소에 따라 가상의 공시가 매칭 (실제 개발 시 API 결과값 대입)
        const mockOfficialPrice = 150000000; // 1억 5천만 원 가정
        setOfficialPrice(mockOfficialPrice / 10000); // 만원 단위 변환
        alert("🏠 주소지 매칭 성공! 공시가격이 자동으로 입력되었습니다.");
      } else {
        alert("💡 오피스텔 KB시세는 보안 정책상 하단에 직접 입력해 주셔야 정확합니다!");
      }
    } catch (err) {
      alert("주소 조회 중 오류가 발생했습니다. 수동 입력을 이용해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🧮 안전성 정밀 산출 계산 로직
  const handleCalculateSafety = () => {
    if (!jeonsePrice) return alert("비교할 전세가격을 입력해 주세요!");

    const jeonseRaw = jeonsePrice * 10000; // 원 단위 변환
    let standardLimit = 0; // HUG 보증보험 가입 상한 기준 금액

    if (propertyType === 'villa') {
      if (!officialPrice) return alert("공시가격을 입력하거나 주소 조회를 먼저 해주세요!");
      const officialRaw = officialPrice * 10000;
      // 🎯 126% 룰 적용 (공시가의 140% 산정 가격 * 담보인정비율 90%)
      standardLimit = officialRaw * 1.4 * 0.9;
    } else {
      if (!kbPrice) return alert("KB시세 또는 부동산테크 하위평균가를 입력해 주세요!");
      const kbRaw = kbPrice * 10000;
      // 🎯 오피스텔 90% 룰 적용 (KB시세 하위평균가의 90%)
      standardLimit = kbRaw * 0.9;
    }

    // 전세가 대비 상한선 비율 계산
    const safetyRatio = Math.round((jeonseRaw / standardLimit) * 100);
    const isSafe = safetyRatio <= 100;

    setResult({
      safetyRatio,
      standardLimit: Math.round(standardLimit / 10000),
      isSafe
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-6 pt-28 font-sans text-slate-900">
      <div className="w-full max-w-xl space-y-8">
        
        {/* 타이틀 헤더 구역 */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-[1000] text-slate-900 tracking-tight">HUG 보증금 안전 진단기</h2>
          <p className="text-slate-500 font-bold text-sm leading-relaxed">정부 보증보험 가입 규격에 맞춰 전세 안전성을 진단합니다.</p>
        </div>

        {/* 탭 컨트롤러 (빌라 vs 오피스텔 분리) */}
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm gap-1 w-full">
          <button 
            onClick={() => { setPropertyType('villa'); setResult(null); }} 
            className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${propertyType === 'villa' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
          >
            🏠 빌라/주택 (공시가 126%)
          </button>
          <button 
            onClick={() => { setPropertyType('officetel'); setResult(null); }} 
            className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${propertyType === 'officetel' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
          >
            🏢 오피스텔 (KB시세 90%)
          </button>
        </div>

        {/* 메인 입력 카드 보드 */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 space-y-6">
          
          {/* 주소 및 API 연동 입력창 */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 tracking-wide uppercase pl-1">검색 주소</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="예: 서울시 강남구 역삼동 123-4" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1 p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm text-slate-900 placeholder:text-slate-300"
              />
              <button 
                onClick={handleFetchOfficialPrice}
                disabled={isLoading}
                className="px-6 py-4 bg-slate-900 text-white text-xs font-black rounded-2xl shrink-0 hover:bg-slate-800 transition-all disabled:bg-slate-300"
              >
                {isLoading ? '조회 중...' : '주소 조회'}
              </button>
            </div>
          </div>

          {/* 내가 들어갈 전세가격 입력창 */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 tracking-wide uppercase pl-1">내가 계약할 전세보증금</label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="금액을 입력하세요" 
                value={jeonsePrice}
                onChange={(e) => setJeonsePrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-base text-slate-900 placeholder:text-slate-300 pr-14"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">만원</span>
            </div>
          </div>

          {/* 조건별 타겟 데이터 입력창 (빌라 공시가 vs 오피스텔 KB시세) */}
          {propertyType === 'villa' ? (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pl-1">
                <label className="text-xs font-black text-slate-400 tracking-wide uppercase">올해 공동주택 공시가격</label>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">126% 규정</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="주소를 조회하거나 직접 입력해 주세요" 
                  value={officialPrice}
                  onChange={(e) => setOfficialPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-base text-slate-900 placeholder:text-slate-300 pr-14 focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">만원</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pl-1">
                <label className="text-xs font-black text-slate-400 tracking-wide uppercase">KB시세 또는 부동산테크 하위평균가</label>
                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded">90% 규정</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="시세 하위평균가를 입력해 주세요" 
                  value={kbPrice}
                  onChange={(e) => setKbPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-base text-slate-900 placeholder:text-slate-300 pr-14 focus:ring-2 focus:ring-orange-400"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">만원</span>
              </div>
            </div>
          )}

          {/* 계산서 발행 버튼 */}
          <button 
            onClick={handleCalculateSafety}
            className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all active:scale-95"
          >
            안전성 진단하기 ⚡
          </button>
        </div>

        {/* 📊 결과 대시보드 리포팅 구역 (결과가 도출되었을 때만 노출) */}
        {result && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${result.isSafe ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500 animate-pulse'}`}>
                {result.isSafe ? '🟢 가입 승인 권역 (안전군)' : '🔴 보증 가입 불허 권역 (위험군)'}
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-4">
                보증보험 한도 대비 비율: <span className={`text-3xl font-[1000] ${result.isSafe ? 'text-blue-600' : 'text-red-500'}`}>{result.safetyRatio}%</span>
              </h3>
            </div>

            {/* 비주얼 게이지 진행 바 바인딩 */}
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${result.isSafe ? 'bg-blue-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(result.safetyRatio, 100)}%` }}
              />
            </div>

            {/* 상세 요약 박스 피드백 */}
            <div className="bg-slate-50 p-5 rounded-2xl text-left space-y-2.5 text-xs font-bold text-slate-500">
              <div className="flex justify-between">
                <span>HUG 가입 제한 전세 상한선</span>
                <span className="text-slate-900 font-black">{result.standardLimit.toLocaleString()} 만원 이하</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                <span>내가 설정한 전세금 규모</span>
                <span className="text-slate-900 font-black">{(jeonsePrice || 0).toLocaleString()} 만원</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-dashed border-slate-200">
                {result.isSafe 
                  ? '✨ 해당 계약은 전세보증금 반환보증보험 가입 기준을 안정적으로 만족합니다. 안심하고 계약을 진행하셔도 좋습니다.'
                  : '🚨 경고: 이 주택은 깡통전세 위험군이거나 보증보험 가입이 거절될 수 있습니다. 계약 체결 전 특약사항을 반드시 재검토하세요.'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}