'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge, Domain } from '@/lib/types';
import { DOMAIN_COLORS, DOMAIN_LABELS } from '@/lib/types';
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

function getNodeRadius(connections: number, sizeMultiplier: number): number {
  const base = Math.max(3, Math.min(8, 3 + connections * 0.3));
  return base * (sizeMultiplier / 4);
}

function getNodeColor(node: SimNode, colorBy: GraphSettingsValues['colorBy']): string {
  if (colorBy === 'none') return '#666666';
  if (colorBy === 'type') {
    const typeColors: Record<GraphNode['type'], string> = {
      skill: '#C9A84C',
      agent: '#4ADE80',
      report: '#4A9EFF',
      course: '#A78BFA',
      note: '#F59E0B',
      lecture: '#10B981',
    };
    return typeColors[node.type];
  }
  return DOMAIN_COLORS[node.domain] ?? '#666666';
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
    'font-weight:600;color:#C9A84C;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px';
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

      // Arrow marker
      const defs = svg.append('defs');
      defs
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -4 8 8')
        .attr('refX', 14)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4')
        .attr('fill', '#555');

      // Background
      svg.append('rect').attr('width', w).attr('height', h).attr('fill', '#202020');

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

      // Edge layer
      const linkG = g.append('g').attr('class', 'links');
      const linkSel = linkG
        .selectAll<SVGLineElement, SimEdge>('line')
        .data(simEdges)
        .join('line')
        .attr('stroke', '#555555')
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', (d) => Math.max(0.3, d.weight * 0.15 * s.linkThickness))
        .attr('marker-end', s.showArrows ? 'url(#arrowhead)' : null);
      linkSelRef.current = linkSel;

      // Node layer
      const nodeG = g.append('g').attr('class', 'nodes');
      const nodeSel = nodeG
        .selectAll<SVGCircleElement, SimNode>('circle')
        .data(simNodes)
        .join('circle')
        .attr('r', (d) => getNodeRadius(d.connections, s.nodeSize))
        .attr('fill', (d) => getNodeColor(d, s.colorBy))
        .attr('stroke', '#202020')
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
        .attr('fill', '#999999')
        .attr('pointer-events', 'none')
        .style('opacity', currentZoomRef.current >= s.textFadeThreshold ? '1' : '0');
      labelSelRef.current = labelSel;

      const tooltipEl = tooltipRef.current;

      // Hover
      nodeSel
        .on('mouseenter', function (event: MouseEvent, d: SimNode) {
          const curSettings = settingsRef.current;
          const r = getNodeRadius(d.connections, curSettings.nodeSize);

          d3.select(this)
            .raise()
            .transition()
            .duration(120)
            .attr('r', r * 1.4)
            .attr('stroke', '#888')
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
              return src === d.id || tgt === d.id ? '#999999' : '#555555';
            })
            .attr('stroke-opacity', (l) => {
              const src = typeof l.source === 'object' ? (l.source as SimNode).id : String(l.source);
              const tgt = typeof l.target === 'object' ? (l.target as SimNode).id : String(l.target);
              return src === d.id || tgt === d.id ? 0.8 : 0.05;
            });

          nodeSel.style('opacity', (n) =>
            n.id === d.id || connectedIds.has(n.id) ? '1' : '0.15',
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
          const r = getNodeRadius(d.connections, curSettings.nodeSize);
          d3.select(this)
            .transition()
            .duration(120)
            .attr('r', r)
            .attr('stroke', '#202020')
            .attr('stroke-width', 0.5);

          linkSel.attr('stroke', '#555555').attr('stroke-opacity', 0.3);

          if (searchQueryRef.current.trim()) {
            applySearchHighlight(searchQueryRef.current);
          } else {
            nodeSel.style('opacity', null);
            labelSel.style('opacity', null);
          }

          if (tooltipEl) tooltipEl.style.display = 'none';
        })
        .on('click', (_event: MouseEvent, d: SimNode) => {
          if (d.type === 'skill') {
            window.location.href = `/article/${d.id}`;
          }
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
            .radius((d) => getNodeRadius(d.connections, s.nodeSize) + 2),
        )
        .alphaDecay(0.02)
        .velocityDecay(0.4);

      simulationRef.current = simulation;

      simulation.on('tick', () => {
        linkSel
          .attr('x1', (d) => (d.source as SimNode).x ?? 0)
          .attr('y1', (d) => (d.source as SimNode).y ?? 0)
          .attr('x2', (d) => (d.target as SimNode).x ?? 0)
          .attr('y2', (d) => (d.target as SimNode).y ?? 0);

        nodeSel.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);

        labelSel
          .attr('x', (d) => (d.x ?? 0) + getNodeRadius(d.connections, settingsRef.current.nodeSize) + 4)
          .attr('y', (d) => (d.y ?? 0) + 3);
      });

      // ResizeObserver
      const ro = new ResizeObserver(() => {
        const { width: nw, height: nh } = measure();
        dimensionsRef.current = { width: nw, height: nh };
        svg.attr('width', nw).attr('height', nh);
        svg.select('rect[fill="#202020"]').attr('width', nw).attr('height', nh);
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
        nodeSel.attr('r', (d) => getNodeRadius(d.connections, settings.nodeSize));
        nodeSel.attr('fill', (d) => getNodeColor(d, settings.colorBy));
      }

      const linkSel = linkSelRef.current;
      if (linkSel) {
        linkSel.attr(
          'stroke-width',
          (d) => Math.max(0.3, d.weight * 0.15 * settings.linkThickness),
        );
        linkSel.attr('marker-end', settings.showArrows ? 'url(#arrowhead)' : null);
      }

      updateLabelVisibility(currentZoomRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    return (
      <div ref={containerRef} className="relative w-full h-full">
        <svg ref={svgRef} className="w-full h-full block" />
        <div
          ref={tooltipRef}
          style={{
            display: 'none',
            position: 'absolute',
            background: 'rgba(30,30,30,0.95)',
            border: '1px solid #3a3a3a',
            borderRadius: '6px',
            padding: '8px 10px',
            pointerEvents: 'none',
            zIndex: 50,
            fontSize: '12px',
            color: '#ccc',
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
