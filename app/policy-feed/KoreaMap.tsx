'use client';

import { KOREA_MAP_PATHS, KOREA_MAP_VIEWBOX } from './korea-map-paths';

type KoreaMapProps = {
  selectedSido: string;
  onSelect: (sidoCode: string) => void;
};

export default function KoreaMap({ selectedSido, onSelect }: KoreaMapProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <svg
        viewBox={KOREA_MAP_VIEWBOX}
        className="w-full h-auto"
        role="img"
        aria-label="대한민국 시·도 지도. 지역을 선택하면 해당 청년 주거 정책을 볼 수 있습니다."
      >
        {KOREA_MAP_PATHS.map((r) => {
          const active = selectedSido === r.sidoCode;
          return (
            <g key={r.sidoCode}>
              <path
                d={r.path}
                fill={active ? 'var(--brand-soft, rgba(4, 214, 32, 0.15))' : 'var(--bg-surface)'}
                stroke={active ? 'var(--brand)' : 'var(--border)'}
                strokeWidth={active ? 2 : 1}
                className="cursor-pointer transition-colors hover:fill-[var(--bg-muted)]"
                onClick={() => onSelect(r.sidoCode)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(r.sidoCode);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${r.label} 선택`}
                aria-pressed={active}
              />
              <text
                x={r.labelX}
                y={r.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none font-bold fill-[var(--text-primary)]"
                style={{ fontSize: active ? 13 : 11 }}
              >
                {r.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
