import { NextResponse } from 'next/server';
import { fetchYouthPolicies, isYouthCenterApiConfigured } from '@/lib/youth-center/client';
import { getYouthApiCode } from '@/lib/youth-center/regions';
import type { YouthPolicyScope } from '@/lib/youth-center/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sidoCode = searchParams.get('sido') ?? '';
  const scope = (searchParams.get('scope') ?? 'all') as YouthPolicyScope;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get('pageSize') ?? '20') || 20));

  if (!sidoCode) {
    return NextResponse.json({ success: false, error: 'sido 파라미터가 필요합니다.' }, { status: 400 });
  }

  if (!['local', 'national', 'all'].includes(scope)) {
    return NextResponse.json({ success: false, error: 'scope는 local|national|all 입니다.' }, { status: 400 });
  }

  const youthRegionCode = getYouthApiCode(sidoCode);

  try {
    const result = await fetchYouthPolicies({
      sidoCode,
      youthRegionCode,
      scope,
      page,
      pageSize,
    });

    const keyConfigured = isYouthCenterApiConfigured();

    return NextResponse.json({
      success: true,
      ...result,
      configured: keyConfigured && result.source === 'api',
      message:
        result.source === 'demo'
          ? keyConfigured
            ? '온통청년 API 연결에 실패해 예시 데이터를 표시합니다. 잠시 후 다시 시도하거나 키 승인 상태를 확인하세요.'
            : process.env.VERCEL === '1'
              ? '서버에 YOUTH_CENTER_API_KEY가 없습니다. Vercel 대시보드 → Project → Settings → Environment Variables에 키를 추가한 뒤 재배포하세요. (로컬은 .env.local)'
              : 'YOUTH_CENTER_API_KEY가 없어 예시 데이터를 표시합니다. 온통청년에서 키를 발급해 .env.local에 설정하세요.'
          : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '정책 목록을 불러오지 못했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
