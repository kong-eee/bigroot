import Image from 'next/image';
import Link from 'next/link';

const SIZES = { sm: 32, md: 40, lg: 52, xl: 72 } as const;

type BrandLogoProps = {
  size?: keyof typeof SIZES;
  showWordmark?: boolean;
  href?: string | null;
  className?: string;
};

export default function BrandLogo({
  size = 'md',
  showWordmark = true,
  href = '/',
  className = '',
}: BrandLogoProps) {
  const px = SIZES[size];

  const content = (
    <>
      <Image
        src="/brand-logo.png"
        alt="빅루트"
        width={px}
        height={px}
        className="shrink-0 rounded-lg"
        priority={size === 'lg' || size === 'xl'}
      />
      {showWordmark && (
        <span className="hidden sm:inline text-lg font-black tracking-tight text-[var(--text-primary)] whitespace-nowrap">
          BIG<span className="text-[var(--brand)]">ROOT</span>
        </span>
      )}
    </>
  );

  const wrapClass = `flex items-center gap-2.5 shrink-0 min-w-0 ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={wrapClass}>
        {content}
      </Link>
    );
  }

  return <div className={wrapClass}>{content}</div>;
}
