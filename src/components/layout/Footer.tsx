import { existsSync } from 'fs';
import { join } from 'path';

function loadMeta() {
  const filePath = join(process.cwd(), 'public', 'data', 'knowledge.json');
  if (!existsSync(filePath)) return null;
  try {
    const { readFileSync } = require('fs');
    const raw = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return data.meta as { totalSkills: number; totalAgents: number; totalReports: number };
  } catch {
    return null;
  }
}

export function Footer() {
  const meta = loadMeta();

  return (
    <footer className="border-t border-glass-border py-8 text-center">
      <p className="text-sm font-medium tracking-widest text-gold">
        NURAL CORTEX &mdash; Personal Knowledge Brain
      </p>
      {meta ? (
        <p className="mt-2 text-xs text-muted">
          {meta.totalSkills} Skills &middot; {meta.totalAgents} Agents &middot; {meta.totalReports} Reports
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted">Run npm run extract to populate the knowledge base</p>
      )}
    </footer>
  );
}
