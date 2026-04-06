'use client';

import { KnowledgeGraph } from './KnowledgeGraph';
import type { GraphNode, GraphEdge } from '@/lib/types';

interface GraphClientWrapperProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function GraphClientWrapper({ nodes, edges }: GraphClientWrapperProps) {
  return (
    <div className="w-full h-full">
      <KnowledgeGraph nodes={nodes} edges={edges} height={800} />
    </div>
  );
}
