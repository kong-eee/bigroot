type PageHeroProps = {
  badge?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
};

export default function PageHero({
  badge,
  title,
  description,
  children,
}: PageHeroProps) {
  return (
    <header className="relative text-center space-y-5 pb-8 sm:pb-10">
      {badge && (
        <span className="ui-badge ui-badge-brand">{badge}</span>
      )}
      <h1 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-black leading-tight tracking-tight text-[var(--text-primary)]">
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
