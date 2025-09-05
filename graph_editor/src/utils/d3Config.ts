// D3 configuration and re-exports for better tree-shaking and TypeScript support
import * as d3 from 'd3';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceX,
  forceY,
} from 'd3-force';

// Re-export commonly used D3 modules
export {
  d3,
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceX,
  forceY,
};

// Node and Edge interfaces for D3
export interface D3Node extends d3.SimulationNodeDatum {
  label: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface D3Edge extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  source: string | D3Node;
  target: string | D3Node;
  weight?: string;
}

// D3 selection types for TypeScript
export type D3Selection = d3.Selection<SVGSVGElement, unknown, null, undefined>;
export type D3NodeSelection = d3.Selection<
  SVGGElement,
  D3Node,
  null,
  undefined
>;
export type D3EdgeSelection = d3.Selection<
  SVGLineElement,
  D3Edge,
  null,
  undefined
>;

// Force simulation types
export type ForceSimulation = d3.Simulation<D3Node, D3Edge>;
export type ForceLink = d3.ForceLink<D3Node, D3Edge>;
export type ForceManyBody = d3.ForceManyBody<D3Node>;
export type ForceCenter = d3.ForceCenter<D3Node>;

// Common D3 utilities for graph visualization
export const d3Utils = {
  // Color scales
  getColorScale: (domain: string[]) =>
    d3.scaleOrdinal(d3.schemeCategory10).domain(domain),

  // Zoom behavior
  createZoom: () =>
    d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', event => {
        const { transform } = event;
        d3.selectAll('.graph-group').attr('transform', transform);
      }),

  // Drag behavior for nodes
  createDrag: (simulation?: ForceSimulation) =>
    d3
      .drag<SVGGElement, D3Node, unknown>()
      .on('start', (event, d) => {
        if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
        d.fx = d.x ?? null;
        d.fy = d.y ?? null;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active && simulation) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }),

  // Force simulation configuration
  createForceSimulation: (width: number, height: number) => {
    return forceSimulation<D3Node, D3Edge>()
      .force(
        'link',
        forceLink<D3Node, D3Edge>()
          .id((d: D3Node) => d.label)
          .distance(100)
      )
      .force('charge', forceManyBody<D3Node>().strength(-300))
      .force('center', forceCenter<D3Node>(width / 2, height / 2))
      .force('x', forceX<D3Node>(width / 2).strength(0.1))
      .force('y', forceY<D3Node>(height / 2).strength(0.1));
  },
};
