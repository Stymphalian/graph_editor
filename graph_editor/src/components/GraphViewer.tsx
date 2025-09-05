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
  onEdgeCreate?: (sourceId: string, targetId: string) => void;
  selectedNodeId?: string | null;
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
  selectedNodeId,
  selectedEdgeId,
  mode = 'edit',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<ForceSimulation | null>(null);
  const containerRef = useRef<SVGGElement | null>(null);

  // Convert Graph model data to D3 format
  const convertToD3Data = (graphData: GraphData) => {
    const d3Nodes: D3Node[] = graphData.nodes.map(node => ({
      id: node.id,
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

    // Create edges
    const edges = container
      .selectAll('.edge')
      .data(d3Data.edges)
      .enter()
      .append('line')
      .attr('class', 'graph-edge')
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        event.stopPropagation();
        const originalEdge = data.edges.find(e => e.id === d.id);
        if (originalEdge) onEdgeClick?.(originalEdge);
      });

    // Add arrows for directed graphs
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
        .attr('fill', '#6b7280');

      edges.attr('marker-end', 'url(#arrowhead)');
    }

    // Create nodes
    const nodes = container
      .selectAll('.node')
      .data(d3Data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('data-node-id', (d: D3Node) => d.id)
      .call(d3Utils.createDrag(simulation))
      .on('click', (event, d) => {
        event.stopPropagation();
        const originalNode = data.nodes.find(n => n.id === d.id);
        if (originalNode) onNodeClick?.(originalNode);
      });

    // Add circles to nodes
    nodes
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d: D3Node) => 
        selectedNodeId === d.id ? '#ef4444' : '#3b82f6'
      )
      .attr('stroke', (d: D3Node) => 
        selectedNodeId === d.id ? '#dc2626' : '#1e40af'
      )
      .attr('stroke-width', 2)
      .attr('class', 'graph-node');

    // Add labels to nodes
    nodes
      .append('text')
      .attr('class', 'graph-node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d: D3Node) => {
        const originalNode = data.nodes.find(n => n.id === d.id);
        return originalNode?.label || d.id;
      });

    // Add click handler for empty space (node creation)
    if (mode === 'edit' && onNodeCreate) {
      svg.on('click', (event) => {
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
  }, [data, width, height, onNodeClick, onEdgeClick, onNodeCreate, selectedNodeId, selectedEdgeId, mode]);

  return (
    <div className="graph-container w-full h-full relative" data-testid="graph-viewer">
      <svg 
        ref={svgRef} 
        width={width} 
        height={height} 
        className="graph-svg w-full h-full border border-gray-200 rounded-lg bg-white"
        style={{ cursor: mode === 'edit' ? 'crosshair' : 'default' }}
      />
    </div>
  );
};

export default GraphViewer;
