import Link from 'next/link';
import BrandTagline from './BrandTagline';

export default function SiteFooter() {
  return (
    <footer className="mt-12 py-10 px-4 bg-[var(--text-primary)] text-[var(--bg-muted)]">
      <div className="page-container page-container-wide flex flex-col sm:flex-row justify-between gap-8">
        <div className="space-y-3">
          <p className="text-xl font-black text-white">
            BIG<span className="text-[var(--brand-soft)]">ROOT</span>
          </p>
          <div className="text-white/90 [&_p]:text-white/80 [&_span]:text-[var(--brand-soft)]">
            <BrandTagline compact showWordplay={false} />
          </div>
          <p className="text-sm font-medium max-w-sm text-white/70">
            뿌리처럼 단단한 권리, 길처럼 이어지는 정보. 세입자의 보증금과 계약을 함께
            지킵니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-8 text-sm font-bold">
          <div className="space-y-2">
            <p className="text-white">서비스</p>
            <Link href="/community" className="block hover:text-white">
              커뮤니티
            </Link>
            <Link href="/feedback" className="block hover:text-white">
              문의·요청
            </Link>
          </div>
          <div className="space-y-2">
            <p className="text-white">도구</p>
            <Link href="/safety-check" className="block hover:text-white">
              안전진단
            </Link>
            <Link href="/legal-ai" className="block hover:text-white">
              근방 AI
            </Link>
          </div>
        </div>
      </div>
      <p className="page-container page-container-wide mt-8 pt-6 border-t border-white/10 text-center text-xs font-medium">
        © 2026 빅루트
      </p>
    </footer>
  );
}
