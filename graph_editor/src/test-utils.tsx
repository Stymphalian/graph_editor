import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { D3Node, D3Edge } from '@/utils/d3Config';

// Mock data for testing
export const mockNodes: D3Node[] = [
  { id: 'A', x: 100, y: 100 },
  { id: 'B', x: 200, y: 200 },
  { id: 'C', x: 300, y: 100 },
];

export const mockEdges: D3Edge[] = [
  { source: 'A', target: 'B' },
  { source: 'B', target: 'C' },
  { source: 'C', target: 'A' },
];

export const mockGraphData = {
  nodes: mockNodes,
  edges: mockEdges,
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
export const createMockNode = (id: string, x = 0, y = 0): D3Node => ({
  id,
  x,
  y,
  fx: null,
  fy: null,
});

export const createMockEdge = (
  source: string,
  target: string,
  weight?: string
): D3Edge => ({
  source,
  target,
  ...(weight && { weight }),
});

export const createMockGraph = (nodeCount = 3, edgeCount = 2) => {
  const nodes: D3Node[] = [];
  const edges: D3Edge[] = [];

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
      edges.push(createMockEdge(sourceNode.id, targetNode.id));
    }
  }

  return { nodes, edges };
};

// Mock event handlers
export const mockEventHandlers = {
  onNodeClick: jest.fn(),
  onEdgeClick: jest.fn(),
  onNodeDrag: jest.fn(),
  onNodeDragEnd: jest.fn(),
  onZoom: jest.fn(),
};

// Clean up mocks
export const cleanupMocks = () => {
  Object.values(mockEventHandlers).forEach(mock => mock.mockClear());
};
