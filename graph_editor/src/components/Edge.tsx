import { D3Edge, D3Node } from '@/utils/d3Config';

export interface EdgeConfig {
  isSelected?: boolean;
  isDirected?: boolean;
  strokeWidth?: number;
  strokeColor?: string;
  className?: string;
}

export interface EdgeEventHandlers {
  onEdgeClick?: (edge: D3Edge) => void;
  onEdgeDoubleClick?: (edge: D3Edge) => void;
  onEdgeMouseEnter?: (edge: D3Edge) => void;
  onEdgeMouseLeave?: (edge: D3Edge) => void;
}

/**
 * Get edge styling based on selection state
 */
export const getEdgeStyling = (
  isSelected: boolean,
  strokeColor: string = '#000000',
  strokeWidth: number = 2
) => {
  return {
    stroke: isSelected ? '#1976d2' : strokeColor,
    strokeWidth: isSelected ? strokeWidth + 1 : strokeWidth,
  };
};

/**
 * Create edge event handlers for D3.js
 */
export const createEdgeEventHandlers = (
  edge: D3Edge,
  handlers: EdgeEventHandlers
) => {
  return {
    click: (event: Event) => {
      event.stopPropagation();
      handlers.onEdgeClick?.(edge);
    },
    dblclick: (event: Event) => {
      event.stopPropagation();
      handlers.onEdgeDoubleClick?.(edge);
    },
    mouseenter: (event: Event) => {
      event.stopPropagation();
      handlers.onEdgeMouseEnter?.(edge);
    },
    mouseleave: (event: Event) => {
      event.stopPropagation();
      handlers.onEdgeMouseLeave?.(edge);
    },
  };
};

/**
 * Apply edge styling to a D3.js edge selection
 */
export const applyEdgeStyling = (
  edgeSelection: any,
  isSelected: boolean,
  strokeColor: string = '#000000',
  strokeWidth: number = 2,
  isDirected: boolean = false
) => {
  const styling = getEdgeStyling(isSelected, strokeColor, strokeWidth);
  
  // Style the line
  edgeSelection
    .attr('stroke', styling.stroke)
    .attr('stroke-width', styling.strokeWidth)
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s ease-in-out');

  // Add arrow marker for directed edges
  if (isDirected) {
    edgeSelection.attr('marker-end', 'url(#arrowhead)');
  } else {
    edgeSelection.attr('marker-end', null);
  }

  // Style the weight text if present
  const weightText = edgeSelection.select('text');
  if (!weightText.empty()) {
    weightText
      .attr('fill', styling.stroke)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('transition', 'all 0.2s ease-in-out');
  }
};

/**
 * Create an edge line element
 */
export const createEdgeElement = (
  edge: D3Edge,
  sourceNode: D3Node,
  targetNode: D3Node,
  config: EdgeConfig = {}
) => {
  const {
    isSelected = false,
    isDirected = false,
    strokeWidth = 2,
    strokeColor = '#000000',
    className = '',
  } = config;

  const styling = getEdgeStyling(isSelected, strokeColor, strokeWidth);
  const x1 = sourceNode.x || 0;
  const y1 = sourceNode.y || 0;
  const x2 = targetNode.x || 0;
  const y2 = targetNode.y || 0;

  const children = [
    {
      tag: 'line',
      attributes: {
        class: 'graph-edge',
        x1,
        y1,
        x2,
        y2,
        stroke: styling.stroke,
        'stroke-width': styling.strokeWidth,
        'marker-end': isDirected ? 'url(#arrowhead)' : undefined,
        style: 'cursor: pointer; transition: all 0.2s ease-in-out;',
      },
    },
  ];

  // Add weight text if present
  if (edge.weight) {
    children.push({
      tag: 'text',
      attributes: {
        class: 'graph-edge-weight',
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
        'text-anchor': 'middle',
        dy: '-0.5em',
        fill: styling.stroke,
        'font-size': '10px',
        'font-weight': 'bold',
        style: 'pointer-events: none; user-select: none; transition: all 0.2s ease-in-out;',
      },
      text: edge.weight,
    });
  }

  return {
    tag: 'g',
    attributes: {
      class: `edge ${className}`,
      'data-edge-id': edge.id,
      'data-testid': `edge-${edge.id}`,
    },
    children,
  };
};
