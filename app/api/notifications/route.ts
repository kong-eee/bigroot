import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string;
  post_id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  posts?: { title: string } | null;
};

async function enrichWithActorNicknames(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  rows: NotificationRow[]
) {
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
  if (!actorIds.length) {
    return rows.map((n) => ({ ...n, actor: { nickname: '세입자' } }));
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname')
    .in('id', actorIds);

  const nicknameById = new Map(
    (profiles ?? []).map((p: { id: string; nickname: string }) => [p.id, p.nickname])
  );

  return rows.map((n) => ({
    ...n,
    actor: { nickname: nicknameById.get(n.actor_id) || '세입자' },
  }));
}

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, actor_id, post_id, type, is_read, created_at, posts(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, notifications: [], unreadCount: 0 },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as unknown as NotificationRow[];
    const notifications = await enrichWithActorNicknames(supabase, rows);
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알림 조회 실패';
    return NextResponse.json(
      { success: false, error: message, notifications: [], unreadCount: 0 },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      target_user_id?: string;
      post_id?: string;
      type?: 'comment' | 'like';
    };

    const { target_user_id, post_id, type } = body;
    if (!target_user_id || !post_id || !type) {
      return NextResponse.json(
        { success: false, error: 'target_user_id, post_id, type이 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    if (user.id === target_user_id) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const payload = {
      user_id: target_user_id,
      actor_id: user.id,
      post_id,
      type,
      is_read: false,
    };

    const admin = createAdminSupabase();
    const writer = admin ?? supabase;
    const { error } = await writer.from('notifications').insert(payload);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알림 저장 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '읽음 처리 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
