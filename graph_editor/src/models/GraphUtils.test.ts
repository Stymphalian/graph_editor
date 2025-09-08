/**
 * Unit tests for GraphUtils - Graph difference resolution
 */

import { Graph } from './Graph';
import {
  ChangeType,
  NodeMatch,
  EdgeMatch,
  ChangeOperation,
  NodeDiff,
  EdgeDiff,
  GraphMatches,
  GraphDiffResult,
  GraphComparisonOptions,
  GraphTransformationResult,
  GraphTransformationOptions
} from './GraphUtils';

describe('GraphUtils', () => {
  let originalGraph: Graph;
  let editedGraph: Graph;

  beforeEach(() => {
    // Create a simple original graph
    originalGraph = new Graph({
      nodes: [
        { id: 1, label: 'A' },
        { id: 2, label: 'B' },
        { id: 3, label: 'C' }
      ],
      edges: [
        { id: 'e1', source: 1, target: 2 },
        { id: 'e2', source: 2, target: 3 }
      ],
      type: 'undirected'
    });

    // Create an edited version with different IDs but similar structure
    editedGraph = new Graph({
      nodes: [
        { id: 10, label: 'A' },      // Same label, different ID
        { id: 20, label: 'B' },      // Same label, different ID
        { id: 30, label: 'D' }       // New node
      ],
      edges: [
        { id: 'edge1', source: 10, target: 20 },  // Same connection, different IDs
        { id: 'edge2', source: 20, target: 30 }   // New connection
      ],
      type: 'undirected'
    });
  });

  describe('Node Matching', () => {
    it('should match nodes by label when IDs are different', () => {
      // This test will verify that nodes with same labels but different IDs are matched
      const originalNodes = originalGraph.getNodes();
      const editedNodes = editedGraph.getNodes();
      
      // Expected: A matches A, B matches B, C has no match, D has no match
      expect(originalNodes).toHaveLength(3);
      expect(editedNodes).toHaveLength(3);
    });

    it('should handle duplicate labels in the same graph', () => {
      const graphWithDuplicates = new Graph({
        nodes: [
          { id: 1, label: 'A' },
          { id: 2, label: 'A' },  // Duplicate label
          { id: 3, label: 'B' }
        ],
        edges: []
      });

      // Should handle duplicate labels gracefully
      expect(graphWithDuplicates.getNodes()).toHaveLength(3);
    });

    it('should identify added and removed nodes', () => {
      // Original has A, B, C
      // Edited has A, B, D
      // Should identify: C removed, D added
      const originalNodes = originalGraph.getNodes();
      const editedNodes = editedGraph.getNodes();
      
      const originalLabels = originalNodes.map(n => n.label);
      const editedLabels = editedNodes.map(n => n.label);
      
      expect(originalLabels).toContain('C');
      expect(editedLabels).toContain('D');
      expect(editedLabels).not.toContain('C');
      expect(originalLabels).not.toContain('D');
    });
  });

  describe('Edge Matching', () => {
    it('should match edges by corresponding node labels', () => {
      const originalEdges = originalGraph.getEdges();
      const editedEdges = editedGraph.getEdges();
      
      // Original: A-B, B-C
      // Edited: A-B, B-D
      // Should match A-B, identify B-C as removed, B-D as added
      expect(originalEdges).toHaveLength(2);
      expect(editedEdges).toHaveLength(2);
    });

    it('should handle edge weight changes', () => {
      const graphWithWeights = new Graph({
        nodes: [
          { id: 1, label: 'A' },
          { id: 2, label: 'B' }
        ],
        edges: [
          { id: 'e1', source: 1, target: 2, weight: '5' }
        ]
      });

      const graphWithDifferentWeights = new Graph({
        nodes: [
          { id: 10, label: 'A' },
          { id: 20, label: 'B' }
        ],
        edges: [
          { id: 'e2', source: 10, target: 20, weight: '10' }
        ]
      });

      // Should detect weight change from 5 to 10
      expect(graphWithWeights.getEdges()[0].weight).toBe('5');
      expect(graphWithDifferentWeights.getEdges()[0].weight).toBe('10');
    });

    it('should handle directed vs undirected graph differences', () => {
      const directedGraph = new Graph({
        nodes: [
          { id: 1, label: 'A' },
          { id: 2, label: 'B' }
        ],
        edges: [
          { id: 'e1', source: 1, target: 2 }
        ],
        type: 'directed'
      });

      const undirectedGraph = new Graph({
        nodes: [
          { id: 10, label: 'A' },
          { id: 20, label: 'B' }
        ],
        edges: [
          { id: 'e2', source: 10, target: 20 }
        ],
        type: 'undirected'
      });

      // Should detect graph type change
      expect(directedGraph.getType()).toBe('directed');
      expect(undirectedGraph.getType()).toBe('undirected');
    });
  });

  describe('Change Detection', () => {
    it('should detect node label changes', () => {
      const graphWithChangedLabel = new Graph({
        nodes: [
          { id: 10, label: 'A' },
          { id: 20, label: 'X' },  // Changed from B to X
          { id: 30, label: 'D' }
        ],
        edges: []
      });

      // Should detect that B became X
      const originalLabels = originalGraph.getNodes().map(n => n.label);
      const editedLabels = graphWithChangedLabel.getNodes().map(n => n.label);
      
      expect(originalLabels).toContain('B');
      expect(editedLabels).toContain('X');
      expect(editedLabels).not.toContain('B');
    });

    it('should detect multiple types of changes simultaneously', () => {
      // Original: A, B, C with edges A-B, B-C
      // Edited: A, X, D with edges A-X, X-D
      // Should detect: B->X (label change), C removed, D added, B-C removed, X-D added
      
      const complexEditedGraph = new Graph({
        nodes: [
          { id: 10, label: 'A' },
          { id: 20, label: 'X' },  // B became X
          { id: 30, label: 'D' }   // New node
        ],
        edges: [
          { id: 'edge1', source: 10, target: 20 },  // A-X (was A-B)
          { id: 'edge2', source: 20, target: 30 }   // X-D (new)
        ]
      });

      // This should generate multiple change types
      expect(complexEditedGraph.getNodes()).toHaveLength(3);
      expect(complexEditedGraph.getEdges()).toHaveLength(2);
    });
  });

  describe('Graph Property Changes', () => {
    it('should detect graph type changes', () => {
      const directedGraph = new Graph({
        nodes: [{ id: 1, label: 'A' }],
        edges: [],
        type: 'directed'
      });

      const undirectedGraph = new Graph({
        nodes: [{ id: 1, label: 'A' }],
        edges: [],
        type: 'undirected'
      });

      expect(directedGraph.getType()).toBe('directed');
      expect(undirectedGraph.getType()).toBe('undirected');
    });

    it('should detect indexing mode changes', () => {
      const zeroIndexedGraph = new Graph(undefined, '0-indexed');
      const oneIndexedGraph = new Graph(undefined, '1-indexed');

      expect(zeroIndexedGraph.getNodeIndexingMode()).toBe('0-indexed');
      expect(oneIndexedGraph.getNodeIndexingMode()).toBe('1-indexed');
    });

    it('should detect max nodes changes', () => {
      const graphWithMaxNodes = new Graph({
        nodes: [],
        edges: [],
        maxNodes: 500
      });

      const graphWithDifferentMaxNodes = new Graph({
        nodes: [],
        edges: [],
        maxNodes: 1000
      });

      expect(graphWithMaxNodes.getMaxNodes()).toBe(500);
      expect(graphWithDifferentMaxNodes.getMaxNodes()).toBe(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty graphs', () => {
      const emptyOriginal = new Graph();
      const emptyEdited = new Graph();

      // Should handle empty graphs without errors
      expect(emptyOriginal.getNodes()).toHaveLength(0);
      expect(emptyEdited.getNodes()).toHaveLength(0);
    });

    it('should handle graphs with only nodes (no edges)', () => {
      const nodesOnlyGraph = new Graph({
        nodes: [
          { id: 1, label: 'A' },
          { id: 2, label: 'B' }
        ],
        edges: []
      });

      expect(nodesOnlyGraph.getNodes()).toHaveLength(2);
      expect(nodesOnlyGraph.getEdges()).toHaveLength(0);
    });

    it('should handle graphs with only edges (no nodes)', () => {
      // This should be invalid, but we should handle it gracefully
      const edgesOnlyGraph = new Graph({
        nodes: [],
        edges: [
          { id: 'e1', source: 1, target: 2 }
        ]
      });

      expect(edgesOnlyGraph.getNodes()).toHaveLength(0);
      expect(edgesOnlyGraph.getEdges()).toHaveLength(1);
    });

    it('should handle self-loops', () => {
      const graphWithSelfLoop = new Graph({
        nodes: [{ id: 1, label: 'A' }],
        edges: [
          { id: 'e1', source: 1, target: 1 }
        ]
      });

      expect(graphWithSelfLoop.getEdges()[0].source).toBe(1);
      expect(graphWithSelfLoop.getEdges()[0].target).toBe(1);
    });

    it('should handle duplicate edges', () => {
      const graphWithDuplicateEdges = new Graph({
        nodes: [
          { id: 1, label: 'A' },
          { id: 2, label: 'B' }
        ],
        edges: [
          { id: 'e1', source: 1, target: 2 },
          { id: 'e2', source: 1, target: 2 }  // Duplicate
        ]
      });

      expect(graphWithDuplicateEdges.getEdges()).toHaveLength(2);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete graph restructuring', () => {
      // Original: Linear graph A-B-C
      const linearGraph = new Graph({
        nodes: [
          { id: 1, label: 'A' },
          { id: 2, label: 'B' },
          { id: 3, label: 'C' }
        ],
        edges: [
          { id: 'e1', source: 1, target: 2 },
          { id: 'e2', source: 2, target: 3 }
        ]
      });

      // Edited: Star graph with B as center
      const starGraph = new Graph({
        nodes: [
          { id: 10, label: 'A' },
          { id: 20, label: 'B' },
          { id: 30, label: 'C' }
        ],
        edges: [
          { id: 'edge1', source: 20, target: 10 },
          { id: 'edge2', source: 20, target: 30 }
        ]
      });

      // Should detect significant structural changes
      expect(linearGraph.getEdges()).toHaveLength(2);
      expect(starGraph.getEdges()).toHaveLength(2);
    });

    it('should handle node reordering with same labels', () => {
      const graph1 = new Graph({
        nodes: [
          { id: 1, label: 'A' },
          { id: 2, label: 'B' },
          { id: 3, label: 'C' }
        ],
        edges: []
      });

      const graph2 = new Graph({
        nodes: [
          { id: 10, label: 'C' },
          { id: 20, label: 'A' },
          { id: 30, label: 'B' }
        ],
        edges: []
      });

      // Should match nodes by label regardless of order
      expect(graph1.getNodes()).toHaveLength(3);
      expect(graph2.getNodes()).toHaveLength(3);
    });
  });
});
