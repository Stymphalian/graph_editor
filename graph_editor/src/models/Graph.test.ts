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
      expect(data.nodes[0]?.label).toBe('1'); // First node becomes 1
      expect(data.nodes[1]?.label).toBe('2'); // Second node becomes 2
      expect(data.nodes[2]?.label).toBe('3'); // Third node becomes 3

      // Switch to custom mode (should keep same labels as 0-indexed for now)
      graph.setNodeIndexingMode('custom');

      const data2 = graph.getData();
      expect(data2.nodes[0]?.label).toBe('0'); // First node becomes 0
      expect(data2.nodes[1]?.label).toBe('1'); // Second node becomes 1
      expect(data2.nodes[2]?.label).toBe('2'); // Third node becomes 2

      // Switch back to 0-indexed
      graph.setNodeIndexingMode('0-indexed');

      const data3 = graph.getData();
      expect(data3.nodes[0]?.label).toBe('0'); // First node becomes 0
      expect(data3.nodes[1]?.label).toBe('1'); // Second node becomes 1
      expect(data3.nodes[2]?.label).toBe('2'); // Third node becomes 2
    });

    it('should preserve node order when re-labeling', () => {
      // Add some nodes
      graph.addNode({ label: 'A' });
      graph.addNode({ label: 'B' });
      graph.addNode({ label: 'C' });

      // Original labels stored for reference (not used in this test)
      // const originalLabels = [node1?.label, node2?.label, node3?.label];

      // Switch to 1-indexed mode
      graph.setNodeIndexingMode('1-indexed');

      const data = graph.getData();
      expect(data.nodes[0]?.label).toBe('1'); // First node becomes 1
      expect(data.nodes[1]?.label).toBe('2'); // Second node becomes 2
      expect(data.nodes[2]?.label).toBe('3'); // Third node becomes 3
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
      const result = graph.removeNode('Z');
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

    it('should update edge references when node label changes', () => {
      // Create nodes and edges
      graph.addNode({ label: 'A' });
      graph.addNode({ label: 'B' });
      graph.addNode({ label: 'C' });
      graph.addEdge({ source: 'A', target: 'B', weight: '1' });
      graph.addEdge({ source: 'B', target: 'C', weight: '2' });
      graph.addEdge({ source: 'A', target: 'C', weight: '3' });

      // Verify initial state
      const initialData = graph.getData();
      expect(initialData.edges).toHaveLength(3);
      expect(initialData.edges[0]?.source).toBe('A');
      expect(initialData.edges[0]?.target).toBe('B');
      expect(initialData.edges[1]?.source).toBe('B');
      expect(initialData.edges[1]?.target).toBe('C');
      expect(initialData.edges[2]?.source).toBe('A');
      expect(initialData.edges[2]?.target).toBe('C');

      // Update node label from A to A2
      const result = graph.updateNode('A', { label: 'A2' });
      expect(result).toBeDefined();
      expect(result?.label).toBe('A2');

      // Verify node was updated
      expect(graph.hasNode('A')).toBe(false);
      expect(graph.hasNode('A2')).toBe(true);

      // Verify edge references were updated
      const updatedData = graph.getData();
      expect(updatedData.edges).toHaveLength(3);
      expect(updatedData.edges[0]?.source).toBe('A2'); // Updated
      expect(updatedData.edges[0]?.target).toBe('B');
      expect(updatedData.edges[1]?.source).toBe('B');
      expect(updatedData.edges[1]?.target).toBe('C');
      expect(updatedData.edges[2]?.source).toBe('A2'); // Updated
      expect(updatedData.edges[2]?.target).toBe('C');
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
      const result = graph.addEdge({ source: 'Z', target: 'A' });

      expect(result).toBeNull();
      expect(graph.getError()).toContain('source node');
    });

    it('should reject edge with non-existent target', () => {
      const result = graph.addEdge({ source: 'A', target: 'Z' });

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

    it('should remove an edge by source and target', () => {
      graph.addEdge({ source: 'A', target: 'B' });
      const result = graph.removeEdgeByNodes('A', 'B');

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
      graph.addEdge({ source: 'A', target: 'B' });
      const result = graph.updateEdgeByNodes('A', 'B', { weight: '10' });

      expect(result).toBeDefined();
      expect(result?.weight).toBe('10');
    });

    it('should get edge by source and target', () => {
      graph.addEdge({ source: 'A', target: 'B' });
      const found = graph.getEdgeByNodes('A', 'B');

      expect(found).toBeDefined();
      expect(found?.source).toBe('A');
      expect(found?.target).toBe('B');
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
      graph.addEdge({ source: 'A', target: 'B' });
      const result = graph.updateEdgeWeightByNodes('A', 'B', '15');

      expect(result).toBe(true);
      const updated = graph.getEdgeByNodes('A', 'B');
      expect(updated?.weight).toBe('15');
    });

    it('should remove edge weight', () => {
      graph.addEdge({ source: 'A', target: 'B', weight: '5' });
      const result = graph.removeEdgeWeightByNodes('A', 'B');

      expect(result).toBe(true);
      const updated = graph.getEdgeByNodes('A', 'B');
      expect(updated?.weight).toBeUndefined();
    });

    it('should clear all edges', () => {
      graph.addEdge({ source: 'A', target: 'B' });
      graph.addEdge({ source: 'B', target: 'C' });

      expect(graph.getEdgeCount()).toBe(2);
      graph.clearAllEdges();
      expect(graph.getEdgeCount()).toBe(0);
    });

    it('should get all edge tuples', () => {
      graph.addEdge({ source: 'A', target: 'B' });
      graph.addEdge({ source: 'B', target: 'C' });

      const tuples = graph.getEdgeTuples();
      expect(tuples).toHaveLength(2);
      expect(tuples).toContainEqual(['A', 'B']);
      expect(tuples).toContainEqual(['B', 'C']);
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

    it('should parse text to graph (old format interpreted as edge-list)', () => {
      const text = `2
A
B
A B 5`;

      const result = Graph.parseFromText(text, new Graph());

      expect(result.success).toBe(true);
      expect(result.graph).toBeDefined();
      expect(result.graph!.getNodeCount()).toBe(3); // 2, A, B as nodes
      expect(result.graph!.getEdgeCount()).toBe(1); // A B 5 as edge
    });

    it('should handle parse errors', () => {
      // Test with truly invalid input that should cause an error
      const result = Graph.parseFromText('a b c d e f', new Graph()); // Too many parts

      expect(result.success).toBe(true); // Should succeed but ignore invalid lines
      expect(result.graph).toBeDefined();
      expect(result.graph!.getNodeCount()).toBe(0); // No valid content
      expect(result.graph!.getEdgeCount()).toBe(0);
    });

    it('should handle empty text', () => {
      const result = Graph.parseFromText('', new Graph());

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

      const result = Graph.parseFromText(text, new Graph());

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
      expect(graph.hasEdgeBetween('2', '3')).toBe(true);
      expect(graph.hasEdgeBetween('1', '2')).toBe(true);
      expect(graph.hasEdgeBetween('4', '3')).toBe(true);

      // Check edge with weight
      const edgesBetween1And2 = graph.getEdgesBetweenNodes('1', '2');
      expect(edgesBetween1And2).toHaveLength(1);
      expect(edgesBetween1And2[0]?.weight).toBe('100');
    });

    it('should ignore duplicate nodes and edges in edge-list format', () => {
      const text = `1
2
1 2
1 2 50
1 2 100
3
3 1`;

      const result = Graph.parseFromText(text, new Graph());

      expect(result.success).toBe(true);
      expect(result.graph).toBeDefined();

      const graph = result.graph!;
      expect(graph.getNodeCount()).toBe(3);
      expect(graph.getEdgeCount()).toBe(2); // Only 1->2 and 3->1, duplicates ignored

      // Verify nodes exist
      expect(graph.hasNode('1')).toBe(true);
      expect(graph.hasNode('2')).toBe(true);
      expect(graph.hasNode('3')).toBe(true);

      expect(graph.hasEdgeBetween('1', '2')).toBe(true);
      expect(graph.hasEdgeBetween('3', '1')).toBe(true);
    });

    it('should ignore malformed lines in edge-list format', () => {
      const text = `1
2
1 2 3 4 5
1 2
3
3 1`;

      const result = Graph.parseFromText(text, new Graph());

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

      const result = Graph.parseFromText(text, new Graph());

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
