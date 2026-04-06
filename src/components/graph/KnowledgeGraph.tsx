'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge, Domain } from '@/lib/types';
import { DOMAIN_LABELS } from '@/lib/types';
import { getTheme, NODE_DOMAIN_COLORS, NODE_TYPE_COLORS } from '@/lib/themes';
import { DEFAULT_SETTINGS, type GraphSettingsValues } from './GraphSettings';

export interface KnowledgeGraphHandle {
  centerOnNode: (nodeId: string) => void;
  highlightSearch: (query: string) => void;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  settings?: GraphSettingsValues;
  /** @deprecated use CSS on parent instead */
  height?: number;
  onNodeSelect?: (node: GraphNode | null) => void;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: GraphNode['type'];
  domain: Domain;
  connections: number;
}

interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  weight: number;
  reason: string;
}

/** Type-based weight: structural "root" nodes get a size bonus */
const TYPE_WEIGHT: Record<GraphNode['type'], number> = {
  course: 1.6,    // courses are root hubs
  agent: 1.3,     // agents are structural nodes
  skill: 1.0,     // default
  report: 0.85,   // reports are leaf-ish
  note: 1.0,      // notes vary — connections drive their size
  lecture: 0.75,   // lectures are leaves under courses
};

function getNodeRadius(connections: number, sizeMultiplier: number, type?: GraphNode['type']): number {
  // Logarithmic scale: tiny orphans (2.5px) to mega-hubs (22px)
  // log(1)=0 → base 2.5,  log(150)≈5 → base ~17
  const logBase = 2.5 + Math.log1p(connections) * 2.9;
  const clamped = Math.max(2.5, Math.min(22, logBase));
  const typeBonus = type ? (TYPE_WEIGHT[type] ?? 1.0) : 1.0;
  return clamped * typeBonus * (sizeMultiplier / 4);
}

function getNodeColor(node: SimNode, colorBy: GraphSettingsValues['colorBy']): string {
  if (colorBy === 'none') return '#666666';
  if (colorBy === 'type') {
    return NODE_TYPE_COLORS[node.type] ?? '#666666';
  }
  return NODE_DOMAIN_COLORS[node.domain] ?? '#666666';
}

/** Build safe tooltip DOM — no innerHTML */
function buildTooltip(container: HTMLDivElement, d: SimNode) {
  // Clear existing children safely
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const nameEl = document.createElement('div');
  nameEl.textContent = d.label;
  nameEl.style.cssText =
    'font-weight:600;color:#e8b84a;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px';
  container.appendChild(nameEl);

  const metaEl = document.createElement('div');
  metaEl.textContent = `${DOMAIN_LABELS[d.domain]} · ${d.type}`;
  metaEl.style.cssText = 'color:#888;font-size:11px';
  container.appendChild(metaEl);

  const connEl = document.createElement('div');
  connEl.textContent = `${d.connections} connection${d.connections !== 1 ? 's' : ''}`;
  connEl.style.cssText = 'color:#888;font-size:11px;margin-top:2px';
  container.appendChild(connEl);

  if (d.type === 'skill') {
    const hintEl = document.createElement('div');
    hintEl.textContent = 'Click to view';
    hintEl.style.cssText = 'color:#C9A84C;font-size:10px;margin-top:4px;opacity:0.7';
    container.appendChild(hintEl);
  }
}

const KnowledgeGraph = forwardRef<KnowledgeGraphHandle, KnowledgeGraphProps>(
  function KnowledgeGraph({ nodes, edges, settings: settingsProp, height, onNodeSelect }, ref) {
    const settings = settingsProp ?? DEFAULT_SETTINGS;
    void height; // legacy prop — ignored, size controlled by CSS
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<d3.Simulation<SimNode, SimEdge> | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const nodesRef = useRef<SimNode[]>([]);
    const linkSelRef = useRef<d3.Selection<SVGLineElement, SimEdge, SVGGElement, unknown> | null>(null);
    const nodeSelRef = useRef<d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown> | null>(null);
    const labelSelRef = useRef<d3.Selection<SVGTextElement, SimNode, SVGGElement, unknown> | null>(null);
    const dimensionsRef = useRef({ width: 1200, height: 800 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const currentZoomRef = useRef<number>(1);
    const searchQueryRef = useRef<string>('');
    const settingsRef = useRef<GraphSettingsValues>(settings);

    // Keep settingsRef in sync so event handlers can read current values
    useEffect(() => {
      settingsRef.current = settings;
    }, [settings]);

    const applySearchHighlight = useCallback((query: string) => {
      const nodeSel = nodeSelRef.current;
      const labelSel = labelSelRef.current;
      const linkSel = linkSelRef.current;
      if (!nodeSel || !labelSel) return;

      if (!query.trim()) {
        nodeSel.style('opacity', null);
        labelSel.style('opacity', null);
        if (linkSel) linkSel.style('opacity', null);
        return;
      }

      const q = query.toLowerCase();
      const matchIds = new Set<string>();
      nodesRef.current.forEach((n) => {
        if (n.label.toLowerCase().includes(q) || n.domain.includes(q)) {
          matchIds.add(n.id);
        }
      });

      nodeSel.style('opacity', (d) => (matchIds.has(d.id) ? '1' : '0.1'));
      labelSel.style('opacity', (d) => (matchIds.has(d.id) ? '1' : '0.05'));
      if (linkSel) {
        linkSel.style('opacity', (l) => {
          const src = typeof l.source === 'object' ? (l.source as SimNode).id : String(l.source);
          const tgt = typeof l.target === 'object' ? (l.target as SimNode).id : String(l.target);
          return matchIds.has(src) && matchIds.has(tgt) ? '0.5' : '0.03';
        });
      }
    }, []);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      centerOnNode(nodeId: string) {
        const svgEl = svgRef.current;
        const zoom = zoomRef.current;
        if (!zoom || !svgEl) return;
        const node = nodesRef.current.find((n) => n.id === nodeId);
        if (!node || node.x == null || node.y == null) return;
        const { width: w, height: h } = dimensionsRef.current;
        const scale = 2;
        const tx = w / 2 - scale * node.x;
        const ty = h / 2 - scale * node.y;
        const target = d3.zoomIdentity.translate(tx, ty).scale(scale);
        // Apply zoom transform directly (with smooth transition via interpolation)
        zoom.transform(
          d3.select(svgEl).transition().duration(600) as unknown as Parameters<typeof zoom.transform>[0],
          target,
        );
      },
      highlightSearch(query: string) {
        searchQueryRef.current = query;
        applySearchHighlight(query);
      },
    }));

    const updateLabelVisibility = useCallback(
      (k: number) => {
        const labelSel = labelSelRef.current;
        if (!labelSel) return;
        const visible = k >= settingsRef.current.textFadeThreshold;
        labelSel.style('opacity', visible ? '1' : '0');
      },
      [],
    );

    // Build the graph (only when nodes/edges change)
    useEffect(() => {
      const container = containerRef.current;
      const svgEl = svgRef.current;
      if (!container || !svgEl) return;

      const measure = () => {
        const rect = container.getBoundingClientRect();
        return {
          width: Math.max(400, rect.width),
          height: Math.max(400, rect.height),
        };
      };

      const { width: w, height: h } = measure();
      dimensionsRef.current = { width: w, height: h };

      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();
      svg.attr('width', w).attr('height', h);

      const themeNow = getTheme(settingsRef.current.theme);

      // Arrow marker
      const defs = svg.append('defs');
      defs
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -3 6 6')
        .attr('refX', 14)
        .attr('refY', 0)
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-3L6,0L0,3')
        .attr('fill', themeNow.edgeColor)
        .attr('opacity', 0.4);

      // Background — semi-transparent so Three.js galaxy shows through
      svg.append('rect').attr('class', 'bg-rect').attr('width', w).attr('height', h).attr('fill', themeNow.canvasBg).attr('opacity', 0.5);

      // Nebula glow — soft radial gradient at center
      const nebulaGrad = defs.append('radialGradient')
        .attr('id', 'nebula-glow').attr('cx', '50%').attr('cy', '50%').attr('r', '45%');
      nebulaGrad.append('stop').attr('offset', '0%')
        .attr('stop-color', themeNow.id === 'light' ? '#e8e0f0' : '#2a2040').attr('stop-opacity', 0.4);
      nebulaGrad.append('stop').attr('offset', '40%')
        .attr('stop-color', themeNow.id === 'light' ? '#f0ece0' : '#1a1830').attr('stop-opacity', 0.2);
      nebulaGrad.append('stop').attr('offset', '100%')
        .attr('stop-color', 'transparent').attr('stop-opacity', 0);
      svg.append('ellipse').attr('class', 'nebula')
        .attr('cx', w / 2).attr('cy', h / 2)
        .attr('rx', w * 0.4).attr('ry', h * 0.38)
        .attr('fill', 'url(#nebula-glow)');

      // Node glow filter
      const glowFilter = defs.append('filter').attr('id', 'node-glow')
        .attr('x', '-80%').attr('y', '-80%').attr('width', '260%').attr('height', '260%');
      glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
      const glowMerge = glowFilter.append('feMerge');
      glowMerge.append('feMergeNode').attr('in', 'blur');
      glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      const g = svg.append('g');

      // Zoom
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.05, 8])
        .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          g.attr('transform', event.transform.toString());
          currentZoomRef.current = event.transform.k;
          updateLabelVisibility(event.transform.k);
        });
      zoomRef.current = zoom;
      svg.call(zoom);

      // Build sim data
      const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
      nodesRef.current = simNodes;

      const nodeIdSet = new Set(simNodes.map((n) => n.id));
      const simEdges: SimEdge[] = edges
        .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
        .map((e) => ({ ...e }));

      const s = settingsRef.current;
      const theme = getTheme(s.theme);

      // Edge layer
      const linkG = g.append('g').attr('class', 'links');
      const linkSel = linkG
        .selectAll<SVGLineElement, SimEdge>('line')
        .data(simEdges)
        .join('line')
        .attr('stroke', theme.edgeColor)
        .attr('stroke-opacity', theme.id === 'cosmos' ? 0.35 : 0.15)
        .attr('stroke-width', (d) => Math.max(0.3, d.weight * 0.15 * s.linkThickness))
        .attr('stroke-dasharray', theme.id === 'cosmos' ? '8 4' : null)
        .attr('marker-end', s.showArrows ? 'url(#arrowhead)' : null);
      linkSelRef.current = linkSel;

      // Node glow layer (behind nodes — soft halos for hub nodes)
      const glowG = g.append('g').attr('class', 'node-glows');
      glowG
        .selectAll('circle')
        .data(simNodes.filter((d) => d.connections > 15))
        .join('circle')
        .attr('r', (d) => getNodeRadius(d.connections, s.nodeSize, d.type) * 2.5)
        .attr('fill', (d) => getNodeColor(d, s.colorBy))
        .attr('opacity', (d) => Math.min(0.15, 0.04 + d.connections * 0.001))
        .attr('filter', 'url(#node-glow)');

      // Node layer
      const nodeG = g.append('g').attr('class', 'nodes');
      const nodeSel = nodeG
        .selectAll<SVGCircleElement, SimNode>('circle')
        .data(simNodes)
        .join('circle')
        .attr('r', (d) => getNodeRadius(d.connections, s.nodeSize, d.type))
        .attr('fill', (d) => getNodeColor(d, s.colorBy))
        .attr('stroke', theme.canvasBg)
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer');
      nodeSelRef.current = nodeSel;

      // Label layer
      const labelG = g.append('g').attr('class', 'labels');
      const labelSel = labelG
        .selectAll<SVGTextElement, SimNode>('text')
        .data(simNodes)
        .join('text')
        .text((d) => d.label)
        .attr('font-size', '10px')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .attr('fill', theme.labelColor)
        .attr('pointer-events', 'none')
        .style('opacity', currentZoomRef.current >= s.textFadeThreshold ? '1' : '0');
      labelSelRef.current = labelSel;

      const tooltipEl = tooltipRef.current;

      // Hover
      nodeSel
        .on('mouseenter', function (event: MouseEvent, d: SimNode) {
          const curSettings = settingsRef.current;
          const curTheme = getTheme(curSettings.theme);
          const r = getNodeRadius(d.connections, curSettings.nodeSize, d.type);

          d3.select(this)
            .raise()
            .transition()
            .duration(120)
            .attr('r', r * 1.4)
            .attr('stroke', curTheme.edgeHoverColor)
            .attr('stroke-width', 1);

          const connectedIds = new Set<string>();
          linkSel.each((l) => {
            const src = typeof l.source === 'object' ? (l.source as SimNode).id : String(l.source);
            const tgt = typeof l.target === 'object' ? (l.target as SimNode).id : String(l.target);
            if (src === d.id || tgt === d.id) {
              connectedIds.add(src);
              connectedIds.add(tgt);
            }
          });

          linkSel
            .attr('stroke', (l) => {
              const src = typeof l.source === 'object' ? (l.source as SimNode).id : String(l.source);
              const tgt = typeof l.target === 'object' ? (l.target as SimNode).id : String(l.target);
              return src === d.id || tgt === d.id ? curTheme.edgeHoverColor : curTheme.edgeColor;
            })
            .attr('stroke-opacity', (l) => {
              const src = typeof l.source === 'object' ? (l.source as SimNode).id : String(l.source);
              const tgt = typeof l.target === 'object' ? (l.target as SimNode).id : String(l.target);
              return src === d.id || tgt === d.id ? 0.6 : 0.03;
            });

          nodeSel.style('opacity', (n) =>
            n.id === d.id || connectedIds.has(n.id) ? '1' : '0.12',
          );
          const visLabels = currentZoomRef.current >= curSettings.textFadeThreshold;
          labelSel.style('opacity', (n) => {
            if (!visLabels) return '0';
            return n.id === d.id || connectedIds.has(n.id) ? '1' : '0.1';
          });

          if (tooltipEl) {
            buildTooltip(tooltipEl, d);
            tooltipEl.style.display = 'block';
            tooltipEl.style.left = `${event.offsetX + 14}px`;
            tooltipEl.style.top = `${event.offsetY - 10}px`;
          }
          onNodeSelect?.(nodes.find((n) => n.id === d.id) ?? null);
        })
        .on('mousemove', function (event: MouseEvent) {
          if (tooltipEl) {
            tooltipEl.style.left = `${event.offsetX + 14}px`;
            tooltipEl.style.top = `${event.offsetY - 10}px`;
          }
        })
        .on('mouseleave', function (_event: MouseEvent, d: SimNode) {
          const curSettings = settingsRef.current;
          const curTheme = getTheme(curSettings.theme);
          const r = getNodeRadius(d.connections, curSettings.nodeSize, d.type);
          d3.select(this)
            .transition()
            .duration(120)
            .attr('r', r)
            .attr('stroke', curTheme.canvasBg)
            .attr('stroke-width', 0.5);

          linkSel.attr('stroke', curTheme.edgeColor).attr('stroke-opacity', curTheme.id === 'cosmos' ? 0.35 : 0.15);

          if (searchQueryRef.current.trim()) {
            applySearchHighlight(searchQueryRef.current);
          } else {
            nodeSel.style('opacity', null);
            labelSel.style('opacity', null);
          }

          if (tooltipEl) tooltipEl.style.display = 'none';
        })
        .on('click', (_event: MouseEvent, d: SimNode) => {
          onNodeSelect?.(nodes.find((n) => n.id === d.id) ?? null);
        });

      // Drag
      const drag = d3
        .drag<SVGCircleElement, SimNode>()
        .on('start', (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>, d: SimNode) => {
          if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>, d: SimNode) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>, d: SimNode) => {
          if (!event.active) simulationRef.current?.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });
      nodeSel.call(drag);

      // Radial force — hub nodes pulled to center, leaf nodes pushed outward
      // This creates the galaxy/circular shape
      const maxConn = Math.max(...simNodes.map((n) => n.connections), 1);
      const galaxyRadius = Math.min(w, h) * 0.35;

      function radialForce(alpha: number) {
        const cx = w / 2;
        const cy = h / 2;
        for (const d of simNodes) {
          if (d.x == null || d.y == null) continue;
          const dx = d.x - cx;
          const dy = d.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          // Hub nodes (high connections) want to be near center
          // Leaf nodes (low connections) want to be at galaxy edge
          const hubness = d.connections / maxConn; // 0 = leaf, 1 = biggest hub
          const targetDist = galaxyRadius * (1.0 - hubness * 0.7);
          const strength = 0.015 * alpha;
          const scale = (targetDist - dist) / dist * strength;
          d.vx = (d.vx ?? 0) + dx * scale;
          d.vy = (d.vy ?? 0) + dy * scale;
        }
      }

      // Simulation
      const simulation = d3
        .forceSimulation<SimNode>(simNodes)
        .force(
          'link',
          d3
            .forceLink<SimNode, SimEdge>(simEdges)
            .id((d) => d.id)
            .distance(s.linkDistance)
            .strength((d) => Math.min(s.linkForce / 100, d.weight * 0.05)),
        )
        .force(
          'charge',
          d3.forceManyBody<SimNode>().strength(-s.repelForce).distanceMax(600),
        )
        .force(
          'center',
          d3.forceCenter(w / 2, h / 2).strength(s.centerForce / 100),
        )
        .force(
          'collide',
          d3
            .forceCollide<SimNode>()
            .radius((d) => getNodeRadius(d.connections, s.nodeSize, d.type) + 2),
        )
        .force('radial', radialForce)
        .alphaDecay(0.02)
        .velocityDecay(0.4);

      simulationRef.current = simulation;

      // Glow halo nodes reference for tick
      const glowSel = glowG.selectAll('circle');

      simulation.on('tick', () => {
        linkSel
          .attr('x1', (d) => (d.source as SimNode).x ?? 0)
          .attr('y1', (d) => (d.source as SimNode).y ?? 0)
          .attr('x2', (d) => (d.target as SimNode).x ?? 0)
          .attr('y2', (d) => (d.target as SimNode).y ?? 0);

        nodeSel.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);

        // Move glow halos with their nodes
        glowSel.attr('cx', (d: unknown) => ((d as SimNode).x ?? 0))
               .attr('cy', (d: unknown) => ((d as SimNode).y ?? 0));

        labelSel
          .attr('x', (d) => (d.x ?? 0) + getNodeRadius(d.connections, settingsRef.current.nodeSize, d.type) + 4)
          .attr('y', (d) => (d.y ?? 0) + 3);
      });

      // ResizeObserver
      const ro = new ResizeObserver(() => {
        const { width: nw, height: nh } = measure();
        dimensionsRef.current = { width: nw, height: nh };
        svg.attr('width', nw).attr('height', nh);
        svg.select('rect.bg-rect').attr('width', nw).attr('height', nh);
        simulation.force(
          'center',
          d3.forceCenter(nw / 2, nh / 2).strength(settingsRef.current.centerForce / 100),
        );
        simulation.alpha(0.1).restart();
      });
      ro.observe(container);

      return () => {
        simulation.stop();
        ro.disconnect();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges]);

    // React to settings changes without full rebuild
    useEffect(() => {
      const sim = simulationRef.current;
      if (!sim) return;

      const theme = getTheme(settings.theme);

      const linkForce = sim.force<d3.ForceLink<SimNode, SimEdge>>('link');
      if (linkForce) {
        linkForce.distance(settings.linkDistance);
        linkForce.strength((d) => Math.min(settings.linkForce / 100, d.weight * 0.05));
      }

      const chargeForce = sim.force<d3.ForceManyBody<SimNode>>('charge');
      if (chargeForce) chargeForce.strength(-settings.repelForce);

      const { width: w, height: h } = dimensionsRef.current;
      sim.force(
        'center',
        d3.forceCenter(w / 2, h / 2).strength(settings.centerForce / 100),
      );

      sim.alpha(0.3).restart();

      const nodeSel = nodeSelRef.current;
      if (nodeSel) {
        nodeSel.attr('r', (d) => getNodeRadius(d.connections, settings.nodeSize, d.type));
        nodeSel.attr('fill', (d) => getNodeColor(d, settings.colorBy));
        nodeSel.attr('stroke', theme.canvasBg);
      }

      const linkSel = linkSelRef.current;
      if (linkSel) {
        linkSel.attr(
          'stroke-width',
          (d) => Math.max(0.3, d.weight * 0.15 * settings.linkThickness),
        );
        linkSel.attr('stroke', theme.edgeColor);
        linkSel.attr('stroke-opacity', theme.id === 'cosmos' ? 0.35 : 0.15);
        linkSel.attr('stroke-dasharray', theme.id === 'cosmos' ? '8 4' : null);
        linkSel.attr('marker-end', settings.showArrows ? 'url(#arrowhead)' : null);
      }

      const labelSel = labelSelRef.current;
      if (labelSel) {
        labelSel.attr('fill', theme.labelColor);
      }

      // Update background rect
      const svgEl = svgRef.current;
      if (svgEl) {
        d3.select(svgEl).select('rect.bg-rect').attr('fill', theme.canvasBg).attr('opacity', 0.5);
      }

      updateLabelVisibility(currentZoomRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    return (
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <svg ref={svgRef} className="w-full h-full block" />
        <div
          ref={tooltipRef}
          className="graph-tooltip"
          style={{
            display: 'none',
            position: 'absolute',
            background: getTheme(settings.theme).tooltipBg,
            border: `1px solid ${getTheme(settings.theme).panelBorder}`,
            borderRadius: '6px',
            padding: '8px 10px',
            pointerEvents: 'none',
            zIndex: 50,
            fontSize: '12px',
            color: getTheme(settings.theme).textPrimary,
            maxWidth: '260px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    );
  },
);

KnowledgeGraph.displayName = 'KnowledgeGraph';
export { KnowledgeGraph };
