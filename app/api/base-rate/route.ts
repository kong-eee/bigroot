import { NextResponse } from 'next/server';

export async function GET() {
  // 1. .env.local에 저장한 API 키 불러오기
  const API_KEY = process.env.BOK_ECOS_API_KEY;
  
  // 오늘 날짜와 데이터가 확실히 있을 7일 전 날짜 구하기
  const now = new Date();
  const today = now.toISOString().slice(0, 10).replace(/-/g, '');
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

  // 키가 없는 경우를 대비한 안전장치
  if (!API_KEY || API_KEY === 'sample') {
    console.warn("⚠️ API 키가 설정되지 않았습니다. 기본값 3.5%를 반환합니다.");
    return NextResponse.json({ baseRate: 3.5 });
  }

  try {
    // 2. 한국은행 ECOS API 호출 (기준금리 통계표: 722Y001, 항목: 0101000)
    const url = `https://ecos.bok.or.kr/api/StatisticSearch/${API_KEY}/json/kr/1/1/722Y001/D/${lastWeek}/${today}/0101000`;
    
    const response = await fetch(url, { next: { revalidate: 3600 } }); // 1시간마다 데이터 갱신
    const data = await response.json();

    // 3. 데이터 파싱
    if (data.StatisticSearch?.row && data.StatisticSearch.row.length > 0) {
      // 가장 최신 날짜의 금리 가져오기
      const latestRate = parseFloat(data.StatisticSearch.row[data.StatisticSearch.row.length - 1].DATA_VALUE);
      return NextResponse.json({ baseRate: latestRate });
    }

    // 데이터 형식이 예상과 다를 경우
    console.error("❌ API 응답 구조 이상:", data);
    return NextResponse.json({ baseRate: 3.5 });

  } catch (error) {
    console.error("❌ 한국은행 API 연결 실패:", error);
    // 서버가 점검 중이거나 에러 나도 서비스는 돌아가야 하므로 기본값 반환
    return NextResponse.json({ baseRate: 3.5 });
  }
}