import Link from 'next/link';
import ClassicBrandLogo from '../ClassicBrandLogo';

const LINKS = {
  service: [
    { href: '/community', label: '커뮤니티' },
    { href: '/feedback', label: '문의·요청' },
    { href: '/contract', label: '계약전 체크' },
  ],
  tools: [
    { href: '/safety-check', label: '안전진단' },
    { href: '/lease-timeline', label: '타임라인' },
  ],
};

export default function SiteFooter() {
  return (
    <footer className="mt-4 border-t border-[var(--border)] bg-[var(--text-primary)] text-white">
      <div className="page-container page-container-wide py-12 sm:py-14 flex flex-col lg:flex-row justify-between gap-10">
        <div className="space-y-4 max-w-sm">
          <ClassicBrandLogo size="md" href={null} onDark />
          <p className="text-sm font-medium text-white/65 leading-relaxed">
            세입자의 보증금과 권리를 데이터·법률·커뮤니티로 연결합니다. 뿌리처럼 단단한 권리,
            길처럼 이어지는 정보.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand)]">
            Tenant-first platform
          </p>
        </div>

        <div className="flex flex-wrap gap-12 sm:gap-16 text-sm font-bold">
          <div className="space-y-3">
            <p className="text-white/40 text-xs uppercase tracking-wider">서비스</p>
            {LINKS.service.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-white/75 hover:text-[var(--brand)] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-white/40 text-xs uppercase tracking-wider">도구</p>
            {LINKS.tools.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-white/75 hover:text-[var(--brand)] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <p className="page-container page-container-wide py-6 border-t border-white/10 text-center text-xs font-medium text-white/40">
        © 2026 빅루트 BIGROOT
      </p>
    </footer>
  );
}
