'use client';

import type { GraphNode, GraphEdge } from '@/lib/types';
import { ObsidianLayout } from './ObsidianLayout';

interface ObsidianGraphPageProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function ObsidianGraphPage({ nodes, edges }: ObsidianGraphPageProps) {
  return <ObsidianLayout nodes={nodes} edges={edges} />;
}
