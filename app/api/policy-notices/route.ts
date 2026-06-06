import { NextResponse } from 'next/server';
import { fetchPolicyNotices } from '@/lib/policy-notices';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sido = searchParams.get('sido') ?? '11';

  try {
    const feed = await fetchPolicyNotices(sido);
    return NextResponse.json({
      success: true,
      ...feed,
      total: feed.items.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '공지를 불러오지 못했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
