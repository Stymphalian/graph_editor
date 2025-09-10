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

// Create boundary force function
export const createBoundaryForce = (
  simulation: any,
  svgElement: SVGElement | null,
  nodeRadius: number
) => {
  return (_alpha: number) => {
    // Custom boundary force to keep nodes within SVG bounds with padding
    const nodes = simulation.nodes() as D3Node[];
    const padding = nodeRadius + 10; // Add 10px padding beyond node radius

    // Get actual SVG dimensions from the rendered element
    let actualWidth = 400; // fallback
    let actualHeight = 400; // fallback

    if (svgElement) {
      const rect = svgElement.getBoundingClientRect();
      actualWidth = rect.width;
      actualHeight = rect.height;
    }

    nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        // Left boundary
        if (node.x < padding) {
          node.x = padding;
        }
        // Right boundary
        if (node.x > actualWidth - padding) {
          node.x = actualWidth - padding;
        }
        // Top boundary
        if (node.y < padding) {
          node.y = padding;
        }
        // Bottom boundary
        if (node.y > actualHeight - padding) {
          node.y = actualHeight - padding;
        }
      }
    });
  };
};

// Force simulation configuration presets
export const ForceSimulationPresets = {
  // Default preset for general graph layout
  default: {
    linkDistance: 120,
    linkStrength: 0.8,
    chargeStrength: -300,
    collisionRadius: 1.2,
    centerStrength: 0.1,
    xStrength: 0.1,
    yStrength: 0.1,
    alphaDecay: 0.0228,
    velocityDecay: 0.4,
  },
  // Dense layout for tightly connected graphs
  dense: {
    linkDistance: 80,
    linkStrength: 1.0,
    chargeStrength: -200,
    collisionRadius: 1.0,
    centerStrength: 0.15,
    xStrength: 0.15,
    yStrength: 0.15,
    alphaDecay: 0.028,
    velocityDecay: 0.3,
  },
  // Sparse layout for loosely connected graphs
  sparse: {
    linkDistance: 200,
    linkStrength: 0.6,
    chargeStrength: -500,
    collisionRadius: 1.5,
    centerStrength: 0.05,
    xStrength: 0.05,
    yStrength: 0.05,
    alphaDecay: 0.018,
    velocityDecay: 0.5,
  },
  // Large graph preset for performance
  large: {
    linkDistance: 150,
    linkStrength: 0.7,
    chargeStrength: -400,
    collisionRadius: 1.3,
    centerStrength: 0.08,
    xStrength: 0.08,
    yStrength: 0.08,
    alphaDecay: 0.025,
    velocityDecay: 0.45,
  },
} as const;

export type ForceSimulationPreset = keyof typeof ForceSimulationPresets;

// Common D3 utilities for graph visualization
export const d3Utils = {
  // Drag behavior for nodes
  createDrag: (
    simulation?: ForceSimulation,
    mode?: string,
    width?: number,
    height?: number,
    nodeRadius?: number,
    svgElement?: SVGElement | null,
    isNodeAnchored?: (nodeId: string) => boolean
  ) =>
    d3
      .drag<SVGGElement, D3Node, unknown>()
      .on('start', (event, d) => {
        // Prevent click events from firing after drag
        event.sourceEvent?.stopPropagation();

        if (!event.active && simulation) {
          simulation.alphaTarget(0.1).restart();
        }

        // Always allow dragging by temporarily unfixing the node
        d.fx = d.x ?? null;
        d.fy = d.y ?? null;
      })
      .on('drag', (event, d) => {
        // Prevent click events during drag
        event.sourceEvent?.stopPropagation();

        const radius = nodeRadius || 15;
        const padding = radius + 10; // Add 10px padding beyond node radius
        let newX = event.x;
        let newY = event.y;

        // Get actual SVG dimensions for boundary constraints
        let actualWidth = width || 400;
        let actualHeight = height || 400;

        if (svgElement) {
          const rect = svgElement.getBoundingClientRect();
          actualWidth = rect.width;
          actualHeight = rect.height;
        }

        // Apply boundary constraints during drag with padding
        // Left boundary
        if (newX < padding) {
          newX = padding;
        }
        // Right boundary
        if (newX > actualWidth - padding) {
          newX = actualWidth - padding;
        }
        // Top boundary
        if (newY < padding) {
          newY = padding;
        }
        // Bottom boundary
        if (newY > actualHeight - padding) {
          newY = actualHeight - padding;
        }

        d.fx = newX;
        d.fy = newY;
      })
      .on('end', (event, d) => {
        // Prevent click events from firing after drag
        event.sourceEvent?.stopPropagation();

        if (!event.active && simulation) {
          simulation.alphaTarget(0.1).restart();
          
          // Check if node should remain anchored
          const shouldRemainAnchored = isNodeAnchored?.(d.id) || false;
          
          if (mode === 'view-force') {
            // In view-force mode, only unfix if not anchored
            if (shouldRemainAnchored) {
              // Keep anchored nodes fixed in their new position
              d.fx = d.x ?? null;
              d.fy = d.y ?? null;
            } else {
              // Unfix non-anchored nodes to allow free movement
              d.fx = null;
              d.fy = null;
            }
          } else {
            // In edit/delete modes, fix the node in its new position
            d.fx = d.x ?? null;
            d.fy = d.y ?? null;
          }
        } else {
          // If no simulation, check anchored state
          const shouldRemainAnchored = isNodeAnchored?.(d.id) || false;
          if (shouldRemainAnchored) {
            // Keep anchored nodes fixed
            d.fx = d.x ?? null;
            d.fy = d.y ?? null;
          } else {
            // Unfix non-anchored nodes
            d.fx = null;
            d.fy = null;
          }
        }
      }),

  // Force simulation configuration
  createForceSimulation: (
    width: number,
    height: number,
    nodeRadius: number = 15,
    svgElement?: SVGElement | null,
    preset: ForceSimulationPreset = 'default'
  ) => {
    const config = ForceSimulationPresets[preset];

    const simulation = forceSimulation<D3Node, D3Edge>()
      .force(
        'link',
        forceLink<D3Node, D3Edge>()
          .id((d: D3Node) => d.id)
          .distance(config.linkDistance)
          .strength(config.linkStrength)
      )
      .force(
        'charge',
        forceManyBody<D3Node>().strength(config.chargeStrength).distanceMax(300) // Limit charge force range for performance
      )
      .force(
        'collision',
        forceCollide<D3Node>()
          .radius(() => (nodeRadius + 10) * config.collisionRadius)
          .strength(0.7)
      )
      .force(
        'center',
        forceCenter<D3Node>(width / 2, height / 2).strength(
          config.centerStrength
        )
      )
      .force('x', forceX<D3Node>(width / 2).strength(config.xStrength))
      .force('y', forceY<D3Node>(height / 2).strength(config.yStrength))
      .alphaDecay(config.alphaDecay)
      .velocityDecay(config.velocityDecay);

    // Add boundary force after simulation is created
    simulation.force(
      'boundary',
      createBoundaryForce(simulation, svgElement || null, nodeRadius)
    );

    return simulation;
  },

  // Update force simulation with new preset
  updateForceSimulationPreset: (
    simulation: ForceSimulation,
    preset: ForceSimulationPreset,
    nodeRadius: number = 15
  ) => {
    const config = ForceSimulationPresets[preset];

    // Update existing forces
    (simulation.force('link') as any)
      ?.distance(config.linkDistance)
      ?.strength(config.linkStrength);

    (simulation.force('charge') as any)?.strength(config.chargeStrength);

    (simulation.force('collision') as any)?.radius(
      () => (nodeRadius + 10) * config.collisionRadius
    );

    (simulation.force('center') as any)?.strength(config.centerStrength);

    (simulation.force('x') as any)?.strength(config.xStrength);

    (simulation.force('y') as any)?.strength(config.yStrength);

    // Update simulation parameters
    simulation
      .alphaDecay(config.alphaDecay)
      .velocityDecay(config.velocityDecay);

    return simulation;
  },

  // Get optimal preset based on graph characteristics
  getOptimalPreset: (
    nodeCount: number,
    edgeCount: number
  ): ForceSimulationPreset => {
    if (nodeCount >= 500) {
      return 'large';
    }

    const density = edgeCount / Math.max(nodeCount, 1);
    if (density > 2) {
      return 'dense';
    } else if (density < 0.5) {
      return 'sparse';
    }

    return 'default';
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

    const scale = Math.min(
      (fullWidth - padding * 2) / width,
      (fullHeight - padding * 2) / height
    );
    const translateX = fullWidth / 2 - scale * midX;
    const translateY = fullHeight / 2 - scale * midY;

    svg
      .transition()
      .duration(750)
      .call(
        d3.zoom().transform,
        zoomIdentity.translate(translateX, translateY).scale(scale)
      );
  },

  resetViewport: (svg: any) => {
    svg.transition().duration(750).call(d3.zoom().transform, zoomIdentity);
  },
};
