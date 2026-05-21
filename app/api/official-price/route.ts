import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: '주소가 누락되었습니다.' }, { status: 400 });
  }

  try {
    const serviceKey = process.env.NEXT_PUBLIC_DATA_GO_KR_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: '서버에 공공데이터 API Key가 설정되지 않았습니다. Vercel 환경변수를 확인해 주세요.' }, { status: 500 });
    }

    // 💡 [정밀 수정] 띄어쓰기가 없어도 "방이동", "143", "12"를 자석처럼 추출하는 정규식 엔진
    const dongMatch = address.match(/([가-힣]+(?:동|리|가|로|길))/);
    const jibeonMatch = address.match(/(\d+)(?:\s*-\s*(\d+))?/);

    const dong = dongMatch ? dongMatch[1] : '';
    const bon = jibeonMatch ? jibeonMatch[1] : '0';
    const bu = jibeonMatch && jibeonMatch[2] ? jibeonMatch[2] : '0';

    if (!dong) {
      return NextResponse.json({ error: '주소에서 동/리 이름을 찾을 수 없습니다. 정확한 지번 주소를 입력해 주세요.' }, { status: 400 });
    }

    // 국토교통부 서버로 보낼 주소 조립
    const targetUrl = `https://apis.data.go.kr/1613000/BldOfclPriceService/getGvdOfficPriceInfo?serviceKey=${encodeURIComponent(serviceKey)}&dongNm=${encodeURIComponent(dong)}&bobn=${bon.padStart(4, '0')}&bubn=${bu.padStart(4, '0')}&numOfRows=1&pageNo=1&_type=json`;

    const response = await fetch(targetUrl, { method: 'GET', next: { revalidate: 60 } });
    
    // 💡 [안전장치] 정부 서버가 뿜은 원본 글자를 먼저 읽어서 XML 깨짐 현상 원천 차단
    const responseText = await response.text();

    if (responseText.includes('<?xml') || responseText.startsWith('<')) {
      return NextResponse.json({ error: '정부 API 서버가 에러 메세지(XML)를 반환했습니다. 인증키가 아직 활성화되지 않았거나 주소가 올바르지 않습니다.' }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    const item = data?.response?.body?.items?.item;

    if (!item) {
      return NextResponse.json({ error: '공시지가 장부에 등록되지 않은 주소입니다. 수동 입력을 이용해 주세요!' }, { status: 404 });
    }

    const rawPrice = item.pblntfPclnd || item.pblntfPrice || 0;
    return NextResponse.json({
      success: true,
      address: address,
      officialPrice: Math.round(Number(rawPrice) / 10000)
    });

  } catch (error: any) {
    return NextResponse.json({ error: `서버 내부 에러: ${error.message}` }, { status: 500 });
  }
}