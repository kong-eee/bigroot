'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { STATIC_SIDO_LIST } from '@/lib/korea-sido';

declare global {
  interface Window {
    naver: any;
  }
}

interface RoomType {
  id: string;
  dong: string;
  ho: string;
  area: string;
  price: number;
}

interface RegionOption {
  code: string;
  name: string;
}

function parseWonInput(value: string): number | '' {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits);
}

function formatWon(value: number | ''): string {
  if (value === '') return '';
  return value.toLocaleString('ko-KR');
}

/** HUG 기준 한도(원) — 1원이라도 초과 시 불가 */
function calcSafety(jeonseWon: number, limitWon: number) {
  const isSafe = jeonseWon <= limitWon;
  const rawPercent = (jeonseWon / limitWon) * 100;
  const safetyRatio = isSafe ? Math.floor(rawPercent) : Math.ceil(rawPercent);
  return { isSafe, safetyRatio, standardLimit: limitWon };
}

export default function SafetyCheckPage() {
  const [propertyType, setPropertyType] = useState<'villa' | 'officetel'>('villa');
  const [jeonsePrice, setJeonsePrice] = useState<number | ''>('');
  const [officialPrice, setOfficialPrice] = useState<number | ''>('');
  const [kbPrice, setKbPrice] = useState<number | ''>('');

  const [sidoList] = useState<RegionOption[]>([...STATIC_SIDO_LIST]);
  const [sigunguList, setSigunguList] = useState<RegionOption[]>([]);
  const [dongList, setDongList] = useState<RegionOption[]>([]);

  const [selectedSido, setSelectedSido] = useState('');
  const [selectedSigungu, setSelectedSigungu] = useState('');
  const [selectedDong, setSelectedDong] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  const [loadingSigungu, setLoadingSigungu] = useState(false);
  const [loadingDong, setLoadingDong] = useState(false);
  const [regionError, setRegionError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [buildingName, setBuildingName] = useState('');
  const [priceNotice, setPriceNotice] = useState('');
  const [roomList, setRoomList] = useState<RoomType[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const fetchRegions = useCallback(async (type: 'sigungu' | 'dong', parent: string) => {
    const params = new URLSearchParams({ type, parent });
    let res: Response;
    try {
      res = await fetch(`/api/regions?${params.toString()}`, {
        signal: AbortSignal.timeout(20000),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.name === 'TimeoutError'
          ? '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
          : '서버에 연결하지 못했습니다. 배포 후 Redeploy가 필요할 수 있습니다.';
      throw new Error(message);
    }

    let data: { success?: boolean; error?: string; regions?: RegionOption[] };
    try {
      data = await res.json();
    } catch {
      throw new Error(`서버 응답 오류 (${res.status}). Vercel 재배포 후 다시 시도해 주세요.`);
    }

    if (!res.ok || !data.success) {
      throw new Error(data.error || '행정구역 목록을 불러오지 못했습니다.');
    }
    return data.regions as RegionOption[];
  }, []);

  useEffect(() => {
    if (!selectedSido) {
      setSigunguList([]);
      setSelectedSigungu('');
      setRegionError('');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingSigungu(true);
      setRegionError('');
      try {
        const regions = await fetchRegions('sigungu', selectedSido);
        if (!cancelled) {
          setSigunguList(regions);
          setSelectedSigungu('');
          setDongList([]);
          setSelectedDong('');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : '시군구 목록 로드 실패';
          setRegionError(message);
          setSigunguList([]);
        }
      } finally {
        if (!cancelled) setLoadingSigungu(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSido, fetchRegions]);

  useEffect(() => {
    if (!selectedSigungu) {
      setDongList([]);
      setSelectedDong('');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingDong(true);
      setRegionError('');
      try {
        const regions = await fetchRegions('dong', selectedSigungu);
        if (!cancelled) {
          setDongList(regions);
          setSelectedDong('');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '동 목록 로드 실패';
          setRegionError(message);
          setDongList([]);
        }
      } finally {
        if (!cancelled) setLoadingDong(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSigungu, fetchRegions]);

  const fullAddress = useMemo(() => {
    const sidoName = sidoList.find((r) => r.code === selectedSido)?.name ?? '';
    const sigunguName = sigunguList.find((r) => r.code === selectedSigungu)?.name ?? '';
    const dongName = dongList.find((r) => r.code === selectedDong)?.name ?? '';
    return [sidoName, sigunguName, dongName, detailAddress.trim()]
      .filter(Boolean)
      .join(' ');
  }, [
    sidoList,
    sigunguList,
    dongList,
    selectedSido,
    selectedSigungu,
    selectedDong,
    detailAddress,
  ]);

  const initMap = useCallback(() => {
    if (typeof window === 'undefined' || !window.naver?.maps || !mapContainerRef.current) {
      return false;
    }

    if (mapRef.current) {
      mapRef.current.destroy();
      mapRef.current = null;
      markerRef.current = null;
    }

    const center = new window.naver.maps.LatLng(37.5665, 126.9780);
    const map = new window.naver.maps.Map(mapContainerRef.current, {
      center,
      zoom: 16,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.RIGHT_BOTTOM,
      },
    });
    const marker = new window.naver.maps.Marker({
      position: center,
      map,
      visible: false,
    });

    mapRef.current = map;
    markerRef.current = marker;
    setMapReady(true);
    return true;
  }, []);

  useEffect(() => {
    if (initMap()) return;

    const interval = window.setInterval(() => {
      if (initMap()) window.clearInterval(interval);
    }, 200);

    return () => {
      window.clearInterval(interval);
      mapRef.current?.destroy();
      mapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    };
  }, [initMap]);

  const handleFetchOfficialPrice = async () => {
    if (!selectedSido || !selectedSigungu || !selectedDong) {
      return alert('시도, 시군구, 동을 모두 선택해 주세요!');
    }
    if (!detailAddress.trim()) {
      return alert('번지(상세주소)를 입력해 주세요! 예: 143-12');
    }
    if (!mapReady || !mapRef.current || !markerRef.current) {
      return alert('지도 엔진이 준비 중입니다. 잠시 후 다시 시도해 주세요.');
    }

    setIsLoading(true);
    setResult(null);
    setBuildingName('');
    setPriceNotice('');
    setRoomList([]);
    setSelectedRoomId('');
    setOfficialPrice('');

    window.naver.maps.Service.geocode(
      { query: fullAddress },
      function (status: any, response: any) {
        if (status === window.naver.maps.Service.Status.OK && response.v2?.addresses?.[0]) {
          const item = response.v2.addresses[0];
          const newCoords = new window.naver.maps.LatLng(item.y, item.x);
          mapRef.current.setCenter(newCoords);
          markerRef.current.setPosition(newCoords);
          markerRef.current.setVisible(true);
        }
      }
    );

    try {
      const params = new URLSearchParams({
        dongCode: selectedDong,
        jibun: detailAddress.trim(),
        address: fullAddress,
      });
      const res = await fetch(`/api/official-price?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '공시가격을 조회할 수 없습니다.');
      }

      setBuildingName(data.buildingName);
      setPriceNotice(data.notice || '');
      setRoomList(data.rooms || []);

      const noticeLine = data.notice ? `\n\n※ ${data.notice}` : '';
      alert(
        `✨ 국토교통부 실시간 장부 연동 완료!\n[${data.buildingName}]의 호실 ${(data.rooms || []).length}건을 가져왔습니다.${noticeLine}`
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '공시가격을 조회할 수 없습니다.';
      alert(
        `💡 안내: ${message}\n정부 망 연동 지연 시 하단에 직접 입력하셔도 계산이 가능합니다.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    const targetRoom = roomList.find((r) => r.id === roomId);
    if (targetRoom) {
      setOfficialPrice(targetRoom.price);
    } else {
      setOfficialPrice('');
    }
  };

  const handleCalculateSafety = () => {
    if (!jeonsePrice) return alert('비교할 전세가격을 입력해 주세요!');

    const jeonseWon = Number(jeonsePrice);
    let limitWon = 0;

    if (propertyType === 'villa') {
      if (!officialPrice)
        return alert('호실을 먼저 선택하여 진짜 공시가격을 불러와야 합니다!');
      // 공시가 × 126% (1원 초과 시 불가)
      limitWon = Math.floor((Number(officialPrice) * 126) / 100);
    } else {
      if (!kbPrice) return alert('KB시세 하위평균가를 입력해 주세요!');
      limitWon = Math.floor((Number(kbPrice) * 90) / 100);
    }

    setResult(calcSafety(jeonseWon, limitWon));
  };

  const selectClass =
    'w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <>
      <Script
        src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=9eu2mq3ip3&submodules=geocoder"
        onLoad={initMap}
      />

      <div className="page-main flex flex-col items-center p-4 sm:p-6">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-[1000] text-slate-900 tracking-tight">
              HUG 보증금 안전 진단기 ⚡
            </h2>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              공시가 API + 네이버 지도 실시간 공간 추적 엔진 결합
            </p>
          </div>

          <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm gap-1 w-full">
            <button
              onClick={() => {
                setPropertyType('villa');
                setResult(null);
              }}
              className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${propertyType === 'villa' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              🏠 빌라/주택 (공시가 126%)
            </button>
            <button
              onClick={() => {
                setPropertyType('officetel');
                setResult(null);
              }}
              className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${propertyType === 'officetel' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              🏢 오피스텔 (KB시세 90%)
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 tracking-wide pl-1">
                주소 선택 (시도 → 시군구 → 동)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={selectedSido}
                  onChange={(e) => setSelectedSido(e.target.value)}
                  className={selectClass}
                >
                  <option value="">시도 선택</option>
                  {sidoList.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSigungu}
                  onChange={(e) => setSelectedSigungu(e.target.value)}
                  disabled={!selectedSido || loadingSigungu}
                  className={selectClass}
                >
                  <option value="">
                    {loadingSigungu ? '시군구 불러오는 중...' : '시군구 선택'}
                  </option>
                  {sigunguList.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDong}
                  onChange={(e) => setSelectedDong(e.target.value)}
                  disabled={!selectedSigungu || loadingDong}
                  className={selectClass}
                >
                  <option value="">
                    {loadingDong ? '동 불러오는 중...' : '동 선택'}
                  </option>
                  {dongList.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {regionError && (
                <p className="text-[11px] font-bold text-red-500 leading-relaxed pl-1">
                  {regionError}
                </p>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 pl-1">
                  상세주소 (번지)
                </label>
                <input
                  type="text"
                  placeholder="예: 143-12"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm text-slate-900 placeholder:text-slate-300"
                />
              </div>

              {fullAddress && (
                <p className="text-[11px] font-bold text-slate-400 pl-1">
                  조회 주소: <span className="text-slate-600">{fullAddress}</span>
                </p>
              )}

              <button
                onClick={handleFetchOfficialPrice}
                disabled={isLoading || loadingSigungu || loadingDong}
                className="w-full py-4 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-800 transition-all disabled:bg-slate-300"
              >
                {isLoading ? '조회 중...' : '주소 조회 🔍'}
              </button>
            </div>

            {buildingName && (
              <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100/80 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-blue-500 uppercase tracking-wide">
                    정부 전산망 식별 건물명
                  </span>
                  <span className="text-xs font-black text-slate-400">
                    {roomList.length}개 호실 실시간 로드됨
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900">🏢 {buildingName}</h4>
                {priceNotice && (
                  <p className="text-[11px] font-bold text-amber-600">{priceNotice}</p>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400">
                    계약 예정인 진짜 호실 선택
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">-- 진짜 등록된 호실 목록 --</option>
                    {roomList.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.dong !== '본동' ? `${room.dong} ` : ''}
                        {room.ho}호 · {Number(room.area) ? `${room.area}㎡` : '면적미상'} · 공시가{' '}
                        {room.price.toLocaleString()}원
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 tracking-wide pl-1">
                건물 위치 확인
              </label>
              <div
                ref={mapContainerRef}
                className="w-full h-64 bg-slate-100 rounded-2xl border border-slate-200/60 overflow-hidden shadow-inner relative z-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 tracking-wide pl-1">
                내가 계약할 전세보증금
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="금액을 입력하세요"
                  value={formatWon(jeonsePrice)}
                  onChange={(e) => setJeonsePrice(parseWonInput(e.target.value))}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-base text-slate-900 placeholder:text-slate-300 pr-14"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                  원
                </span>
              </div>
            </div>

            {propertyType === 'villa' ? (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label className="text-xs font-black text-slate-400 tracking-wide">
                  올해 공동주택 공시가격 (선택 호실 반영값)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    placeholder="위에서 호실을 선택하면 진짜 금액이 꽂힙니다"
                    value={formatWon(officialPrice)}
                    className="w-full p-4 bg-slate-100 rounded-2xl border-none outline-none font-black text-base text-blue-600 placeholder:text-slate-300 pr-14"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-blue-500">
                    원
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-xs font-black text-slate-400 tracking-wide">
                    KB시세 하위평균가 수동 입력
                  </label>
                  <a
                    href="https://kbland.kr"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-black text-blue-500 hover:underline"
                  >
                    ↗️ KB부동산 시세 확인
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="시세 금액을 직접 입력하세요"
                    value={formatWon(kbPrice)}
                    onChange={(e) => setKbPrice(parseWonInput(e.target.value))}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-base text-slate-900 placeholder:text-slate-300 pr-14 focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    원
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleCalculateSafety}
              className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all active:scale-95"
            >
              안전성 진단하기 ⚡
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div>
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${result.isSafe ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
                >
                  {result.isSafe
                    ? '🟢 가입 승인 권역 (안전)'
                    : '🔴 보증 가입 거절 권역 (위험)'}
                </span>
                <h3 className="text-lg font-black text-slate-800 mt-4">
                  보증 한도비용 대비 충족도:{' '}
                  <span
                    className={`text-3xl font-[1000] ${result.isSafe ? 'text-blue-600' : 'text-red-500'}`}
                  >
                    {result.safetyRatio}%
                  </span>
                </h3>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${result.isSafe ? 'bg-blue-500' : 'bg-red-500'}`}
                  style={{
                    width: `${result.isSafe ? Math.min(result.safetyRatio, 100) : 100}%`,
                  }}
                />
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl text-left space-y-2.5 text-xs font-bold text-slate-500">
                <div className="flex justify-between">
                  <span>
                    {propertyType === 'villa'
                      ? 'HUG 한도 (공시가 × 126%)'
                      : 'HUG 한도 (KB시세 × 90%)'}
                  </span>
                  <span className="text-slate-900 font-black">
                    {result.standardLimit.toLocaleString()}원 이하
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                  <span>내가 입력한 보증금 규모</span>
                  <span className="text-slate-900 font-black">
                    {Number(jeonsePrice || 0).toLocaleString()}원
                  </span>
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
