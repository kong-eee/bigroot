import Image from 'next/image';
import Link from 'next/link';

const SIZES = { sm: 48, md: 56, lg: 64 } as const;

type ClassicBrandLogoProps = {
  size?: keyof typeof SIZES;
  href?: string | null;
  /** 푸터 등 어두운 배경 */
  onDark?: boolean;
  className?: string;
};

export default function ClassicBrandLogo({
  size = 'sm',
  href = '/',
  onDark = false,
  className = '',
}: ClassicBrandLogoProps) {
  const px = SIZES[size];

  const wordmark = (
    <span
      className={`text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap ${
        onDark ? 'text-white' : 'text-[var(--text-primary)]'
      }`}
    >
      BIG<span className="text-[var(--brand)]">ROOT</span>
    </span>
  );

  const content = (
    <>
      <Image
        src="/brand-logo-classic.png"
        alt="빅루트"
        width={px}
        height={px}
        className="shrink-0 rounded-full"
        priority={size !== 'sm'}
      />
      {wordmark}
    </>
  );

  const wrapClass = `flex items-center gap-1 shrink-0 min-w-0 ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={wrapClass}>
        {content}
      </Link>
    );
  }

  return <div className={wrapClass}>{content}</div>;
}
