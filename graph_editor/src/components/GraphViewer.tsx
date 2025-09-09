import React, { useEffect, useRef, useState } from 'react';
import {
  d3,
  d3Utils,
  createBoundaryForce,
  ForceSimulation,
  D3Node,
  D3Edge,
} from '@/utils/d3Config';
import { GraphData, Node, Edge } from '@/types/graph';
import {
  applyNodeStyling,
  createNodeEventHandlers,
  applyNodeNibs,
} from './Node';
import { applyEdgeStyling, createEdgeEventHandlers } from './Edge';
// Removed usePrevious import - using useRef instead
// Constants are now passed as props

interface GraphViewerProps {
  data: GraphData;
  onNodeCreate?: (x: number, y: number) => void;
  onEdgeCreate?: (sourceLabel: string, targetLabel: string) => void;
  onNodeLabelEdit?: (nodeLabel: string, newLabel: string) => void;
  onEdgeWeightEdit?: (
    sourceLabel: string,
    targetLabel: string,
    newWeight: string
  ) => void;
  onNodeDelete?: (nodeLabel: string) => void;
  onEdgeDelete?: (sourceLabel: string, targetLabel: string) => void;
  onNodePositionUpdate?: (
    positions: Array<{ label: string; x: number; y: number }>
  ) => void;
  onError?: (message: string) => void;
  errorMessage?: string | null;
  mode?: 'edit' | 'delete' | 'view-force';
  newNodePosition?: { x: number; y: number } | null;
  onNewNodePositioned?: () => void;
  onModeTransitionCleanup?: () => void;
  nodeRadius?: number;
  edgeStrokeWidth?: number;
}

const WIDTH = 600;
const HEIGHT = 400;

const GraphViewer: React.FC<GraphViewerProps> = ({
  data,
  onNodeCreate,
  onEdgeCreate,
  onNodeLabelEdit,
  onEdgeWeightEdit,
  onNodeDelete,
  onEdgeDelete,
  onNodePositionUpdate,
  onError,
  errorMessage,
  mode = 'edit',
  newNodePosition,
  onNewNodePositioned,
  onModeTransitionCleanup,
  nodeRadius = 20,
  edgeStrokeWidth = 2,
}) => {
  // Internal selection state
  const [selectionChange, setSelectionChange] = useState<boolean>(false);
  const [edgeCreationCancel, setEdgeCreationCancel] = useState<boolean>(false);
  const [showClickableAreas, setShowClickableAreas] = useState<boolean>(false);
  const [editingNodeLabel, setEditingNodeLabel] = useState<string | null>(null);
  // Debug panel state
  const [debugPanelExpanded, setDebugPanelExpanded] = useState<boolean>(false);

  // Throttling for position updates
  const lastPositionUpdateRef = useRef<number>(0);
  const positionUpdateThrottle = 50; // Update positions max every 50ms
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [editingPosition, setEditingPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [editingEdgeTuple, setEditingEdgeTuple] = useState<
    [string, string] | null
  >(null);
  const [editingWeight, setEditingWeight] = useState<string>('');
  const [editingEdgePosition, setEditingEdgePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const d3InstanceRef = useRef<{
    svg: any;
    container: any;
    simulation: ForceSimulation | null;
    edgeCreationSource: string | null;
    mousePosition: { x: number; y: number } | null;
    selectedNodeId: string | null | undefined;
    selectedEdgeTuple: [string, string] | null | undefined;
    currentDimensions: { width: number; height: number };
    previousDimensions: { width: number; height: number };
  } | null>(null);

  const getCurrentContainerDimensions = () => {
    if (!containerRef.current) return {width: 0, height: 0};

    const rect = containerRef.current.getBoundingClientRect();

    const parentElement = containerRef.current.parentElement;
    const parentRect = parentElement?.getBoundingClientRect();
    
    const effectiveHeight =
      parentRect && parentRect.height > 0 ? parentRect.height : rect.height;

    const containerWidth = Math.max(300, rect.width);
    const containerHeight = Math.max(300, effectiveHeight);

    return {width: containerWidth, height: containerHeight};
  }


  // Internal click handlers
  const handleNodeClick = (node: Node) => {
    d3InstanceRef.current!.selectedNodeId = node.label;
    d3InstanceRef.current!.selectedEdgeTuple = null;
    setSelectionChange(val => !val);
  };

  const handleEdgeClick = (edge: Edge) => {
    d3InstanceRef.current!.selectedEdgeTuple = [edge.source, edge.target];
    d3InstanceRef.current!.selectedNodeId = null;
    setSelectionChange(val => !val);
  };

  const handleNodeLabelEdit = (node: Node) => {
    // Find the node's current position in the D3 simulation
    const d3Node = d3InstanceRef.current?.simulation
      ?.nodes()
      ?.find((n: any) => n.id === node.label);
    if (d3Node && d3Node.x !== undefined && d3Node.y !== undefined) {
      setEditingNodeLabel(node.label);
      setEditingLabel(node.label);

      // Calculate position relative to the container, accounting for SVG centering
      const containerRect = containerRef.current?.getBoundingClientRect();
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (containerRect && svgRect) {
        const relativeX = d3Node.x + (svgRect.left - containerRect.left);
        const relativeY = d3Node.y + (svgRect.top - containerRect.top);
        setEditingPosition({ x: relativeX, y: relativeY });
      } else {
        setEditingPosition({ x: d3Node.x, y: d3Node.y });
      }
    }
  };

  const handleLabelEditSave = () => {
    if (editingNodeLabel && editingLabel.trim() !== '') {
      onNodeLabelEdit?.(editingNodeLabel, editingLabel.trim());
    }
    setEditingNodeLabel(null);
    setEditingLabel('');
    setEditingPosition(null);
  };

  const handleLabelEditCancel = () => {
    setEditingNodeLabel(null);
    setEditingLabel('');
    setEditingPosition(null);
  };

  const handleLabelEditKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleLabelEditSave();
    } else if (event.key === 'Escape') {
      handleLabelEditCancel();
    }
  };

  const handleEdgeWeightEdit = (edge: Edge) => {
    // Find the source and target nodes for this edge
    const sourceNode = d3InstanceRef.current?.simulation
      ?.nodes()
      ?.find((n: any) => n.id === edge.source);
    const targetNode = d3InstanceRef.current?.simulation
      ?.nodes()
      ?.find((n: any) => n.id === edge.target);

    if (
      sourceNode &&
      targetNode &&
      sourceNode.x !== undefined &&
      sourceNode.y !== undefined &&
      targetNode.x !== undefined &&
      targetNode.y !== undefined
    ) {
      setEditingEdgeTuple([edge.source, edge.target]);
      setEditingWeight(edge.weight || '');

      // Calculate the midpoint of the edge
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;

      // Calculate position relative to the container, accounting for SVG centering
      const containerRect = containerRef.current?.getBoundingClientRect();
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (containerRect && svgRect) {
        const relativeX = midX + (svgRect.left - containerRect.left);
        const relativeY = midY + (svgRect.top - containerRect.top);
        setEditingEdgePosition({ x: relativeX, y: relativeY });
      } else {
        setEditingEdgePosition({ x: midX, y: midY });
      }
    }
  };

  const handleWeightEditSave = () => {
    if (editingEdgeTuple) {
      onEdgeWeightEdit?.(
        editingEdgeTuple[0],
        editingEdgeTuple[1],
        editingWeight.trim()
      );
    }
    setEditingEdgeTuple(null);
    setEditingWeight('');
    setEditingEdgePosition(null);
  };

  const handleWeightEditCancel = () => {
    setEditingEdgeTuple(null);
    setEditingWeight('');
    setEditingEdgePosition(null);
  };

  const handleWeightEditKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleWeightEditSave();
    } else if (event.key === 'Escape') {
      handleWeightEditCancel();
    }
  };

  // Function to scale node positions proportionally when resizing
  const scaleNodePositions = (oldWidth: number, oldHeight: number, newWidth: number, newHeight: number) => {
    if (!d3InstanceRef.current?.simulation) return;

    const simulation = d3InstanceRef.current.simulation;
    const nodes = simulation.nodes() as D3Node[];
    
    // Calculate scale factors
    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;
        
    console.log("@@@@ Scaling with factors:", { scaleX, scaleY });
    
    // Scale all node positions and update the graphData
    const updatedPositions: Array<{ label: string; x: number; y: number }> = [];
    
    nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        const newX = node.x * scaleX;
        const newY = node.y * scaleY;
        
        // Update the D3 node position
        node.x = newX;
        node.y = newY;
        
        // Also scale fixed positions if they exist
        if (node.fx !== undefined && node.fx !== null) {
          node.fx = node.fx * scaleX;
        }
        if (node.fy !== undefined && node.fy !== null) {
          node.fy = node.fy * scaleY;
        }
        
        // Collect updated positions for graphData update
        updatedPositions.push({
          label: node.label || node.id,
          x: newX,
          y: newY
        });
      }
    });

    console.log("@@@@ updatedPositions", updatedPositions);

    // Update the parent component with new positions
    if (onNodePositionUpdate && updatedPositions.length > 0) {
      onNodePositionUpdate(updatedPositions);
    }
  };

  // Comprehensive resize handler
  const handleResize = () => {
    if (!containerRef.current || !svgRef.current || !d3InstanceRef.current) return;

    const containerDimensions = getCurrentContainerDimensions();
    const { currentDimensions, previousDimensions } = d3InstanceRef.current;

    // Keep the area square by using the smaller dimension
    const squareSize = Math.min(containerDimensions.width, containerDimensions.height);
    const newDimensions = { width: squareSize, height: squareSize };

    // Check if dimensions actually changed
    const hasChanged = 
      currentDimensions.width !== newDimensions.width || 
      currentDimensions.height !== newDimensions.height;
    if (!hasChanged) return;
    if (Math.abs(currentDimensions.width - newDimensions.width) < 10 || 
        Math.abs(currentDimensions.height - newDimensions.height) < 10) {
      return;
    }

    console.log("@@@@ Resizing from", currentDimensions, "to", newDimensions);

    // Update previous dimensions before scaling
    d3InstanceRef.current.previousDimensions = { ...currentDimensions };
    d3InstanceRef.current.currentDimensions = { ...newDimensions };

    // Scale node positions if we have previous dimensions
    if (previousDimensions.width > 0 && previousDimensions.height > 0) {
      scaleNodePositions(
        previousDimensions.width,
        previousDimensions.height,
        newDimensions.width,
        newDimensions.height
      );
    }

    // Update SVG dimensions
    svgRef.current.setAttribute('width', newDimensions.width.toString());
    svgRef.current.setAttribute('height', newDimensions.height.toString());
    svgRef.current.style.width = `${newDimensions.width}px`;
    svgRef.current.style.height = `${newDimensions.height}px`;

    // Update drag behavior for existing nodes with new dimensions
    updateNodeDragBehavior(newDimensions.width, newDimensions.height);

    // Update force simulation boundaries
    if (d3InstanceRef.current.simulation) {
      const simulation = d3InstanceRef.current.simulation;
      
      // Update boundary force with new dimensions
      simulation.force(
        'boundary',
        createBoundaryForce(simulation, svgRef.current, nodeRadius)
      );

      // Update collision radius if needed
      simulation.force('collision', d3.forceCollide().radius(nodeRadius + 10));

      // Restart simulation gently to apply new boundaries
      simulation.alpha(0.1).restart();
    }
  };

  // Function to update drag behavior for existing nodes with new dimensions
  const updateNodeDragBehavior = (newWidth: number, newHeight: number) => {
    if (!d3InstanceRef.current) return;

    const { container, simulation } = d3InstanceRef.current;
    if (!container || !simulation) return;

    // Update drag behavior for all existing nodes
    container
      .selectAll('.node')
      .call(
        d3Utils.createDrag(
          simulation,
          mode,
          newWidth,
          newHeight,
          nodeRadius,
          svgRef.current
        )
      );
  };

  // Setup SVG event handlers
  const setupSVGEventHandlers = () => {
    const svg = d3.select(svgRef.current);

    // Add mouse tracking for edge creation preview
    svg.on('mousemove', (event: any) => {
      if (d3InstanceRef.current?.edgeCreationSource) {
        const rect = svg.node()?.getBoundingClientRect();
        if (rect) {
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          d3InstanceRef.current.mousePosition = { x, y };
          updatePreviewLine();

          // Update cursor based on whether we're over a valid target
          const targetNode = d3InstanceRef.current.container
            .selectAll('.node')
            .data()
            .find((d: D3Node) => {
              if (d.id === d3InstanceRef.current?.edgeCreationSource)
                return false;
              const dx = (d.x || 0) - x;
              const dy = (d.y || 0) - y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return distance <= 30;
            });

          svg.style('cursor', targetNode ? 'crosshair' : 'not-allowed');
        }
      }
    });

    svg.on('mouseleave', () => {
      if (d3InstanceRef.current) {
        d3InstanceRef.current.mousePosition = null;
        updatePreviewLine();
        // Reset cursor when mouse leaves
        svg.style('cursor', getModeCursor());
      }
    });

    // Add click handler for empty space (node creation and edge creation cancellation)
    svg.on('click', (event: any) => {
      if (event.target === svg.node()) {
        // Check if this event should be processed based on mode
        if (!shouldProcessEvent('click', 'empty')) {
          return;
        }

        // Cancel edge creation if in edge creation mode
        if (d3InstanceRef.current?.edgeCreationSource) {
          d3InstanceRef.current.selectedNodeId = null;
          d3InstanceRef.current.selectedEdgeTuple = null;
          setSelectionChange(val => !val);

          d3InstanceRef.current.edgeCreationSource = null;
          d3InstanceRef.current.mousePosition = null;
          setEdgeCreationCancel(val => !val);
          // Reset cursor
          svg.style('cursor', getModeCursor());
          return;
        }

        if (
          d3InstanceRef.current?.selectedNodeId ||
          d3InstanceRef.current?.selectedEdgeTuple
        ) {
          d3InstanceRef.current.selectedNodeId = null;
          d3InstanceRef.current.selectedEdgeTuple = null;
          setSelectionChange(val => !val);
          return;
        }

        // Only create nodes when in edit mode
        if (mode === 'edit' && onNodeCreate) {
          // Get coordinates relative to the SVG
          const [x, y] = d3.pointer(event, svg.node());
          onNodeCreate(x, y);
        }
      }
    });
  };

  // Initialize D3 instance (runs only once)
  const initializeD3Instance = () => {
    if (!svgRef.current || d3InstanceRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    // Get initial dimensions and keep them square
    const containerDimensions = getCurrentContainerDimensions();
    const squareSize = Math.min(containerDimensions.width, containerDimensions.height);
    const initialDimensions = { width: squareSize, height: squareSize };
    
    // Update SVG with initial dimensions
    svgRef.current.setAttribute('width', initialDimensions.width.toString());
    svgRef.current.setAttribute('height', initialDimensions.height.toString());
    svgRef.current.style.width = `${initialDimensions.width}px`;
    svgRef.current.style.height = `${initialDimensions.height}px`;

    // Create main group for graph elements
    const container = svg
      .append('g')
      .attr('class', 'graph-group')
      .attr('data-testid', 'graph-container');

    // Create force simulation with responsive dimensions and optimal preset
    const optimalPreset = d3Utils.getOptimalPreset(
      data.nodes.length,
      data.edges.length
    );
    const simulation = d3Utils.createForceSimulation(
      initialDimensions.width,
      initialDimensions.height,
      nodeRadius,
      svgRef.current,
      optimalPreset
    );

    // Store D3 instance with initial dimensions
    d3InstanceRef.current = {
      svg,
      container,
      simulation,
      edgeCreationSource: null,
      mousePosition: null,
      selectedNodeId: null,
      selectedEdgeTuple: null,
      currentDimensions: { ...initialDimensions },
      previousDimensions: { width: 0, height: 0 },
    };

    // Setup SVG event handlers
    setupSVGEventHandlers();
  };

  // Update preview line
  const updatePreviewLine = () => {
    if (!d3InstanceRef.current) return;

    const { svg, edgeCreationSource, mousePosition } = d3InstanceRef.current;

    // Remove existing preview line
    svg.selectAll('.preview-line').remove();

    if (edgeCreationSource && mousePosition) {
      // Find source node position
      const sourceNode = d3InstanceRef.current.container
        .selectAll('.node')
        .data()
        .find((d: D3Node) => d.id === edgeCreationSource);

      if (sourceNode) {
        // Check if mouse is over a valid target node
        const targetNode = d3InstanceRef.current.container
          .selectAll('.node')
          .data()
          .find((d: D3Node) => {
            if (d.id === edgeCreationSource) return false; // Can't connect to self
            const dx = (d.x || 0) - mousePosition.x;
            const dy = (d.y || 0) - mousePosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= 30; // Within 30px of a node
          });

        // Determine line color based on whether we're over a valid target
        const lineColor = targetNode ? '#4caf50' : '#1976d2'; // Green for valid target, blue otherwise
        const lineOpacity = targetNode ? 0.9 : 0.7;

        // Add new preview line
        svg
          .append('line')
          .attr('class', 'preview-line')
          .attr('x1', sourceNode.x || 0)
          .attr('y1', sourceNode.y || 0)
          .attr('x2', mousePosition.x)
          .attr('y2', mousePosition.y)
          .attr('stroke', lineColor)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', lineOpacity)
          .style('pointer-events', 'none')
          .style(
            'transition',
            'stroke 0.2s ease-in-out, opacity 0.2s ease-in-out'
          );
      }
    }
  };

  // Helper function to handle node click logic
  const handleNodeClickLogic = (node: D3Node) => {
    // Check if this event should be processed based on mode
    if (!shouldProcessEvent('click', 'node')) {
      return;
    }

    if (mode === 'edit') {
      // Check if we're in edge creation mode
      if (d3InstanceRef.current?.edgeCreationSource) {
        // Handle edge creation
        if (d3InstanceRef.current.edgeCreationSource === node.label) {
          // Cancel edge creation if clicking the same node
          d3InstanceRef.current.edgeCreationSource = null;
          d3InstanceRef.current.mousePosition = null;
          // Reset cursor
          if (d3InstanceRef.current?.svg) {
            d3InstanceRef.current.svg.style('cursor', getModeCursor());
          }
        } else {
          // Complete edge creation and continue from target node
          onEdgeCreate?.(d3InstanceRef.current.edgeCreationSource, node.label);
          // Continue edge creation from the target node
          d3InstanceRef.current!.edgeCreationSource = node.label;
          // Select the target node to show its nib
          const originalNode = data.nodes.find(n => n.label === node.label);
          if (originalNode) {
            handleNodeClick(originalNode);
          }
        }
      } else {
        // Handle node selection/deselection
        const originalNode = data.nodes.find(n => n.label === node.label);
        if (originalNode) {
          handleNodeClick(originalNode);
        }
      }
    } else if (mode === 'delete') {
      // Handle node deletion in delete mode
      onNodeDelete?.(node.label);
    } else {
      // Handle node selection/deselection in non-edit modes
      const originalNode = data.nodes.find(n => n.label === node.label);
      if (originalNode) {
        handleNodeClick(originalNode);
      }
    }
  };

  // Helper function to handle edge click logic
  const handleEdgeClickLogic = (edge: D3Edge) => {
    // Check if this event should be processed based on mode
    if (!shouldProcessEvent('click', 'edge')) {
      return;
    }

    if (mode === 'delete') {
      // Handle edge deletion in delete mode
      const sourceLabel =
        typeof edge.source === 'string' ? edge.source : edge.source.label;
      const targetLabel =
        typeof edge.target === 'string' ? edge.target : edge.target.label;
      onEdgeDelete?.(sourceLabel, targetLabel);
    } else {
      // Handle edge selection/deselection in non-delete modes
      const sourceLabel =
        typeof edge.source === 'string' ? edge.source : edge.source.label;
      const targetLabel =
        typeof edge.target === 'string' ? edge.target : edge.target.label;
      const originalEdge = data.edges.find(
        e => e.source === sourceLabel && e.target === targetLabel
      );
      if (originalEdge) {
        handleEdgeClick(originalEdge);
      }
    }
  };

  // Helper function to handle edge double-click logic
  const handleEdgeDoubleClickLogic = (edge: D3Edge) => {
    // Check if this event should be processed based on mode
    if (!shouldProcessEvent('dblclick', 'edge')) {
      return;
    }

    // Only allow edge weight editing in edit mode
    if (mode === 'edit') {
      const sourceLabel =
        typeof edge.source === 'string' ? edge.source : edge.source.label;
      const targetLabel =
        typeof edge.target === 'string' ? edge.target : edge.target.label;
      const originalEdge = data.edges.find(
        e => e.source === sourceLabel && e.target === targetLabel
      );
      if (originalEdge) {
        handleEdgeWeightEdit(originalEdge);
      }
    }
  };

  // Helper function to determine if an event should be processed based on mode
  const shouldProcessEvent = (
    eventType: 'click' | 'dblclick' | 'drag',
    target: 'node' | 'edge' | 'empty'
  ): boolean => {
    switch (mode) {
      case 'edit':
        // In edit mode, all events are allowed for full editing capabilities
        return true;
      case 'delete':
        // In delete mode, only clicks for deletion are allowed
        // No node creation, edge creation, or editing
        return (
          eventType === 'click' && (target === 'node' || target === 'edge')
        );
      case 'view-force':
        // In view-force mode, only drag events for node movement are allowed
        // No creation, editing, or deletion
        return eventType === 'drag' && target === 'node';
      default:
        return true;
    }
  };

  // Helper function to get mode-specific cursor
  const getModeCursor = (): string => {
    switch (mode) {
      case 'edit':
        return 'crosshair';
      case 'delete':
        return 'not-allowed';
      case 'view-force':
        return 'grab';
      default:
        return 'default';
    }
  };

  // Function to fix or unfix all nodes in the simulation
  const fixAllNodes = (fix: boolean) => {
    if (d3InstanceRef.current?.simulation) {
      const nodes = d3InstanceRef.current.simulation.nodes() as D3Node[];
      nodes.forEach(node => {
        if (fix) {
          // Fix nodes in place by setting fx and fy to current position
          node.fx = node.x ?? 0;
          node.fy = node.y ?? 0;
        } else {
          // Unfix nodes to allow free movement
          node.fx = null;
          node.fy = null;
        }
      });
    }
  };


  // Update D3 data and rendering
  const updateD3Data = () => {
    if (!d3InstanceRef.current) return;
    // console.log("@@@@ updateD3Data");

    const { container, simulation, currentDimensions } = d3InstanceRef.current;
    const d3Data = convertToD3Data(data, currentDimensions);

    // Handle arrow markers for directed graphs (only add if not already present)
    if (data.type === 'directed') {
      const existingDefs = container.select('defs');
      if (existingDefs.empty()) {
        const defs = container.append('defs');

        // Default arrow marker (black)
        defs
          .append('marker')
          .attr('id', 'arrowhead')
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 8)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', '#000000');

        // Selected arrow marker (blue)
        defs
          .append('marker')
          .attr('id', 'arrowhead-selected')
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 8)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', '#1976d2');
      }
    } else {
      // Remove arrow markers for undirected graphs
      container.select('defs').remove();
    }

    // Render edges
    let edgeGroup = container.select('.edges-group');
    if (edgeGroup.empty()) {
      edgeGroup = container.append('g').attr('class', 'edges-group');
    }
    const edges = edgeGroup
      .selectAll('.edge-container')
      .data(d3Data.edges, (d: any) => d.id)
      .join(
        (enter: any) => {
          const edgeEnter = enter
            .append('g')
            .attr('class', 'edge-container')
            .attr('data-edge-source', (d: D3Edge) => d.source)
            .attr('data-edge-target', (d: D3Edge) => d.target);

          // Add invisible clickable area (wider stroke)
          edgeEnter
            .append('line')
            .attr('class', 'edge-clickable')
            .attr(
              'stroke',
              showClickableAreas ? 'rgba(255, 0, 0, 0.3)' : 'transparent'
            )
            .attr('stroke-width', 15)
            .style('cursor', 'pointer');

          // Add visible edge line
          edgeEnter
            .append('line')
            .attr('class', 'graph-edge')
            .attr('opacity', 1);

          // Add weight label text
          edgeEnter
            .append('text')
            .attr('class', 'edge-weight-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .attr('font-size', '10px')
            .attr('font-weight', 'normal')
            .attr('fill', '#000000')
            .style('pointer-events', 'none')
            .style('user-select', 'none')
            .text((d: D3Edge) => d.weight || '');

          edgeEnter.each(function (this: any, d: D3Edge) {
            const edgeContainer = d3.select(this);
            const visibleEdge = edgeContainer.select('.graph-edge');
            const sourceLabel =
              typeof d.source === 'string' ? d.source : d.source.label;
            const targetLabel =
              typeof d.target === 'string' ? d.target : d.target.label;
            const isSelected =
              d3InstanceRef.current?.selectedEdgeTuple &&
              d3InstanceRef.current.selectedEdgeTuple[0] === sourceLabel &&
              d3InstanceRef.current.selectedEdgeTuple[1] === targetLabel;
            const isDirected = data.type === 'directed';
            applyEdgeStyling(
              visibleEdge,
              isSelected || false,
              '#000000',
              edgeStrokeWidth,
              isDirected
            );
          });

          edgeEnter.each(function (this: any, d: D3Edge) {
            const edgeContainer = d3.select(this);
            const clickableEdge = edgeContainer.select('.edge-clickable');
            const eventHandlers = createEdgeEventHandlers(d, {
              onEdgeClick: edge => {
                handleEdgeClickLogic(edge);
              },
              onEdgeDoubleClick: edge => {
                handleEdgeDoubleClickLogic(edge);
              },
              onEdgeMouseEnter: edge => {
                const edgeElement = d3.select(
                  `[data-edge-source="${edge.source}"][data-edge-target="${edge.target}"] .graph-edge`
                );
                const isDirected = data.type === 'directed';
                applyEdgeStyling(
                  edgeElement,
                  false,
                  '#000000',
                  edgeStrokeWidth,
                  isDirected
                );
              },
              onEdgeMouseLeave: edge => {
                const edgeElement = d3.select(
                  `[data-edge-source="${edge.source}"][data-edge-target="${edge.target}"] .graph-edge`
                );
                const isSelected =
                  d3InstanceRef.current?.selectedEdgeTuple &&
                  d3InstanceRef.current.selectedEdgeTuple[0] === edge.source &&
                  d3InstanceRef.current.selectedEdgeTuple[1] === edge.target;
                const isDirected = data.type === 'directed';
                applyEdgeStyling(
                  edgeElement,
                  isSelected || false,
                  '#000000',
                  edgeStrokeWidth,
                  isDirected
                );
              },
            });

            const visibleEdge = edgeContainer.select('.graph-edge');

            clickableEdge
              .on('click', eventHandlers.click)
              .on('dblclick', eventHandlers.dblclick)
              .on('mouseenter', eventHandlers.mouseenter)
              .on('mouseleave', eventHandlers.mouseleave);

            // Also attach event handlers to the visible edge line
            visibleEdge
              .on('click', eventHandlers.click)
              .on('dblclick', eventHandlers.dblclick)
              .on('mouseenter', eventHandlers.mouseenter)
              .on('mouseleave', eventHandlers.mouseleave);
          });

          return edgeEnter;
        },
        (update: any) => {
          update.each(function (this: any, d: D3Edge) {
            const edgeContainer = d3.select(this);
            const visibleEdge = edgeContainer.select('.graph-edge');
            const clickableEdge = edgeContainer.select('.edge-clickable');
            const sourceLabel =
              typeof d.source === 'string' ? d.source : d.source.label;
            const targetLabel =
              typeof d.target === 'string' ? d.target : d.target.label;
            const isSelected =
              d3InstanceRef.current?.selectedEdgeTuple &&
              d3InstanceRef.current.selectedEdgeTuple[0] === sourceLabel &&
              d3InstanceRef.current.selectedEdgeTuple[1] === targetLabel;
            const isDirected = data.type === 'directed';
            applyEdgeStyling(
              visibleEdge,
              isSelected || false,
              '#000000',
              edgeStrokeWidth,
              isDirected
            );

            // Update weight label text
            edgeContainer.select('.edge-weight-label').text(d.weight || '');

            // Re-attach event handlers for existing edges
            const eventHandlers = createEdgeEventHandlers(d, {
              onEdgeClick: edge => {
                handleEdgeClickLogic(edge);
              },
              onEdgeDoubleClick: edge => {
                handleEdgeDoubleClickLogic(edge);
              },
              onEdgeMouseEnter: edge => {
                const edgeElement = d3.select(
                  `[data-edge-source="${edge.source}"][data-edge-target="${edge.target}"] .graph-edge`
                );
                const isDirected = data.type === 'directed';
                applyEdgeStyling(
                  edgeElement,
                  false,
                  '#000000',
                  edgeStrokeWidth,
                  isDirected
                );
              },
              onEdgeMouseLeave: edge => {
                const edgeElement = d3.select(
                  `[data-edge-source="${edge.source}"][data-edge-target="${edge.target}"] .graph-edge`
                );
                const isSelected =
                  d3InstanceRef.current?.selectedEdgeTuple &&
                  d3InstanceRef.current.selectedEdgeTuple[0] === edge.source &&
                  d3InstanceRef.current.selectedEdgeTuple[1] === edge.target;
                const isDirected = data.type === 'directed';
                applyEdgeStyling(
                  edgeElement,
                  isSelected || false,
                  '#000000',
                  edgeStrokeWidth,
                  isDirected
                );
              },
            });

            clickableEdge
              .on('click', eventHandlers.click)
              .on('dblclick', eventHandlers.dblclick)
              .on('mouseenter', eventHandlers.mouseenter)
              .on('mouseleave', eventHandlers.mouseleave);

            // Also attach event handlers to the visible edge line
            visibleEdge
              .on('click', eventHandlers.click)
              .on('dblclick', eventHandlers.dblclick)
              .on('mouseenter', eventHandlers.mouseenter)
              .on('mouseleave', eventHandlers.mouseleave);
          });
          return update;
        },
        (exit: any) => {
          return exit.remove();
        }
      );

    // Render nodes
    let nodeGroup = container.select('.nodes-group');
    if (nodeGroup.empty()) {
      nodeGroup = container.append('g').attr('class', 'nodes-group');
    }
    const nodes = nodeGroup
      .selectAll('.node')
      .data(d3Data.nodes, (d: any) => d.id)
      .join(
        (enter: any) => {
          const nodeEnter = enter
            .append('g')
            .attr('class', 'node')
            .attr('data-node-label', (d: D3Node) => d.label)
            .attr('opacity', 1)
            .call(
              d3Utils.createDrag(
                simulation!,
                mode,
                currentDimensions.width,
                currentDimensions.height,
                nodeRadius,
                svgRef.current
              )
            );

          nodeEnter.append('circle').attr('class', 'graph-node');

          nodeEnter
            .append('text')
            .attr('class', 'graph-node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', '12px')
            .text((d: D3Node) => d.label);

          nodeEnter.each(function (this: any, d: D3Node) {
            const nodeSelection = d3.select(this);
            const isSelected = d3InstanceRef.current?.selectedNodeId === d.id;
            const isEditMode = mode === 'edit';
            const isSource = d3InstanceRef.current?.edgeCreationSource === d.id;

            applyNodeStyling(nodeSelection, isSelected, nodeRadius, isSource);
            applyNodeNibs(
              nodeSelection,
              isEditMode && isSelected && !isSource,
              nodeRadius,
              node => {
                // Nib click starts edge creation mode
                if (
                  mode === 'edit' &&
                  !d3InstanceRef.current?.edgeCreationSource
                ) {
                  d3InstanceRef.current!.edgeCreationSource = node.label;
                }
              }
            );
          });

          nodeEnter.each(function (this: any, d: D3Node) {
            const nodeSelection = d3.select(this);
            const eventHandlers = createNodeEventHandlers(d, {
              onNodeClick: node => handleNodeClickLogic(node),
              onNodeDoubleClick: node => {
                // Double-click for node label editing
                const originalNode = data.nodes.find(
                  n => n.label === node.label
                );
                if (originalNode) {
                  handleNodeLabelEdit(originalNode);
                }
              },
              onNodeMouseEnter: () => {
                // Mouse enter/leave styling removed to avoid conflicts with selection styling
              },
              onNodeMouseLeave: () => {
                // Mouse enter/leave styling removed to avoid conflicts with selection styling
              },
            });

            nodeSelection
              .on('click', eventHandlers.click)
              .on('dblclick', eventHandlers.dblclick)
              .on('dragstart', eventHandlers.dragstart);
          });

          return nodeEnter;
        },
        (update: any) => {
          update.each(function (this: any, d: D3Node) {
            const nodeSelection = d3.select(this);
            const isSelected = d3InstanceRef.current?.selectedNodeId === d.id;
            const isEditMode = mode === 'edit';
            const isSource = d3InstanceRef.current?.edgeCreationSource === d.id;

            // Update the node label text and attribute
            nodeSelection
              .attr('data-node-label', d.label)
              .select('text')
              .text(d.label);

            applyNodeStyling(nodeSelection, isSelected, nodeRadius, isSource);
            applyNodeNibs(
              nodeSelection,
              isEditMode && isSelected && !isSource,
              nodeRadius,
              node => {
                // Nib click starts edge creation mode
                if (
                  mode === 'edit' &&
                  !d3InstanceRef.current?.edgeCreationSource
                ) {
                  d3InstanceRef.current!.edgeCreationSource = node.label;
                }
              }
            );

            // Re-attach event handlers for existing nodes
            const eventHandlers = createNodeEventHandlers(d, {
              onNodeClick: node => handleNodeClickLogic(node),
              onNodeDoubleClick: node => {
                // Double-click for node label editing
                const originalNode = data.nodes.find(
                  n => n.label === node.label
                );
                if (originalNode) {
                  handleNodeLabelEdit(originalNode);
                }
              },
              onNodeMouseEnter: () => {
                // Mouse enter/leave styling removed to avoid conflicts with selection styling
              },
              onNodeMouseLeave: () => {
                // Mouse enter/leave styling removed to avoid conflicts with selection styling
              },
            });

            nodeSelection
              .on('click', eventHandlers.click)
              .on('dblclick', eventHandlers.dblclick)
              .on('dragstart', eventHandlers.dragstart);
          });
          return update;
        },
        (exit: any) => {
          return exit.remove();
        }
      );


    // Update simulation with new data - all forces are configured in d3Config.ts
    if (simulation) {
      simulation.nodes(d3Data.nodes);
      (simulation.force('link') as any)?.links(d3Data.edges);

      // Update positions on simulation tick
      simulation.on('tick', () => {
        edges.each(function (this: any, d: D3Edge) {
          const edgeContainer = d3.select(this);
          const source = d.source as D3Node;
          const target = d.target as D3Node;

          // Calculate line endpoints at node circumference
          const dx = (target.x || 0) - (source.x || 0);
          const dy = (target.y || 0) - (source.y || 0);
          const length = Math.sqrt(dx * dx + dy * dy);

          if (length > 0) {
            // Calculate unit vector
            const unitX = dx / length;
            const unitY = dy / length;

            // Calculate endpoints at node circumference
            const x1 = (source.x || 0) + unitX * nodeRadius;
            const y1 = (source.y || 0) + unitY * nodeRadius;
            const x2 = (target.x || 0) - unitX * nodeRadius;
            const y2 = (target.y || 0) - unitY * nodeRadius;

            // Update both clickable and visible lines
            edgeContainer
              .selectAll('line')
              .attr('x1', x1)
              .attr('y1', y1)
              .attr('x2', x2)
              .attr('y2', y2);

            // Update weight label position (midpoint of the edge)
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            edgeContainer
              .select('.edge-weight-label')
              .attr('x', midX)
              .attr('y', midY);
          }
        });

        nodes.attr(
          'transform',
          (d: D3Node) => `translate(${d.x || 0},${d.y || 0})`
        );

        // Save node positions back to the Graph model (throttled)
        if (onNodePositionUpdate && simulation.nodes().length > 0) {
          const now = Date.now();
          if (now - lastPositionUpdateRef.current > positionUpdateThrottle) {
            const positions = simulation.nodes().map((node: any) => ({
              label: node.label || node.id,
              x: node.x || 0,
              y: node.y || 0,
            }));
            onNodePositionUpdate(positions);
            lastPositionUpdateRef.current = now;
          }
        }

        updatePreviewLine();
      });

      // Save final positions when simulation ends
      simulation.on('end', () => {
        if (onNodePositionUpdate && simulation.nodes().length > 0) {
          const positions = simulation.nodes().map((node: any) => ({
            label: node.label || node.id,
            x: node.x || 0,
            y: node.y || 0,
          }));
          onNodePositionUpdate(positions);
        }
      });

      if (mode === 'edit' || mode === 'delete') {
        simulation.alpha(0).restart(); // Very gentle restart to minimize disruption when adding/removing nodes/edges
        // Re-fix nodes after restart to maintain edit/delete mode behavior
        fixAllNodes(true);
      }
    }
  };

  // Convert Graph model data to D3 format
  const convertToD3Data = (graphData: GraphData, dimensions: {width: number, height: number}) => {
    // Get existing node positions from the simulation if it exists
    const existingNodes = d3InstanceRef.current?.simulation?.nodes() || [];
    const existingNodeMap = new Map(
      existingNodes.map((node: any) => [node.label, { x: node.x, y: node.y }])
    );

    let offsetX = 100;
    let offsetY = dimensions.height/2;

    const d3Nodes: D3Node[] = graphData.nodes.map((node, index) => {
      // First priority: Use stored position from Graph model
      if (node.x !== undefined && node.y !== undefined) {
        return {
          id: node.label, // Use label as ID for D3
          label: node.label,
          x: node.x,
          y: node.y,
        };
      }

      // Second priority: Preserve existing position from simulation if available
      const existingPos = existingNodeMap.get(node.label);
      if (
        existingPos &&
        existingPos.x !== undefined &&
        existingPos.y !== undefined
      ) {
        return {
          id: node.label, // Use label as ID for D3
          label: node.label,
          x: existingPos.x,
          y: existingPos.y,
        };
      }

      // Third priority: Check if this is the newest node and we have a position for it
      const isNewestNode = index === graphData.nodes.length - 1;
      if (isNewestNode && newNodePosition) {
        return {
          id: node.label, // Use label as ID for D3
          label: node.label,
          x: newNodePosition.x,
          y: newNodePosition.y,
        };
      }

      // Fallback: Generate new position for other new nodes
      return {
        id: node.label, // Use label as ID for D3
        label: node.label,
        x: offsetX + (index % 4) * dimensions.width / 4,
        y: offsetY + Math.floor(index / 4) * dimensions.height / 4,
      };
    });

    // Log the d3 nodes position data.
    console.log("@@@@ d3Nodes", d3Nodes);

    const d3Edges: D3Edge[] = graphData.edges.map((edge, index) => ({
      id: `edge_${index}`, // Generate a simple ID for D3 edges
      source: edge.source, // This is the node label
      target: edge.target, // This is the node label
      ...(edge.weight && { weight: edge.weight }),
    }));

    return { nodes: d3Nodes, edges: d3Edges };
  };

  // Initialize D3 instance once
  useEffect(() => {
    initializeD3Instance();
  }, []);

  // Setup ResizeObserver for automatic resize detection
  useEffect(() => {
    if (!containerRef.current) return;

    // Create ResizeObserver
    resizeObserverRef.current = new ResizeObserver(() => {
      handleResize();
    });

    // Start observing the container
    resizeObserverRef.current.observe(containerRef.current);

    // Initial resize to set accurate dimensions
    const timer = setTimeout(() => {
      handleResize();
    }, 100);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      clearTimeout(timer);
    };
  }, []);

  // Update data when it changes (excluding dimensions to avoid recreating graph on resize)
  useEffect(() => {
    setupSVGEventHandlers();
    updateD3Data();
  }, [data, mode, newNodePosition]);

  // Recreate simulation when nodeRadius or edgeStrokeWidth changes
  useEffect(() => {
    if (d3InstanceRef.current?.simulation) {
      const { simulation, currentDimensions } = d3InstanceRef.current;

      // Update collision radius
      simulation.force('collision', d3.forceCollide().radius(nodeRadius + 10));

      // Update boundary force with padding
      simulation.force(
        'boundary',
        createBoundaryForce(simulation, svgRef.current, nodeRadius)
      );

      // Update drag behavior for existing nodes
      updateNodeDragBehavior(currentDimensions.width, currentDimensions.height);

      // Restart simulation with new settings
      simulation.alpha(0.3).restart();
      // Re-fix nodes after restart to maintain current mode behavior
      // fixAllNodes(mode !== 'view-force');
    }
  }, [nodeRadius, edgeStrokeWidth]);

  // Update visual styling when nodeRadius or edgeStrokeWidth changes
  useEffect(() => {
    // Force a complete data update to ensure all styling is reapplied
    updateD3Data();
  }, [nodeRadius, edgeStrokeWidth]);

  // Clear selections and interactive states when graph structure changes
  // Only clear if the actual structure changed, not just data object recreation
  useEffect(() => {
    if (d3InstanceRef.current) {
      d3InstanceRef.current.selectedNodeId = null;
      d3InstanceRef.current.selectedEdgeTuple = null;
      d3InstanceRef.current.edgeCreationSource = null;
      d3InstanceRef.current.mousePosition = null;
      setSelectionChange(val => !val);
      setEdgeCreationCancel(val => !val);
      setEditingNodeLabel(null);
      setEditingLabel('');
    }
  }, [data.nodes, data.edges]);

  // Update selection styling without restarting simulation
  useEffect(() => {
    if (!d3InstanceRef.current) return;

    const { container } = d3InstanceRef.current;

    // Update node selection styling
    container.selectAll('.node').each(function (this: any, d: any) {
      const nodeSelection = d3.select(this);
      const isSelected = d3InstanceRef.current?.selectedNodeId === d.id;
      const isEditMode = mode === 'edit';
      const isSource = d3InstanceRef.current?.edgeCreationSource === d.id;

      applyNodeStyling(nodeSelection, isSelected, nodeRadius, isSource);
      applyNodeNibs(
        nodeSelection,
        isEditMode && isSelected && !isSource,
        nodeRadius,
        node => {
          // Nib click starts edge creation mode
          if (mode === 'edit' && !d3InstanceRef.current?.edgeCreationSource) {
            d3InstanceRef.current!.edgeCreationSource = node.label;
          }
        }
      );
    });

    // Update edge selection styling
    container.selectAll('.edge-container').each(function (this: any, d: any) {
      const edgeContainer = d3.select(this);
      const visibleEdge = edgeContainer.select('.graph-edge');
      const sourceLabel =
        typeof d.source === 'string' ? d.source : d.source.label;
      const targetLabel =
        typeof d.target === 'string' ? d.target : d.target.label;
      const isSelected =
        d3InstanceRef.current?.selectedEdgeTuple &&
        d3InstanceRef.current.selectedEdgeTuple[0] === sourceLabel &&
        d3InstanceRef.current.selectedEdgeTuple[1] === targetLabel;
      const isDirected = data.type === 'directed';
      applyEdgeStyling(
        visibleEdge,
        isSelected || false,
        '#000000',
        edgeStrokeWidth,
        isDirected
      );
    });
  }, [selectionChange, mode]);

  // Update edge creation state in D3 instance
  useEffect(() => {
    if (d3InstanceRef.current) {
      updatePreviewLine();
    }
  }, [edgeCreationCancel]);

  // Update clickable area visibility
  useEffect(() => {
    if (d3InstanceRef.current) {
      const { container } = d3InstanceRef.current;
      container
        .selectAll('.edge-clickable')
        .attr(
          'stroke',
          showClickableAreas ? 'rgba(255, 0, 0, 0.3)' : 'transparent'
        );
    }
  }, [showClickableAreas]);

  // Call onNewNodePositioned after a new node has been positioned
  useEffect(() => {
    if (newNodePosition && onNewNodePositioned) {
      // Use a small delay to ensure the node has been positioned in the simulation
      const timer = setTimeout(() => {
        onNewNodePositioned();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [newNodePosition, onNewNodePositioned]);

  // Comprehensive state cleanup function for mode transitions
  const performModeTransitionCleanup = () => {
    console.log('Performing comprehensive mode transition cleanup');

    if (d3InstanceRef.current) {
      // Clear all interactive states
      d3InstanceRef.current.selectedNodeId = null;
      d3InstanceRef.current.selectedEdgeTuple = null;
      d3InstanceRef.current.edgeCreationSource = null;
      d3InstanceRef.current.mousePosition = null;

      // Trigger re-renders to clear visual states
      setSelectionChange(val => !val);
      setEdgeCreationCancel(val => !val);

      // Clear any editing states
      setEditingNodeLabel(null);
      setEditingLabel('');

      // Clear preview line
      if (d3InstanceRef.current.svg) {
        d3InstanceRef.current.svg.selectAll('.preview-line').remove();
        d3InstanceRef.current.svg.style('cursor', getModeCursor());
      }

      console.log('Mode transition cleanup completed');
    }

    // Call parent cleanup callback if provided
    onModeTransitionCleanup?.();
  };

  // Control force simulation and perform cleanup based on mode
  useEffect(() => {
    // Perform comprehensive state cleanup on mode change
    performModeTransitionCleanup();

    if (d3InstanceRef.current?.simulation) {
      const { simulation } = d3InstanceRef.current;

      // Update simulation preset if needed
      const optimalPreset = d3Utils.getOptimalPreset(
        data.nodes.length,
        data.edges.length
      );
      d3Utils.updateForceSimulationPreset(
        simulation,
        optimalPreset,
        nodeRadius
      );

      // Fix or unfix all nodes based on mode
      // fixAllNodes(mode === 'view-force' ? false : true);

      // Restart simulation with appropriate alpha
      if (mode === 'view-force') {
        simulation.alpha(0.5).restart();
        console.log(
          'Force simulation running in view-force mode with preset:',
          optimalPreset
        );
      } else {
        simulation.alpha(0.1).restart(); // Lower alpha for edit/delete modes
        console.log(
          'Force simulation running in',
          mode,
          'mode with fixed nodes'
        );
      }
      // Re-fix nodes after restart to maintain current mode behavior
      // fixAllNodes(mode !== 'view-force');
    }
  }, [mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (d3InstanceRef.current?.simulation) {
        d3InstanceRef.current.simulation.stop();
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="graph-container w-full h-full min-w-[300px] min-h-[300px] flex flex-col items-center justify-center relative"
      data-testid="graph-viewer"
    >
      {/* Mode indicator */}
      <div className="absolute top-2 left-2 z-10">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            mode === 'edit'
              ? 'bg-blue-100 text-blue-800'
              : mode === 'delete'
                ? 'bg-red-100 text-red-800'
                : mode === 'view-force'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
          }`}
        >
          {mode === 'edit'
            ? 'Edit Mode'
            : mode === 'delete'
              ? 'Delete Mode'
              : mode === 'view-force'
                ? 'View/Force Mode'
                : 'Unknown Mode'}
        </div>
      </div>
      <svg
        ref={svgRef}
        width={d3InstanceRef.current?.currentDimensions.width || WIDTH}
        height={d3InstanceRef.current?.currentDimensions.height || HEIGHT}
        className={`graph-svg border border-gray-200 rounded-lg bg-white cursor-${getModeCursor().replace('-', '-')}`}
        style={{
          width: `${d3InstanceRef.current?.currentDimensions.width || WIDTH}px`,
          height: `${d3InstanceRef.current?.currentDimensions.height || HEIGHT}px`,
        }}
      />

      {/* Debug Panel */}
      <div className="w-full">
        <button
          onClick={() => setDebugPanelExpanded(!debugPanelExpanded)}
          className="w-full flex items-center justify-between px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700"
        >
          <span>Debug</span>
          <svg
            className={`w-3 h-3 transition-transform ${debugPanelExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {debugPanelExpanded && (
          <div className="space-y-1">
            {/* Selection Info */}
            <div className="px-2 py-1 bg-blue-50 text-xs">
              <div className="font-medium text-blue-800">Selection</div>
              <div className="text-blue-700">
                Node:{' '}
                {d3InstanceRef.current?.selectedNodeId
                  ? data.nodes.find(
                      n => n.label === d3InstanceRef.current?.selectedNodeId
                    )?.label || `Node ${d3InstanceRef.current?.selectedNodeId}`
                  : 'none'}{' '}
                | Edge:{' '}
                {d3InstanceRef.current?.selectedEdgeTuple
                  ? `${d3InstanceRef.current.selectedEdgeTuple[0]}-${d3InstanceRef.current.selectedEdgeTuple[1]}`
                  : 'none'}
              </div>
            </div>


            {/* Debug Controls */}
            <div className="px-2 py-1 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClickableAreas}
                  onChange={e => setShowClickableAreas(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Show clickable areas</span>
              </label>
            </div>

            {/* Resize Test Buttons */}
            <div className="px-2 py-1 text-xs">
              <div className="font-medium text-gray-800 mb-1">Resize Test (Square)</div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (containerRef.current) {
                      containerRef.current.style.width = '400px';
                      containerRef.current.style.height = '400px';
                      // ResizeObserver will automatically detect the change and trigger handleResize
                    }
                  }}
                  className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                >
                  400x400
                </button>
                <button
                  onClick={() => {
                    if (containerRef.current) {
                      containerRef.current.style.width = '600px';
                      containerRef.current.style.height = '600px';
                      // ResizeObserver will automatically detect the change and trigger handleResize
                    }
                  }}
                  className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded"
                >
                  600x600
                </button>
                <button
                  onClick={() => {
                    if (containerRef.current) {
                      containerRef.current.style.width = '800px';
                      containerRef.current.style.height = '500px';
                      // ResizeObserver will automatically detect the change and trigger handleResize (will use 500x500)
                    }
                  }}
                  className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 rounded"
                >
                  800x500→500x500
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 animate-fade-in">
          <div className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => onError?.('')}
              className="ml-2 text-red-600 hover:text-red-800 focus:outline-none"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Inline Label Editor */}
      {editingNodeLabel && editingPosition && (
        <div
          className="absolute z-50"
          style={{
            left: `${editingPosition.x - 30}px`,
            top: `${editingPosition.y - 10}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <input
            type="text"
            value={editingLabel}
            onChange={e => setEditingLabel(e.target.value)}
            onKeyDown={handleLabelEditKeyDown}
            onBlur={handleLabelEditSave}
            className="px-1 py-0.5 text-xs border border-blue-500 rounded shadow-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-12"
            autoFocus
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              textAlign: 'center',
              height: '20px',
            }}
          />
        </div>
      )}

      {/* Inline Weight Editor */}
      {editingEdgeTuple && editingEdgePosition && (
        <div
          className="absolute z-50"
          style={{
            left: `${editingEdgePosition.x - 30}px`,
            top: `${editingEdgePosition.y - 10}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <input
            type="text"
            value={editingWeight}
            onChange={e => setEditingWeight(e.target.value)}
            onKeyDown={handleWeightEditKeyDown}
            onBlur={handleWeightEditSave}
            className="px-1 py-0.5 text-xs border border-black rounded shadow-lg bg-white focus:outline-none focus:ring-1 focus:ring-black w-12"
            autoFocus
            placeholder="weight"
            style={{
              fontSize: '10px',
              fontWeight: 'normal',
              textAlign: 'center',
              height: '20px',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GraphViewer;
