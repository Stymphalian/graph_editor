import { D3Node } from '@/utils/d3Config';

export interface NodeConfig {
  isSelected?: boolean;
  radius?: number;
  className?: string;
  showNibs?: boolean;
  isEdgeCreationSource?: boolean;
}

export interface NodeEventHandlers {
  onNodeClick?: (node: D3Node) => void;
  onNodeDoubleClick?: (node: D3Node) => void;
  onNodeRightClick?: (node: D3Node) => void;
  onNodeMouseEnter?: (node: D3Node) => void;
  onNodeMouseLeave?: (node: D3Node) => void;
}

/**
 * Get node styling based on selection state
 */
export const getNodeStyling = (
  isSelected: boolean,
  isEdgeCreationSource: boolean = false,
  isAnchored: boolean = false
) => {
  if (isEdgeCreationSource) {
    return {
      fill: '#fff3e0',
      stroke: '#ff9800',
      strokeWidth: 3,
      labelFill: '#ff9800',
    };
  }

  const baseStrokeWidth = isSelected ? 4 : 2;
  const anchoredStrokeWidth = baseStrokeWidth + (isAnchored ? 3 : 0);

  return {
    fill: isSelected ? '#e3f2fd' : 'white',
    stroke: isSelected ? '#1976d2' : '#000000',
    strokeWidth: anchoredStrokeWidth,
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
  let dragStarted = false;
  let clickTimeout: number | null = null;

  return {
    click: (event: Event) => {
      event.stopPropagation();

      // If drag was started, ignore click events
      if (dragStarted) {
        dragStarted = false;
        return;
      }

      // Clear any existing timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }

      // Delay click handling to allow for double-click detection
      clickTimeout = setTimeout(() => {
        handlers.onNodeClick?.(node);
      }, 100);
    },
    dblclick: (event: Event) => {
      event.stopPropagation();

      // Clear click timeout to prevent single click from firing
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }

      handlers.onNodeDoubleClick?.(node);
    },
    contextmenu: (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      handlers.onNodeRightClick?.(node);
    },
    mouseenter: (event: Event) => {
      event.stopPropagation();
      handlers.onNodeMouseEnter?.(node);
    },
    mouseleave: (event: Event) => {
      event.stopPropagation();
      handlers.onNodeMouseLeave?.(node);
    },
    dragstart: () => {
      dragStarted = true;
      // Clear any pending click
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
    },
  };
};

/**
 * Apply node styling to a D3.js node selection
 */
export const applyNodeStyling = (
  nodeSelection: any,
  isSelected: boolean,
  radius: number = 20,
  isEdgeCreationSource: boolean = false,
  isAnchored: boolean = false
) => {
  const styling = getNodeStyling(isSelected, isEdgeCreationSource, isAnchored);

  // Style the circle
  nodeSelection
    .select('circle')
    .attr('r', radius)
    .attr('fill', styling.fill)
    .attr('stroke', styling.stroke)
    .attr('stroke-width', styling.strokeWidth)
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s ease-in-out')
    .style(
      'filter',
      isSelected ? 'drop-shadow(0 0 6px rgba(25, 118, 210, 0.4))' : 'none'
    );

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


