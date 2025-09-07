import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { D3Node } from '@/utils/d3Config';
import { Node, Edge, GraphData } from '@/types/graph';

// Mock data for testing
export const mockNodes: Node[] = [
  { id: 1, label: 'A' },
  { id: 2, label: 'B' },
  { id: 3, label: 'C' },
];

export const mockEdges: Edge[] = [
  { id: 'edge1', source: 1, target: 2 },
  { id: 'edge2', source: 2, target: 3 },
  { id: 'edge3', source: 3, target: 1 },
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
export const createMockNode = (id: number, label: string): Node => ({
  id,
  label,
});

export const createMockD3Node = (id: number, label: string, x = 0, y = 0): D3Node => ({
  id,
  label,
  x,
  y,
  fx: null,
  fy: null,
});

export const createMockEdge = (
  source: number,
  target: number,
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
    nodes.push(createMockNode(i + 1, String.fromCharCode(65 + i)));
  }

  // Create edges
  for (let i = 0; i < edgeCount; i++) {
    const sourceIndex = i % nodeCount;
    const targetIndex = (i + 1) % nodeCount;
    const sourceNode = nodes[sourceIndex];
    const targetNode = nodes[targetIndex];
    if (sourceNode && targetNode) {
      edges.push(createMockEdge(sourceNode.id, targetNode.id));
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
