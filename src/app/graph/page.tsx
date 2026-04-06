import { getKnowledgeDataSync } from '@/lib/data';
import { ObsidianGraphPage } from '@/components/graph/ObsidianGraphPage';

export default function GraphPage() {
  const data = getKnowledgeDataSync();
  return <ObsidianGraphPage nodes={data.graph.nodes} edges={data.graph.edges} />;
}
