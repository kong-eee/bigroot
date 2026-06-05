import { NextResponse } from 'next/server';
import { fetchLoanRatesBundle } from '@/lib/housing-fund';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  try {
    const result = await fetchLoanRatesBundle();
    const total =
      result.didimdol.length + result.rent.length + result.conforming.length;

    return NextResponse.json({
      success: true,
      ...result,
      total,
      updatedAt: new Date().toISOString(),
      message:
        result.source === 'demo'
          ? process.env.VERCEL === '1'
            ? 'DATA_GO_KR_SERVICE_KEY가 없습니다. 공공데이터포털 HF·기금 API 활용신청 후 Vercel에 키를 추가하세요.'
            : 'DATA_GO_KR_SERVICE_KEY가 없어 예시 금리를 표시합니다. .env.local에 공공데이터 인증키를 넣어 주세요.'
          : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '금리 정보를 불러오지 못했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
