import Link from 'next/link';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface ArmyState {
  status: string;
  agents: Array<{
    id: string;
    tier: string;
    state: string;
    lastActive?: string;
    metrics?: Record<string, number>;
  }>;
  metrics?: {
    tasksCompleted?: number;
    tasksQueued?: number;
    uptime?: string;
  };
}

function loadArmyState(): ArmyState | null {
  const paths = [
    join(process.cwd(), '..', 'tc-nural-cortex', 'state.json'),
    join(process.cwd(), 'tc-nural-cortex', 'state.json'),
  ];

  for (const filePath of paths) {
    if (existsSync(filePath)) {
      try {
        const raw = readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
}

const TIER_COLORS: Record<string, string> = {
  commander: '#C9A84C',
  lieutenant: '#4A9EFF',
  specialist: '#4ADE80',
  scout: '#F97316',
};

export default function ArmyPage() {
  const armyState = loadArmyState();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        href="/admin"
        className="text-sm text-muted hover:text-gold mb-6 inline-block"
      >
        &larr; Back to Admin
      </Link>

      <h1 className="text-3xl font-bold tracking-wide gold-shimmer mb-2">
        Army Status
      </h1>
      <p className="text-muted text-sm mb-10">
        TC-NURAL-CORTEX Agent Orchestration
      </p>

      {!armyState ? (
        <div className="glass-panel p-10 text-center">
          <div className="text-4xl mb-4 opacity-40">&#x2699;</div>
          <h2 className="text-xl font-semibold text-text mb-3">
            Army Not Yet Initialized
          </h2>
          <p className="text-muted text-sm max-w-md mx-auto mb-6">
            The TC-NURAL-CORTEX state file was not found. The agent army needs to
            be initialized before status can be displayed.
          </p>
          <div className="glass-panel p-4 text-left max-w-lg mx-auto">
            <p className="text-xs text-muted uppercase tracking-wider mb-2">
              To initialize:
            </p>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>Create <code className="text-gold">tc-nural-cortex/state.json</code></li>
              <li>Define agent tiers and assignments</li>
              <li>Run the orchestration bootstrap script</li>
            </ol>
          </div>
        </div>
      ) : (
        <>
          {/* Army Metrics */}
          {armyState.metrics && (
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="glass-panel p-6 text-center">
                <p className="text-2xl font-bold text-gold">
                  {armyState.metrics.tasksCompleted ?? 0}
                </p>
                <p className="text-xs text-muted uppercase tracking-wider mt-1">
                  Tasks Completed
                </p>
              </div>
              <div className="glass-panel p-6 text-center">
                <p className="text-2xl font-bold text-domain-ai">
                  {armyState.metrics.tasksQueued ?? 0}
                </p>
                <p className="text-xs text-muted uppercase tracking-wider mt-1">
                  Tasks Queued
                </p>
              </div>
              <div className="glass-panel p-6 text-center">
                <p className="text-2xl font-bold text-domain-academic">
                  {armyState.metrics.uptime ?? 'N/A'}
                </p>
                <p className="text-xs text-muted uppercase tracking-wider mt-1">
                  Uptime
                </p>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="glass-panel p-4 mb-8 flex items-center gap-3">
            <span className="inline-block h-3 w-3 rounded-full bg-domain-academic pulse-glow" />
            <span className="text-sm font-medium text-text">
              Army Status: <span className="text-gold capitalize">{armyState.status}</span>
            </span>
          </div>

          {/* Agent Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {armyState.agents.map((agent) => {
              const tierColor = TIER_COLORS[agent.tier] ?? '#8a7e6d';
              const isActive = agent.state === 'active' || agent.state === 'running';
              return (
                <div
                  key={agent.id}
                  className="glass-panel p-5"
                  style={{ borderLeftWidth: 3, borderLeftColor: tierColor }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-text">{agent.id}</h3>
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        isActive ? 'bg-domain-academic pulse-glow' : 'bg-muted'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
                    >
                      {agent.tier}
                    </span>
                    <span className="capitalize">{agent.state}</span>
                  </div>
                  {agent.lastActive && (
                    <p className="text-xs text-muted mt-2 font-mono">
                      Last: {agent.lastActive}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
