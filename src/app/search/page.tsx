import Link from 'next/link';
import { getKnowledgeDataSync } from '@/lib/data';
import { DOMAIN_COLORS, DOMAIN_LABELS, type Domain } from '@/lib/types';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const data = getKnowledgeDataSync();

  // Combine all searchable items
  const allItems = [
    ...data.skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      domain: s.domain,
      type: 'skill' as const,
    })),
    ...data.agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      domain: a.domain,
      type: 'agent' as const,
    })),
    ...data.reports.map((r) => ({
      id: r.id,
      name: r.title,
      description: r.type,
      domain: r.domain,
      type: 'report' as const,
    })),
  ];

  const query = q?.trim().toLowerCase() ?? '';
  const results = query
    ? allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      )
    : allItems;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-wide gold-shimmer mb-6">
        Search
      </h1>

      {/* Search Form */}
      <form action="/search" method="GET" className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search skills, agents, reports..."
            className="flex-1 glass-panel px-4 py-3 text-sm text-text placeholder:text-muted bg-transparent outline-none focus:border-gold/40"
          />
          <button
            type="submit"
            className="px-6 py-3 text-sm font-medium bg-gold/10 text-gold border border-gold/30 rounded-xl hover:bg-gold/20 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      <p className="text-sm text-muted mb-6">
        {results.length} result{results.length !== 1 ? 's' : ''}
        {query && (
          <span>
            {' '}for &ldquo;<span className="text-gold">{q}</span>&rdquo;
          </span>
        )}
      </p>

      <div className="space-y-2">
        {results.map((item) => {
          const color = DOMAIN_COLORS[item.domain as Domain];
          const domainLabel = DOMAIN_LABELS[item.domain as Domain];
          return (
            <Link
              key={item.id}
              href={`/article/${item.id}`}
              className="glass-panel p-4 flex items-center gap-4 transition-all duration-200 hover:border-gold/30 block"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                title={domainLabel}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-text truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted uppercase tracking-wider shrink-0">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-muted truncate">
                  {item.description.length > 150
                    ? item.description.slice(0, 150) + '...'
                    : item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {results.length === 0 && query && (
        <div className="text-center py-16">
          <p className="text-muted mb-4">No results found.</p>
          <Link href="/explore" className="text-gold hover:underline text-sm">
            Browse all domains
          </Link>
        </div>
      )}
    </div>
  );
}
