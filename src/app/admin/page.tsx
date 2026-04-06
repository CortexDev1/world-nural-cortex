import Link from 'next/link';
import { getKnowledgeDataSync } from '@/lib/data';
import { DOMAIN_COLORS, DOMAIN_LABELS, type Domain } from '@/lib/types';

export default function AdminPage() {
  const data = getKnowledgeDataSync();

  const domains = (Object.keys(DOMAIN_LABELS) as Domain[]).map((domain) => ({
    domain,
    label: DOMAIN_LABELS[domain],
    color: DOMAIN_COLORS[domain],
    skills: data.skills.filter((s) => s.domain === domain).length,
    reports: data.reports.filter((r) => r.domain === domain).length,
    agents: data.agents.filter((a) => a.domain === domain).length,
    notes: (data.notes ?? []).filter((n) => n.domain === domain).length,
    lectures: (data.lectures ?? []).filter((l) => l.domain === domain).length,
  }));

  // Sort reports by date descending, take last 10
  const recentReports = [...data.reports]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-wide gold-shimmer">
            Admin Dashboard
          </h1>
          <p className="text-muted text-sm mt-1">NURAL CORTEX System Overview</p>
        </div>
        <Link
          href="/admin/army"
          className="px-4 py-2 text-sm font-medium bg-gold/10 text-gold border border-gold/30 rounded-xl hover:bg-gold/20 transition-colors"
        >
          Army Status
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {[
          { label: 'Skills', value: data.meta.totalSkills, color: '#C9A84C' },
          { label: 'Agents', value: data.meta.totalAgents, color: '#EC4899' },
          { label: 'Notes', value: data.meta.totalNotes ?? 0, color: '#F59E0B' },
          { label: 'Lectures', value: data.meta.totalLectures ?? 0, color: '#10B981' },
          { label: 'Reports', value: data.meta.totalReports, color: '#4ADE80' },
          { label: 'Courses', value: data.meta.totalCourses, color: '#A78BFA' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-6 text-center">
            <p className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-xs text-muted uppercase tracking-wider mt-2">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Domain Breakdown */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text mb-6">Domain Breakdown</h2>
        <div className="glass-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left px-6 py-3 text-xs text-muted uppercase tracking-wider">
                  Domain
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted uppercase tracking-wider">
                  Skills
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted uppercase tracking-wider">
                  Notes
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted uppercase tracking-wider">
                  Lectures
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted uppercase tracking-wider">
                  Reports
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted uppercase tracking-wider">
                  Agents
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.domain} className="border-b border-glass-border/50">
                  <td className="px-6 py-3 flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <Link
                      href={`/explore/${d.domain}`}
                      className="text-text hover:text-gold transition-colors"
                    >
                      {d.label}
                    </Link>
                  </td>
                  <td className="text-right px-6 py-3 text-muted">{d.skills}</td>
                  <td className="text-right px-6 py-3 text-muted">{d.reports}</td>
                  <td className="text-right px-6 py-3 text-muted">{d.agents}</td>
                  <td className="text-right px-6 py-3 text-text font-medium">
                    {d.skills + d.reports + d.agents}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Reports */}
      <section>
        <h2 className="text-xl font-semibold text-text mb-6">Recent Reports</h2>
        <div className="space-y-2">
          {recentReports.map((report) => {
            const color = DOMAIN_COLORS[report.domain];
            return (
              <div
                key={report.id}
                className="glass-panel p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
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
            );
          })}
        </div>
      </section>
    </div>
  );
}
