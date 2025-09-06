import { D3Node } from '@/utils/d3Config';

export interface NodeConfig {
  isSelected?: boolean;
  radius?: number;
  className?: string;
}

export interface NodeEventHandlers {
  onNodeClick?: (node: D3Node) => void;
  onNodeDoubleClick?: (node: D3Node) => void;
  onNodeMouseEnter?: (node: D3Node) => void;
  onNodeMouseLeave?: (node: D3Node) => void;
}

/**
 * Get node styling based on selection state
 */
export const getNodeStyling = (isSelected: boolean) => {
  return {
    fill: isSelected ? '#e3f2fd' : 'white',
    stroke: isSelected ? '#1976d2' : '#000000',
    strokeWidth: isSelected ? 3 : 2,
    labelFill: isSelected ? '#1976d2' : '#000000',
  };
};

/**
 * Create node event handlers for D3.js
 */
export const createNodeEventHandlers = (
  node: D3Node,
  handlers: NodeEventHandlers
) => {
  return {
    click: (event: Event) => {
      event.stopPropagation();
      handlers.onNodeClick?.(node);
    },
    dblclick: (event: Event) => {
      event.stopPropagation();
      handlers.onNodeDoubleClick?.(node);
    },
    mouseenter: (event: Event) => {
      event.stopPropagation();
      handlers.onNodeMouseEnter?.(node);
    },
    mouseleave: (event: Event) => {
      event.stopPropagation();
      handlers.onNodeMouseLeave?.(node);
    },
  };
};

/**
 * Apply node styling to a D3.js node selection
 */
export const applyNodeStyling = (
  nodeSelection: any,
  isSelected: boolean,
  radius: number = 20
) => {
  const styling = getNodeStyling(isSelected);
  
  // Style the circle
  nodeSelection
    .select('circle')
    .attr('r', radius)
    .attr('fill', styling.fill)
    .attr('stroke', styling.stroke)
    .attr('stroke-width', styling.strokeWidth)
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s ease-in-out');

  // Style the text
  nodeSelection
    .select('text')
    .attr('fill', styling.labelFill)
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .style('pointer-events', 'none')
    .style('user-select', 'none')
    .style('transition', 'all 0.2s ease-in-out');
};

/**
 * Create a node group element with circle and text
 */
export const createNodeElement = (node: D3Node, config: NodeConfig = {}) => {
  const { isSelected = false, radius = 20, className = '' } = config;
  const styling = getNodeStyling(isSelected);

  return {
    tag: 'g',
    attributes: {
      class: `node ${className}`,
      'data-node-label': node.label,
      'data-testid': `node-${node.label}`,
    },
    children: [
      {
        tag: 'circle',
        attributes: {
          class: 'graph-node',
          r: radius,
          fill: styling.fill,
          stroke: styling.stroke,
          'stroke-width': styling.strokeWidth,
          style: 'cursor: pointer; transition: all 0.2s ease-in-out;',
        },
      },
      {
        tag: 'text',
        attributes: {
          class: 'graph-node-label',
          'text-anchor': 'middle',
          dy: '0.35em',
          fill: styling.labelFill,
          'font-size': '12px',
          'font-weight': 'bold',
          style: 'pointer-events: none; user-select: none; transition: all 0.2s ease-in-out;',
        },
        text: node.label,
      },
    ],
  };
};
