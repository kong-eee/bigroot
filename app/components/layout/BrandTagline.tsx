type BrandTaglineProps = {
  compact?: boolean;
  showWordplay?: boolean;
};

export default function BrandTagline({
  compact = false,
  showWordplay = true,
}: BrandTaglineProps) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <p
        className={`font-black text-[var(--brand)] leading-snug ${
          compact ? 'text-sm' : 'text-base sm:text-lg'
        }`}
      >
        세입자의 든든한 뿌리, 든든한 길
      </p>
      {showWordplay && (
        <p className="text-xs sm:text-sm font-bold text-[var(--text-muted)] tracking-wide">
          BIG <span className="text-[var(--brand)]">ROOT</span> (뿌리) · BIG{' '}
          <span className="text-[var(--brand)]">ROUTE</span> (길)
        </p>
      )}
    </div>
  );
}
