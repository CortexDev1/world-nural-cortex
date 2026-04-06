import type { GraphData } from './types';

export async function fetchGraphData(): Promise<GraphData> {
  const res = await fetch('/data/knowledge.json', { cache: 'no-store' });
  if (!res.ok) {
    return { nodes: [], edges: [] };
  }
  const data = await res.json();
  return {
    nodes: data.graph?.nodes ?? [],
    edges: data.graph?.edges ?? [],
  };
}
