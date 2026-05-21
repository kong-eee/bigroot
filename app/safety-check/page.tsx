'use client';

import { useState } from 'react';
import Script from 'next/script';

// 💡 [핵심 해결책] 글로벌 window 객체에 naver가 존재할 수 있다고 타입스크립트에게 알려주는 선언문입니다.
declare global {
  interface Window {
    naver: any;
  }
}

export default function SafetyCheckPage() {
  const [propertyType, setPropertyType] = useState<'villa' | 'officetel'>('villa');
  const [address, setAddress] = useState('');
  const [jeonsePrice, setJeonsePrice] = useState<number | ''>('');
  const [officialPrice, setOfficialPrice] = useState<number | ''>(''); 
  const [kbPrice, setKbPrice] = useState<number | ''>(''); 

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerInstance, setMapMarker] = useState<any>(null);

  const initMap = () => {
    if (typeof window !== 'undefined' && window.naver && window.naver.maps) {
      const mapOptions = {
        center: new window.naver.maps.LatLng(37.5665, 126.9780),
        zoom: 16,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.RIGHT_BOTTOM
        }
      };
      
      const map = new window.naver.maps.Map('naver-map', mapOptions);
      const marker = new window.naver.maps.Marker({
        position: mapOptions.center,
        map: map,
        visible: false 
      });

      setMapInstance(map);
      setMapMarker(marker);
    }
  };

  const handleFetchOfficialPrice = async () => {
    if (!address.trim()) return alert("주소를 입력해 주세요!");
    if (!mapInstance || !markerInstance) return alert("지도 엔진이 아직 준비되지 않았습니다. 잠시만 기다려주세요!");
    
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/official-price?address=${encodeURIComponent(address)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '공시가격을 조회할 수 없습니다.');
      }

      setOfficialPrice(data.officialPrice);

      window.naver.maps.Service.geocode({ query: address }, function (status: any, response: any) {
        if (status !== window.naver.maps.Service.Status.OK) {
          console.warn("지도 주소 변환 실패");
          return;
        }

        const item = response.v2.addresses[0];
        if (item) {
          const newCoords = new window.naver.maps.LatLng(item.y, item.x);
          mapInstance.setCenter(newCoords);
          markerInstance.setPosition(newCoords);
          markerInstance.setVisible(true);
        }
      });

      alert(`🏠 주소 매칭 및 위치 추적 완료!\n공시가격: ${data.officialPrice.toLocaleString()}만 원`);

    } catch (err: any) {
      alert(`💡 안내: ${err.message}\n데이터가 공공망에 없거나 오피스텔인 경우 직접 입력하시면 즉시 진단이 가능합니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateSafety = () => {
    if (!jeonsePrice) return alert("비교할 전세가격을 입력해 주세요!");

    const jeonseRaw = jeonsePrice * 10000;
    let standardLimit = 0;

    if (propertyType === 'villa') {
      if (!officialPrice) return alert("공시가격을 입력하거나 주소 조회를 먼저 해주세요!");
      const officialRaw = officialPrice * 10000;
      standardLimit = officialRaw * 1.4 * 0.9;
    } else {
      if (!kbPrice) return alert("KB시세 하위평균가를 입력해 주세요!");
      const kbRaw = kbPrice * 10000;
      standardLimit = kbRaw * 0.9;
    }

    const safetyRatio = Math.round((jeonseRaw / standardLimit) * 100);
    const isSafe = safetyRatio <= 100;

    setResult({
      safetyRatio,
      standardLimit: Math.round(standardLimit / 10000),
      isSafe
    });
  };

  return (
    <>
      <Script
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}&submodules=geocoder`}
        onLoad={initMap}
      />

      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-6 pt-32 font-sans text-slate-900">
        <div className="w-full max-w-xl space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-[1000] text-slate-900 tracking-tight">HUG 보증금 안전 진단기 ⚡</h2>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">공시가 API + 네이버 지도 실시간 공간 추적 엔진 결합</p>
          </div>

          <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm gap-1 w-full">
            <button onClick={() => { setPropertyType('villa'); setResult(null); }} className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${propertyType === 'villa' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>
              🏠 빌라/주택 (공시가 126%)
            </button>
            <button onClick={() => { setPropertyType('officetel'); setResult(null); }} className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${propertyType === 'officetel' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>
              🏢 오피스텔 (KB시세 90%)
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 tracking-wide pl-1">검색 주소 (번지수까지 기입)</label>
              <div className="flex gap-2">
                <input type="text" placeholder="예: 경기도 성남시 분당구 삼평동 624" value={address} onChange={(e) => setAddress(e.target.value)} className="flex-1 p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm text-slate-900 placeholder:text-slate-300" />
                <button onClick={handleFetchOfficialPrice} disabled={isLoading} className="px-6 py-4 bg-slate-900 text-white text-xs font-black rounded-2xl shrink-0 hover:bg-slate-800 transition-all disabled:bg-slate-300">
                  {isLoading ? '조회 중...' : '주소 조회 🔍'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 tracking-wide pl-1">건물 위치 확인</label>
              <div 
                id="naver-map" 
                className="w-full h-64 bg-slate-100 rounded-2xl border border-slate-200/60 overflow-hidden shadow-inner relative z-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 tracking-wide pl-1">내가 계약할 전세보증금</label>
              <div className="relative">
                <input type="number" placeholder="금액을 입력하세요" value={jeonsePrice} onChange={(e) => setJeonsePrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-base text-slate-900 placeholder:text-slate-300 pr-14" />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">만원</span>
              </div>
            </div>

            {propertyType === 'villa' ? (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label className="text-xs font-black text-slate-400 tracking-wide">올해 공동주택 공시가격</label>
                <div className="relative">
                  <input type="number" placeholder="주소를 조회하면 자동으로 입력됩니다" value={officialPrice} onChange={(e) => setOfficialPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-base text-slate-900 placeholder:text-slate-300 pr-14 focus:ring-2 focus:ring-blue-500" />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">만원</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-xs font-black text-slate-400 tracking-wide">KB시세 하위평균가 수동 입력</label>
                  <a href="https://kbland.kr" target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-500 hover:underline">↗️ KB부동산 시세 확인</a>
                </div>
                <div className="relative">
                  <input type="number" placeholder="시세 금액을 직접 입력하세요" value={kbPrice} onChange={(e) => setKbPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-base text-slate-900 placeholder:text-slate-300 pr-14 focus:ring-2 focus:ring-orange-400" />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">만원</span>
                </div>
              </div>
            )}

            <button onClick={handleCalculateSafety} className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all active:scale-95">
              안전성 진단하기 ⚡
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${result.isSafe ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {result.isSafe ? '🟢 가입 승인 권역 (안전)' : '🔴 보증 가입 거절 권역 (위험)'}
                </span>
                <h3 className="text-lg font-black text-slate-800 mt-4">
                  보증 한도비용 대비 충족도: <span className={`text-3xl font-[1000] ${result.isSafe ? 'text-blue-600' : 'text-red-500'}`}>{result.safetyRatio}%</span>
                </h3>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 rounded-full ${result.isSafe ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${Math.min(result.safetyRatio, 100)}%` }} />
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl text-left space-y-2.5 text-xs font-bold text-slate-500">
                <div className="flex justify-between">
                  <span>HUG 역산 기준 합격 커트라인</span>
                  <span className="text-slate-900 font-black">{result.standardLimit.toLocaleString()} 만원 이하</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                  <span>내가 입력한 보증금 규모</span>
                  <span className="text-slate-900 font-black">{(jeonsePrice || 0).toLocaleString()} 만원</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-dashed border-slate-200">
                  {result.isSafe 
                    ? '✨ 본 매물은 허그 보증보험 전세가율 126% 기준을 안전하게 충족하여 보증서 발급이 무난할 것으로 예상됩니다.'
                    : '🚨 경고: 상한선을 초과하여 가입이 거절되거나 추후 전세금 반환에 차질이 생길 수 있으니 감액 계약을 요구하세요.'}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}