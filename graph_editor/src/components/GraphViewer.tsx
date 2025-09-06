import React, { useEffect, useRef, useState } from 'react';
import { d3, d3Utils, ForceSimulation, D3Node, D3Edge } from '@/utils/d3Config';
import { GraphData, Node, Edge } from '@/types/graph';
import { applyNodeStyling, createNodeEventHandlers, applyNodeNibs } from './Node';
import { applyEdgeStyling, createEdgeEventHandlers } from './Edge';

interface GraphViewerProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
  onNodeCreate?: (x: number, y: number) => void;
  onEdgeCreate?: (sourceLabel: string, targetLabel: string) => void;
  selectedNodeLabel?: string | null;
  selectedEdgeId?: string | null;
  mode?: 'edit' | 'delete' | 'view-force';
}

const GraphViewer: React.FC<GraphViewerProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onEdgeClick,
  onNodeCreate,
  onEdgeCreate,
  selectedNodeLabel,
  selectedEdgeId,
  mode = 'edit',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const d3InstanceRef = useRef<{
    svg: any;
    container: any;
    simulation: ForceSimulation | null;
    edgeCreationSource: string | null;
    mousePosition: { x: number; y: number } | null;
    zoom: any;
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
          const { svg, simulation, zoom } = d3InstanceRef.current;
          if (svg && simulation) {
            // Preserve current zoom state
            const currentTransform = d3.zoomTransform(svg.node());
            
            svg.attr('width', newDimensions.width)
               .attr('height', newDimensions.height);
            
            // Update simulation center force for new dimensions
            simulation.force('center', d3.forceCenter(newDimensions.width / 2, newDimensions.height / 2).strength(0.05));
            simulation.alpha(0.3).restart(); // Gentle restart to adjust to new center
            
            // Restore zoom state after dimensions change
            if (zoom && currentTransform) {
              svg.call(zoom.transform, currentTransform);
            }
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
    svg.selectAll('*').remove(); // Clear previous content

    // Create main group for zoom/pan
    const container = svg
      .append('g')
      .attr('class', 'graph-group')
      .attr('data-testid', 'graph-container');

    // Create enhanced zoom behavior with viewport management
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10]) // Allow zoom from 0.1x to 10x
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation with responsive dimensions
    const simulation = d3Utils.createForceSimulation(dimensions.width, dimensions.height);

    // Store D3 instance
    d3InstanceRef.current = {
      svg,
      container,
      simulation,
      edgeCreationSource: null,
      mousePosition: null,
      zoom,
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
        }
      }
    });

    svg.on('mouseleave', () => {
      if (d3InstanceRef.current) {
        d3InstanceRef.current.mousePosition = null;
        updatePreviewLine();
      }
    });

    // Add click handler for empty space (node creation)
    if (mode === 'edit' && onNodeCreate) {
      svg.on('click', event => {
        if (event.target === svg.node()) {
          const [x, y] = d3.pointer(event, svg.node());
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
        // Add new preview line
        svg.append('line')
          .attr('class', 'preview-line')
          .attr('x1', sourceNode.x || 0)
          .attr('y1', sourceNode.y || 0)
          .attr('x2', mousePosition.x)
          .attr('y2', mousePosition.y)
          .attr('stroke', '#1976d2')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.7)
          .style('pointer-events', 'none');
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
            .attr('opacity', 0);

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
                if (originalEdge) onEdgeClick?.(originalEdge);
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

          edgeEnter
            .transition()
            .duration(300)
            .attr('opacity', 1);

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
            .transition()
            .duration(300)
            .attr('opacity', 0)
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
            .attr('opacity', 0)
            .call(d3Utils.createDrag(simulation!));

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
            applyNodeNibs(nodeSelection, isEditMode && !isSource, 20);
          });

          nodeEnter.each(function(this: any, d: D3Node) {
            const nodeSelection = d3.select(this);
            const eventHandlers = createNodeEventHandlers(d, {
              onNodeClick: (node) => {
                if (mode === 'edit') {
                  if (!d3InstanceRef.current?.edgeCreationSource) {
                    d3InstanceRef.current!.edgeCreationSource = node.label;
                    setEdgeCreationSource(node.label);
                  } else if (d3InstanceRef.current.edgeCreationSource === node.label) {
                    d3InstanceRef.current.edgeCreationSource = null;
                    d3InstanceRef.current.mousePosition = null;
                    setEdgeCreationSource(null);
                    setMousePosition(null);
                  } else {
                    onEdgeCreate?.(d3InstanceRef.current.edgeCreationSource, node.label);
                    d3InstanceRef.current.edgeCreationSource = null;
                    d3InstanceRef.current.mousePosition = null;
                    setEdgeCreationSource(null);
                    setMousePosition(null);
                  }
                } else {
                  const originalNode = data.nodes.find(n => n.label === node.label);
                  if (originalNode) onNodeClick?.(originalNode);
                }
              },
              onNodeDoubleClick: () => {},
              onNodeMouseEnter: (node) => {
                const nodeElement = d3.select(`[data-node-label="${node.label}"]`);
                applyNodeStyling(nodeElement, true, 20);
              },
              onNodeMouseLeave: (node) => {
                const nodeElement = d3.select(`[data-node-label="${node.label}"]`);
                const isSelected = selectedNodeLabel === node.label;
                applyNodeStyling(nodeElement, isSelected, 20);
              },
            });

            nodeSelection
              .on('click', eventHandlers.click)
              .on('dblclick', eventHandlers.dblclick)
              .on('mouseenter', eventHandlers.mouseenter)
              .on('mouseleave', eventHandlers.mouseleave);
          });

          nodeEnter
            .transition()
            .duration(300)
            .attr('opacity', 1);

          return nodeEnter;
        },
        (update: any) => {
          update.each(function(this: any, d: D3Node) {
            const nodeSelection = d3.select(this);
            const isSelected = selectedNodeLabel === d.label;
            const isEditMode = mode === 'edit';
            const isSource = d3InstanceRef.current?.edgeCreationSource === d.label;
            
            applyNodeStyling(nodeSelection, isSelected, 20, isSource);
            applyNodeNibs(nodeSelection, isEditMode && !isSource, 20);
          });
          return update;
        },
        (exit: any) => {
          return exit
            .transition()
            .duration(300)
            .attr('opacity', 0)
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

      simulation.alpha(1).restart();
    }
  };

  // Convert Graph model data to D3 format
  const convertToD3Data = (graphData: GraphData) => {
    const d3Nodes: D3Node[] = graphData.nodes.map(node => ({
      id: node.label, // Use label as ID for D3
      label: node.label,
      x: node.x,
      y: node.y,
    }));

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
  }, [data, selectedNodeLabel, selectedEdgeId, mode]);

  // Update edge creation state in D3 instance
  useEffect(() => {
    if (d3InstanceRef.current) {
      d3InstanceRef.current.edgeCreationSource = edgeCreationSource;
      d3InstanceRef.current.mousePosition = mousePosition;
      updatePreviewLine();
    }
  }, [edgeCreationSource, mousePosition]);

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
      className="graph-container w-full h-full min-w-[300px] min-h-[300px] flex items-center justify-center"
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
    </div>
  );
};

export default GraphViewer;
