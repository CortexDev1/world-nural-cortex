import { existsSync } from 'fs';
import { join } from 'path';
import { getKnowledgeDataSync } from '@/lib/data';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { DomainNav } from '@/components/layout/DomainNav';
import { SearchBar } from '@/components/search/SearchBar';
import type { Domain, KnowledgeData } from '@/lib/types';
import { DOMAIN_LABELS } from '@/lib/types';

function loadData(): KnowledgeData | null {
  const filePath = join(process.cwd(), 'public', 'data', 'knowledge.json');
  if (!existsSync(filePath)) return null;
  try {
    return getKnowledgeDataSync();
  } catch {
    return null;
  }
}

function computeDomainCounts(data: KnowledgeData): Record<Domain, number> {
  const counts: Record<Domain, number> = {
    ai: 0,
    fashion: 0,
    academic: 0,
    business: 0,
    career: 0,
    engineering: 0,
    meta: 0,
  };

  for (const skill of data.skills) {
    if (skill.domain in counts) counts[skill.domain]++;
  }
  for (const agent of data.agents) {
    if (agent.domain in counts) counts[agent.domain]++;
  }
  for (const report of data.reports) {
    if (report.domain in counts) counts[report.domain]++;
  }
  for (const note of (data.notes ?? [])) {
    if (note.domain in counts) counts[note.domain]++;
  }
  for (const lecture of (data.lectures ?? [])) {
    if (lecture.domain in counts) counts[lecture.domain]++;
  }
  return counts;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function HomePage() {
  const data = loadData();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <h1 className="text-5xl md:text-7xl font-bold gold-shimmer tracking-tight">
          NURAL CORTEX
        </h1>
        <p className="text-muted text-center max-w-md">
          Knowledge graph data has not been extracted yet. Run{' '}
          <code className="text-gold/80 bg-surface px-1.5 py-0.5 rounded text-sm">
            npm run extract
          </code>{' '}
          to generate the knowledge base.
        </p>
      </div>
    );
  }

  const domainCounts = computeDomainCounts(data);
  const totalDomains = (Object.keys(DOMAIN_LABELS) as Domain[]).filter(
    (d) => domainCounts[d] > 0,
  ).length;

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* ── Hero Section ─────────────────────────────── */}
      <section className="flex flex-col items-center pt-16 md:pt-24 px-4 gap-6">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold gold-shimmer tracking-tight text-center">
          NURAL CORTEX
        </h1>
        <p className="text-muted text-center text-base md:text-lg max-w-xl">
          Personal Knowledge Brain &mdash;{' '}
          <span className="text-text">{data.meta.totalSkills} Skills</span> &middot;{' '}
          <span className="text-text">{data.meta.totalAgents} Agents</span> &middot;{' '}
          <span className="text-text">{data.meta.totalNotes ?? 0} Notes</span> &middot;{' '}
          <span className="text-text">{data.meta.totalReports} Reports</span>
        </p>

        {/* Search */}
        <div className="w-full mt-2">
          <SearchBar totalNodes={data.meta.totalNodes ?? data.graph.nodes.length} />
        </div>
      </section>

      {/* ── Knowledge Graph ──────────────────────────── */}
      <section className="px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold inline-block" />
            Knowledge Graph
          </h2>
          <KnowledgeGraph
            nodes={data.graph.nodes}
            edges={data.graph.edges}
            height={650}
          />
        </div>
      </section>

      {/* ── Domain Navigation ────────────────────────── */}
      <section className="px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-text mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold inline-block" />
            Explore by Domain
          </h2>
          <DomainNav counts={domainCounts} />
        </div>
      </section>

      {/* ── Stats Section ────────────────────────────── */}
      <section className="px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="glass-panel p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold inline-block" />
              System Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard
                label="Total Nodes"
                value={data.meta.totalNodes ?? data.graph.nodes.length}
              />
              <StatCard
                label="Total Edges"
                value={data.meta.totalEdges ?? data.graph.edges.length}
              />
              <StatCard label="Domains" value={totalDomains} />
              <StatCard
                label="Last Extracted"
                value={formatDate(data.meta.extractedAt)}
                isText
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  isText = false,
}: {
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-muted">{label}</span>
      <span className={isText ? 'text-sm text-gold' : 'text-2xl font-bold text-gold'}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
