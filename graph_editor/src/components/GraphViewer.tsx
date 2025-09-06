import React, { useEffect, useRef, useState } from 'react';
import { d3, d3Utils, ForceSimulation, D3Node, D3Edge } from '@/utils/d3Config';
import { GraphData, Node, Edge } from '@/types/graph';
import { applyNodeStyling, createNodeEventHandlers, applyNodeNibs } from './Node';
import { applyEdgeStyling, createEdgeEventHandlers } from './Edge';

interface GraphViewerProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeCreate?: (x: number, y: number) => void;
  onEdgeCreate?: (sourceLabel: string, targetLabel: string) => void;
  mode?: 'edit' | 'delete' | 'view-force';
  newNodePosition?: { x: number; y: number } | null;
  onNewNodePositioned?: () => void;
}

const GraphViewer: React.FC<GraphViewerProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeCreate,
  onEdgeCreate,
  mode = 'edit',
  newNodePosition,
  onNewNodePositioned,
}) => {
  // Internal selection state
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Internal click handlers
  const handleNodeClick = (node: Node) => {
    console.log('Node clicked', node);
    console.log('Current selectedNodeLabel:', selectedNodeLabel);
    console.log('Clicked node label:', node.label);
    console.log('Will deselect?', selectedNodeLabel === node.label);
    
    // Toggle selection: if the same node is clicked, deselect it
    if (selectedNodeLabel === node.label) {
      console.log('Deselecting node');
      setSelectedNodeLabel(null);
    } else {
      console.log('Selecting node');
      // Select the clicked node and deselect any edge
      setSelectedNodeLabel(node.label);
      setSelectedEdgeId(null);
    }
  };

  const handleEdgeClick = (edge: Edge) => {
    console.log('Edge clicked:', edge);
    
    // Toggle selection: if the same edge is clicked, deselect it
    if (selectedEdgeId === edge.id) {
      setSelectedEdgeId(null);
    } else {
      // Select the clicked edge and deselect any node
      setSelectedEdgeId(edge.id);
      setSelectedNodeLabel(null);
    }
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const d3InstanceRef = useRef<{
    svg: any;
    container: any;
    simulation: ForceSimulation | null;
    edgeCreationSource: string | null;
    mousePosition: { x: number; y: number } | null;
  } | null>(null);
  const [edgeCreationSource, setEdgeCreationSource] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState({ 
    width: Math.min(width, height), 
    height: Math.min(width, height) 
  });

  // Handle responsive resizing without destroying the graph
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Ensure container has minimum dimensions
        const containerWidth = Math.max(300, rect.width);
        const containerHeight = Math.max(300, rect.height);
        
        // Calculate square dimensions based on the smaller dimension
        const minDimension = Math.min(containerWidth, containerHeight);
        const squareSize = Math.max(300, minDimension); // Minimum size of 300px
        const newDimensions = {
          width: squareSize,
          height: squareSize,
        };
        
        // Update SVG dimensions without recreating the graph (if D3 instance exists)
        if (d3InstanceRef.current) {
          const { svg, simulation } = d3InstanceRef.current;
          if (svg && simulation) {
            svg.attr('width', newDimensions.width)
               .attr('height', newDimensions.height);
            
            // Update simulation center force for new dimensions
            simulation.force('center', d3.forceCenter(newDimensions.width / 2, newDimensions.height / 2).strength(0.05));
            simulation.alpha(0.3).restart(); // Gentle restart to adjust to new center
          }
        }
        
        setDimensions(newDimensions);
      }
    };

    // Initial size calculation
    handleResize();

    // Add resize observer for responsive behavior (with fallback for test environment)
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(handleResize);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    }

    // Also listen to window resize as fallback
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Initialize D3 instance (runs only once)
  const initializeD3Instance = () => {
    if (!svgRef.current || d3InstanceRef.current) return;

    const svg = d3.select(svgRef.current);
    console.log("@@@@ initializeD3Instance");
    svg.selectAll('*').remove(); // Clear previous content

    // Create main group for graph elements
    const container = svg
      .append('g')
      .attr('class', 'graph-group')
      .attr('data-testid', 'graph-container');

    // Create force simulation with responsive dimensions
    const simulation = d3Utils.createForceSimulation(dimensions.width, dimensions.height);

    // Store D3 instance
    d3InstanceRef.current = {
      svg,
      container,
      simulation,
      edgeCreationSource: null,
      mousePosition: null,
    };

    // Add mouse tracking for edge creation preview
    svg.on('mousemove', (event) => {
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
              if (d.label === d3InstanceRef.current?.edgeCreationSource) return false;
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
        svg.style('cursor', mode === 'edit' ? 'crosshair' : 'default');
      }
    });

    // Add click handler for empty space (node creation and edge creation cancellation)
    if (mode === 'edit' && onNodeCreate) {
      svg.on('click', event => {
        if (event.target === svg.node()) {
          // Cancel edge creation if in edge creation mode
          if (d3InstanceRef.current?.edgeCreationSource) {
            d3InstanceRef.current.edgeCreationSource = null;
            d3InstanceRef.current.mousePosition = null;
            setEdgeCreationSource(null);
            setMousePosition(null);
            // Reset cursor
            svg.style('cursor', mode === 'edit' ? 'crosshair' : 'default');
            return;
          }
          
          // Get coordinates relative to the SVG
          const [x, y] = d3.pointer(event, svg.node());
          console.log('SVG click at coordinates:', x, y);
          onNodeCreate(x, y);
        }
      });
    }
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
        .find((d: D3Node) => d.label === edgeCreationSource);
      
      if (sourceNode) {
        // Check if mouse is over a valid target node
        const targetNode = d3InstanceRef.current.container
          .selectAll('.node')
          .data()
          .find((d: D3Node) => {
            if (d.label === edgeCreationSource) return false; // Can't connect to self
            const dx = (d.x || 0) - mousePosition.x;
            const dy = (d.y || 0) - mousePosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= 30; // Within 30px of a node
          });

        // Determine line color based on whether we're over a valid target
        const lineColor = targetNode ? '#4caf50' : '#1976d2'; // Green for valid target, blue otherwise
        const lineOpacity = targetNode ? 0.9 : 0.7;
        
        // Add new preview line
        svg.append('line')
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
          .style('transition', 'stroke 0.2s ease-in-out, opacity 0.2s ease-in-out');
      }
    }
  };

  // Helper function to handle node click logic
  const handleNodeClickLogic = (node: D3Node, section: string) => {
    console.log(`${section}: GraphViewer onNodeClick called with:`, node);
    console.log(`${section}: Current mode:`, mode);
    console.log(`${section}: Edge creation source:`, d3InstanceRef.current?.edgeCreationSource);
    console.log(`${section}: Selected node label:`, selectedNodeLabel);
    
    if (mode === 'edit') {
      // Check if we're in edge creation mode
      if (d3InstanceRef.current?.edgeCreationSource) {
        console.log(`${section}: In edge creation mode`);
        // Handle edge creation
        if (d3InstanceRef.current.edgeCreationSource === node.label) {
          console.log(`${section}: Canceling edge creation`);
          // Cancel edge creation if clicking the same node
          d3InstanceRef.current.edgeCreationSource = null;
          d3InstanceRef.current.mousePosition = null;
          setEdgeCreationSource(null);
          setMousePosition(null);
          // Reset cursor
          if (d3InstanceRef.current?.svg) {
            d3InstanceRef.current.svg.style('cursor', mode === 'edit' ? 'crosshair' : 'default');
          }
        } else {
          console.log(`${section}: Completing edge creation`);
          // Complete edge creation and continue from target node
          onEdgeCreate?.(d3InstanceRef.current.edgeCreationSource, node.label);
          // Continue edge creation from the target node
          d3InstanceRef.current!.edgeCreationSource = node.label;
          setEdgeCreationSource(node.label);
          // Select the target node to show its nib
          const originalNode = data.nodes.find(n => n.label === node.label);
          if (originalNode) {
            console.log(`${section}: Calling handleNodeClick for edge creation target`);
            handleNodeClick(originalNode);
          }
        }
      } else {
        console.log(`${section}: Not in edge creation mode, handling selection`);
        // Handle node selection/deselection
        const originalNode = data.nodes.find(n => n.label === node.label);
        if (originalNode) {
          console.log(`${section}: Calling handleNodeClick for selection`);
          handleNodeClick(originalNode);
        } else {
          console.log(`${section}: Original node not found!`);
        }
      }
    } else {
      console.log(`${section}: Not in edit mode, handling selection`);
      // Handle node selection/deselection in non-edit modes
      const originalNode = data.nodes.find(n => n.label === node.label);
      if (originalNode) {
        console.log(`${section}: Calling handleNodeClick for non-edit selection`);
        handleNodeClick(originalNode);
      } else {
        console.log(`${section}: Original node not found in non-edit mode!`);
      }
    }
  };

  // Update D3 data and rendering
  const updateD3Data = () => {
    if (!d3InstanceRef.current) return;

    const { container, simulation } = d3InstanceRef.current;
    const d3Data = convertToD3Data(data);

    // Clear previous content
    container.selectAll('*').remove();

    // Add arrow markers for directed graphs
    if (data.type === 'directed') {
      const defs = container.append('defs');
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#000000');
    }

    // Render edges
    const edgeGroup = container.append('g').attr('class', 'edges-group');
    const edges = edgeGroup
      .selectAll('.edge')
      .data(d3Data.edges, (d: any) => d.id)
      .join(
        (enter: any) => {
          const edgeEnter = enter
            .append('line')
            .attr('class', 'graph-edge')
            .attr('opacity', 1);

          edgeEnter.each(function(this: any, d: D3Edge) {
            const edgeSelection = d3.select(this);
            const isSelected = selectedEdgeId === d.id;
            const isDirected = data.type === 'directed';
            applyEdgeStyling(edgeSelection, isSelected, '#000000', 2, isDirected);
          });

          edgeEnter.each(function(this: any, d: D3Edge) {
            const edgeSelection = d3.select(this);
            const eventHandlers = createEdgeEventHandlers(d, {
              onEdgeClick: (edge) => {
                const originalEdge = data.edges.find(e => e.id === edge.id);
                if (originalEdge) handleEdgeClick(originalEdge);
              },
              onEdgeDoubleClick: () => {},
              onEdgeMouseEnter: (edge) => {
                const edgeElement = d3.select(`[data-edge-id="${edge.id}"]`);
                const isDirected = data.type === 'directed';
                applyEdgeStyling(edgeElement, true, '#000000', 2, isDirected);
              },
              onEdgeMouseLeave: (edge) => {
                const edgeElement = d3.select(`[data-edge-id="${edge.id}"]`);
                const isSelected = selectedEdgeId === edge.id;
                const isDirected = data.type === 'directed';
                applyEdgeStyling(edgeElement, isSelected, '#000000', 2, isDirected);
              },
            });

            edgeSelection
              .on('click', eventHandlers.click)
              .on('dblclick', eventHandlers.dblclick)
              .on('mouseenter', eventHandlers.mouseenter)
              .on('mouseleave', eventHandlers.mouseleave);
          });


          return edgeEnter;
        },
        (update: any) => {
          update.each(function(this: any, d: D3Edge) {
            const edgeSelection = d3.select(this);
            const isSelected = selectedEdgeId === d.id;
            const isDirected = data.type === 'directed';
            applyEdgeStyling(edgeSelection, isSelected, '#000000', 2, isDirected);
          });
          return update;
        },
        (exit: any) => {
          return exit
            .remove();
        }
      );

    // Render nodes
    const nodeGroup = container.append('g').attr('class', 'nodes-group');
    const nodes = nodeGroup
      .selectAll('.node')
      .data(d3Data.nodes, (d: any) => d.label)
      .join(
        (enter: any) => {
          const nodeEnter = enter
            .append('g')
            .attr('class', 'node')
            .attr('data-node-label', (d: D3Node) => d.label)
            .attr('opacity', 1)
            .call(d3Utils.createDrag(simulation!, mode));

          nodeEnter
            .append('circle')
            .attr('class', 'graph-node');

          nodeEnter
            .append('text')
            .attr('class', 'graph-node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', '12px')
            .text((d: D3Node) => d.label);

          nodeEnter.each(function(this: any, d: D3Node) {
            const nodeSelection = d3.select(this);
            const isSelected = selectedNodeLabel === d.label;
            const isEditMode = mode === 'edit';
            const isSource = d3InstanceRef.current?.edgeCreationSource === d.label;
            
            applyNodeStyling(nodeSelection, isSelected, 20, isSource);
            applyNodeNibs(nodeSelection, isEditMode && isSelected && !isSource, 20, (node) => {
              // Nib click starts edge creation mode
              if (mode === 'edit' && !d3InstanceRef.current?.edgeCreationSource) {
                d3InstanceRef.current!.edgeCreationSource = node.label;
                setEdgeCreationSource(node.label);
              }
            });
          });

          nodeEnter.each(function(this: any, d: D3Node) {
            const nodeSelection = d3.select(this);
            const eventHandlers = createNodeEventHandlers(d, {
              onNodeClick: (node) => handleNodeClickLogic(node, 'ENTER SECTION'),
              onNodeDoubleClick: () => {
                // Double-click functionality removed - edge creation now uses nibs
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
              .on('dblclick', eventHandlers.dblclick);
          });


          return nodeEnter;
        },
        (update: any) => {
          update.each(function(this: any, d: D3Node) {
            const nodeSelection = d3.select(this);
            const isSelected = selectedNodeLabel === d.label;
            const isEditMode = mode === 'edit';
            const isSource = d3InstanceRef.current?.edgeCreationSource === d.label;
            
            applyNodeStyling(nodeSelection, isSelected, 20, isSource);
            applyNodeNibs(nodeSelection, isEditMode && isSelected && !isSource, 20, (node) => {
              // Nib click starts edge creation mode
              if (mode === 'edit' && !d3InstanceRef.current?.edgeCreationSource) {
                d3InstanceRef.current!.edgeCreationSource = node.label;
                setEdgeCreationSource(node.label);
              }
            });

            // Re-attach event handlers for existing nodes
            const eventHandlers = createNodeEventHandlers(d, {
              onNodeClick: (node) => handleNodeClickLogic(node, 'UPDATE SECTION'),
              onNodeDoubleClick: () => {
                // Double-click functionality removed - edge creation now uses nibs
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
              .on('dblclick', eventHandlers.dblclick);
          });
          return update;
        },
        (exit: any) => {
          return exit
            .remove();
        }
      );

    // Update simulation with new data - all forces are configured in d3Config.ts
    if (simulation) {
      simulation.nodes(d3Data.nodes);
      (simulation.force('link') as any)?.links(d3Data.edges);

      // Update positions on simulation tick
      simulation.on('tick', () => {
        edges
          .attr('x1', (d: D3Edge) => {
            const source = d.source as D3Node;
            return source.x || 0;
          })
          .attr('y1', (d: D3Edge) => {
            const source = d.source as D3Node;
            return source.y || 0;
          })
          .attr('x2', (d: D3Edge) => {
            const target = d.target as D3Node;
            return target.x || 0;
          })
          .attr('y2', (d: D3Edge) => {
            const target = d.target as D3Node;
            return target.y || 0;
          });

        nodes.attr(
          'transform',
          (d: D3Node) => `translate(${d.x || 0},${d.y || 0})`
        );

        updatePreviewLine();
      });

      simulation.alpha(0).restart(); // Very gentle restart to minimize disruption when adding nodes
    }
  };

  // Convert Graph model data to D3 format
  const convertToD3Data = (graphData: GraphData) => {
    // Get existing node positions from the simulation if it exists
    const existingNodes = d3InstanceRef.current?.simulation?.nodes() || [];
    const existingNodeMap = new Map(existingNodes.map((node: any) => [node.label, { x: node.x, y: node.y }]));

    const d3Nodes: D3Node[] = graphData.nodes.map((node, index) => {
      // Preserve existing position if available
      const existingPos = existingNodeMap.get(node.label);
      if (existingPos && existingPos.x !== undefined && existingPos.y !== undefined) {
        return {
          id: node.label,
          label: node.label,
          x: existingPos.x,
          y: existingPos.y,
        };
      } else {
        // Check if this is the newest node and we have a position for it
        const isNewestNode = index === graphData.nodes.length - 1;
        if (isNewestNode && newNodePosition) {
          return {
            id: node.label,
            label: node.label,
            x: newNodePosition.x,
            y: newNodePosition.y,
          };
        } else {
          // Generate new position for other new nodes
          return {
            id: node.label,
            label: node.label,
            x: 100 + (index % 4) * 200,
            y: 100 + Math.floor(index / 4) * 200,
          };
        }
      }
    });

    const d3Edges: D3Edge[] = graphData.edges.map(edge => ({
      id: edge.id,
      source: edge.source, // This will be the node label
      target: edge.target, // This will be the node label
      ...(edge.weight && { weight: edge.weight }),
    }));

    return { nodes: d3Nodes, edges: d3Edges };
  };

  // Initialize D3 instance once
  useEffect(() => {
    initializeD3Instance();
  }, []);

  // Update data when it changes (excluding dimensions to avoid recreating graph on resize)
  useEffect(() => {
    updateD3Data();
  }, [data, mode, newNodePosition]);

  // Clear selections when graph structure changes (new nodes/edges added)
  useEffect(() => {
    setSelectedNodeLabel(null);
    setSelectedEdgeId(null);
  }, [data.nodes.length, data.edges.length]);

  // Update selection styling without restarting simulation
  useEffect(() => {
    console.log('GraphViewer selection effect triggered. selectedNodeLabel:', selectedNodeLabel);
    if (!d3InstanceRef.current) return;
    
    const { container } = d3InstanceRef.current;
    
    // Update node selection styling
    container.selectAll('.node').each(function(this: any, d: any) {
      const nodeSelection = d3.select(this);
      const isSelected = selectedNodeLabel === d.label;
      const isEditMode = mode === 'edit';
      const isSource = d3InstanceRef.current?.edgeCreationSource === d.label;
      
      applyNodeStyling(nodeSelection, isSelected, 20, isSource);
      applyNodeNibs(nodeSelection, isEditMode && isSelected && !isSource, 20, (node) => {
        // Nib click starts edge creation mode
        if (mode === 'edit' && !d3InstanceRef.current?.edgeCreationSource) {
          d3InstanceRef.current!.edgeCreationSource = node.label;
          setEdgeCreationSource(node.label);
        }
      });
    });
    
    // Update edge selection styling
    container.selectAll('.graph-edge').each(function(this: any, d: any) {
      const edgeSelection = d3.select(this);
      const isSelected = selectedEdgeId === d.id;
      const isDirected = data.type === 'directed';
      applyEdgeStyling(edgeSelection, isSelected, '#000000', 2, isDirected);
    });
  }, [selectedNodeLabel, selectedEdgeId, mode]);

  // Update edge creation state in D3 instance
  useEffect(() => {
    if (d3InstanceRef.current) {
      d3InstanceRef.current.edgeCreationSource = edgeCreationSource;
      d3InstanceRef.current.mousePosition = mousePosition;
      updatePreviewLine();
    }
  }, [edgeCreationSource, mousePosition]);

  // Call onNewNodePositioned after a new node has been positioned
  useEffect(() => {
    if (newNodePosition && onNewNodePositioned) {
      // Use a small delay to ensure the node has been positioned in the simulation
      const timer = setTimeout(() => {
        onNewNodePositioned();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [newNodePosition, onNewNodePositioned]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (d3InstanceRef.current?.simulation) {
        d3InstanceRef.current.simulation.stop();
      }
    };
  }, []);


  return (
    <div
      ref={containerRef}
      className="graph-container w-full h-full min-w-[300px] min-h-[300px] flex flex-col items-center justify-center"
      data-testid="graph-viewer"
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={`graph-svg border border-gray-200 rounded-lg bg-white ${
          mode === 'edit' ? 'cursor-crosshair' : 'cursor-default'
        }`}
        style={{ 
          width: `${dimensions.width}px`, 
          height: `${dimensions.height}px`
        }}
      />

      {/* Selection indicator */}
      {selectedNodeLabel && (
        <div className="mb-2 px-3 py-1 bg-blue-100 border border-blue-300 rounded-full text-sm text-blue-800 font-medium">
          Selected: {selectedNodeLabel}
        </div>
      )}
      
    </div>
  );
};

export default GraphViewer;
