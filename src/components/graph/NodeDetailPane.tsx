'use client';

import { useMemo } from 'react';
import type { GraphNode, GraphEdge, Domain } from '@/lib/types';
import { DOMAIN_COLORS, DOMAIN_LABELS } from '@/lib/types';

interface NodeDetailPaneProps {
  node: GraphNode;
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
}

export function NodeDetailPane({ node, allNodes, allEdges, onClose, onNavigate }: NodeDetailPaneProps) {
  // Find connected edges
  const connectedEdges = useMemo(() =>
    allEdges.filter(e => e.source === node.id || e.target === node.id),
    [allEdges, node.id]
  );

  // Find connected nodes
  const connectedNodes = useMemo(() => {
    const connectedIds = connectedEdges.map(e =>
      e.source === node.id ? e.target : e.source
    );
    const uniqueIds = [...new Set(connectedIds)];
    return uniqueIds
      .map(id => allNodes.find(n => n.id === id))
      .filter((n): n is GraphNode => n != null)
      .sort((a, b) => b.connections - a.connections);
  }, [connectedEdges, node.id, allNodes]);

  // Count relationship types
  const relationshipCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const edge of connectedEdges) {
      const reason = edge.reason.replace(/:.+/, ''); // normalize "same-domain:ai" -> "same-domain"
      counts[reason] = (counts[reason] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [connectedEdges]);

  // Determine cluster count (unique domains among connected nodes)
  const clusterCount = useMemo(() => {
    const domains = new Set(connectedNodes.map(n => n.domain));
    return domains.size;
  }, [connectedNodes]);

  const color = DOMAIN_COLORS[node.domain as Domain];
  const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1);
  const domainLabel = DOMAIN_LABELS[node.domain as Domain];

  return (
    <div className="node-detail-pane">
      {/* Close button */}
      <button className="node-detail-close" onClick={onClose} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>

      {/* Title */}
      <h2 className="node-detail-title" style={{ color }}>{node.label}</h2>

      {/* Badges */}
      <div className="node-detail-badges">
        <span className="node-detail-badge" style={{ borderColor: color, color }}>
          {typeLabel}
        </span>
        <span className="node-detail-badge node-detail-badge-domain" style={{ backgroundColor: `${color}18`, color }}>
          {domainLabel}
        </span>
      </div>

      {/* Stats */}
      <div className="node-detail-stats">
        <div className="node-detail-stat">
          <span className="node-detail-stat-value">{node.connections}</span>
          <span className="node-detail-stat-label">connections</span>
        </div>
        <div className="node-detail-stat">
          <span className="node-detail-stat-value">{clusterCount}</span>
          <span className="node-detail-stat-label">clusters</span>
        </div>
        <div className="node-detail-stat">
          <span className="node-detail-stat-value">{relationshipCounts.length}</span>
          <span className="node-detail-stat-label">link types</span>
        </div>
      </div>

      {/* Connections list */}
      <div className="node-detail-section">
        <div className="node-detail-section-header">
          Connections
          <span className="node-detail-count">{connectedNodes.length}</span>
        </div>
        <div className="node-detail-list">
          {connectedNodes.slice(0, 30).map(cn => (
            <button
              key={cn.id}
              className="node-detail-list-item"
              onClick={() => onNavigate(cn.id)}
            >
              <span className="node-detail-dot" style={{ backgroundColor: DOMAIN_COLORS[cn.domain as Domain] }} />
              <span className="node-detail-list-name">{cn.label}</span>
              <span className="node-detail-list-type">{cn.type}</span>
            </button>
          ))}
          {connectedNodes.length > 30 && (
            <div className="node-detail-more">+{connectedNodes.length - 30} more</div>
          )}
        </div>
      </div>

      {/* Relationship types breakdown */}
      <div className="node-detail-section">
        <div className="node-detail-section-header">
          Relationship Types
        </div>
        <div className="node-detail-relationships">
          {relationshipCounts.map(([reason, count]) => (
            <div key={reason} className="node-detail-rel-row">
              <span className="node-detail-rel-name">{reason.replace(/-/g, ' ')}</span>
              <span className="node-detail-rel-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
