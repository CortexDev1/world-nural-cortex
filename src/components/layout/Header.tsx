'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_LINKS = [
  { href: '/', label: 'Explore' },
  { href: '/graph', label: 'Graph' },
  { href: '/search', label: 'Search' },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-glass-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-widest gold-shimmer">
          NURAL CORTEX
        </Link>

        <nav className="flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'text-sm font-medium tracking-wide transition-colors duration-200',
                pathname === href
                  ? 'text-gold'
                  : 'text-muted hover:text-gold'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
