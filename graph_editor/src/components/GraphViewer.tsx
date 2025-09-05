import React, { useEffect, useRef } from 'react';
import { d3, d3Utils, ForceSimulation, D3Node, D3Edge } from '@/utils/d3Config';

interface GraphData {
  nodes: D3Node[];
  edges: D3Edge[];
}

interface GraphViewerProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: D3Node) => void;
  onEdgeClick?: (edge: D3Edge) => void;
}

const GraphViewer: React.FC<GraphViewerProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onEdgeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<ForceSimulation | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    // Create main group for zoom/pan
    const container = svg.append('g').attr('class', 'graph-group');

    // Create zoom behavior
    const zoom = d3Utils.createZoom();
    svg.call(zoom);

    // Create force simulation
    const simulation = d3Utils.createForceSimulation(width, height);
    simulationRef.current = simulation;

    // Add data to simulation
    simulation.nodes(data.nodes);
    (simulation.force('link') as any)?.links(data.edges);

    // Create edges
    const edges = container
      .selectAll('.edge')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('class', 'graph-edge')
      .on('click', (event, d) => {
        event.stopPropagation();
        onEdgeClick?.(d);
      });

    // Create nodes
    const nodes = container
      .selectAll('.node')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3Utils.createDrag(simulation))
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
      });

    // Add circles to nodes
    nodes
      .append('circle')
      .attr('r', 20)
      .attr('fill', '#3b82f6')
      // .attr('fill', 'none')
      .attr('stroke', '#1e40af')
      .attr('stroke-width', 2)
      .attr('class', 'graph-node');

    // Add labels to nodes
    nodes
      .append('text')
      .attr('class', 'graph-node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text((d: D3Node) => d.id);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      edges
        .attr('x1', (d: D3Edge) => (d.source as D3Node).x || 0)
        .attr('y1', (d: D3Edge) => (d.source as D3Node).y || 0)
        .attr('x2', (d: D3Edge) => (d.target as D3Node).x || 0)
        .attr('y2', (d: D3Edge) => (d.target as D3Node).y || 0);

      nodes.attr(
        'transform',
        (d: D3Node) => `translate(${d.x || 0},${d.y || 0})`
      );
    });

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick, onEdgeClick]);

  return (
    <div className="graph-container" data-testid="graph-viewer">
      <svg ref={svgRef} width={width} height={height} className="graph-svg" />
    </div>
  );
};

export default GraphViewer;
