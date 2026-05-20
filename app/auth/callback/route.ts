import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // ⚠️ Next.js 15/16 버전부터는 cookies()를 가져올 때 반드시 await를 붙여야 에러가 안 납니다!
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // 서버 컴포넌트 환경 등에서 호출될 때의 예외 처리
            }
          },
        },
      }
    );

    // 구글 등 외부에 다녀온 인증 코드를 세션 데이터로 교환 및 저장
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 오류가 발생하면 안전하게 메인 화면으로 리다이렉트 처리
  return NextResponse.redirect(`${origin}`);
}