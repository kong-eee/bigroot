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
      
    </div>
  );
}
