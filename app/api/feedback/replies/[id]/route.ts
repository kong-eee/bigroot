import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { isAdminUserId } from '@/lib/is-admin';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!isAdminUserId(user.id, profile?.is_admin)) {
      return NextResponse.json({ success: false, error: '운영자만 수정할 수 있습니다.' }, { status: 403 });
    }

    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim() ?? '';
    if (content.length < 2) {
      return NextResponse.json({ success: false, error: '답변을 2자 이상 입력해 주세요.' }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const writer = admin ?? supabase;

    const { data, error } = await writer
      .from('feedback_replies')
      .update({ content })
      .eq('id', id)
      .eq('author_id', user.id)
      .select('id, feedback_id, author_id, content, created_at, updated_at')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: '답변을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, reply: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : '답변 수정 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
