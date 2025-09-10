import { d3, D3Node } from '@/utils/d3Config';

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

/**
 * Apply nibs to an existing D3 node selection
 */
export const applyNodeNibs = (
  nodeSelection: any,
  showNibs: boolean,
  radius: number = 20,
  onNibClick?: (node: any) => void,
  mousePosition?: { x: number; y: number } | null,
  nodePosition?: { x: number; y: number } | null
) => {
  // Remove existing nibs
  nodeSelection.selectAll('.node-nib').remove();

  if (showNibs) {
    const nibRadius = 6; // Larger nib for easier selection
    const hoverRadius = 8; // Expanded radius on hover
    const hoverFill = '#1976d2'; // Blue highlight color
    const normalFill = '#000000'; // Black color

    // Calculate nib position based on mouse position relative to node center
    let nibCx = radius + nibRadius; // Default position at right edge
    let nibCy = 0; // Default center vertically

    if (mousePosition && nodePosition) {
      // Calculate vector from node center to mouse position
      const dx = mousePosition.x - nodePosition.x;
      const dy = mousePosition.y - nodePosition.y;
      
      // Always calculate angle, even for very small distances to ensure consistent behavior
      const angle = Math.atan2(dy, dx);
      
      // Position nib on circumference at the calculated angle
      // The nib center is positioned at a fixed distance from node center
      // This ensures the nib always hugs the circumference regardless of mouse position
      const nibDistance = radius + nibRadius; // Fixed distance ensures circumference hugging
      nibCx = Math.cos(angle) * nibDistance;
      nibCy = Math.sin(angle) * nibDistance;
    }

    const nib = nodeSelection
      .append('circle')
      .attr('class', 'node-nib')
      .attr('cx', nibCx)
      .attr('cy', nibCy)
      .attr('r', nibRadius)
      .attr('fill', normalFill)
      .attr('stroke', 'none')
      .style('pointer-events', 'all')
      .style('cursor', 'pointer')
      .style('transition', 'r 0.2s ease-in-out, fill 0.2s ease-in-out, filter 0.2s ease-in-out');

    // Add hover effects
    nib
      .on('mouseenter', function (this: SVGElement) {
        d3.select(this)
          .interrupt() // Stop any ongoing transitions that might interfere
          .transition('hover-enter')
          .duration(200)
          .attr('r', hoverRadius)
          .attr('fill', hoverFill)
          .style('filter', 'drop-shadow(0 0 4px rgba(25, 118, 210, 0.6))');
      })
      .on('mouseleave', function (this: SVGElement) {
        d3.select(this)
          .interrupt() // Stop any ongoing transitions that might interfere
          .transition('hover-leave')
          .duration(200)
          .attr('r', nibRadius)
          .attr('fill', normalFill)
          .style('filter', 'none');
      });

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
  const hoverRadius = 5; // Expanded radius on hover
  const hoverFill = '#1976d2'; // Blue highlight color
  const normalFill = '#000000'; // Black color

  return [
    {
      tag: 'circle',
      attributes: {
        class: 'node-nib',
        cx: radius + nibRadius, // Position at right edge of main circle
        cy: 0, // Center vertically
        r: nibRadius,
        fill: normalFill,
        stroke: 'none',
        style:
          'pointer-events: all; cursor: pointer; transition: all 0.2s ease-in-out;',
      },
      eventHandlers: {
        mouseenter: function () {
          d3.select(this as any)
            .transition()
            .duration(200)
            .attr('r', hoverRadius)
            .attr('fill', hoverFill)
            .style('filter', 'drop-shadow(0 0 4px rgba(25, 118, 210, 0.6))');
        },
        mouseleave: function () {
          d3.select(this as any)
            .transition()
            .duration(200)
            .attr('r', nibRadius)
            .attr('fill', normalFill)
            .style('filter', 'none');
        },
      },
    },
  ];
};
