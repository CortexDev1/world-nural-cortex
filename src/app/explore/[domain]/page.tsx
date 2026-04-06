import Link from 'next/link';
import { getKnowledgeDataSync } from '@/lib/data';
import { DOMAIN_COLORS, DOMAIN_LABELS, type Domain } from '@/lib/types';

interface PageProps {
  params: Promise<{ domain: string }>;
}

export default async function DomainPage({ params }: PageProps) {
  const { domain: domainSlug } = await params;
  const data = getKnowledgeDataSync();

  const validDomains = Object.keys(DOMAIN_LABELS);
  if (!validDomains.includes(domainSlug)) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <h1 className="text-3xl font-bold text-text mb-4">Domain Not Found</h1>
        <p className="text-muted mb-6">
          The domain &ldquo;{domainSlug}&rdquo; does not exist.
        </p>
        <Link href="/explore" className="text-gold hover:underline">
          Back to Explore
        </Link>
      </div>
    );
  }

  const domain = domainSlug as Domain;
  const color = DOMAIN_COLORS[domain];
  const label = DOMAIN_LABELS[domain];

  const skills = data.skills.filter((s) => s.domain === domain);
  const reports = data.reports.filter((r) => r.domain === domain);
  const agents = data.agents.filter((a) => a.domain === domain);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/explore" className="text-sm text-muted hover:text-gold mb-6 inline-block">
        &larr; Back to Explore
      </Link>

      <div className="flex items-center gap-4 mb-10">
        <span
          className="inline-block h-4 w-4 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h1 className="text-3xl font-bold text-text">{label}</h1>
        <span className="text-sm text-muted">
          {skills.length + reports.length + agents.length} items
        </span>
      </div>

      {/* Skills Section */}
      {skills.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-text mb-6 flex items-center gap-2">
            <span style={{ color }}>Skills</span>
            <span className="text-sm text-muted font-normal">({skills.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <Link
                key={skill.id}
                href={`/article/${skill.id}`}
                className="glass-panel p-5 transition-all duration-200 hover:border-gold/30"
              >
                <h3 className="text-sm font-semibold text-text mb-2 truncate">
                  {skill.name}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {skill.description.length > 120
                    ? skill.description.slice(0, 120) + '...'
                    : skill.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reports Section */}
      {reports.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-text mb-6 flex items-center gap-2">
            <span style={{ color }}>Reports</span>
            <span className="text-sm text-muted font-normal">({reports.length})</span>
          </h2>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="glass-panel p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted font-mono">{report.date}</span>
                  <span className="text-sm text-text">{report.title}</span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {report.type}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Agents Section */}
      {agents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-text mb-6 flex items-center gap-2">
            <span style={{ color }}>Agents</span>
            <span className="text-sm text-muted font-normal">({agents.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/article/${agent.id}`}
                className="glass-panel p-5 transition-all duration-200 hover:border-gold/30"
              >
                <h3 className="text-sm font-semibold text-text mb-2">{agent.name}</h3>
                <p className="text-xs text-muted leading-relaxed">
                  {agent.description.length > 120
                    ? agent.description.slice(0, 120) + '...'
                    : agent.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
