interface AgentEntry {
  id: string;
  tier: string;
  state: string;
  lastActive?: string;
  metrics?: Record<string, number>;
}

interface ArmyMetrics {
  tasksCompleted?: number;
  tasksQueued?: number;
  uptime?: string;
}

export interface ArmyStatus {
  status: string;
  agents: AgentEntry[];
  metrics?: ArmyMetrics;
}

interface ArmyDashboardProps {
  armyState: ArmyStatus | null;
}

const TIER_COLORS: Record<string, string> = {
  commander:  '#C9A84C',
  lieutenant: '#4A9EFF',
  specialist:  '#4ADE80',
  scout:      '#F97316',
};

export function ArmyDashboard({ armyState }: ArmyDashboardProps) {
  if (!armyState) {
    return (
      <div className="glass-panel p-10 text-center">
        <div className="text-4xl mb-4 opacity-40">&#x2699;</div>
        <h2 className="text-xl font-semibold text-text mb-3">
          Army Not Yet Initialized
        </h2>
        <p className="text-muted text-sm max-w-md mx-auto">
          The TC-NURAL-CORTEX state file was not found. Initialize the agent
          army to view status.
        </p>
      </div>
    );
  }

  const activeCount = armyState.agents.filter(
    (a) => a.state === 'active' || a.state === 'running',
  ).length;

  return (
    <div className="space-y-8">
      {/* System Status Banner */}
      <div className="glass-panel p-4 flex items-center gap-3">
        <span className="inline-block h-3 w-3 rounded-full bg-domain-academic pulse-glow" />
        <span className="text-sm font-medium text-text">
          Army Status:{' '}
          <span className="text-gold capitalize">{armyState.status}</span>
        </span>
        <span className="ml-auto text-xs text-muted">
          {activeCount} / {armyState.agents.length} agents active
        </span>
      </div>

      {/* Metrics */}
      {armyState.metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Tasks Completed"
            value={armyState.metrics.tasksCompleted ?? 0}
            color="#C9A84C"
          />
          <MetricCard
            label="Tasks Queued"
            value={armyState.metrics.tasksQueued ?? 0}
            color="#4A9EFF"
          />
          <MetricCard
            label="Uptime"
            value={armyState.metrics.uptime ?? 'N/A'}
            color="#4ADE80"
            isText
          />
        </div>
      )}

      {/* Agent Cards Grid */}
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
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    isActive ? 'bg-domain-academic pulse-glow' : 'bg-muted'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-muted mb-2">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
                >
                  {agent.tier}
                </span>
                <span className="capitalize">{agent.state}</span>
              </div>

              {agent.lastActive && (
                <p className="text-xs text-muted font-mono">
                  Last: {agent.lastActive}
                </p>
              )}

              {agent.metrics && Object.keys(agent.metrics).length > 0 && (
                <div className="mt-3 pt-3 border-t border-glass-border space-y-1">
                  {Object.entries(agent.metrics).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs text-muted">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gold">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  isText = false,
}: {
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="glass-panel p-6 text-center">
      <p
        className={isText ? 'text-xl font-bold' : 'text-3xl font-bold'}
        style={{ color }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-muted uppercase tracking-wider mt-2">{label}</p>
    </div>
  );
}
