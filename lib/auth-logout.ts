import { supabase } from '@/lib/supabase';

/** 로그아웃 후 홈으로 이동 */
export async function signOutAndGoHome() {
  await supabase.auth.signOut();
  window.location.href = '/';
}
