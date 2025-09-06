import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { D3Node } from '@/utils/d3Config';
import { Node, Edge, GraphData } from '@/types/graph';

// Mock data for testing
export const mockNodes: Node[] = [
  { label: 'A', x: 100, y: 100 },
  { label: 'B', x: 200, y: 200 },
  { label: 'C', x: 300, y: 100 },
];

export const mockEdges: Edge[] = [
  { id: 'edge1', source: 'A', target: 'B' },
  { id: 'edge2', source: 'B', target: 'C' },
  { id: 'edge3', source: 'C', target: 'A' },
];

export const mockGraphData: GraphData = {
  nodes: mockNodes,
  edges: mockEdges,
  type: 'undirected',
  nodeIndexingMode: '0-indexed',
  maxNodes: 1000,
};

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test helpers
export const createMockNode = (label: string, x = 0, y = 0): Node => ({
  label,
  x,
  y,
});

export const createMockD3Node = (label: string, x = 0, y = 0): D3Node => ({
  id: label,
  label,
  x,
  y,
  fx: null,
  fy: null,
});

export const createMockEdge = (
  source: string,
  target: string,
  weight?: string
): Edge => ({
  id: `edge_${Math.random().toString(36).substr(2, 9)}`,
  source,
  target,
  ...(weight && { weight }),
});

export const createMockGraph = (nodeCount = 3, edgeCount = 2) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(createMockNode(String.fromCharCode(65 + i), i * 100, i * 100));
  }

  // Create edges
  for (let i = 0; i < edgeCount; i++) {
    const sourceIndex = i % nodeCount;
    const targetIndex = (i + 1) % nodeCount;
    const sourceNode = nodes[sourceIndex];
    const targetNode = nodes[targetIndex];
    if (sourceNode && targetNode) {
      edges.push(createMockEdge(sourceNode.label, targetNode.label));
    }
  }

  return { nodes, edges };
};

// Mock event handlers
export const mockEventHandlers = {
  onNodeClick: () => {},
  onEdgeClick: () => {},
  onNodeDrag: () => {},
  onNodeDragEnd: () => {},
  onZoom: () => {},
};

// Clean up mocks
export const cleanupMocks = () => {
  // No-op for now since we're not using jest.fn()
};
