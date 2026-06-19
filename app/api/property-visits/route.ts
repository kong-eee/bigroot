import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { draftToRow, rowToVisit } from '@/lib/property-visit-mapper';
import type { PropertyVisitDraft } from '@/lib/property-visit-types';
import type { GoldenPropertyType } from '@/lib/golden-time-schedule';

export const dynamic = 'force-dynamic';

function isPropertyType(v: string): v is GoldenPropertyType {
  return v === '주택' || v === '상가';
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, visits: [] });
    }

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('propertyType');

    let query = supabase
      .from('property_visits')
      .select('*')
      .eq('user_id', user.id)
      .order('visited_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (filterType && isPropertyType(filterType)) {
      query = query.eq('property_type', filterType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      visits: (data ?? []).map((row) => rowToVisit(row as Record<string, unknown>)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '조회 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<PropertyVisitDraft>;
    const title = body.title?.trim() || body.address?.trim();

    if (!title) {
      return NextResponse.json({ success: false, error: '제목 또는 주소를 입력해 주세요.' }, { status: 400 });
    }

    if (body.propertyType && !isPropertyType(body.propertyType)) {
      return NextResponse.json({ success: false, error: '유형은 주택 또는 상가만 가능합니다.' }, { status: 400 });
    }

    const row = draftToRow(
      {
        ...body,
        title,
        propertyType: body.propertyType && isPropertyType(body.propertyType) ? body.propertyType : '주택',
        visitedAt: body.visitedAt || new Date().toISOString().slice(0, 10),
        checklist: body.checklist ?? {},
        photos: body.photos ?? [],
        isFavorite: body.isFavorite ?? false,
      },
      user.id
    );

    const { data, error } = await supabase.from('property_visits').insert(row).select('*').single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      visit: rowToVisit(data as Record<string, unknown>),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '저장 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
