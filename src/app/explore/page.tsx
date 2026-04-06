import Link from 'next/link';
import { existsSync } from 'fs';
import { join } from 'path';
import { getKnowledgeDataSync } from '@/lib/data';
import { DOMAIN_COLORS, DOMAIN_LABELS, type Domain } from '@/lib/types';

function hasData(): boolean {
  return existsSync(join(process.cwd(), 'public', 'data', 'knowledge.json'));
}

export default function ExplorePage() {
  if (!hasData()) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-wide gold-shimmer mb-4">Explore Knowledge Domains</h1>
        <p className="text-muted">
          Run <code className="text-gold bg-surface px-1.5 py-0.5 rounded text-sm">npm run extract</code> to generate the knowledge base.
        </p>
      </div>
    );
  }

  const data = getKnowledgeDataSync();
  const domains = (Object.keys(DOMAIN_LABELS) as Domain[]).map((domain) => {
    const skillCount = data.skills.filter((s) => s.domain === domain).length;
    const reportCount = data.reports.filter((r) => r.domain === domain).length;
    const agentCount = data.agents.filter((a) => a.domain === domain).length;
    return { domain, skillCount, reportCount, agentCount };
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-wide gold-shimmer mb-2">Explore Knowledge Domains</h1>
      <p className="text-muted mb-10">{data.meta.totalSkills} skills across {domains.length} domains</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map(({ domain, skillCount, reportCount, agentCount }) => (
          <Link
            key={domain}
            href={`/explore/${domain}`}
            className="glass-panel p-6 transition-all duration-300 hover:scale-[1.02] hover:border-gold/30"
            style={{ borderLeftWidth: 4, borderLeftColor: DOMAIN_COLORS[domain] }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: DOMAIN_COLORS[domain] }} />
              <h2 className="text-lg font-semibold text-text">{DOMAIN_LABELS[domain]}</h2>
            </div>
            <div className="flex gap-4 text-sm text-muted">
              <span>{skillCount} skills</span>
              <span>{reportCount} reports</span>
              {agentCount > 0 && <span>{agentCount} agents</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
