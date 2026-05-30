'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { NavLink } from '@/lib/nav-links';

type NavDropdownProps = {
  label: string;
  links: NavLink[];
  pathname: string;
  /** refresh | classic */
  variant?: 'refresh' | 'classic';
};

export default function NavDropdown({
  label,
  links,
  pathname,
  variant = 'refresh',
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = links.some((l) => pathname === l.href);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const btnClass = `flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
    isActive
      ? variant === 'classic'
        ? 'text-[var(--brand)]'
        : 'bg-[var(--brand-soft)] text-[var(--brand)]'
      : 'text-[var(--text-secondary)] hover:text-[var(--brand)]'
  }`;

  const panelClass =
    'absolute left-0 top-full mt-2 min-w-[11rem] rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] py-2 shadow-xl z-[120]';

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
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={btnClass}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <span className="text-[10px] opacity-70" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className={panelClass}>
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={itemClass(item.href, item.highlight)}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
