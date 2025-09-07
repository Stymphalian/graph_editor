import { D3Edge } from '@/utils/d3Config';

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

