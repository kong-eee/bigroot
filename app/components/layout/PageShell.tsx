import SiteFooter from './SiteFooter';

type PageShellProps = {
  children: React.ReactNode;
  wide?: boolean;
  withFooter?: boolean;
  className?: string;
};

export default function PageShell({
  children,
  wide = false,
  withFooter = false,
  className = '',
}: PageShellProps) {
  return (
    <div className={`page-main ${className}`}>
      <div
        className={`page-container pb-12 sm:pb-16 ${wide ? 'page-container-wide' : ''}`}
      >
        {children}
      </div>
      {withFooter && <SiteFooter />}
    </div>
  );
}
