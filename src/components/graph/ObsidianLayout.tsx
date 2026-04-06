'use client';

import { useState, useRef, useCallback } from 'react';
import type { GraphNode, GraphEdge } from '@/lib/types';
import { KnowledgeGraph, type KnowledgeGraphHandle } from './KnowledgeGraph';
import { GraphSettings, DEFAULT_SETTINGS, type GraphSettingsValues } from './GraphSettings';
import { NodeList } from './NodeList';
import { NodeDetailPane } from './NodeDetailPane';

interface ObsidianLayoutProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Icon components (inline SVG, no external deps)
function IconFile() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function IconGraph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="2"/>
      <circle cx="19" cy="5" r="2"/>
      <circle cx="19" cy="19" r="2"/>
      <line x1="7" y1="12" x2="17" y2="6"/>
      <line x1="7" y1="12" x2="17" y2="18"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4l-4 4 4 4"/>
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4l4 4-4 4"/>
    </svg>
  );
}

type ActiveIcon = 'files' | 'search' | 'graph' | 'settings' | null;

export function ObsidianLayout({ nodes, edges }: ObsidianLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [activeIcon, setActiveIcon] = useState<ActiveIcon>('files');
  const [settings, setSettings] = useState<GraphSettingsValues>(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailNode, setDetailNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<KnowledgeGraphHandle>(null);

  const handleSettingsChange = useCallback((patch: Partial<GraphSettingsValues>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q);
      graphRef.current?.highlightSearch(q);
    },
    [],
  );

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNodeId(node.id);
    setDetailNode(node);
    graphRef.current?.centerOnNode(node.id);
  }, []);

  const handleIconClick = (icon: ActiveIcon) => {
    if (icon === 'files' || icon === 'search') {
      if (activeIcon === icon && leftOpen) {
        setLeftOpen(false);
        setActiveIcon(null);
      } else {
        setActiveIcon(icon);
        setLeftOpen(true);
      }
    } else if (icon === 'settings') {
      if (activeIcon === 'settings' && rightOpen) {
        setRightOpen(false);
        setActiveIcon(null);
      } else {
        setActiveIcon('settings');
        setRightOpen(true);
      }
    } else if (icon === 'graph') {
      setActiveIcon('graph');
    }
  };

  return (
    <div className="obsidian-root" style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      {/* Top bar */}
      <div className="obsidian-topbar">
        <span className="obsidian-topbar-title">Graph View</span>
        <span className="obsidian-topbar-meta">
          {nodes.length} nodes &middot; {edges.length} edges
        </span>
      </div>

      {/* Main layout */}
      <div className="obsidian-body">
        {/* Left icon bar */}
        <div className="obsidian-iconbar">
          {([
            { id: 'files' as ActiveIcon, Icon: IconFile, label: 'Files' },
            { id: 'search' as ActiveIcon, Icon: IconSearch, label: 'Search' },
            { id: 'graph' as ActiveIcon, Icon: IconGraph, label: 'Graph' },
            { id: 'settings' as ActiveIcon, Icon: IconSettings, label: 'Settings' },
          ] as const).map(({ id, Icon, label }) => (
            <button
              key={id}
              className={`obsidian-iconbtn ${activeIcon === id ? 'obsidian-iconbtn-active' : ''}`}
              onClick={() => handleIconClick(id)}
              title={label}
              aria-label={label}
            >
              <Icon />
            </button>
          ))}
        </div>

        {/* Left panel */}
        {leftOpen && (
          <div className="obsidian-panel obsidian-panel-left">
            <div className="obsidian-panel-header">
              <span className="obsidian-panel-title">
                {activeIcon === 'search' ? 'Search' : 'Files'}
              </span>
              <button
                className="obsidian-collapse-btn"
                onClick={() => setLeftOpen(false)}
                aria-label="Close panel"
              >
                <IconChevronLeft />
              </button>
            </div>
            <NodeList
              nodes={nodes}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNodeId}
            />
          </div>
        )}

        {/* Graph canvas */}
        <div className="obsidian-canvas">
          {!leftOpen && (
            <button
              className="obsidian-panel-reopen obsidian-panel-reopen-left"
              onClick={() => setLeftOpen(true)}
              aria-label="Open left panel"
            >
              <IconChevronRight />
            </button>
          )}
          <KnowledgeGraph
            ref={graphRef}
            nodes={nodes}
            edges={edges}
            settings={settings}
            onNodeSelect={(node) => {
              if (node) {
                setSelectedNodeId(node.id);
                setDetailNode(node);
              }
            }}
          />
          {detailNode && (
            <NodeDetailPane
              node={detailNode}
              allNodes={nodes}
              allEdges={edges}
              onClose={() => setDetailNode(null)}
              onNavigate={(nodeId) => {
                const target = nodes.find(n => n.id === nodeId);
                if (target) {
                  setDetailNode(target);
                  graphRef.current?.centerOnNode(nodeId);
                }
              }}
            />
          )}
          {!rightOpen && (
            <button
              className="obsidian-panel-reopen obsidian-panel-reopen-right"
              onClick={() => setRightOpen(true)}
              aria-label="Open right panel"
            >
              <IconChevronLeft />
            </button>
          )}
        </div>

        {/* Right panel */}
        {rightOpen && (
          <div className="obsidian-panel obsidian-panel-right">
            <div className="obsidian-panel-header">
              <span className="obsidian-panel-title">Settings</span>
              <button
                className="obsidian-collapse-btn"
                onClick={() => setRightOpen(false)}
                aria-label="Close settings"
              >
                <IconChevronRight />
              </button>
            </div>
            <GraphSettings settings={settings} onChange={handleSettingsChange} />
          </div>
        )}

        {/* Right strip toggle */}
        <div className="obsidian-right-strip">
          <button
            className="obsidian-strip-btn"
            onClick={() => setRightOpen((v) => !v)}
            aria-label="Toggle settings panel"
            title="Toggle settings"
          >
            <IconSettings />
          </button>
        </div>
      </div>
    </div>
  );
}
