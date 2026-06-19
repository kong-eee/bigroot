import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { draftToRow, rowToVisit } from '@/lib/property-visit-mapper';
import type { PropertyVisitDraft } from '@/lib/property-visit-types';
import type { GoldenPropertyType } from '@/lib/golden-time-schedule';

export const dynamic = 'force-dynamic';

function isPropertyType(v: string): v is GoldenPropertyType {
  return v === '주택' || v === '상가';
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('property_visits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: '임장 기록을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      visit: rowToVisit(data as Record<string, unknown>),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '조회 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<PropertyVisitDraft>;

    if (body.propertyType && !isPropertyType(body.propertyType)) {
      return NextResponse.json({ success: false, error: '유형은 주택 또는 상가만 가능합니다.' }, { status: 400 });
    }

    if (body.title !== undefined && !body.title.trim() && !body.address?.trim()) {
      return NextResponse.json({ success: false, error: '제목 또는 주소를 입력해 주세요.' }, { status: 400 });
    }

    const row = draftToRow(body, user.id);
    delete row.user_id;

    const { data, error } = await supabase
      .from('property_visits')
      .update(row)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: '임장 기록을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      visit: rowToVisit(data as Record<string, unknown>),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '수정 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from('property_visits')
      .select('photos')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ success: false, error: '임장 기록을 찾을 수 없습니다.' }, { status: 404 });
    }

    const photos = Array.isArray(existing.photos) ? existing.photos : [];
    const paths = photos
      .filter((p): p is { path: string } => Boolean(p && typeof p === 'object' && 'path' in p))
      .map((p) => p.path);

    if (paths.length > 0) {
      await supabase.storage.from('property-visit-photos').remove(paths);
    }

    const { error } = await supabase.from('property_visits').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : '삭제 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
