import { supabase } from '@/lib/supabase';
import { resetStuckBodyScroll } from '@/lib/reset-stuck-ui';
import { getAuthCallbackUrl } from '@/lib/site-url';

export type OAuthProvider = 'google' | 'kakao';

export async function signInWithOAuth(provider: OAuthProvider) {
  const redirectTo = getAuthCallbackUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('로그인 URL을 받지 못했습니다.');
  resetStuckBodyScroll();
  window.location.assign(data.url);
}
