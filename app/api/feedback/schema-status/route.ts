import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = createAdminSupabase();
  if (!admin) {
    return NextResponse.json({ ready: false, reason: 'service_role_missing' });
  }

  const { error } = await admin.from('feedback_requests').select('admin_reply').limit(1);
  if (error && /admin_reply|42703/i.test(error.message)) {
    return NextResponse.json({ ready: false, reason: 'migration_required' });
  }

  return NextResponse.json({ ready: !error, reason: error?.message ?? null });
}
