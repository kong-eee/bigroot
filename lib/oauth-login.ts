import { supabase } from '@/lib/supabase';

export type OAuthProvider = 'google' | 'kakao';

export async function signInWithOAuth(provider: OAuthProvider) {
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) throw error;
}
