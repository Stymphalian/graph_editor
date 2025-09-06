// D3 configuration and re-exports for better tree-shaking and TypeScript support
import * as d3 from 'd3';
import { zoomIdentity } from 'd3-zoom';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceX,
  forceY,
  forceCollide,
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
  forceCollide,
};

// Node and Edge interfaces for D3
export interface D3Node extends d3.SimulationNodeDatum {
  id: string;
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


  // Drag behavior for nodes
  createDrag: (simulation?: ForceSimulation, mode?: string) =>
    d3
      .drag<SVGGElement, D3Node, unknown>()
      .on('start', (event, d) => {
        if (!event.active && simulation) {
          if (mode === 'view-force') {
            // In view-force mode, temporarily disable force simulation during drag
            simulation.alphaTarget(0.1).restart();
          } else {
            // In edit/delete modes, increase alpha target for more responsive movement
            simulation.alphaTarget(0.3).restart();
          }
        }
        d.fx = d.x ?? null;
        d.fy = d.y ?? null;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active && simulation) {
          if (mode === 'view-force') {
            // In view-force mode, restart force simulation after drag
            simulation.alphaTarget(0.1).restart();
          } else {
            // In other modes, let simulation settle naturally
            simulation.alphaTarget(0);
          }
        }
        d.fx = null;
        d.fy = null;
      }),

  // Force simulation configuration
  createForceSimulation: (width: number, height: number) => {
    return forceSimulation<D3Node, D3Edge>()
      .force('link', forceLink<D3Node, D3Edge>().id((d: D3Node) => d.id).distance(80).strength(0.8)) // Stronger link force for better connectivity
      .force('charge', forceManyBody<D3Node>().strength(40)) // Gentle charge strength to minimize repulsion on new nodes
      .force('collision', forceCollide<D3Node>().radius(25)) // Smaller collision radius to reduce repulsion
      .force('center', forceCenter<D3Node>(width / 2, height / 2).strength(0.02)) // Reduced center force to minimize disruption
      // .force('x', forceX<D3Node>(width / 2).strength(0.05)) // X position force configuration
      // .force('y', forceY<D3Node>(height / 2).strength(0.05)); // Y position force configuration
  },

  // Viewport management utilities
  fitToViewport: (svg: any, container: any, padding = 20) => {
    const bounds = container.node().getBBox();
    const fullWidth = svg.node().clientWidth || 800;
    const fullHeight = svg.node().clientHeight || 600;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;
    
    if (width === 0 || height === 0) return;
    
    const scale = Math.min((fullWidth - padding * 2) / width, (fullHeight - padding * 2) / height);
    const translateX = fullWidth / 2 - scale * midX;
    const translateY = fullHeight / 2 - scale * midY;
    
    svg.transition().duration(750).call(
      d3.zoom().transform,
      zoomIdentity.translate(translateX, translateY).scale(scale)
    );
  },

  resetViewport: (svg: any) => {
    svg.transition().duration(750).call(
      d3.zoom().transform,
      zoomIdentity
    );
  },
};
