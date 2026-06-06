import { NextResponse } from 'next/server';
import { fetchLoanRatesBundle } from '@/lib/housing-fund';
import { demoLoanRates } from '@/lib/housing-fund/hf-client';
import { fetchBokBaseRate } from '@/lib/housing-fund/bok';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
          : result.source === 'partial'
            ? 'HF API 일시 오류로 일부 예시·참고 금리를 표시합니다. 새로고침하면 최신 데이터를 다시 시도합니다.'
            : undefined,
    });
  } catch (e) {
    const baseRate = await fetchBokBaseRate();
    const demo = demoLoanRates();
    const message = e instanceof Error ? e.message : '금리 정보를 불러오지 못했습니다.';

    return NextResponse.json({
      success: true,
      baseRate,
      ...demo,
      configured: false,
      source: 'demo',
      total: demo.didimdol.length + demo.rent.length + demo.conforming.length,
      updatedAt: new Date().toISOString(),
      message: `${message} — 예시 금리를 표시합니다.`,
      warnings: [message],
    });
  }
}
