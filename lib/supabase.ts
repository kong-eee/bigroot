import { createBrowserClient } from '@supabase/ssr';

// 최신 라이브러리인 @supabase/ssr 방식을 사용합니다.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);