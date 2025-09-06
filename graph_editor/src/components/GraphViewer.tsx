import React, { useEffect, useRef } from 'react';
import { d3, d3Utils, ForceSimulation, D3Node, D3Edge } from '@/utils/d3Config';
import { GraphData, Node, Edge } from '@/types/graph';

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
  selectedNodeLabel,
  selectedEdgeId,
  mode = 'edit',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<ForceSimulation | null>(null);
  const containerRef = useRef<SVGGElement | null>(null);

  // Convert Graph model data to D3 format
  const convertToD3Data = (graphData: GraphData) => {
    const d3Nodes: D3Node[] = graphData.nodes.map(node => ({
      label: node.label,
      x: node.x,
      y: node.y,
    }));

    const d3Edges: D3Edge[] = graphData.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(edge.weight && { weight: edge.weight }),
    }));

    return { nodes: d3Nodes, edges: d3Edges };
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    // Create main group for zoom/pan
    const container = svg
      .append('g')
      .attr('class', 'graph-group')
      .attr('data-testid', 'graph-container');
    containerRef.current = container.node();

    // Create zoom behavior
    const zoom = d3Utils.createZoom();
    svg.call(zoom);

    // Create force simulation
    const simulation = d3Utils.createForceSimulation(width, height);
    simulationRef.current = simulation;

    // Convert data to D3 format
    const d3Data = convertToD3Data(data);

    // Add data to simulation
    simulation.nodes(d3Data.nodes);
    (simulation.force('link') as any)?.links(d3Data.edges);

    // Create arrow markers for directed graphs
    if (data.type === 'directed') {
      const defs = svg.append('defs');
      defs
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#000000');
    }

    // Enhanced D3 data binding for edges
    const edgeGroup = container.append('g').attr('class', 'edges-group');
    
    const edges = edgeGroup
      .selectAll('.edge')
      .data(d3Data.edges, (d: any) => d.id) // Use ID as key for proper data binding
      .join(
        // Enter selection - new edges
        (enter) => {
          const edgeEnter = enter
            .append('line')
            .attr('class', 'graph-edge')
            .attr('stroke', '#000000')
            .attr('stroke-width', 2)
            .attr('opacity', 0)
            .on('click', (event, d) => {
              event.stopPropagation();
              const originalEdge = data.edges.find(e => e.id === d.id);
              if (originalEdge) onEdgeClick?.(originalEdge);
            });

          // Add arrow markers for directed graphs
          if (data.type === 'directed') {
            edgeEnter.attr('marker-end', 'url(#arrowhead)');
          }

          // Animate in
          edgeEnter
            .transition()
            .duration(300)
            .attr('opacity', 1);

          return edgeEnter;
        },
        // Update selection - existing edges
        (update) => {
          return update
            .attr('stroke', '#000000')
            .attr('stroke-width', 2);
        },
        // Exit selection - removed edges
        (exit) => {
          return exit
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();
        }
      );

    // Enhanced D3 data binding for nodes
    const nodeGroup = container.append('g').attr('class', 'nodes-group');
    
    const nodes = nodeGroup
      .selectAll('.node')
      .data(d3Data.nodes, (d: any) => d.label) // Use label as key for proper data binding
      .join(
        // Enter selection - new nodes
        (enter) => {
          const nodeEnter = enter
            .append('g')
            .attr('class', 'node')
            .attr('data-node-label', (d: D3Node) => d.label)
            .attr('opacity', 0)
            .call(d3Utils.createDrag(simulation))
            .on('click', (event, d) => {
              event.stopPropagation();
              const originalNode = data.nodes.find(n => n.label === d.label);
              if (originalNode) onNodeClick?.(originalNode);
            });

          // Add circle to nodes
          nodeEnter
            .append('circle')
            .attr('r', 20)
            .attr('fill', 'white')
            .attr('stroke', '#000000')
            .attr('stroke-width', 2)
            .attr('class', 'graph-node');

          // Add labels to nodes
          nodeEnter
            .append('text')
            .attr('class', 'graph-node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', '#000000')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text((d: D3Node) => d.label);

          // Animate in
          nodeEnter
            .transition()
            .duration(300)
            .attr('opacity', 1);

          return nodeEnter;
        },
        // Update selection - existing nodes
        (update) => {
          // Update node styling based on selection state
          update.select('circle')
            .attr('fill', (d: D3Node) => 
              selectedNodeLabel === d.label ? '#e3f2fd' : 'white'
            )
            .attr('stroke', (d: D3Node) => 
              selectedNodeLabel === d.label ? '#1976d2' : '#000000'
            )
            .attr('stroke-width', (d: D3Node) => 
              selectedNodeLabel === d.label ? 3 : 2
            );

          // Update label styling
          update.select('text')
            .attr('fill', (d: D3Node) => 
              selectedNodeLabel === d.label ? '#1976d2' : '#000000'
            )
            .attr('font-weight', (d: D3Node) => 
              selectedNodeLabel === d.label ? 'bold' : 'bold'
            );

          return update;
        },
        // Exit selection - removed nodes
        (exit) => {
          return exit
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();
        }
      );

    // Add click handler for empty space (node creation)
    if (mode === 'edit' && onNodeCreate) {
      svg.on('click', event => {
        if (event.target === svg.node()) {
          const [x, y] = d3.pointer(event, svg.node());
          onNodeCreate(x, y);
        }
      });
    }

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
    });

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [
    data,
    width,
    height,
    onNodeClick,
    onEdgeClick,
    onNodeCreate,
    selectedNodeLabel,
    selectedEdgeId,
    mode,
  ]);

  return (
    <div
      className="graph-container"
      data-testid="graph-viewer"
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className={`graph-svg border border-gray-200 rounded-lg bg-white ${
          mode === 'edit' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      />
    </div>
  );
};

export default GraphViewer;
