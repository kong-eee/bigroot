import BrandTagline from './BrandTagline';

type PageHeroProps = {
  badge?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  showBrand?: boolean;
  children?: React.ReactNode;
};

export default function PageHero({
  badge,
  title,
  description,
  showBrand = true,
  children,
}: PageHeroProps) {
  return (
    <header className="text-center space-y-4 pb-8 sm:pb-10">
      {showBrand && (
        <div className="flex justify-center">
          <BrandTagline compact />
        </div>
      )}
      {badge && (
        <span className="inline-block rounded-full border border-[var(--border)] bg-[var(--brand-soft)] px-4 py-1.5 text-xs font-bold text-[var(--brand)]">
          {badge}
        </span>
      )}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-[var(--text-primary)]">
        {title}
      </h1>
      {description && (
        <p className="text-sm sm:text-base font-medium text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
