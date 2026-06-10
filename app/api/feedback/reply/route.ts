import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { isFeedbackSchemaError } from '@/lib/feedback-migration-sql';
import { isAdminUserId } from '@/lib/is-admin';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
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
      return NextResponse.json({ success: false, error: '운영자만 답변할 수 있습니다.' }, { status: 403 });
    }

    const body = (await request.json()) as { feedbackId?: string; reply?: string };
    const feedbackId = body.feedbackId?.trim();
    const reply = body.reply?.trim() ?? '';

    if (!feedbackId) {
      return NextResponse.json({ success: false, error: 'feedbackId가 필요합니다.' }, { status: 400 });
    }
    if (reply.length < 2) {
      return NextResponse.json({ success: false, error: '답변을 2자 이상 입력해 주세요.' }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const writer = admin ?? supabase;

    const { data, error } = await writer
      .from('feedback_requests')
      .update({
        admin_reply: reply,
        replied_at: new Date().toISOString(),
        replied_by: user.id,
      })
      .eq('id', feedbackId)
      .select('id, admin_reply, replied_at')
      .single();

    if (error) {
      const needsMigration = isFeedbackSchemaError(error.message);
      return NextResponse.json(
        {
          success: false,
          error: needsMigration
            ? 'DB에 답변 컬럼이 없습니다. Supabase SQL Editor에서 마이그레이션을 실행해 주세요.'
            : error.message,
          needsMigration,
        },
        { status: needsMigration ? 503 : 500 }
      );
    }

    return NextResponse.json({ success: true, feedback: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : '답변 저장 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
