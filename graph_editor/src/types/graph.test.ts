/**
 * Unit tests for graph type definitions
 */

import {
  Node,
  Edge,
  GraphData,
  GraphState,
  GraphValidationResult,
  NodeCreationData,
  EdgeCreationData,
  GraphSerializationOptions,
  TextFormatData,
  NodeIndexingMode,
  GraphType,
} from './graph';

describe('Graph Types', () => {
  describe('Node interface', () => {
    it('should create a valid node with required properties', () => {
      const node: Node = {
        label: 'A',
      };

      expect(node.label).toBe('A');
    });
  });

  describe('Edge interface', () => {
    it('should create a valid edge with required properties', () => {
      const edge: Edge = {
        id: 'edge1',
        source: 'A',
        target: 'B',
      };

      expect(edge.id).toBe('edge1');
      expect(edge.source).toBe('A');
      expect(edge.target).toBe('B');
    });

    it('should create an edge with optional properties', () => {
      const edge: Edge = {
        id: 'edge2',
        source: 'B',
        target: 'C',
        weight: '5',
      };

      expect(edge.weight).toBe('5');
    });
  });

  describe('GraphData interface', () => {
    it('should create a valid graph data structure', () => {
      const graphData: GraphData = {
        nodes: [
          { label: 'A' },
          { label: 'B' },
        ],
        edges: [{ id: 'edge1', source: 'A', target: 'B' }],
        type: 'directed',
        nodeIndexingMode: '0-indexed',
        maxNodes: 1000,
      };

      expect(graphData.nodes).toHaveLength(2);
      expect(graphData.edges).toHaveLength(1);
      expect(graphData.type).toBe('directed');
      expect(graphData.nodeIndexingMode).toBe('0-indexed');
      expect(graphData.maxNodes).toBe(1000);
    });
  });

  describe('GraphState interface', () => {
    it('should create a valid graph state', () => {
      const graphState: GraphState = {
        data: {
          nodes: [],
          edges: [],
          type: 'undirected',
          nodeIndexingMode: '1-indexed',
          maxNodes: 1000,
        },
        isModified: false,
      };

      expect(graphState.data.type).toBe('undirected');
      expect(graphState.isModified).toBe(false);
      expect(graphState.error).toBeUndefined();
    });

    it('should create a graph state with error', () => {
      const graphState: GraphState = {
        data: {
          nodes: [],
          edges: [],
          type: 'directed',
          nodeIndexingMode: 'custom',
          maxNodes: 1000,
        },
        isModified: true,
        error: 'Invalid graph structure',
      };

      expect(graphState.isModified).toBe(true);
      expect(graphState.error).toBe('Invalid graph structure');
    });
  });

  describe('GraphValidationResult interface', () => {
    it('should create a valid validation result', () => {
      const result: GraphValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should create a validation result with errors and warnings', () => {
      const result: GraphValidationResult = {
        isValid: false,
        errors: ['Node ID already exists', 'Invalid edge reference'],
        warnings: ['Graph has isolated nodes'],
      };

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('NodeCreationData interface', () => {
    it('should create valid node creation data', () => {
      const nodeData: NodeCreationData = {
        label: 'New Node',
      };

      expect(nodeData.label).toBe('New Node');
    });
  });

  describe('EdgeCreationData interface', () => {
    it('should create valid edge creation data', () => {
      const edgeData: EdgeCreationData = {
        source: 'A',
        target: 'B',
        weight: '10',
      };

      expect(edgeData.source).toBe('A');
      expect(edgeData.target).toBe('B');
      expect(edgeData.weight).toBe('10');
    });

    it('should create edge creation data without weight', () => {
      const edgeData: EdgeCreationData = {
        source: 'A',
        target: 'B',
      };

      expect(edgeData.source).toBe('A');
      expect(edgeData.target).toBe('B');
      expect(edgeData.weight).toBeUndefined();
    });
  });

  describe('GraphSerializationOptions interface', () => {
    it('should create valid serialization options', () => {
      const options: GraphSerializationOptions = {
        includePositions: true,
        includeWeights: true,
        format: 'readable',
      };

      expect(options.includePositions).toBe(true);
      expect(options.includeWeights).toBe(true);
      expect(options.format).toBe('readable');
    });

    it('should create minimal serialization options', () => {
      const options: GraphSerializationOptions = {
        includePositions: false,
        includeWeights: false,
      };

      expect(options.includePositions).toBe(false);
      expect(options.includeWeights).toBe(false);
      expect(options.format).toBeUndefined();
    });
  });

  describe('TextFormatData interface', () => {
    it('should create valid text format data', () => {
      const textData: TextFormatData = {
        nodeCount: 3,
        graphType: 'directed',
        edges: ['0 1', '1 2', '2 0'],
        metadata: { version: '1.0' },
      };

      expect(textData.nodeCount).toBe(3);
      expect(textData.graphType).toBe('directed');
      expect(textData.edges).toHaveLength(3);
      expect(textData.metadata).toEqual({ version: '1.0' });
    });

    it('should create text format data without metadata', () => {
      const textData: TextFormatData = {
        nodeCount: 2,
        graphType: 'undirected',
        edges: ['0 1'],
      };

      expect(textData.nodeCount).toBe(2);
      expect(textData.graphType).toBe('undirected');
      expect(textData.edges).toHaveLength(1);
      expect(textData.metadata).toBeUndefined();
    });
  });

  describe('Type unions', () => {
    it('should support all NodeIndexingMode values', () => {
      const modes: NodeIndexingMode[] = ['0-indexed', '1-indexed', 'custom'];

      expect(modes).toContain('0-indexed');
      expect(modes).toContain('1-indexed');
      expect(modes).toContain('custom');
    });

    it('should support all GraphType values', () => {
      const types: GraphType[] = ['directed', 'undirected'];

      expect(types).toContain('directed');
      expect(types).toContain('undirected');
    });
  });
});
