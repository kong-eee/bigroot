'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { getSidoShortLabel } from '@/lib/korea-sido';
import { YOUTH_SIDO_REGIONS } from '@/lib/youth-center/regions';
import { KOREA_MAP_PATHS, KOREA_MAP_VIEWBOX } from './korea-map-paths';

type KoreaMapProps = {
  selectedSido: string;
  onSelect: (sidoCode: string) => void;
};

type LabelPos = { x: number; y: number };

/** getBBox 보정: 작은 광역시·해안 */
const LABEL_NUDGE: Record<string, { dx: number; dy: number }> = {
  '11': { dx: 0, dy: -10 },
  '28': { dx: -14, dy: -2 },
  '30': { dx: 0, dy: -10 },
  '27': { dx: 0, dy: -10 },
  '31': { dx: 10, dy: -2 },
  '26': { dx: 12, dy: -4 },
  '36': { dx: 0, dy: -10 },
  '29': { dx: 0, dy: -10 },
};

function regionName(sidoCode: string): string {
  return YOUTH_SIDO_REGIONS.find((r) => r.sidoCode === sidoCode)?.name ?? sidoCode;
}

function labelBadgeSize(text: string): { w: number; h: number } {
  const len = text.length;
  return { w: len <= 2 ? 30 : 36, h: 18 };
}

function MapLabelBadge({
  x,
  y,
  text,
  emphasized,
}: {
  x: number;
  y: number;
  text: string;
  emphasized: boolean;
}) {
  const { w, h } = labelBadgeSize(text);
  const fontSize = emphasized ? 12 : 11;

  return (
    <g transform={`translate(${x}, ${y})`} pointerEvents="none">
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={4}
        fill="#ffffff"
        stroke="var(--border, #d4d4d4)"
        strokeWidth={emphasized ? 1.5 : 1}
        filter="url(#map-label-shadow)"
      />
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        className="select-none font-black"
        fill="var(--text-primary, #1a1a1a)"
        style={{ fontSize }}
      >
        {text}
      </text>
    </g>
  );
}

export default function KoreaMap({ selectedSido, onSelect }: KoreaMapProps) {
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const [centers, setCenters] = useState<Record<string, LabelPos>>({});
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const measureLabels = useCallback(() => {
    const next: Record<string, LabelPos> = {};
    for (const r of KOREA_MAP_PATHS) {
      const el = pathRefs.current.get(r.sidoCode);
      if (!el) continue;
      try {
        const box = el.getBBox();
        const nudge = LABEL_NUDGE[r.sidoCode] ?? { dx: 0, dy: 0 };
        next[r.sidoCode] = {
          x: box.x + box.width / 2 + nudge.dx,
          y: box.y + box.height / 2 + nudge.dy,
        };
      } catch {
        /* ignore */
      }
    }
    setCenters(next);
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    measureLabels();
  }, [measureLabels]);

  const hintSido = hovered ?? selectedSido;
  const hintShort = hintSido ? getSidoShortLabel(hintSido) : null;

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <div
        className="min-h-[2rem] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-center text-sm font-bold text-[var(--text-primary)]"
        aria-live="polite"
      >
        {hintShort ? (
          <>
            <span className="font-black">{hintShort}</span>
            <span className="text-[var(--text-secondary)] font-medium">
              {' '}
              · {regionName(hintSido)}
            </span>
          </>
        ) : (
          <span className="text-[var(--text-secondary)] font-medium">
            지역을 선택하거나 지도 위에 마우스를 올려 보세요
          </span>
        )}
      </div>

      <svg
        viewBox={KOREA_MAP_VIEWBOX}
        className="w-full h-auto touch-manipulation"
        role="img"
        aria-label="대한민국 시·도 지도. 지역을 선택하면 해당 청년 주거 정책을 볼 수 있습니다."
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <filter id="map-label-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.18" />
          </filter>
        </defs>

        <g className="map-regions">
          {KOREA_MAP_PATHS.map((r) => {
            const active = selectedSido === r.sidoCode;
            const hover = hovered === r.sidoCode;
            const emphasized = active || hover;

            return (
              <path
                key={r.sidoCode}
                ref={(el) => {
                  if (el) pathRefs.current.set(r.sidoCode, el);
                  else pathRefs.current.delete(r.sidoCode);
                }}
                d={r.path}
                fill="var(--bg-surface, #fff)"
                stroke={emphasized ? 'var(--text-primary, #333)' : 'var(--border, #ccc)'}
                strokeWidth={emphasized ? 2 : 1}
                className="cursor-pointer transition-[stroke,stroke-width] duration-150"
                onClick={() => onSelect(r.sidoCode)}
                onMouseEnter={() => setHovered(r.sidoCode)}
                onFocus={() => setHovered(r.sidoCode)}
                onBlur={() => setHovered(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(r.sidoCode);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${regionName(r.sidoCode)} 선택`}
                aria-pressed={active}
              >
                <title>{regionName(r.sidoCode)}</title>
              </path>
            );
          })}
        </g>

        <g className="map-labels" pointerEvents="none">
          {ready &&
            KOREA_MAP_PATHS.map((r) => {
              const center = centers[r.sidoCode];
              if (!center) return null;
              const active = selectedSido === r.sidoCode;
              const hover = hovered === r.sidoCode;
              return (
                <MapLabelBadge
                  key={`label-${r.sidoCode}`}
                  x={center.x}
                  y={center.y}
                  text={getSidoShortLabel(r.sidoCode)}
                  emphasized={active || hover}
                />
              );
            })}
        </g>
      </svg>
    </div>
  );
}
