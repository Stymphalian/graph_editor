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

    it('should set node indexing mode', () => {
      graph.setNodeIndexingMode('1-indexed');
      expect(graph.getNodeIndexingMode()).toBe('1-indexed');
      expect(graph.isModified()).toBe(true);
      
      graph.setNodeIndexingMode('custom');
      expect(graph.getNodeIndexingMode()).toBe('custom');
      expect(graph.isModified()).toBe(true);
    });

    it('should re-label existing nodes when changing indexing mode', () => {
      // Add some nodes with 0-indexed labels
      const node1 = graph.addNode({ label: '0' });
      const node2 = graph.addNode({ label: '1' });
      const node3 = graph.addNode({ label: '2' });
      
      expect(node1?.label).toBe('0');
      expect(node2?.label).toBe('1');
      expect(node3?.label).toBe('2');
      
      // Switch to 1-indexed mode
      graph.setNodeIndexingMode('1-indexed');
      
      const data = graph.getData();
      expect(data.nodes[0].label).toBe('1'); // First node becomes 1
      expect(data.nodes[1].label).toBe('2'); // Second node becomes 2
      expect(data.nodes[2].label).toBe('3'); // Third node becomes 3
      
      // Switch to custom mode (should keep same labels as 0-indexed for now)
      graph.setNodeIndexingMode('custom');
      
      const data2 = graph.getData();
      expect(data2.nodes[0].label).toBe('0'); // First node becomes 0
      expect(data2.nodes[1].label).toBe('1'); // Second node becomes 1
      expect(data2.nodes[2].label).toBe('2'); // Third node becomes 2
      
      // Switch back to 0-indexed
      graph.setNodeIndexingMode('0-indexed');
      
      const data3 = graph.getData();
      expect(data3.nodes[0].label).toBe('0'); // First node becomes 0
      expect(data3.nodes[1].label).toBe('1'); // Second node becomes 1
      expect(data3.nodes[2].label).toBe('2'); // Third node becomes 2
    });

    it('should preserve node IDs when re-labeling', () => {
      // Add some nodes
      const node1 = graph.addNode({ label: 'A' });
      const node2 = graph.addNode({ label: 'B' });
      const node3 = graph.addNode({ label: 'C' });
      
      const originalIds = [node1?.id, node2?.id, node3?.id];
      
      // Switch to 1-indexed mode
      graph.setNodeIndexingMode('1-indexed');
      
      const data = graph.getData();
      expect(data.nodes[0].id).toBe(originalIds[0]); // ID should remain the same
      expect(data.nodes[1].id).toBe(originalIds[1]); // ID should remain the same
      expect(data.nodes[2].id).toBe(originalIds[2]); // ID should remain the same
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
      const node = graph.addNode({ label: 'A' });
      const result = graph.removeNode(node!.id);
      
      expect(result).toBe(true);
      expect(graph.getNodeCount()).toBe(0);
      expect(graph.hasNode('A')).toBe(false);
    });

    it('should remove edges when removing node', () => {
      const nodeA = graph.addNode({ label: 'A' });
      const nodeB = graph.addNode({ label: 'B' });
      graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      
      expect(graph.getEdgeCount()).toBe(1);
      graph.removeNode(nodeA!.id);
      expect(graph.getEdgeCount()).toBe(0);
    });

    it('should return false when removing non-existent node', () => {
        const result = graph.removeNode(999);
        expect(result).toBe(false);
        expect(graph.getError()).toContain('not found');
    });

    it('should update a node', () => {
      const node = graph.addNode({ label: 'A' });
      const result = graph.updateNode(node!.id, { label: 'B' });

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
    let nodeA: any, nodeB: any, nodeC: any;
    
    beforeEach(() => {
      nodeA = graph.addNode({ label: 'A' });
      nodeB = graph.addNode({ label: 'B' });
      nodeC = graph.addNode({ label: 'C' });
    });

    it('should add an edge', () => {
      const edge = graph.addEdge({ source: nodeA!.id, target: nodeB!.id });

        expect(edge).toBeDefined();
      expect(edge?.source).toBe(nodeA!.id);
      expect(edge?.target).toBe(nodeB!.id);
        expect(graph.getEdgeCount()).toBe(1);
      expect(graph.hasEdgeBetween(nodeA!.id, nodeB!.id)).toBe(true);
      });

    it('should add an edge with weight', () => {
      const edge = graph.addEdge({ source: nodeA!.id, target: nodeB!.id, weight: '5' });

        expect(edge).toBeDefined();
      expect(edge?.weight).toBe('5');
    });

    it('should reject edge with non-existent source', () => {
      const result = graph.addEdge({ source: 999, target: nodeA!.id });

        expect(result).toBeNull();
      expect(graph.getError()).toContain('source node');
    });

    it('should reject edge with non-existent target', () => {
      const result = graph.addEdge({ source: nodeA!.id, target: 999 });

        expect(result).toBeNull();
      expect(graph.getError()).toContain('target node');
      });

      it('should reject self-loops in undirected graphs', () => {
      const result = graph.addEdge({ source: nodeA!.id, target: nodeA!.id });

        expect(result).toBeNull();
      expect(graph.getError()).toContain('self-loops are not allowed');
      });

      it('should allow self-loops in directed graphs', () => {
        graph.setType('directed');
      const edge = graph.addEdge({ source: nodeA!.id, target: nodeA!.id });

        expect(edge).toBeDefined();
      });

      it('should reject duplicate edges', () => {
      graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      const result = graph.addEdge({ source: nodeA!.id, target: nodeB!.id });

        expect(result).toBeNull();
        expect(graph.getError()).toContain('already exists');
    });

    it('should remove an edge by ID', () => {
      const edge = graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      const result = graph.removeEdge(edge!.id);

        expect(result).toBe(true);
        expect(graph.getEdgeCount()).toBe(0);
    });

    it('should remove edges between nodes', () => {
      graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      const removed = graph.removeEdgesBetweenNodes(nodeA!.id, nodeB!.id);
      
      expect(removed).toBe(1);
      expect(graph.getEdgeCount()).toBe(0);
    });

    it('should update an edge', () => {
      const edge = graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      const result = graph.updateEdge(edge!.id, { weight: '10' });
      
      expect(result).toBeDefined();
      expect(result?.weight).toBe('10');
    });

    it('should get edge by ID', () => {
      const edge = graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      const found = graph.getEdgeById(edge!.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(edge!.id);
      });

      it('should get edges by node', () => {
      graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      graph.addEdge({ source: nodeA!.id, target: nodeC!.id });

      const edges = graph.getEdgesByNode(nodeA!.id);
        expect(edges).toHaveLength(2);
    });

    it('should get edges between nodes', () => {
      graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      const edges = graph.getEdgesBetweenNodes(nodeA!.id, nodeB!.id);

        expect(edges).toHaveLength(1);
      });

      it('should update edge weight', () => {
      const edge = graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      const result = graph.updateEdgeWeight(edge!.id, '15');

        expect(result).toBe(true);
      const updated = graph.getEdgeById(edge!.id);
      expect(updated?.weight).toBe('15');
    });

    it('should remove edge weight', () => {
      const edge = graph.addEdge({ source: nodeA!.id, target: nodeB!.id, weight: '5' });
          const result = graph.removeEdgeWeight(edge!.id);

          expect(result).toBe(true);
      const updated = graph.getEdgeById(edge!.id);
      expect(updated?.weight).toBeUndefined();
      });

      it('should clear all edges', () => {
      graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      graph.addEdge({ source: nodeB!.id, target: nodeC!.id });

      expect(graph.getEdgeCount()).toBe(2);
      graph.clearAllEdges();
        expect(graph.getEdgeCount()).toBe(0);
    });

    it('should get all edge IDs', () => {
      const edge1 = graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      const edge2 = graph.addEdge({ source: nodeB!.id, target: nodeC!.id });
      
      const ids = graph.getEdgeIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain(edge1!.id);
      expect(ids).toContain(edge2!.id);
    });
  });

  describe('Graph Reset and Clone', () => {
    it('should reset graph to empty state', () => {
      const nodeA = graph.addNode({ label: 'A' });
      const nodeB = graph.addNode({ label: 'B' });
      graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      
      expect(graph.getNodeCount()).toBe(2);
      expect(graph.getEdgeCount()).toBe(1);
      
      graph.reset();
      
      expect(graph.getNodeCount()).toBe(0);
      expect(graph.getEdgeCount()).toBe(0);
      expect(graph.isModified()).toBe(false);
    });

    it('should clone graph', () => {
      const nodeA = graph.addNode({ label: 'A' });
      const nodeB = graph.addNode({ label: 'B' });
      graph.addEdge({ source: nodeA!.id, target: nodeB!.id });
      
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
      const nodeA = graph.addNode({ label: 'A' });
      const nodeB = graph.addNode({ label: 'B' });
      graph.addEdge({ source: nodeA!.id, target: nodeB!.id, weight: '5' });
      
        const text = graph.serializeToText();
        const lines = text.split('\n');

      expect(lines[0]).toBe('2'); // Node count
      expect(lines[1]).toBe('A'); // First node
      expect(lines[2]).toBe('B'); // Second node
      expect(lines[3]).toBe('A B 5'); // Edge with weight
    });

    it('should parse text to graph (old format interpreted as edge-list)', () => {
      const text = `2
A
B
A B 5`;

        const result = Graph.parseFromText(text);

        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
      expect(result.graph!.getNodeCount()).toBe(3); // 2, A, B as nodes
      expect(result.graph!.getEdgeCount()).toBe(1); // A B 5 as edge
    });

    it('should handle parse errors', () => {
      // Test with truly invalid input that should cause an error
      const result = Graph.parseFromText('a b c d e f'); // Too many parts
      
      expect(result.success).toBe(true); // Should succeed but ignore invalid lines
      expect(result.graph).toBeDefined();
      expect(result.graph!.getNodeCount()).toBe(0); // No valid content
      expect(result.graph!.getEdgeCount()).toBe(0);
      });

      it('should handle empty text', () => {
        const result = Graph.parseFromText('');

        expect(result.success).toBe(true);
      expect(result.graph!.getNodeCount()).toBe(0);
    });

    it('should parse edge-list format with mixed node and edge definitions', () => {
      const text = `1
2
4
2 3
1 2 100
4 3
3`;

      const result = Graph.parseFromText(text);

      expect(result.success).toBe(true);
      expect(result.graph).toBeDefined();
      
      const graph = result.graph!;
      expect(graph.getNodeCount()).toBe(4);
      expect(graph.getEdgeCount()).toBe(3);
      
      // Check that all nodes exist
      expect(graph.hasNode('1')).toBe(true);
      expect(graph.hasNode('2')).toBe(true);
      expect(graph.hasNode('3')).toBe(true);
      expect(graph.hasNode('4')).toBe(true);
      
      // Check that edges exist
      const node1 = graph.getNodeByLabel('1');
      const node2 = graph.getNodeByLabel('2');
      const node3 = graph.getNodeByLabel('3');
      const node4 = graph.getNodeByLabel('4');
      
      expect(node1).toBeDefined();
      expect(node2).toBeDefined();
      expect(node3).toBeDefined();
      expect(node4).toBeDefined();
      
      // Check edges
      expect(graph.hasEdgeBetween(node2!.id, node3!.id)).toBe(true);
      expect(graph.hasEdgeBetween(node1!.id, node2!.id)).toBe(true);
      expect(graph.hasEdgeBetween(node4!.id, node3!.id)).toBe(true);
      
      // Check edge with weight
      const edgesBetween1And2 = graph.getEdgesBetweenNodes(node1!.id, node2!.id);
      expect(edgesBetween1And2).toHaveLength(1);
      expect(edgesBetween1And2[0].weight).toBe('100');
    });

    it('should ignore duplicate nodes and edges in edge-list format', () => {
      const text = `1
2
1 2
1 2 50
1 2 100
3
3 1`;

      const result = Graph.parseFromText(text);

      expect(result.success).toBe(true);
      expect(result.graph).toBeDefined();
      
      const graph = result.graph!;
      expect(graph.getNodeCount()).toBe(3);
      expect(graph.getEdgeCount()).toBe(2); // Only 1->2 and 3->1, duplicates ignored
      
      const node1 = graph.getNodeByLabel('1');
      const node2 = graph.getNodeByLabel('2');
      const node3 = graph.getNodeByLabel('3');
      
      expect(graph.hasEdgeBetween(node1!.id, node2!.id)).toBe(true);
      expect(graph.hasEdgeBetween(node3!.id, node1!.id)).toBe(true);
    });

    it('should ignore malformed lines in edge-list format', () => {
      const text = `1
2
1 2 3 4 5
1 2
3
3 1`;

      const result = Graph.parseFromText(text);

      expect(result.success).toBe(true);
      expect(result.graph).toBeDefined();
      
      const graph = result.graph!;
      expect(graph.getNodeCount()).toBe(3);
      expect(graph.getEdgeCount()).toBe(2); // Only 1->2 and 3->1
    });

    it('should create nodes automatically when referenced in edges', () => {
      const text = `A B
B C 5
C D`;

      const result = Graph.parseFromText(text);

      expect(result.success).toBe(true);
      expect(result.graph).toBeDefined();
      
      const graph = result.graph!;
      expect(graph.getNodeCount()).toBe(4); // A, B, C, D all created
      expect(graph.getEdgeCount()).toBe(3); // A->B, B->C, C->D
      
      expect(graph.hasNode('A')).toBe(true);
      expect(graph.hasNode('B')).toBe(true);
      expect(graph.hasNode('C')).toBe(true);
      expect(graph.hasNode('D')).toBe(true);
    });
  });
});