'use client';

import { useMemo, useState } from 'react';
import type { GraphNode, Domain } from '@/lib/types';
import { DOMAIN_COLORS, DOMAIN_LABELS } from '@/lib/types';

interface NodeListProps {
  nodes: GraphNode[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNodeClick: (node: GraphNode) => void;
  selectedNodeId: string | null;
}

const TYPE_ORDER: GraphNode['type'][] = ['skill', 'agent', 'note', 'lecture', 'report', 'course'];
const TYPE_LABELS: Record<GraphNode['type'], string> = {
  skill: 'Skills',
  agent: 'Agents',
  report: 'Reports',
  course: 'Courses',
  note: 'Notes',
  lecture: 'Lectures',
};

export function NodeList({
  nodes,
  searchQuery,
  onSearchChange,
  onNodeClick,
  selectedNodeId,
}: NodeListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter((n) => n.label.toLowerCase().includes(q) || n.domain.includes(q));
  }, [nodes, searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<GraphNode['type'], GraphNode[]>();
    for (const type of TYPE_ORDER) {
      map.set(type, []);
    }
    for (const node of filtered) {
      map.get(node.type)?.push(node);
    }
    return map;
  }, [filtered]);

  const toggleGroup = (type: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="obsidian-panel-inner flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2 border-b border-[#333]">
        <div className="relative">
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="#666" strokeWidth="1.5" />
            <path d="M10.5 10.5l3 3" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="obsidian-input w-full pl-7"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 py-1.5 text-[11px] text-[#555] border-b border-[#2a2a2a]">
        {filtered.length} of {nodes.length} nodes
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto">
        {TYPE_ORDER.map((type) => {
          const group = grouped.get(type) ?? [];
          if (group.length === 0) return null;
          const isCollapsed = collapsedGroups.has(type);
          return (
            <div key={type}>
              <button
                onClick={() => toggleGroup(type)}
                className="obsidian-group-header"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 0.12s ease',
                    flexShrink: 0,
                  }}
                >
                  <path d="M4 2l4 4-4 4" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{TYPE_LABELS[type]}</span>
                <span className="obsidian-group-count">{group.length}</span>
              </button>
              {!isCollapsed && (
                <div>
                  {group.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => onNodeClick(node)}
                      className={`obsidian-node-row ${selectedNodeId === node.id ? 'obsidian-node-active' : ''}`}
                    >
                      <span
                        className="obsidian-node-dot"
                        style={{ background: DOMAIN_COLORS[node.domain as Domain] }}
                      />
                      <span className="obsidian-node-label truncate">{node.label}</span>
                    </button>
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
