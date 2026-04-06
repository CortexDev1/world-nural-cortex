import Link from 'next/link';
import { getKnowledgeDataSync } from '@/lib/data';
import { DOMAIN_COLORS, DOMAIN_LABELS, type Domain } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const data = getKnowledgeDataSync();

  // Search across all item types
  const skill = data.skills.find((s) => s.id === slug);
  const agent = data.agents.find((a) => a.id === slug);
  const report = data.reports.find((r) => r.id === slug);

  const item = skill ?? agent ?? report;

  if (!item) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <h1 className="text-3xl font-bold text-text mb-4">Not Found</h1>
        <p className="text-muted mb-6">
          No item found with id &ldquo;{slug}&rdquo;.
        </p>
        <Link href="/explore" className="text-gold hover:underline">
          Explore all domains
        </Link>
      </div>
    );
  }

  const domain = item.domain as Domain;
  const color = DOMAIN_COLORS[domain];
  const label = DOMAIN_LABELS[domain];
  const title = 'title' in item ? item.title : item.name;
  const description = 'description' in item ? item.description : '';
  const itemType = skill ? 'skill' : agent ? 'agent' : 'report';

  // Find connections from graph edges
  const edges = data.graph.edges.filter(
    (e) => e.source === slug || e.target === slug
  );
  const connectedIds = edges.map((e) =>
    e.source === slug ? e.target : e.source
  );
  const connectedNodes = data.graph.nodes.filter((n) =>
    connectedIds.includes(n.id)
  );

  // Find related items in same domain (excluding self)
  const allItems = [
    ...data.skills.map((s) => ({ ...s, type: 'skill' as const, title: s.name })),
    ...data.agents.map((a) => ({ ...a, type: 'agent' as const, title: a.name })),
    ...data.reports.map((r) => ({ ...r, type: 'report' as const })),
  ];
  const related = allItems
    .filter((i) => i.domain === domain && i.id !== slug)
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/explore" className="text-sm text-muted hover:text-gold mb-6 inline-block">
        &larr; Back to Explore
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {label}
          </span>
          <span className="text-xs text-muted uppercase tracking-wider">
            {itemType}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-text mb-4">{title}</h1>
        {description && (
          <p className="text-muted leading-relaxed max-w-3xl">{description}</p>
        )}
        {'date' in item && item.date && (
          <p className="text-sm text-muted mt-3 font-mono">{item.date}</p>
        )}
      </div>

      {/* Stats */}
      <div className="glass-panel p-6 mb-10 flex gap-8">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Domain</p>
          <p className="text-sm font-medium" style={{ color }}>{label}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Type</p>
          <p className="text-sm font-medium text-text capitalize">{itemType}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Connections</p>
          <p className="text-sm font-medium text-text">{edges.length}</p>
        </div>
      </div>

      {/* Connections */}
      {connectedNodes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-text mb-4">Connections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {connectedNodes.slice(0, 12).map((node) => {
              const nodeColor = DOMAIN_COLORS[node.domain];
              return (
                <Link
                  key={node.id}
                  href={`/article/${node.id}`}
                  className="glass-panel p-4 flex items-center gap-3 transition-all duration-200 hover:border-gold/30"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: nodeColor }}
                  />
                  <span className="text-sm text-text truncate">{node.label}</span>
                  <span className="text-xs text-muted ml-auto capitalize">{node.type}</span>
                </Link>
              );
            })}
          </div>
          {connectedNodes.length > 12 && (
            <p className="text-sm text-muted mt-3">
              + {connectedNodes.length - 12} more connections
            </p>
          )}
        </section>
      )}

      {/* Related Items */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-text mb-4">
            Related in {label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((rel) => (
              <Link
                key={rel.id}
                href={`/article/${rel.id}`}
                className="glass-panel p-4 flex items-center gap-3 transition-all duration-200 hover:border-gold/30"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-text truncate">{rel.title}</span>
                <span className="text-xs text-muted ml-auto capitalize">{rel.type}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
