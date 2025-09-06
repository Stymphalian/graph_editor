import { Graph } from './Graph';

describe('Graph', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  describe('Basic Graph Operations', () => {
    it('should create an empty graph', () => {
      expect(graph.getNodeCount()).toBe(0);
      expect(graph.getEdgeCount()).toBe(0);
      expect(graph.isModified()).toBe(false);
    });

    it('should get graph state and data', () => {
      const state = graph.getState();
      const data = graph.getData();
      
      expect(state).toBeDefined();
      expect(data).toBeDefined();
      expect(data.nodes).toEqual([]);
      expect(data.edges).toEqual([]);
    });

    it('should get graph type', () => {
      expect(graph.getType()).toBe('undirected');
      expect(graph.isUndirected()).toBe(true);
      expect(graph.isDirected()).toBe(false);
    });

    it('should set graph type', () => {
      graph.setType('directed');
      expect(graph.getType()).toBe('directed');
      expect(graph.isDirected()).toBe(true);
      expect(graph.isUndirected()).toBe(false);
      expect(graph.isModified()).toBe(true);
    });

    it('should get node indexing mode', () => {
      expect(graph.getNodeIndexingMode()).toBe('0-indexed');
    });

    it('should get max nodes', () => {
      expect(graph.getMaxNodes()).toBe(1000);
    });

    it('should check if modified', () => {
      expect(graph.isModified()).toBe(false);
      graph.setType('directed');
      expect(graph.isModified()).toBe(true);
    });

    it('should get and clear error', () => {
      expect(graph.getError()).toBeUndefined();
      // Add a node to trigger error state
      graph.addNode({ label: 'A' });
      graph.addNode({ label: 'A' }); // This should cause an error
      expect(graph.getError()).toBeDefined();
      graph.clearError();
      expect(graph.getError()).toBeUndefined();
    });
  });

  describe('Node Management', () => {
    it('should add a node', () => {
      const node = graph.addNode({ label: 'A' });
      
      expect(node).toBeDefined();
      expect(node?.label).toBe('A');
      expect(graph.getNodeCount()).toBe(1);
      expect(graph.hasNode('A')).toBe(true);
      expect(graph.isModified()).toBe(true);
    });

    it('should add a node with auto-generated label', () => {
      const node = graph.addNodeWithAutoLabel();

        expect(node).toBeDefined();
      expect(node?.label).toBe('0');
        expect(graph.getNodeCount()).toBe(1);
    });

    it('should get next node label', () => {
      expect(graph.getNextNodeLabel()).toBe('0');
      graph.addNode({ label: 'A' });
      expect(graph.getNextNodeLabel()).toBe('1');
    });

    it('should reject duplicate node labels', () => {
      graph.addNode({ label: 'A' });
      const result = graph.addNode({ label: 'A' });

        expect(result).toBeNull();
      expect(graph.getError()).toContain('already exists');
      });

      it('should reject when max nodes reached', () => {
      // Set max nodes to 1
      (graph as any).state.data.maxNodes = 1;
      graph.addNode({ label: 'A' });
      const result = graph.addNode({ label: 'B' });

        expect(result).toBeNull();
        expect(graph.getError()).toContain('maximum node limit');
    });

    it('should remove a node', () => {
      graph.addNode({ label: 'A' });
      const result = graph.removeNode('A');
      
      expect(result).toBe(true);
      expect(graph.getNodeCount()).toBe(0);
      expect(graph.hasNode('A')).toBe(false);
    });

    it('should remove edges when removing node', () => {
      graph.addNode({ label: 'A' });
      graph.addNode({ label: 'B' });
      graph.addEdge({ source: 'A', target: 'B' });
      
      expect(graph.getEdgeCount()).toBe(1);
      graph.removeNode('A');
      expect(graph.getEdgeCount()).toBe(0);
    });

    it('should return false when removing non-existent node', () => {
        const result = graph.removeNode('nonexistent');
        expect(result).toBe(false);
        expect(graph.getError()).toContain('not found');
    });

    it('should update a node', () => {
      graph.addNode({ label: 'A' });
      const result = graph.updateNode('A', { label: 'B' });

        expect(result).toBeDefined();
      expect(result?.label).toBe('B');
      expect(graph.hasNode('A')).toBe(false);
      expect(graph.hasNode('B')).toBe(true);
    });

    it('should get node by label', () => {
      graph.addNode({ label: 'A' });
        const node = graph.getNodeByLabel('A');

        expect(node).toBeDefined();
        expect(node?.label).toBe('A');
      });

      it('should get all node labels', () => {
      graph.addNode({ label: 'A' });
      graph.addNode({ label: 'B' });
      
        const labels = graph.getNodeLabels();
      expect(labels).toEqual(['A', 'B']);
      });
    });

  describe('Edge Management', () => {
    beforeEach(() => {
      graph.addNode({ label: 'A' });
      graph.addNode({ label: 'B' });
      graph.addNode({ label: 'C' });
    });

    it('should add an edge', () => {
      const edge = graph.addEdge({ source: 'A', target: 'B' });

        expect(edge).toBeDefined();
      expect(edge?.source).toBe('A');
      expect(edge?.target).toBe('B');
        expect(graph.getEdgeCount()).toBe(1);
      expect(graph.hasEdgeBetween('A', 'B')).toBe(true);
      });

    it('should add an edge with weight', () => {
      const edge = graph.addEdge({ source: 'A', target: 'B', weight: '5' });

        expect(edge).toBeDefined();
      expect(edge?.weight).toBe('5');
    });

    it('should reject edge with non-existent source', () => {
      const result = graph.addEdge({ source: 'nonexistent', target: 'A' });

        expect(result).toBeNull();
      expect(graph.getError()).toContain('source node');
    });

    it('should reject edge with non-existent target', () => {
      const result = graph.addEdge({ source: 'A', target: 'nonexistent' });

        expect(result).toBeNull();
      expect(graph.getError()).toContain('target node');
      });

      it('should reject self-loops in undirected graphs', () => {
      const result = graph.addEdge({ source: 'A', target: 'A' });

        expect(result).toBeNull();
      expect(graph.getError()).toContain('self-loops are not allowed');
      });

      it('should allow self-loops in directed graphs', () => {
        graph.setType('directed');
      const edge = graph.addEdge({ source: 'A', target: 'A' });

        expect(edge).toBeDefined();
      });

      it('should reject duplicate edges', () => {
      graph.addEdge({ source: 'A', target: 'B' });
      const result = graph.addEdge({ source: 'A', target: 'B' });

        expect(result).toBeNull();
        expect(graph.getError()).toContain('already exists');
    });

    it('should remove an edge by ID', () => {
      const edge = graph.addEdge({ source: 'A', target: 'B' });
      const result = graph.removeEdge(edge!.id);

        expect(result).toBe(true);
        expect(graph.getEdgeCount()).toBe(0);
    });

    it('should remove edges between nodes', () => {
      graph.addEdge({ source: 'A', target: 'B' });
      const removed = graph.removeEdgesBetweenNodes('A', 'B');
      
      expect(removed).toBe(1);
      expect(graph.getEdgeCount()).toBe(0);
    });

    it('should update an edge', () => {
      const edge = graph.addEdge({ source: 'A', target: 'B' });
      const result = graph.updateEdge(edge!.id, { weight: '10' });
      
      expect(result).toBeDefined();
      expect(result?.weight).toBe('10');
    });

    it('should get edge by ID', () => {
      const edge = graph.addEdge({ source: 'A', target: 'B' });
      const found = graph.getEdgeById(edge!.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(edge!.id);
      });

      it('should get edges by node', () => {
      graph.addEdge({ source: 'A', target: 'B' });
      graph.addEdge({ source: 'A', target: 'C' });

      const edges = graph.getEdgesByNode('A');
        expect(edges).toHaveLength(2);
    });

    it('should get edges between nodes', () => {
      graph.addEdge({ source: 'A', target: 'B' });
      const edges = graph.getEdgesBetweenNodes('A', 'B');

        expect(edges).toHaveLength(1);
      });

      it('should update edge weight', () => {
      const edge = graph.addEdge({ source: 'A', target: 'B' });
      const result = graph.updateEdgeWeight(edge!.id, '15');

        expect(result).toBe(true);
      const updated = graph.getEdgeById(edge!.id);
      expect(updated?.weight).toBe('15');
    });

    it('should remove edge weight', () => {
      const edge = graph.addEdge({ source: 'A', target: 'B', weight: '5' });
          const result = graph.removeEdgeWeight(edge!.id);

          expect(result).toBe(true);
      const updated = graph.getEdgeById(edge!.id);
      expect(updated?.weight).toBeUndefined();
      });

      it('should clear all edges', () => {
      graph.addEdge({ source: 'A', target: 'B' });
      graph.addEdge({ source: 'B', target: 'C' });

      expect(graph.getEdgeCount()).toBe(2);
      graph.clearAllEdges();
        expect(graph.getEdgeCount()).toBe(0);
    });

    it('should get all edge IDs', () => {
      const edge1 = graph.addEdge({ source: 'A', target: 'B' });
      const edge2 = graph.addEdge({ source: 'B', target: 'C' });
      
      const ids = graph.getEdgeIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain(edge1!.id);
      expect(ids).toContain(edge2!.id);
    });
  });

  describe('Graph Reset and Clone', () => {
    it('should reset graph to empty state', () => {
      graph.addNode({ label: 'A' });
      graph.addNode({ label: 'B' });
      graph.addEdge({ source: 'A', target: 'B' });
      
      expect(graph.getNodeCount()).toBe(2);
      expect(graph.getEdgeCount()).toBe(1);
      
      graph.reset();
      
      expect(graph.getNodeCount()).toBe(0);
      expect(graph.getEdgeCount()).toBe(0);
      expect(graph.isModified()).toBe(false);
    });

    it('should clone graph', () => {
      graph.addNode({ label: 'A' });
      graph.addNode({ label: 'B' });
      graph.addEdge({ source: 'A', target: 'B' });
      
      const cloned = graph.clone();
      
      expect(cloned.getNodeCount()).toBe(2);
      expect(cloned.getEdgeCount()).toBe(1);
      expect(cloned.getNodes()).toEqual(graph.getNodes());
      expect(cloned.getEdges()).toEqual(graph.getEdges());
      });
    });

  describe('Graph Serialization', () => {
    it('should serialize empty graph to text', () => {
        const text = graph.serializeToText();
        expect(text).toBe('0');
      });

    it('should serialize graph with nodes and edges to text', () => {
      graph.addNode({ label: 'A' });
      graph.addNode({ label: 'B' });
      graph.addEdge({ source: 'A', target: 'B', weight: '5' });
      
        const text = graph.serializeToText();
        const lines = text.split('\n');

      expect(lines[0]).toBe('2'); // Node count
      expect(lines[1]).toBe('A'); // First node
      expect(lines[2]).toBe('B'); // Second node
      expect(lines[3]).toBe('A B 5'); // Edge with weight
    });

    it('should parse text to graph', () => {
      const text = `2
A
B
A B 5`;

        const result = Graph.parseFromText(text);

        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
      expect(result.graph!.getNodeCount()).toBe(2);
      expect(result.graph!.getEdgeCount()).toBe(1);
    });

    it('should handle parse errors', () => {
      const result = Graph.parseFromText('invalid text');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      });

      it('should handle empty text', () => {
        const result = Graph.parseFromText('');

        expect(result.success).toBe(true);
      expect(result.graph!.getNodeCount()).toBe(0);
    });
  });
});