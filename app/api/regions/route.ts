import { NextResponse } from 'next/server';
import { STATIC_SIDO_LIST } from '@/lib/korea-sido';
import sigunguBySido from '@/lib/data/sigungu-by-sido.json';
import dongBySigungu from '@/lib/data/dong-by-sigungu.json';

type RegionType = 'sido' | 'sigungu' | 'dong';

type RegionItem = { code: string; name: string };

const SIGUNGU_MAP = sigunguBySido as Record<string, RegionItem[]>;
const DONG_MAP = dongBySigungu as Record<string, RegionItem[]>;

function sortRegions(items: RegionItem[]): RegionItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as RegionType | null;
  const parent = searchParams.get('parent') ?? undefined;

  if (!type || !['sido', 'sigungu', 'dong'].includes(type)) {
    return NextResponse.json(
      { success: false, error: 'type 파라미터(sido|sigungu|dong)가 필요합니다.' },
      { status: 400 }
    );
  }

  if (type === 'sido') {
    return NextResponse.json({
      success: true,
      regions: [...STATIC_SIDO_LIST],
    });
  }

  if (!parent) {
    return NextResponse.json(
      { success: false, error: '시군구·동 조회 시 parent 코드가 필요합니다.' },
      { status: 400 }
    );
  }

  if (type === 'sigungu') {
    const regions = sortRegions(SIGUNGU_MAP[parent] ?? []);
    return NextResponse.json({ success: true, regions });
  }

  const regions = sortRegions(DONG_MAP[parent] ?? []);
  return NextResponse.json({ success: true, regions });
}
