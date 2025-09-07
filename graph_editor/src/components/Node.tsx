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
  onNodeMouseEnter?: (node: D3Node) => void;
  onNodeMouseLeave?: (node: D3Node) => void;
}

/**
 * Get node styling based on selection state
 */
export const getNodeStyling = (isSelected: boolean, isEdgeCreationSource: boolean = false) => {
  if (isEdgeCreationSource) {
    return {
      fill: '#fff3e0',
      stroke: '#ff9800',
      strokeWidth: 3,
      labelFill: '#ff9800',
    };
  }
  
  return {
    fill: isSelected ? '#e3f2fd' : 'white',
    stroke: isSelected ? '#1976d2' : '#000000',
    strokeWidth: isSelected ? 4 : 2,
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
  radius: number = 20,
  isEdgeCreationSource: boolean = false
) => {
  const styling = getNodeStyling(isSelected, isEdgeCreationSource);
  
  // Style the circle
  nodeSelection
    .select('circle')
    .attr('r', radius)
    .attr('fill', styling.fill)
    .attr('stroke', styling.stroke)
    .attr('stroke-width', styling.strokeWidth)
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s ease-in-out')
    .style('filter', isSelected ? 'drop-shadow(0 0 6px rgba(25, 118, 210, 0.4))' : 'none');

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
 * Apply nibs to an existing D3 node selection
 */
export const applyNodeNibs = (nodeSelection: any, showNibs: boolean, radius: number = 20, onNibClick?: (node: any) => void) => {
  // Remove existing nibs
  nodeSelection.selectAll('.node-nib').remove();
  
  if (showNibs) {
    const nibRadius = 6; // Larger nib for easier selection
    
    const nib = nodeSelection
      .append('circle')
      .attr('class', 'node-nib')
      .attr('cx', radius + nibRadius) // Position at right edge of main circle
      .attr('cy', 0) // Center vertically
      .attr('r', nibRadius)
      .attr('fill', '#000000') // Black color
      .attr('stroke', 'none')
      .style('pointer-events', 'all')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease-in-out');
    
    // Add click handler for the nib
    if (onNibClick) {
      nib.on('click', (event: Event) => {
        event.stopPropagation();
        const nodeData = nodeSelection.datum();
        onNibClick(nodeData);
      });
    }
  }
};

/**
 * Create node nibs for edge creation mode
 */
export const createNodeNibs = (_node: D3Node, radius: number = 20) => {
  const nibRadius = 3; // Smaller nib
  
  return [{
    tag: 'circle',
    attributes: {
      class: 'node-nib',
      cx: radius + nibRadius, // Position at right edge of main circle
      cy: 0, // Center vertically
      r: nibRadius,
      fill: '#000000', // Black color
      stroke: 'none',
      style: 'pointer-events: none; transition: all 0.2s ease-in-out;',
    },
  }];
};

