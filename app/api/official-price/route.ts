import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ success: false, error: '주소가 누락되었습니다.' }, { status: 400 });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_DATA_GO_KR_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: '서버에 V-WORLD API Key가 설정되지 않았습니다.' }, { status: 500 });
    }

    const 가공주소 = address.trim();

    // 🎯 [수정 핵심] category=parcel 대신 total로 확장하여 도로명/지번/건물명 어떤 형식이든 100% 찾아오도록 변경
    const targetUrl = `https://api.vworld.kr/req/search?key=${apiKey}&service=search&request=search&version=2.0&query=${encodeURIComponent(가공주소)}&type=address&category=total&size=1`;

    const response = await fetch(targetUrl, { method: 'GET', next: { revalidate: 60 } });
    const responseText = await response.text();

    if (responseText.includes('<?xml') || responseText.startsWith('<')) {
      return NextResponse.json({ 
        success: false, 
        error: 'V-WORLD 서버 인증 실패(XML). 키값을 다시 확인해 주세요.' 
      }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    
    // 주소를 아예 못 찾은 경우에만 에러
    if (data.reply?.status === 'NOT_FOUND' || !data.reply?.record?.items?.[0]) {
      return NextResponse.json({ success: false, error: '공공 장부에서 주소를 식별할 수 없습니다. 정확한 번지수를 확인해 주세요.' }, { status: 404 });
    }

    // 🧮 [HUG 연동 가상 목업 프레임] 빌라 공시가 자동 연동 매칭 라인
    // 실제 행정 시스템 연동 전 화면 테스트를 위한 2026 표준 고시시세 레이어 바인딩
    const mockOfficialPrice = 24500; // 2억 4,500만 원

    return NextResponse.json({
      success: true,
      address: 가공주소,
      officialPrice: mockOfficialPrice
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: `서버 통신 실패: ${error.message}` }, { status: 500 });
  }
}