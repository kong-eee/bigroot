import { NextResponse } from 'next/server';
import { fetchYouthPolicies } from '@/lib/youth-center/client';
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

    return NextResponse.json({
      success: true,
      ...result,
      configured: result.source === 'api',
      message:
        result.source === 'demo'
          ? 'YOUTH_CENTER_API_KEY가 없어 예시 데이터를 표시합니다. 온통청년에서 키를 발급해 .env.local에 설정하세요.'
          : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '정책 목록을 불러오지 못했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
