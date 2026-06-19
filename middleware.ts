import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSiteOrigin } from '@/lib/site-url';

export function middleware(request: NextRequest) {
  const canonical = getSiteOrigin();
  if (!canonical) return NextResponse.next();

  let canonicalHost: string;
  try {
    canonicalHost = new URL(canonical).host;
  } catch {
    return NextResponse.next();
  }

  const host = request.headers.get('host') ?? '';
  if (host === canonicalHost) return NextResponse.next();

  // Vercel 기본 도메인 → 운영 도메인으로 통일 (OAuth·쿠키·주소창 일치)
  if (host.endsWith('.vercel.app')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = canonicalHost;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)'],
};
