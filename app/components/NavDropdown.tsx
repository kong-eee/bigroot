'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { NavLink } from '@/lib/nav-links';

const STAGGER_MS = 55;
const ROW_H = 42;
const ANIM_MS = 300;

type NavDropdownProps = {
  label: string;
  links: NavLink[];
  pathname: string;
  variant?: 'classic';
};

export default function NavDropdown({
  label,
  links,
  pathname,
  variant = 'classic',
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const isActive = links.some((l) => pathname === l.href);

  const handleEnter = () => setOpen(true);
  const handleLeave = () => setOpen(false);

  const btnClass = `flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
    isActive
      ? variant === 'classic'
        ? 'text-[var(--brand)]'
        : 'bg-[var(--brand-soft)] text-[var(--brand)]'
      : 'text-[var(--text-secondary)] hover:text-[var(--brand)]'
  }`;

  const panelClass = `absolute left-1/2 -translate-x-1/2 top-full pt-2 z-[120] ${
    open ? 'pointer-events-auto' : 'pointer-events-none'
  }`;

  const boxClass =
    'min-w-[11rem] rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl overflow-hidden py-1';

  const itemClass = (href: string, highlight?: boolean) => {
    const active = pathname === href;
    return `block px-4 py-2.5 text-sm font-bold transition-colors ${
      active
        ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
        : highlight
          ? 'text-[var(--accent)] hover:bg-[var(--bg-muted)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--brand)]'
    }`;
  };

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) handleLeave();
      }}
    >
      <button type="button" className={btnClass} aria-expanded={open} aria-haspopup="true">
        {label}
        <span
          className={`text-[10px] opacity-70 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      <div className={panelClass}>
        <div
          className={boxClass}
          style={{
            opacity: open ? 1 : 0,
            transition: `opacity ${ANIM_MS}ms ease`,
          }}
        >
          {links.map((item, index) => {
            const delay = open
              ? index * STAGGER_MS
              : (links.length - 1 - index) * STAGGER_MS;
            return (
              <div
                key={item.href}
                className="overflow-hidden"
                style={{
                  height: open ? ROW_H : 0,
                  transitionProperty: 'height',
                  transitionDuration: `${ANIM_MS}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  transitionDelay: `${delay}ms`,
                }}
              >
                <Link href={item.href} className={itemClass(item.href, item.highlight)}>
                  {item.label}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
