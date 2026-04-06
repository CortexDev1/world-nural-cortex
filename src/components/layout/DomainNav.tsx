import Link from 'next/link';
import type { Domain } from '@/lib/types';
import { DOMAIN_COLORS, DOMAIN_LABELS } from '@/lib/types';

const DOMAIN_ICONS: Record<Domain, string> = {
  ai: '\u{1F9E0}',
  fashion: '\u{1F451}',
  academic: '\u{1F393}',
  business: '\u{1F4C8}',
  career: '\u{1F680}',
  engineering: '\u{2699}\u{FE0F}',
  meta: '\u{1F300}',
};

interface DomainNavProps {
  counts: Record<Domain, number>;
}

export function DomainNav({ counts }: DomainNavProps) {
  const domains = Object.keys(DOMAIN_LABELS) as Domain[];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {domains.map((domain) => (
        <Link
          key={domain}
          href={`/explore/${domain}`}
          className="glass-panel group flex flex-col items-center justify-center gap-2 p-5 transition-all duration-300 hover:border-[rgba(201,168,76,0.5)] hover:scale-[1.02]"
          style={{
            borderColor: 'rgba(201,168,76,0.15)',
          }}
        >
          <span className="text-3xl" role="img" aria-label={DOMAIN_LABELS[domain]}>
            {DOMAIN_ICONS[domain]}
          </span>
          <span
            className="text-sm font-semibold tracking-wide transition-colors duration-300"
            style={{ color: DOMAIN_COLORS[domain] }}
          >
            {DOMAIN_LABELS[domain]}
          </span>
          <span className="text-xs text-muted">
            {counts[domain] ?? 0} item{(counts[domain] ?? 0) !== 1 ? 's' : ''}
          </span>
        </Link>
      ))}
    </div>
  );
}
