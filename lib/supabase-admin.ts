import { createClient } from '@supabase/supabase-js';

/** RLS 우회용 (Vercel에 SUPABASE_SERVICE_ROLE_KEY 설정 시 알림 INSERT 보장) */
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
