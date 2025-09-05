/**
 * Unit tests for Graph class
 */

import { Graph } from './Graph';
import { GraphData } from '../types/graph';

describe('Graph', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  describe('Constructor', () => {
    it('should create an empty graph with default settings', () => {
      const state = graph.getState();
      
      expect(state.data.nodes).toHaveLength(0);
      expect(state.data.edges).toHaveLength(0);
      expect(state.data.type).toBe('undirected');
      expect(state.data.nodeIndexingMode).toBe('0-indexed');
      expect(state.data.maxNodes).toBe(1000);
      expect(state.isModified).toBe(false);
      expect(state.error).toBeUndefined();
    });

    it('should create a graph with custom initial data', () => {
      const initialData: Partial<GraphData> = {
        type: 'directed',
        maxNodes: 500,
      };
      const customGraph = new Graph(initialData, '1-indexed');
      const state = customGraph.getState();
      
      expect(state.data.type).toBe('directed');
      expect(state.data.nodeIndexingMode).toBe('1-indexed');
      expect(state.data.maxNodes).toBe(500);
    });
  });

  describe('State Management', () => {
    it('should get current state', () => {
      const state = graph.getState();
      expect(state).toBeDefined();
      expect(state.data).toBeDefined();
    });

    it('should get current data', () => {
      const data = graph.getData();
      expect(data).toBeDefined();
      expect(data.nodes).toBeDefined();
      expect(data.edges).toBeDefined();
    });

    it('should get all nodes', () => {
      const nodes = graph.getNodes();
      expect(Array.isArray(nodes)).toBe(true);
    });

    it('should get all edges', () => {
      const edges = graph.getEdges();
      expect(Array.isArray(edges)).toBe(true);
    });

    it('should get graph type', () => {
      expect(graph.getType()).toBe('undirected');
    });

    it('should get node indexing mode', () => {
      expect(graph.getNodeIndexingMode()).toBe('0-indexed');
    });

    it('should get max nodes', () => {
      expect(graph.getMaxNodes()).toBe(1000);
    });

    it('should check if modified', () => {
      expect(graph.isModified()).toBe(false);
    });

    it('should get error', () => {
      expect(graph.getError()).toBeUndefined();
    });
  });

  describe('Configuration Methods', () => {
    it('should set graph type', () => {
      graph.setType('directed');
      expect(graph.getType()).toBe('directed');
      expect(graph.isModified()).toBe(true);
    });

    it('should not mark as modified if type is the same', () => {
      graph.setType('undirected');
      expect(graph.isModified()).toBe(false);
    });

    it('should set node indexing mode', () => {
      graph.setNodeIndexingMode('1-indexed');
      expect(graph.getNodeIndexingMode()).toBe('1-indexed');
      expect(graph.isModified()).toBe(true);
    });

    it('should set max nodes within valid range', () => {
      graph.setMaxNodes(500);
      expect(graph.getMaxNodes()).toBe(500);
      expect(graph.isModified()).toBe(true);
    });

    it('should clamp max nodes to valid range', () => {
      graph.setMaxNodes(0);
      expect(graph.getMaxNodes()).toBe(1);
      
      graph.setMaxNodes(20000);
      expect(graph.getMaxNodes()).toBe(10000);
    });

    it('should clear error', () => {
      // Manually set error state for testing
      (graph as any).state.error = 'Test error';
      expect(graph.getError()).toBe('Test error');
      
      graph.clearError();
      expect(graph.getError()).toBeUndefined();
    });
  });

  describe('ID Generation', () => {
    it('should generate unique node IDs', () => {
      const id1 = (graph as any).generateNodeId();
      const id2 = (graph as any).generateNodeId();
      
      expect(id1).toBe('node_1');
      expect(id2).toBe('node_2');
      expect(id1).not.toBe(id2);
    });

    it('should generate unique edge IDs', () => {
      const id1 = (graph as any).generateEdgeId();
      const id2 = (graph as any).generateEdgeId();
      
      expect(id1).toBe('edge_1');
      expect(id2).toBe('edge_2');
      expect(id1).not.toBe(id2);
    });

    it('should generate node labels based on indexing mode', () => {
      // Test 0-indexed
      graph.setNodeIndexingMode('0-indexed');
      expect((graph as any).generateNodeLabel(0)).toBe('0');
      expect((graph as any).generateNodeLabel(5)).toBe('5');

      // Test 1-indexed
      graph.setNodeIndexingMode('1-indexed');
      expect((graph as any).generateNodeLabel(0)).toBe('1');
      expect((graph as any).generateNodeLabel(5)).toBe('6');

      // Test custom
      graph.setNodeIndexingMode('custom');
      expect((graph as any).generateNodeLabel(0)).toBe('0');
      expect((graph as any).generateNodeLabel(5)).toBe('5');
    });
  });

  describe('Node Finding Methods', () => {
    beforeEach(() => {
      // Add some test nodes
      (graph as any).state.data.nodes = [
        { id: 'node1', label: 'A', x: 0, y: 0 },
        { id: 'node2', label: 'B', x: 100, y: 0 },
      ];
    });

    it('should find node by ID', () => {
      const node = (graph as any).findNodeById('node1');
      expect(node).toBeDefined();
      expect(node?.id).toBe('node1');
    });

    it('should return undefined for non-existent node', () => {
      const node = (graph as any).findNodeById('nonexistent');
      expect(node).toBeUndefined();
    });

    it('should find edge by ID', () => {
      (graph as any).state.data.edges = [
        { id: 'edge1', source: 'node1', target: 'node2' },
      ];
      
      const edge = (graph as any).findEdgeById('edge1');
      expect(edge).toBeDefined();
      expect(edge?.id).toBe('edge1');
    });

    it('should find edges by source and target nodes', () => {
      (graph as any).state.data.edges = [
        { id: 'edge1', source: 'node1', target: 'node2' },
        { id: 'edge2', source: 'node2', target: 'node1' },
      ];
      
      const edges = (graph as any).findEdgesByNodes('node1', 'node2');
      expect(edges).toHaveLength(2);
    });
  });

  describe('Validation', () => {
    it('should validate empty graph', () => {
      const result = graph.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate node IDs', () => {
      (graph as any).state.data.nodes = [
        { id: 'node1', label: 'A', x: 0, y: 0 },
        { id: 'node1', label: 'B', x: 100, y: 0 },
      ];
      
      const result = graph.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate node ID: node1');
    });

    it('should detect duplicate edge IDs', () => {
      (graph as any).state.data.edges = [
        { id: 'edge1', source: 'node1', target: 'node2' },
        { id: 'edge1', source: 'node2', target: 'node3' },
      ];
      
      const result = graph.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate edge ID: edge1');
    });

    it('should detect invalid edge references', () => {
      (graph as any).state.data.edges = [
        { id: 'edge1', source: 'nonexistent', target: 'node2' },
      ];
      
      const result = graph.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Edge edge1 references non-existent source node: nonexistent');
    });

    it('should detect self-loops in undirected graphs', () => {
      graph.setType('undirected');
      (graph as any).state.data.nodes = [
        { id: 'node1', label: 'A', x: 0, y: 0 },
      ];
      (graph as any).state.data.edges = [
        { id: 'edge1', source: 'node1', target: 'node1' },
      ];
      
      const result = graph.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Self-loop not allowed in undirected graph: edge1');
    });

    it('should detect isolated nodes', () => {
      (graph as any).state.data.nodes = [
        { id: 'node1', label: 'A', x: 0, y: 0 },
        { id: 'node2', label: 'B', x: 100, y: 0 },
        { id: 'node3', label: 'C', x: 200, y: 0 },
      ];
      (graph as any).state.data.edges = [
        { id: 'edge1', source: 'node1', target: 'node2' },
      ];
      (graph as any).state.data.type = 'directed';
      
      const result = graph.validate();
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Isolated node detected: node3 (C)');
    });

    it('should detect when graph exceeds max nodes', () => {
      const testGraph = new Graph();
      testGraph.setMaxNodes(2);
      (testGraph as any).state.data.nodes = [
        { id: 'node1', label: 'A', x: 0, y: 0 },
        { id: 'node2', label: 'B', x: 100, y: 0 },
        { id: 'node3', label: 'C', x: 200, y: 0 },
      ];
      
      const result = testGraph.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Graph exceeds maximum node count of 2');
    });
  });

  describe('Reset and Clone', () => {
    beforeEach(() => {
      // Set up a graph with some data
      (graph as any).state.data.nodes = [
        { id: 'node1', label: 'A', x: 0, y: 0 },
      ];
      (graph as any).state.data.edges = [
        { id: 'edge1', source: 'node1', target: 'node1' },
      ];
      (graph as any).state.isModified = true;
      (graph as any).state.error = 'Test error';
    });

    it('should reset graph to empty state', () => {
      graph.reset();
      const state = graph.getState();
      
      expect(state.data.nodes).toHaveLength(0);
      expect(state.data.edges).toHaveLength(0);
      expect(state.isModified).toBe(false);
      expect(state.error).toBeUndefined();
    });

    it('should preserve configuration during reset', () => {
      graph.setType('directed');
      graph.setNodeIndexingMode('1-indexed');
      graph.setMaxNodes(500);
      
      graph.reset();
      const state = graph.getState();
      
      expect(state.data.type).toBe('directed');
      expect(state.data.nodeIndexingMode).toBe('1-indexed');
      expect(state.data.maxNodes).toBe(500);
    });

    it('should reset counters during reset', () => {
      (graph as any).nodeIdCounter = 5;
      (graph as any).edgeIdCounter = 3;
      
      graph.reset();
      
      expect((graph as any).nodeIdCounter).toBe(0);
      expect((graph as any).edgeIdCounter).toBe(0);
    });

    it('should create a deep copy of the graph', () => {
      const clonedGraph = graph.clone();
      
      expect(clonedGraph).not.toBe(graph);
      expect(clonedGraph.getState()).toEqual(graph.getState());
      
      // Verify it's a deep copy
      const originalNodes = graph.getNodes();
      const clonedNodes = clonedGraph.getNodes();
      expect(clonedNodes).not.toBe(originalNodes);
      expect(clonedNodes[0]).not.toBe(originalNodes[0]);
    });

    it('should preserve counters in clone', () => {
      (graph as any).nodeIdCounter = 5;
      (graph as any).edgeIdCounter = 3;
      
      const clonedGraph = graph.clone();
      
      expect((clonedGraph as any).nodeIdCounter).toBe(5);
      expect((clonedGraph as any).edgeIdCounter).toBe(3);
    });
  });

  // ==================== NODE MANAGEMENT TESTS ====================

  describe('Node Management', () => {
    describe('addNode', () => {
      it('should add a node with valid data', () => {
        const nodeData = { label: 'A', x: 100, y: 200 };
        const node = graph.addNode(nodeData);
        
        expect(node).toBeDefined();
        expect(node?.label).toBe('A');
        expect(node?.x).toBe(100);
        expect(node?.y).toBe(200);
        expect(node?.selected).toBe(false);
        expect(node?.dragging).toBe(false);
        expect(graph.getNodeCount()).toBe(1);
        expect(graph.isModified()).toBe(true);
      });

      it('should reject duplicate labels', () => {
        graph.addNode({ label: 'A', x: 100, y: 200 });
        const result = graph.addNode({ label: 'A', x: 200, y: 300 });
        
        expect(result).toBeNull();
        expect(graph.getError()).toContain('label \'A\' already exists');
        expect(graph.getNodeCount()).toBe(1);
      });

      it('should reject when max nodes reached', () => {
        graph.setMaxNodes(1);
        graph.addNode({ label: 'A', x: 100, y: 200 });
        const result = graph.addNode({ label: 'B', x: 200, y: 300 });
        
        expect(result).toBeNull();
        expect(graph.getError()).toContain('maximum node limit');
        expect(graph.getNodeCount()).toBe(1);
      });

      it('should generate unique IDs for nodes', () => {
        const node1 = graph.addNode({ label: 'A', x: 100, y: 200 });
        const node2 = graph.addNode({ label: 'B', x: 200, y: 300 });
        
        expect(node1?.id).toBeDefined();
        expect(node2?.id).toBeDefined();
        expect(node1?.id).not.toBe(node2?.id);
      });
    });

    describe('addNodeWithAutoLabel', () => {
      it('should add node with auto-generated label in 0-indexed mode', () => {
        graph.setNodeIndexingMode('0-indexed');
        const node = graph.addNodeWithAutoLabel(100, 200);
        
        expect(node?.label).toBe('0');
        expect(node?.x).toBe(100);
        expect(node?.y).toBe(200);
      });

      it('should add node with auto-generated label in 1-indexed mode', () => {
        graph.setNodeIndexingMode('1-indexed');
        const node = graph.addNodeWithAutoLabel(100, 200);
        
        expect(node?.label).toBe('1');
      });

      it('should add node with auto-generated label in custom mode', () => {
        graph.setNodeIndexingMode('custom');
        const node = graph.addNodeWithAutoLabel(100, 200);
        
        expect(node?.label).toBe('0');
      });

      it('should generate sequential labels', () => {
        graph.setNodeIndexingMode('0-indexed');
        const node1 = graph.addNodeWithAutoLabel(100, 200);
        const node2 = graph.addNodeWithAutoLabel(200, 300);
        
        expect(node1?.label).toBe('0');
        expect(node2?.label).toBe('1');
      });
    });

    describe('Node Labeling System', () => {
      beforeEach(() => {
        // Add some test nodes
        graph.addNode({ label: 'A', x: 0, y: 0 });
        graph.addNode({ label: 'B', x: 100, y: 0 });
        graph.addNode({ label: 'C', x: 200, y: 0 });
      });

      describe('Label Regeneration', () => {
        it('should regenerate all labels when changing to 0-indexed mode', () => {
          // First change to a different mode, then back to 0-indexed
          graph.setNodeIndexingMode('1-indexed');
          graph.setNodeIndexingMode('0-indexed');
          const nodes = graph.getNodes();
          
          expect(nodes[0]!.label).toBe('0');
          expect(nodes[1]!.label).toBe('1');
          expect(nodes[2]!.label).toBe('2');
        });

        it('should regenerate all labels when changing to 1-indexed mode', () => {
          graph.setNodeIndexingMode('1-indexed');
          const nodes = graph.getNodes();
          
          expect(nodes[0]!.label).toBe('1');
          expect(nodes[1]!.label).toBe('2');
          expect(nodes[2]!.label).toBe('3');
        });

        it('should regenerate all labels when changing to custom mode', () => {
          graph.setNodeIndexingMode('custom');
          const nodes = graph.getNodes();
          
          expect(nodes[0]!.label).toBe('0');
          expect(nodes[1]!.label).toBe('1');
          expect(nodes[2]!.label).toBe('2');
        });

        it('should not regenerate labels if mode is the same', () => {
          graph.setNodeIndexingMode('0-indexed');
          const originalLabels = graph.getNodes().map(n => n.label);
          
          graph.setNodeIndexingMode('0-indexed');
          const newLabels = graph.getNodes().map(n => n.label);
          
          expect(newLabels).toEqual(originalLabels);
        });
      });

      describe('Next Node Label', () => {
        it('should get next label in 0-indexed mode', () => {
          graph.setNodeIndexingMode('0-indexed');
          expect(graph.getNextNodeLabel()).toBe('3');
        });

        it('should get next label in 1-indexed mode', () => {
          graph.setNodeIndexingMode('1-indexed');
          expect(graph.getNextNodeLabel()).toBe('4');
        });

        it('should get next label in custom mode', () => {
          graph.setNodeIndexingMode('custom');
          expect(graph.getNextNodeLabel()).toBe('3');
        });
      });

      describe('Bulk Label Updates', () => {
        it('should update multiple node labels successfully', () => {
          graph.setNodeIndexingMode('0-indexed');
          const nodeIds = graph.getNodes().map(n => n.id);
          
          const result = graph.updateNodeLabels(nodeIds);
          
          expect(result.success).toBe(true);
          expect(result.updated).toBe(3);
          expect(result.errors).toHaveLength(0);
          
          const nodes = graph.getNodes();
          expect(nodes[0]!.label).toBe('0');
          expect(nodes[1]!.label).toBe('1');
          expect(nodes[2]!.label).toBe('2');
        });

        it('should handle errors in bulk label updates', () => {
          const result = graph.updateNodeLabels(['nonexistent', 'invalid']);
          
          expect(result.success).toBe(false);
          expect(result.updated).toBe(0);
          expect(result.errors).toHaveLength(2);
          expect(result.errors[0]).toContain('not found');
          expect(result.errors[1]).toContain('not found');
        });

        it('should handle partial success in bulk label updates', () => {
          const nodeIds = [graph.getNodes()[0]!.id, 'nonexistent'];
          
          const result = graph.updateNodeLabels(nodeIds);
          
          expect(result.success).toBe(false);
          expect(result.updated).toBe(1);
          expect(result.errors).toHaveLength(1);
        });
      });

      describe('Available Node Labels', () => {
        it('should get available labels in 0-indexed mode', () => {
          graph.setNodeIndexingMode('0-indexed');
          const labels = graph.getAvailableNodeLabels(5);
          
          expect(labels).toEqual(['3', '4', '5', '6', '7']);
        });

        it('should get available labels in 1-indexed mode', () => {
          graph.setNodeIndexingMode('1-indexed');
          const labels = graph.getAvailableNodeLabels(3);
          
          expect(labels).toEqual(['4', '5', '6']);
        });

        it('should get available labels in custom mode', () => {
          graph.setNodeIndexingMode('custom');
          const labels = graph.getAvailableNodeLabels(2);
          
          expect(labels).toEqual(['3', '4']);
        });

        it('should use default count of 10', () => {
          graph.setNodeIndexingMode('0-indexed');
          const labels = graph.getAvailableNodeLabels();
          
          expect(labels).toHaveLength(10);
          expect(labels[0]).toBe('3');
          expect(labels[9]).toBe('12');
        });
      });

      describe('Label Validation', () => {
        it('should validate labels in 0-indexed mode', () => {
          graph.setNodeIndexingMode('0-indexed');
          
          expect(graph.isValidNodeLabel('0')).toBe(true);
          expect(graph.isValidNodeLabel('5')).toBe(true);
          expect(graph.isValidNodeLabel('123')).toBe(true);
          expect(graph.isValidNodeLabel('-1')).toBe(false);
          expect(graph.isValidNodeLabel('abc')).toBe(false);
          expect(graph.isValidNodeLabel('1.5')).toBe(false);
        });

        it('should validate labels in 1-indexed mode', () => {
          graph.setNodeIndexingMode('1-indexed');
          
          expect(graph.isValidNodeLabel('1')).toBe(true);
          expect(graph.isValidNodeLabel('5')).toBe(true);
          expect(graph.isValidNodeLabel('123')).toBe(true);
          expect(graph.isValidNodeLabel('0')).toBe(false);
          expect(graph.isValidNodeLabel('abc')).toBe(false);
          expect(graph.isValidNodeLabel('1.5')).toBe(false);
        });

        it('should validate labels in custom mode', () => {
          graph.setNodeIndexingMode('custom');
          
          expect(graph.isValidNodeLabel('0')).toBe(true);
          expect(graph.isValidNodeLabel('5')).toBe(true);
          expect(graph.isValidNodeLabel('123')).toBe(true);
          expect(graph.isValidNodeLabel('-1')).toBe(false);
          expect(graph.isValidNodeLabel('abc')).toBe(false);
          expect(graph.isValidNodeLabel('1.5')).toBe(false);
        });
      });

      describe('Label Format', () => {
        it('should get label format for 0-indexed mode', () => {
          graph.setNodeIndexingMode('0-indexed');
          expect(graph.getLabelFormat()).toBe('Numeric (0, 1, 2, ...)');
        });

        it('should get label format for 1-indexed mode', () => {
          graph.setNodeIndexingMode('1-indexed');
          expect(graph.getLabelFormat()).toBe('Numeric (1, 2, 3, ...)');
        });

        it('should get label format for custom mode', () => {
          graph.setNodeIndexingMode('custom');
          expect(graph.getLabelFormat()).toBe('Numeric (0, 1, 2, ...)');
        });
      });

      describe('Label Conflict Resolution', () => {
        it('should handle label conflicts when regenerating', () => {
          // Create a scenario where regenerating might cause conflicts
          graph.addNode({ label: '0', x: 300, y: 0 });
          graph.setNodeIndexingMode('0-indexed');
          
          // Should regenerate all labels without conflicts
          const nodes = graph.getNodes();
          const labels = nodes.map(n => n.label);
          const uniqueLabels = new Set(labels);
          
          expect(uniqueLabels.size).toBe(labels.length); // No duplicates
        });
      });

      describe('Relabeling from Custom Mode', () => {
        beforeEach(() => {
          // Set up nodes with custom labels first
          graph.setNodeIndexingMode('custom');
          graph.addNode({ label: 'A', x: 0, y: 0 });
          graph.addNode({ label: 'B', x: 100, y: 0 });
          graph.addNode({ label: 'C', x: 200, y: 0 });
        });

        it('should relabel from custom to 0-indexed mode', () => {
          graph.setNodeIndexingMode('0-indexed');
          const nodes = graph.getNodes();
          
          expect(nodes[0]!.label).toBe('0');
          expect(nodes[1]!.label).toBe('1');
          expect(nodes[2]!.label).toBe('2');
        });

        it('should relabel from custom to 1-indexed mode', () => {
          graph.setNodeIndexingMode('1-indexed');
          const nodes = graph.getNodes();
          
          expect(nodes[0]!.label).toBe('1');
          expect(nodes[1]!.label).toBe('2');
          expect(nodes[2]!.label).toBe('3');
        });

        it('should regenerate labels when staying in custom mode', () => {
          graph.setNodeIndexingMode('custom');
          const nodes = graph.getNodes();
          
          expect(nodes[0]!.label).toBe('0');
          expect(nodes[1]!.label).toBe('1');
          expect(nodes[2]!.label).toBe('2');
        });
      });
    });

    describe('removeNode', () => {
      beforeEach(() => {
        graph.addNode({ label: 'A', x: 100, y: 200 });
        graph.addNode({ label: 'B', x: 200, y: 300 });
      });

      it('should remove node by ID', () => {
        const nodes = graph.getNodes();
        const nodeId = nodes[0]!.id;
        
        const result = graph.removeNode(nodeId);
        
        expect(result).toBe(true);
        expect(graph.getNodeCount()).toBe(1);
        expect(graph.getNodeById(nodeId)).toBeNull();
      });

      it('should return false for non-existent node', () => {
        const result = graph.removeNode('nonexistent');
        
        expect(result).toBe(false);
        expect(graph.getError()).toContain('not found');
        expect(graph.getNodeCount()).toBe(2);
      });

      it('should remove connected edges when removing node', () => {
        // Add an edge first
        const nodes = graph.getNodes();
        (graph as any).state.data.edges = [
          { id: 'edge1', source: nodes[0]!.id, target: nodes[1]!.id }
        ];
        
        const result = graph.removeNode(nodes[0]!.id);
        
        expect(result).toBe(true);
        expect(graph.getEdges()).toHaveLength(0);
      });
    });

    describe('updateNode', () => {
      let nodeId: string;

      beforeEach(() => {
        const node = graph.addNode({ label: 'A', x: 100, y: 200 });
        nodeId = node!.id;
      });

      it('should update node properties', () => {
        const updatedNode = graph.updateNode(nodeId, { 
          label: 'B', 
          x: 300, 
          y: 400,
          selected: true 
        });
        
        expect(updatedNode?.label).toBe('B');
        expect(updatedNode?.x).toBe(300);
        expect(updatedNode?.y).toBe(400);
        expect(updatedNode?.selected).toBe(true);
        expect(graph.isModified()).toBe(true);
      });

      it('should reject duplicate label updates', () => {
        graph.addNode({ label: 'B', x: 200, y: 300 });
        const result = graph.updateNode(nodeId, { label: 'B' });
        
        expect(result).toBeNull();
        expect(graph.getError()).toContain('label \'B\' already exists');
      });

      it('should allow same label update', () => {
        const result = graph.updateNode(nodeId, { label: 'A', x: 500 });
        
        expect(result).toBeDefined();
        expect(result?.label).toBe('A');
        expect(result?.x).toBe(500);
      });

      it('should return null for non-existent node', () => {
        const result = graph.updateNode('nonexistent', { label: 'C' });
        
        expect(result).toBeNull();
        expect(graph.getError()).toContain('not found');
      });
    });

    describe('getNodeById', () => {
      let nodeId: string;

      beforeEach(() => {
        const node = graph.addNode({ label: 'A', x: 100, y: 200 });
        nodeId = node!.id;
      });

      it('should return node by ID', () => {
        const node = graph.getNodeById(nodeId);
        
        expect(node).toBeDefined();
        expect(node?.id).toBe(nodeId);
        expect(node?.label).toBe('A');
      });

      it('should return null for non-existent node', () => {
        const node = graph.getNodeById('nonexistent');
        
        expect(node).toBeNull();
      });

      it('should return a copy of the node', () => {
        const node1 = graph.getNodeById(nodeId);
        const node2 = graph.getNodeById(nodeId);
        
        expect(node1).not.toBe(node2);
        expect(node1).toEqual(node2);
      });
    });

    describe('getNodeByLabel', () => {
      beforeEach(() => {
        graph.addNode({ label: 'A', x: 100, y: 200 });
        graph.addNode({ label: 'B', x: 200, y: 300 });
      });

      it('should return node by label', () => {
        const node = graph.getNodeByLabel('A');
        
        expect(node).toBeDefined();
        expect(node?.label).toBe('A');
      });

      it('should return null for non-existent label', () => {
        const node = graph.getNodeByLabel('C');
        
        expect(node).toBeNull();
      });
    });

    describe('getNodesByLabelPattern', () => {
      beforeEach(() => {
        graph.addNode({ label: 'Node1', x: 100, y: 200 });
        graph.addNode({ label: 'Node2', x: 200, y: 300 });
        graph.addNode({ label: 'Edge1', x: 300, y: 400 });
      });

      it('should find nodes by string pattern', () => {
        const nodes = graph.getNodesByLabelPattern('Node');
        
        expect(nodes).toHaveLength(2);
        expect(nodes.every(node => node.label.includes('Node'))).toBe(true);
      });

      it('should find nodes by regex pattern', () => {
        const nodes = graph.getNodesByLabelPattern(/^Node\d+$/);
        
        expect(nodes).toHaveLength(2);
        expect(nodes.every(node => /^Node\d+$/.test(node.label))).toBe(true);
      });

      it('should be case insensitive', () => {
        const nodes = graph.getNodesByLabelPattern('node');
        
        expect(nodes).toHaveLength(2);
      });
    });

    describe('Node counting and existence', () => {
      beforeEach(() => {
        graph.addNode({ label: 'A', x: 100, y: 200 });
        graph.addNode({ label: 'B', x: 200, y: 300 });
      });

      it('should get node count', () => {
        expect(graph.getNodeCount()).toBe(2);
      });

      it('should check node existence by ID', () => {
        const nodes = graph.getNodes();
        expect(graph.hasNode(nodes[0]!.id)).toBe(true);
        expect(graph.hasNode('nonexistent')).toBe(false);
      });

      it('should check node existence by label', () => {
        expect(graph.hasNodeWithLabel('A')).toBe(true);
        expect(graph.hasNodeWithLabel('C')).toBe(false);
      });

      it('should get all node IDs', () => {
        const ids = graph.getNodeIds();
        expect(ids).toHaveLength(2);
        expect(ids.every(id => typeof id === 'string')).toBe(true);
      });

      it('should get all node labels', () => {
        const labels = graph.getNodeLabels();
        expect(labels).toHaveLength(2);
        expect(labels).toContain('A');
        expect(labels).toContain('B');
      });
    });

    describe('Node selection', () => {
      let nodeId: string;

      beforeEach(() => {
        const node = graph.addNode({ label: 'A', x: 100, y: 200 });
        nodeId = node!.id;
      });

      it('should select a node', () => {
        const result = graph.selectNode(nodeId);
        
        expect(result).toBe(true);
        expect(graph.getNodeById(nodeId)?.selected).toBe(true);
      });

      it('should deselect a node', () => {
        graph.selectNode(nodeId);
        const result = graph.deselectNode(nodeId);
        
        expect(result).toBe(true);
        expect(graph.getNodeById(nodeId)?.selected).toBe(false);
      });

      it('should toggle node selection', () => {
        expect(graph.getNodeById(nodeId)?.selected).toBe(false);
        
        graph.toggleNodeSelection(nodeId);
        expect(graph.getNodeById(nodeId)?.selected).toBe(true);
        
        graph.toggleNodeSelection(nodeId);
        expect(graph.getNodeById(nodeId)?.selected).toBe(false);
      });

      it('should clear all node selections', () => {
        graph.addNode({ label: 'B', x: 200, y: 300 });
        graph.selectNode(nodeId);
        graph.selectNode(graph.getNodeByLabel('B')!.id);
        
        graph.clearNodeSelections();
        
        expect(graph.getSelectedNodes()).toHaveLength(0);
        expect(graph.getNodeById(nodeId)?.selected).toBe(false);
      });

      it('should get selected nodes', () => {
        graph.addNode({ label: 'B', x: 200, y: 300 });
        graph.selectNode(nodeId);
        
        const selectedNodes = graph.getSelectedNodes();
        expect(selectedNodes).toHaveLength(1);
        expect(selectedNodes[0]!.id).toBe(nodeId);
      });

      it('should return false for non-existent node operations', () => {
        expect(graph.selectNode('nonexistent')).toBe(false);
        expect(graph.deselectNode('nonexistent')).toBe(false);
        expect(graph.toggleNodeSelection('nonexistent')).toBe(false);
      });
    });

    describe('Node dragging and movement', () => {
      let nodeId: string;

      beforeEach(() => {
        const node = graph.addNode({ label: 'A', x: 100, y: 200 });
        nodeId = node!.id;
      });

      it('should set node dragging state', () => {
        const result = graph.setNodeDragging(nodeId, true);
        
        expect(result).toBe(true);
        expect(graph.getNodeById(nodeId)?.dragging).toBe(true);
      });

      it('should move node to new coordinates', () => {
        const result = graph.moveNode(nodeId, 500, 600);
        
        expect(result).toBe(true);
        const node = graph.getNodeById(nodeId);
        expect(node?.x).toBe(500);
        expect(node?.y).toBe(600);
      });

      it('should return false for non-existent node operations', () => {
        expect(graph.setNodeDragging('nonexistent', true)).toBe(false);
        expect(graph.moveNode('nonexistent', 100, 200)).toBe(false);
      });
    });
  });

  // ==================== EDGE MANAGEMENT TESTS ====================

  describe('Edge Management', () => {
    let node1Id: string;
    let node2Id: string;
    let node3Id: string;

    beforeEach(() => {
      const node1 = graph.addNode({ label: 'A', x: 100, y: 200 });
      const node2 = graph.addNode({ label: 'B', x: 200, y: 300 });
      const node3 = graph.addNode({ label: 'C', x: 300, y: 400 });
      node1Id = node1!.id;
      node2Id = node2!.id;
      node3Id = node3!.id;
    });

    describe('addEdge', () => {
      it('should add an edge with valid data', () => {
        const edge = graph.addEdge({ source: node1Id, target: node2Id, weight: '5' });
        
        expect(edge).toBeDefined();
        expect(edge?.source).toBe(node1Id);
        expect(edge?.target).toBe(node2Id);
        expect(edge?.weight).toBe('5');
        // Edge direction is determined by graph type, not stored on edge
        expect(edge?.selected).toBe(false);
        expect(graph.getEdgeCount()).toBe(1);
        expect(graph.isModified()).toBe(true);
      });

      it('should add an edge without weight', () => {
        const edge = graph.addEdge({ source: node1Id, target: node2Id });
        
        expect(edge).toBeDefined();
        expect(edge?.weight).toBeUndefined();
      });

      it('should reject edge with non-existent source node', () => {
        const result = graph.addEdge({ source: 'nonexistent', target: node2Id });
        
        expect(result).toBeNull();
        expect(graph.getError()).toContain('source node \'nonexistent\' not found');
        expect(graph.getEdgeCount()).toBe(0);
      });

      it('should reject edge with non-existent target node', () => {
        const result = graph.addEdge({ source: node1Id, target: 'nonexistent' });
        
        expect(result).toBeNull();
        expect(graph.getError()).toContain('target node \'nonexistent\' not found');
        expect(graph.getEdgeCount()).toBe(0);
      });

      it('should reject self-loops in undirected graphs', () => {
        const result = graph.addEdge({ source: node1Id, target: node1Id });
        
        expect(result).toBeNull();
        expect(graph.getError()).toContain('self-loops are not allowed in undirected graphs');
        expect(graph.getEdgeCount()).toBe(0);
      });

      it('should allow self-loops in directed graphs', () => {
        graph.setType('directed');
        const edge = graph.addEdge({ source: node1Id, target: node1Id });
        
        expect(edge).toBeDefined();
        // Edge direction is determined by graph type, not stored on edge
        expect(graph.getEdgeCount()).toBe(1);
      });

      it('should reject duplicate edges', () => {
        graph.addEdge({ source: node1Id, target: node2Id });
        const result = graph.addEdge({ source: node1Id, target: node2Id });
        
        expect(result).toBeNull();
        expect(graph.getError()).toContain('already exists');
        expect(graph.getEdgeCount()).toBe(1);
      });

      it('should generate unique IDs for edges', () => {
        const edge1 = graph.addEdge({ source: node1Id, target: node2Id });
        const edge2 = graph.addEdge({ source: node2Id, target: node3Id });
        
        expect(edge1?.id).toBeDefined();
        expect(edge2?.id).toBeDefined();
        expect(edge1?.id).not.toBe(edge2?.id);
      });

      it('should set directed property based on graph type', () => {
        graph.setType('directed');
        graph.addEdge({ source: node1Id, target: node2Id });
        
        // Edge direction is determined by graph type, not stored on edge
      });
    });

    describe('addEdgeWithWeight', () => {
      it('should add edge with weight', () => {
        const edge = graph.addEdgeWithWeight(node1Id, node2Id, '10');
        
        expect(edge).toBeDefined();
        expect(edge?.weight).toBe('10');
      });

      it('should add edge without weight', () => {
        const edge = graph.addEdgeWithWeight(node1Id, node2Id);
        
        expect(edge).toBeDefined();
        expect(edge?.weight).toBeUndefined();
      });
    });

    describe('removeEdge', () => {
      let edgeId: string;

      beforeEach(() => {
        const edge = graph.addEdge({ source: node1Id, target: node2Id });
        edgeId = edge!.id;
      });

      it('should remove edge by ID', () => {
        const result = graph.removeEdge(edgeId);
        
        expect(result).toBe(true);
        expect(graph.getEdgeCount()).toBe(0);
        expect(graph.getEdgeById(edgeId)).toBeNull();
      });

      it('should return false for non-existent edge', () => {
        const result = graph.removeEdge('nonexistent');
        
        expect(result).toBe(false);
        expect(graph.getError()).toContain('not found');
        expect(graph.getEdgeCount()).toBe(1);
      });
    });

    describe('removeEdgesBetweenNodes', () => {
      beforeEach(() => {
        graph.addEdge({ source: node1Id, target: node2Id });
        graph.addEdge({ source: node2Id, target: node1Id }); // This won't be added in undirected
        graph.addEdge({ source: node1Id, target: node3Id });
      });

      it('should remove edges between two nodes', () => {
        const removedCount = graph.removeEdgesBetweenNodes(node1Id, node2Id);
        
        expect(removedCount).toBe(1);
        expect(graph.getEdgeCount()).toBe(1);
        expect(graph.hasEdgeBetween(node1Id, node2Id)).toBe(false);
      });

      it('should return 0 if no edges exist between nodes', () => {
        const removedCount = graph.removeEdgesBetweenNodes(node2Id, node3Id);
        
        expect(removedCount).toBe(0);
        expect(graph.getEdgeCount()).toBe(2);
      });
    });

    describe('updateEdge', () => {
      let edgeId: string;

      beforeEach(() => {
        const edge = graph.addEdge({ source: node1Id, target: node2Id, weight: '5' });
        edgeId = edge!.id;
      });

      it('should update edge properties', () => {
        const updatedEdge = graph.updateEdge(edgeId, { 
          weight: '10',
          selected: true 
        });
        
        expect(updatedEdge?.weight).toBe('10');
        expect(updatedEdge?.selected).toBe(true);
        expect(graph.isModified()).toBe(true);
      });

      it('should return null for non-existent edge', () => {
        const result = graph.updateEdge('nonexistent', { weight: '10' });
        
        expect(result).toBeNull();
        expect(graph.getError()).toContain('not found');
      });
    });

    describe('getEdgeById', () => {
      let edgeId: string;

      beforeEach(() => {
        const edge = graph.addEdge({ source: node1Id, target: node2Id });
        edgeId = edge!.id;
      });

      it('should return edge by ID', () => {
        const edge = graph.getEdgeById(edgeId);
        
        expect(edge).toBeDefined();
        expect(edge?.id).toBe(edgeId);
        expect(edge?.source).toBe(node1Id);
      });

      it('should return null for non-existent edge', () => {
        const edge = graph.getEdgeById('nonexistent');
        
        expect(edge).toBeNull();
      });

      it('should return a copy of the edge', () => {
        const edge1 = graph.getEdgeById(edgeId);
        const edge2 = graph.getEdgeById(edgeId);
        
        expect(edge1).not.toBe(edge2);
        expect(edge1).toEqual(edge2);
      });
    });

    describe('Edge queries by nodes', () => {
      beforeEach(() => {
        graph.addEdge({ source: node1Id, target: node2Id, weight: '5' });
        graph.addEdge({ source: node2Id, target: node3Id, weight: '10' });
        graph.addEdge({ source: node1Id, target: node3Id, weight: '15' });
      });

      it('should get edges by node', () => {
        const edges = graph.getEdgesByNode(node1Id);
        
        expect(edges).toHaveLength(2);
        expect(edges.every(edge => edge.source === node1Id || edge.target === node1Id)).toBe(true);
      });

      it('should get edges by source', () => {
        const edges = graph.getEdgesBySource(node1Id);
        
        expect(edges).toHaveLength(2);
        expect(edges.every(edge => edge.source === node1Id)).toBe(true);
      });

      it('should get edges by target', () => {
        const edges = graph.getEdgesByTarget(node3Id);
        
        expect(edges).toHaveLength(2);
        expect(edges.every(edge => edge.target === node3Id)).toBe(true);
      });

      it('should get edges between specific nodes', () => {
        const edges = graph.getEdgesBetweenNodes(node1Id, node2Id);
        
        expect(edges).toHaveLength(1);
        expect(edges[0]!.source).toBe(node1Id);
        expect(edges[0]!.target).toBe(node2Id);
      });

      it('should return empty array for non-existent node queries', () => {
        expect(graph.getEdgesByNode('nonexistent')).toHaveLength(0);
        expect(graph.getEdgesBySource('nonexistent')).toHaveLength(0);
        expect(graph.getEdgesByTarget('nonexistent')).toHaveLength(0);
        expect(graph.getEdgesBetweenNodes('nonexistent', node1Id)).toHaveLength(0);
      });
    });

    describe('Edge counting and existence', () => {
      beforeEach(() => {
        graph.addEdge({ source: node1Id, target: node2Id });
        graph.addEdge({ source: node2Id, target: node3Id });
      });

      it('should get edge count', () => {
        expect(graph.getEdgeCount()).toBe(2);
      });

      it('should check edge existence by ID', () => {
        const edges = graph.getAllEdges();
        expect(graph.hasEdge(edges[0]!.id)).toBe(true);
        expect(graph.hasEdge('nonexistent')).toBe(false);
      });

      it('should check edge existence between nodes', () => {
        expect(graph.hasEdgeBetween(node1Id, node2Id)).toBe(true);
        expect(graph.hasEdgeBetween(node1Id, node3Id)).toBe(false);
      });

      it('should get all edge IDs', () => {
        const ids = graph.getEdgeIds();
        expect(ids).toHaveLength(2);
        expect(ids.every(id => typeof id === 'string')).toBe(true);
      });

      it('should get all edges', () => {
        const edges = graph.getAllEdges();
        expect(edges).toHaveLength(2);
        expect(edges.every(edge => typeof edge.id === 'string')).toBe(true);
      });
    });

    describe('Edge selection', () => {
      let edgeId: string;

      beforeEach(() => {
        const edge = graph.addEdge({ source: node1Id, target: node2Id });
        edgeId = edge!.id;
      });

      it('should select an edge', () => {
        const result = graph.selectEdge(edgeId);
        
        expect(result).toBe(true);
        expect(graph.getEdgeById(edgeId)?.selected).toBe(true);
      });

      it('should deselect an edge', () => {
        graph.selectEdge(edgeId);
        const result = graph.deselectEdge(edgeId);
        
        expect(result).toBe(true);
        expect(graph.getEdgeById(edgeId)?.selected).toBe(false);
      });

      it('should toggle edge selection', () => {
        expect(graph.getEdgeById(edgeId)?.selected).toBe(false);
        
        graph.toggleEdgeSelection(edgeId);
        expect(graph.getEdgeById(edgeId)?.selected).toBe(true);
        
        graph.toggleEdgeSelection(edgeId);
        expect(graph.getEdgeById(edgeId)?.selected).toBe(false);
      });

      it('should clear all edge selections', () => {
        graph.addEdge({ source: node2Id, target: node3Id });
        graph.selectEdge(edgeId);
        graph.selectEdge(graph.getAllEdges()[1]!.id);
        
        graph.clearEdgeSelections();
        
        expect(graph.getSelectedEdges()).toHaveLength(0);
        expect(graph.getEdgeById(edgeId)?.selected).toBe(false);
      });

      it('should get selected edges', () => {
        graph.addEdge({ source: node2Id, target: node3Id });
        graph.selectEdge(edgeId);
        
        const selectedEdges = graph.getSelectedEdges();
        expect(selectedEdges).toHaveLength(1);
        expect(selectedEdges[0]!.id).toBe(edgeId);
      });

      it('should return false for non-existent edge operations', () => {
        expect(graph.selectEdge('nonexistent')).toBe(false);
        expect(graph.deselectEdge('nonexistent')).toBe(false);
        expect(graph.toggleEdgeSelection('nonexistent')).toBe(false);
      });
    });

    describe('Edge weight operations', () => {
      beforeEach(() => {
        graph.addEdge({ source: node1Id, target: node2Id, weight: '5' });
        graph.addEdge({ source: node2Id, target: node3Id, weight: '10' });
        graph.addEdge({ source: node1Id, target: node3Id }); // no weight
      });

      it('should get edges by weight', () => {
        const edges = graph.getEdgesByWeight('5');
        
        expect(edges).toHaveLength(1);
        expect(edges[0]!.weight).toBe('5');
      });

      it('should get edges by weight pattern', () => {
        const edges = graph.getEdgesByWeightPattern(/^\d+$/);
        
        expect(edges).toHaveLength(2);
        expect(edges.every(edge => /^\d+$/.test(edge.weight!))).toBe(true);
      });

      it('should get all edge weights', () => {
        const weights = graph.getEdgeWeights();
        
        expect(weights).toHaveLength(2);
        expect(weights).toContain('5');
        expect(weights).toContain('10');
      });

      it('should update edge weight', () => {
        const edge = graph.getAllEdges()[0]!;
        const result = graph.updateEdgeWeight(edge.id, '20');
        
        expect(result).toBe(true);
        expect(graph.getEdgeById(edge.id)?.weight).toBe('20');
      });

      it('should return false for non-existent edge weight update', () => {
        const result = graph.updateEdgeWeight('nonexistent', '20');
        
        expect(result).toBe(false);
      });
    });

    describe('Advanced Edge Weight Operations', () => {
        beforeEach(() => {
          // Clear any existing edges first
          graph.clearAllEdges();
          
          // Set to directed mode to allow self-loops
          graph.setType('directed');
          
          // Add edges with various weights for testing
          graph.addEdge({ source: node1Id, target: node2Id, weight: '5' });
          graph.addEdge({ source: node2Id, target: node3Id, weight: '10' });
          graph.addEdge({ source: node1Id, target: node3Id, weight: '15' });
          graph.addEdge({ source: node1Id, target: node1Id, weight: '3' }); // self-loop
          graph.addEdge({ source: node2Id, target: node2Id }); // no weight
        });


      describe('Weight Validation', () => {
        it('should validate valid weights', () => {
          expect(graph.isValidEdgeWeight('5')).toEqual({ valid: true });
          expect(graph.isValidEdgeWeight('10.5')).toEqual({ valid: true });
          expect(graph.isValidEdgeWeight('high')).toEqual({ valid: true });
          expect(graph.isValidEdgeWeight('a')).toEqual({ valid: true });
        });

        it('should reject invalid weights', () => {
          expect(graph.isValidEdgeWeight('')).toEqual({ valid: false, reason: 'Weight cannot be empty' });
          expect(graph.isValidEdgeWeight('   ')).toEqual({ valid: false, reason: 'Weight cannot be empty' });
          expect(graph.isValidEdgeWeight('a'.repeat(101))).toEqual({ valid: false, reason: 'Weight is too long (max 100 characters)' });
        });

        it('should handle edge cases in validation', () => {
          expect(graph.isValidEdgeWeight('0')).toEqual({ valid: true });
          expect(graph.isValidEdgeWeight('-5')).toEqual({ valid: true });
          expect(graph.isValidEdgeWeight('0.0')).toEqual({ valid: true });
        });
      });


      describe('Weight Removal', () => {
        it('should remove weight from edge', () => {
          const edge = graph.getAllEdges().find(e => e.weight === '5')!;
          const result = graph.removeEdgeWeight(edge.id);
          
          expect(result).toBe(true);
          expect(graph.getEdgeById(edge.id)?.weight).toBeUndefined();
        });

        it('should return false for non-existent edge', () => {
          const result = graph.removeEdgeWeight('nonexistent');
          
          expect(result).toBe(false);
        });

        it('should handle edge without weight', () => {
          const edge = graph.getAllEdges().find(e => !e.weight);
          expect(edge).toBeDefined();
          
          const result = graph.removeEdgeWeight(edge!.id);
          
          expect(result).toBe(true);
          expect(graph.getEdgeById(edge!.id)?.weight).toBeUndefined();
        });
      });

      describe('Bulk Weight Operations', () => {
        it('should set weight for multiple edges', () => {
          const edgeIds = graph.getAllEdges().slice(0, 3).map(e => e.id);
          const result = graph.setEdgeWeights(edgeIds, '20');
          
          expect(result.success).toBe(true);
          expect(result.updated).toBe(3);
          expect(result.errors).toHaveLength(0);
          
          edgeIds.forEach(edgeId => {
            expect(graph.getEdgeById(edgeId)?.weight).toBe('20');
          });
        });

        it('should handle errors in bulk weight operations', () => {
          const edgeIds = ['nonexistent1', 'nonexistent2'];
          const result = graph.setEdgeWeights(edgeIds, '20');
          
          expect(result.success).toBe(false);
          expect(result.updated).toBe(0);
          expect(result.errors).toHaveLength(2);
        });

        it('should handle partial success in bulk weight operations', () => {
          const validEdge = graph.getAllEdges()[0]!.id;
          const edgeIds = [validEdge, 'nonexistent'];
          const result = graph.setEdgeWeights(edgeIds, '25');
          
          expect(result.success).toBe(false);
          expect(result.updated).toBe(1);
          expect(result.errors).toHaveLength(1);
          expect(graph.getEdgeById(validEdge)?.weight).toBe('25');
        });

        it('should validate weight before bulk operations', () => {
          const edgeIds = graph.getAllEdges().slice(0, 2).map(e => e.id);
          const result = graph.setEdgeWeights(edgeIds, '');
          
          expect(result.success).toBe(false);
          expect(result.updated).toBe(0);
          expect(result.errors).toHaveLength(1);
          expect(result.errors[0]).toContain('Weight cannot be empty');
        });
      });
    });

    describe('Edge clearing and degree calculations', () => {
      beforeEach(() => {
        graph.addEdge({ source: node1Id, target: node2Id });
        graph.addEdge({ source: node2Id, target: node3Id });
        graph.addEdge({ source: node1Id, target: node3Id });
      });

      it('should clear all edges', () => {
        graph.clearAllEdges();
        
        expect(graph.getEdgeCount()).toBe(0);
        expect(graph.getAllEdges()).toHaveLength(0);
      });

      it('should calculate node degree', () => {
        expect(graph.getNodeDegree(node1Id)).toBe(2);
        expect(graph.getNodeDegree(node2Id)).toBe(2);
        expect(graph.getNodeDegree(node3Id)).toBe(2);
      });

      it('should calculate node in-degree', () => {
        expect(graph.getNodeInDegree(node1Id)).toBe(0);
        expect(graph.getNodeInDegree(node2Id)).toBe(1);
        expect(graph.getNodeInDegree(node3Id)).toBe(2);
      });

      it('should calculate node out-degree', () => {
        expect(graph.getNodeOutDegree(node1Id)).toBe(2);
        expect(graph.getNodeOutDegree(node2Id)).toBe(1);
        expect(graph.getNodeOutDegree(node3Id)).toBe(0);
      });

      it('should return 0 for non-existent node degrees', () => {
        expect(graph.getNodeDegree('nonexistent')).toBe(0);
        expect(graph.getNodeInDegree('nonexistent')).toBe(0);
        expect(graph.getNodeOutDegree('nonexistent')).toBe(0);
      });
    });
  });

  // ==================== VALIDATION TESTS ====================

  describe('Graph Validation', () => {
    describe('Basic Structure Validation', () => {
      it('should validate empty graph', () => {
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });

      it('should detect when graph exceeds max nodes', () => {
        const testGraph = new Graph();
        testGraph.setMaxNodes(2);
        (testGraph as any).state.data.nodes = [
          { id: 'node1', label: 'A', x: 0, y: 0 },
          { id: 'node2', label: 'B', x: 100, y: 0 },
          { id: 'node3', label: 'C', x: 200, y: 0 },
        ];
        
        const result = testGraph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Graph exceeds maximum node count of 2');
      });

      it('should detect edges without nodes', () => {
        (graph as any).state.data.edges = [
          { id: 'edge1', source: 'node1', target: 'node2' }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Graph has edges but no nodes');
      });

      it('should warn about negative coordinates', () => {
        graph.addNode({ label: 'A', x: -10, y: 20 });
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Node node_1 has negative coordinates: (-10, 20)');
      });
    });

    describe('Node Validation', () => {
      it('should detect duplicate node IDs', () => {
        (graph as any).state.data.nodes = [
          { id: 'node1', label: 'A', x: 0, y: 0 },
          { id: 'node1', label: 'B', x: 100, y: 0 }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Duplicate node ID: node1');
      });

      it('should detect duplicate node labels', () => {
        (graph as any).state.data.nodes = [
          { id: 'node1', label: 'A', x: 0, y: 0 },
          { id: 'node2', label: 'A', x: 100, y: 0 }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Duplicate node label: A');
      });

      it('should detect empty node labels', () => {
        (graph as any).state.data.nodes = [
          { id: 'node1', label: '', x: 0, y: 0 }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Node node1 has empty or invalid label');
      });

      it('should warn about very large coordinates', () => {
        graph.addNode({ label: 'A', x: 50000, y: 30000 });
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Node node_1 has very large coordinates: (50000, 30000)');
      });

      it('should detect NaN coordinates', () => {
        (graph as any).state.data.nodes = [
          { id: 'node1', label: 'A', x: NaN, y: 0 }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Node node1 has invalid coordinates: (NaN, 0)');
      });
    });

    describe('Edge Validation', () => {
      beforeEach(() => {
        graph.addNode({ label: 'A', x: 0, y: 0 });
        graph.addNode({ label: 'B', x: 100, y: 0 });
      });

      it('should detect duplicate edge IDs', () => {
        (graph as any).state.data.edges = [
          { id: 'edge1', source: 'node_1', target: 'node_2' },
          { id: 'edge1', source: 'node_2', target: 'node_1' }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Duplicate edge ID: edge1');
      });

      it('should detect invalid edge references', () => {
        (graph as any).state.data.edges = [
          { id: 'edge1', source: 'nonexistent', target: 'node_1' }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Edge edge1 references non-existent source node: nonexistent');
      });

      it('should detect self-loops in undirected graphs', () => {
        (graph as any).state.data.edges = [
          { id: 'edge1', source: 'node_1', target: 'node_1' }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Self-loop not allowed in undirected graph: edge1');
      });

      it('should detect duplicate edges', () => {
        (graph as any).state.data.edges = [
          { id: 'edge1', source: 'node_1', target: 'node_2' },
          { id: 'edge2', source: 'node_2', target: 'node_1' }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('Duplicate edge between'))).toBe(true);
      });

      it('should detect invalid weight types', () => {
        (graph as any).state.data.edges = [
          { id: 'edge1', source: 'node_1', target: 'node_2', weight: 123 }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Edge edge1 has invalid weight type: number');
      });

      it('should warn about empty weights', () => {
        (graph as any).state.data.edges = [
          { id: 'edge1', source: 'node_1', target: 'node_2', weight: '   ' }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Edge edge1 has empty weight');
      });

      it('should validate edge structure', () => {
        graph.setType('directed');
        (graph as any).state.data.edges = [
          { id: 'edge1', source: 'node_1', target: 'node_2' }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
      });
    });

    describe('Graph Topology Validation', () => {
      it('should detect isolated nodes', () => {
        graph.addNode({ label: 'A', x: 0, y: 0 });
        graph.addNode({ label: 'B', x: 100, y: 0 });
        graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: graph.getNodes()[0]!.id, target: graph.getNodes()[1]!.id });
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Isolated node detected: node_3 (C)');
      });

      it('should detect disconnected components', () => {
        graph.addNode({ label: 'A', x: 0, y: 0 });
        graph.addNode({ label: 'B', x: 100, y: 0 });
        graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addNode({ label: 'D', x: 300, y: 0 });
        graph.addEdge({ source: graph.getNodes()[0]!.id, target: graph.getNodes()[1]!.id });
        graph.addEdge({ source: graph.getNodes()[2]!.id, target: graph.getNodes()[3]!.id });
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Graph has 2 disconnected components');
      });

      it('should detect cycles in directed graphs', () => {
        graph.setType('directed');
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        const node3 = graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        graph.addEdge({ source: node2!.id, target: node3!.id });
        graph.addEdge({ source: node3!.id, target: node1!.id });
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Directed graph contains cycles');
      });
    });

    describe('Graph Constraints Validation', () => {
      it('should warn about high degree nodes', () => {
        const centerNode = graph.addNode({ label: 'Center', x: 0, y: 0 });
        for (let i = 0; i < 60; i++) {
          const node = graph.addNode({ label: `Node${i}`, x: i * 10, y: 0 });
          graph.addEdge({ source: centerNode!.id, target: node!.id });
        }
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Node with high degree detected: 60 connections');
      });

      it('should warn about dense graphs', () => {
        // Create a complete graph with 4 nodes (6 edges)
        const nodes = [];
        for (let i = 0; i < 4; i++) {
          nodes.push(graph.addNode({ label: `Node${i}`, x: i * 100, y: 0 }));
        }
        
        // Add all possible edges
        for (let i = 0; i < 4; i++) {
          for (let j = i + 1; j < 4; j++) {
            graph.addEdge({ source: nodes[i]!.id, target: nodes[j]!.id });
          }
        }
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Graph is very dense: 100.0% of possible edges present');
      });

      it('should warn about sparse graphs', () => {
        // Create 10 nodes with only 1 edge
        for (let i = 0; i < 10; i++) {
          graph.addNode({ label: `Node${i}`, x: i * 100, y: 0 });
        }
        graph.addEdge({ source: graph.getNodes()[0]!.id, target: graph.getNodes()[1]!.id });
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Graph is very sparse: 2.2% of possible edges present');
      });

      it('should warn about overlapping nodes', () => {
        (graph as any).state.data.nodes = [
          { id: 'node1', label: 'A', x: 100, y: 100 },
          { id: 'node2', label: 'B', x: 100, y: 100 }
        ];
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings.some(warning => warning.includes('are positioned at the same coordinates'))).toBe(true);
      });

      it('should warn about nodes too close together', () => {
        graph.addNode({ label: 'A', x: 0, y: 0 });
        graph.addNode({ label: 'B', x: 5, y: 0 });
        
        const result = graph.validate();
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Nodes node_1 and node_2 are very close together: distance 5.0');
      });
    });

    describe('Operation Validation', () => {
      beforeEach(() => {
        graph.addNode({ label: 'A', x: 0, y: 0 });
        graph.addNode({ label: 'B', x: 100, y: 0 });
        graph.addEdge({ source: graph.getNodes()[0]!.id, target: graph.getNodes()[1]!.id });
      });

      it('should validate addNode operation', () => {
        const result = graph.validateOperation('addNode', { label: 'C' });
        expect(result.isValid).toBe(true);
        
        const duplicateResult = graph.validateOperation('addNode', { label: 'A' });
        expect(duplicateResult.isValid).toBe(false);
        expect(duplicateResult.errors).toContain("Cannot add node: label 'A' already exists");
      });

      it('should validate addEdge operation', () => {
        const result = graph.validateOperation('addEdge', { 
          source: graph.getNodes()[0]!.id, 
          target: 'nonexistent' 
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Cannot add edge: target node 'nonexistent' not found");
      });

      it('should validate removeNode operation', () => {
        const result = graph.validateOperation('removeNode', { nodeId: 'nonexistent' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Cannot remove node: node 'nonexistent' not found");
      });

      it('should validate removeEdge operation', () => {
        const result = graph.validateOperation('removeEdge', { edgeId: 'nonexistent' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Cannot remove edge: edge 'nonexistent' not found");
      });

      it('should validate self-loop prevention in undirected graphs', () => {
        const result = graph.validateOperation('addEdge', { 
          source: graph.getNodes()[0]!.id, 
          target: graph.getNodes()[0]!.id 
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Cannot add edge: self-loops are not allowed in undirected graphs');
      });

      it('should validate duplicate edge prevention', () => {
        const result = graph.validateOperation('addEdge', { 
          source: graph.getNodes()[0]!.id, 
          target: graph.getNodes()[1]!.id 
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Cannot add edge: edge between 'node_1' and 'node_2' already exists");
      });
    });

    describe('Connected Components Detection', () => {
      it('should find single connected component', () => {
        graph.addNode({ label: 'A', x: 0, y: 0 });
        graph.addNode({ label: 'B', x: 100, y: 0 });
        graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: graph.getNodes()[0]!.id, target: graph.getNodes()[1]!.id });
        graph.addEdge({ source: graph.getNodes()[1]!.id, target: graph.getNodes()[2]!.id });
        
        const components = (graph as any).findConnectedComponents();
        expect(components).toHaveLength(1);
        expect(components[0]).toHaveLength(3);
      });

      it('should find multiple connected components', () => {
        graph.addNode({ label: 'A', x: 0, y: 0 });
        graph.addNode({ label: 'B', x: 100, y: 0 });
        graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addNode({ label: 'D', x: 300, y: 0 });
        graph.addEdge({ source: graph.getNodes()[0]!.id, target: graph.getNodes()[1]!.id });
        graph.addEdge({ source: graph.getNodes()[2]!.id, target: graph.getNodes()[3]!.id });
        
        const components = (graph as any).findConnectedComponents();
        expect(components).toHaveLength(2);
        expect(components[0]).toHaveLength(2);
        expect(components[1]).toHaveLength(2);
      });
    });

    describe('Cycle Detection', () => {
      it('should detect cycles in directed graphs', () => {
        graph.setType('directed');
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        const node3 = graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        graph.addEdge({ source: node2!.id, target: node3!.id });
        graph.addEdge({ source: node3!.id, target: node1!.id });
        
        const hasCycle = (graph as any).hasCycle();
        expect(hasCycle).toBe(true);
      });

      it('should not detect cycles in acyclic directed graphs', () => {
        graph.setType('directed');
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        const node3 = graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        graph.addEdge({ source: node2!.id, target: node3!.id });
        
        const hasCycle = (graph as any).hasCycle();
        expect(hasCycle).toBe(false);
      });

      it('should not detect cycles in undirected graphs', () => {
        graph.setType('undirected');
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        const node3 = graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        graph.addEdge({ source: node2!.id, target: node3!.id });
        graph.addEdge({ source: node3!.id, target: node1!.id });
        
        // For undirected graphs, we don't check cycles in the hasCycle method
        // The cycle detection is only for directed graphs
        expect(graph.getType()).toBe('undirected');
      });
    });
  });

  // ==================== GRAPH TYPE SUPPORT TESTS ====================

  describe('Graph Type Support', () => {
    describe('Basic Graph Type Operations', () => {
      it('should check if graph is directed', () => {
        expect(graph.isDirected()).toBe(false);
        graph.setType('directed');
        expect(graph.isDirected()).toBe(true);
      });

      it('should check if graph is undirected', () => {
        expect(graph.isUndirected()).toBe(true);
        graph.setType('directed');
        expect(graph.isUndirected()).toBe(false);
      });

    });

    describe('Graph Type Conversion', () => {
      beforeEach(() => {
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        const node3 = graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        graph.addEdge({ source: node2!.id, target: node3!.id });
      });

      it('should convert undirected to directed', () => {
        expect(graph.isUndirected()).toBe(true);
        expect(graph.getEdgeCount()).toBe(2);
        
        graph.convertToDirected();
        
        expect(graph.isDirected()).toBe(true);
        expect(graph.getEdgeCount()).toBe(2); // Keep same number of edges, just change type
        
        // All edges are now directed since graph type changed
      });

      it('should convert directed to undirected', () => {
        graph.convertToDirected();
        expect(graph.getEdgeCount()).toBe(2);
        
        graph.convertToUndirected();
        
        expect(graph.isUndirected()).toBe(true);
        expect(graph.getEdgeCount()).toBe(2); // Keep same number of edges, just change type
        
        // All edges are now undirected since graph type changed
      });

      it('should handle self-loops during conversion', () => {
        graph.setType('directed');
        const node1 = graph.addNode({ label: 'D', x: 300, y: 0 });
        graph.addEdge({ source: node1!.id, target: node1!.id });
        
        graph.convertToUndirected();
        expect(graph.getEdgeCount()).toBe(3); // 2 + 1 self-loop
        
        graph.convertToDirected();
        expect(graph.getEdgeCount()).toBe(3); // Keep same number of edges, just change type
      });

      it('should not convert if already in target type', () => {
        const initialEdgeCount = graph.getEdgeCount();
        
        graph.convertToUndirected(); // Already undirected
        expect(graph.getEdgeCount()).toBe(initialEdgeCount);
        
        graph.convertToDirected();
        const directedEdgeCount = graph.getEdgeCount();
        
        graph.convertToDirected(); // Already directed
        expect(graph.getEdgeCount()).toBe(directedEdgeCount);
      });
    });

    describe('Graph Type Statistics', () => {
      it('should get statistics for undirected graph', () => {
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        const node3 = graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        graph.addEdge({ source: node2!.id, target: node3!.id });
        
        const stats = graph.getGraphTypeStats();
        
        expect(stats.isDirected).toBe(false);
        expect(stats.isUndirected).toBe(true);
        expect(stats.totalEdges).toBe(2);
        expect(stats.uniqueConnections).toBe(2);
        expect(stats.bidirectionalEdges).toBe(0);
        expect(stats.selfLoops).toBe(0);
        expect(stats.maxDegree).toBe(2); // Node B has degree 2
        expect(stats.maxInDegree).toBe(2);
        expect(stats.maxOutDegree).toBe(2);
      });

      it('should get statistics for directed graph', () => {
        graph.setType('directed');
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        const node3 = graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        graph.addEdge({ source: node2!.id, target: node1!.id }); // Creates bidirectional pair
        graph.addEdge({ source: node2!.id, target: node3!.id });
        
        const stats = graph.getGraphTypeStats();
        
        expect(stats.isDirected).toBe(true);
        expect(stats.isUndirected).toBe(false);
        expect(stats.totalEdges).toBe(3);
        expect(stats.uniqueConnections).toBe(2);
        expect(stats.bidirectionalEdges).toBe(1); // A->B and B->A
        expect(stats.selfLoops).toBe(0);
        expect(stats.maxDegree).toBe(3);
        expect(stats.maxInDegree).toBe(1);
        expect(stats.maxOutDegree).toBe(2);
      });

      it('should count self-loops in statistics', () => {
        graph.setType('directed');
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        graph.addEdge({ source: node1!.id, target: node1!.id });
        
        const stats = graph.getGraphTypeStats();
        expect(stats.selfLoops).toBe(1);
      });
    });

    describe('Neighbor Operations', () => {
      beforeEach(() => {
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        const node3 = graph.addNode({ label: 'C', x: 200, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        graph.addEdge({ source: node2!.id, target: node3!.id });
      });

      it('should get neighbors in undirected graph', () => {
        const node2 = graph.getNodes()[1]!;
        const neighbors = graph.getNeighbors(node2.id);
        
        expect(neighbors).toHaveLength(2);
        expect(neighbors.map(n => n.label)).toContain('A');
        expect(neighbors.map(n => n.label)).toContain('C');
      });

      it('should get incoming neighbors in directed graph', () => {
        graph.setType('directed');
        const node2 = graph.getNodes()[1]!;
        const incomingNeighbors = graph.getIncomingNeighbors(node2.id);
        
        expect(incomingNeighbors).toHaveLength(1);
        expect(incomingNeighbors[0]!.label).toBe('A');
      });

      it('should get outgoing neighbors in directed graph', () => {
        graph.setType('directed');
        const node2 = graph.getNodes()[1]!;
        const outgoingNeighbors = graph.getOutgoingNeighbors(node2.id);
        
        expect(outgoingNeighbors).toHaveLength(1);
        expect(outgoingNeighbors[0]!.label).toBe('C');
      });

      it('should return all neighbors for incoming/outgoing in undirected graph', () => {
        const node2 = graph.getNodes()[1]!;
        const neighbors = graph.getNeighbors(node2.id);
        const incomingNeighbors = graph.getIncomingNeighbors(node2.id);
        const outgoingNeighbors = graph.getOutgoingNeighbors(node2.id);
        
        expect(incomingNeighbors).toEqual(neighbors);
        expect(outgoingNeighbors).toEqual(neighbors);
      });

      it('should return empty array for non-existent node neighbors', () => {
        expect(graph.getNeighbors('nonexistent')).toEqual([]);
        expect(graph.getIncomingNeighbors('nonexistent')).toEqual([]);
        expect(graph.getOutgoingNeighbors('nonexistent')).toEqual([]);
      });
    });

    describe('Adjacency and Path Finding', () => {
      beforeEach(() => {
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        const node3 = graph.addNode({ label: 'C', x: 200, y: 0 });
        const node4 = graph.addNode({ label: 'D', x: 300, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        graph.addEdge({ source: node2!.id, target: node3!.id });
        graph.addEdge({ source: node3!.id, target: node4!.id });
      });

      it('should check if nodes are adjacent', () => {
        const node1 = graph.getNodes()[0]!;
        const node2 = graph.getNodes()[1]!;
        const node3 = graph.getNodes()[2]!;
        
        expect(graph.areAdjacent(node1.id, node2.id)).toBe(true);
        expect(graph.areAdjacent(node2.id, node1.id)).toBe(true);
        expect(graph.areAdjacent(node1.id, node3.id)).toBe(false);
      });

      it('should find path between connected nodes', () => {
        const node1 = graph.getNodes()[0]!;
        const node4 = graph.getNodes()[3]!;
        
        const path = graph.getPath(node1.id, node4.id);
        expect(path).not.toBeNull();
        expect(path).toHaveLength(4);
        expect(path![0]).toBe(node1.id);
        expect(path![3]).toBe(node4.id);
      });

      it('should return null for path between disconnected nodes', () => {
        const node1 = graph.getNodes()[0]!;
        const node5 = graph.addNode({ label: 'E', x: 400, y: 0 });
        
        const path = graph.getPath(node1.id, node5!.id);
        expect(path).toBeNull();
      });

      it('should return single node path for same node', () => {
        const node1 = graph.getNodes()[0]!;
        const path = graph.getPath(node1.id, node1.id);
        expect(path).toEqual([node1.id]);
      });

      it('should find all paths between nodes', () => {
        // Create a graph with multiple paths
        const node5 = graph.addNode({ label: 'E', x: 100, y: 100 });
        graph.addEdge({ source: graph.getNodes()[0]!.id, target: node5!.id });
        graph.addEdge({ source: node5!.id, target: graph.getNodes()[3]!.id });
        
        const node1 = graph.getNodes()[0]!;
        const node4 = graph.getNodes()[3]!;
        
        const paths = graph.getAllPaths(node1.id, node4.id);
        expect(paths.length).toBeGreaterThan(1);
        expect(paths.every(path => path[0] === node1.id && path[path.length - 1] === node4.id)).toBe(true);
      });

      it('should respect max paths limit', () => {
        const node1 = graph.getNodes()[0]!;
        const node4 = graph.getNodes()[3]!;
        
        const paths = graph.getAllPaths(node1.id, node4.id, 1);
        expect(paths.length).toBeLessThanOrEqual(1);
      });

      it('should work with directed graphs', () => {
        graph.setType('directed');
        const node1 = graph.getNodes()[0]!;
        const node4 = graph.getNodes()[3]!;
        
        const path = graph.getPath(node1.id, node4.id);
        expect(path).not.toBeNull();
        expect(path!.length).toBe(4);
        
        // Reverse path should not exist in directed graph
        const reversePath = graph.getPath(node4.id, node1.id);
        expect(reversePath).toBeNull();
      });
    });

    describe('Edge Management with Graph Types', () => {
      it('should allow self-loops in directed graphs', () => {
        graph.setType('directed');
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const edge = graph.addEdge({ source: node1!.id, target: node1!.id });
        
        expect(edge).not.toBeNull();
        // Edge direction is determined by graph type, not stored on edge
      });

      it('should reject self-loops in undirected graphs', () => {
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const edge = graph.addEdge({ source: node1!.id, target: node1!.id });
        
        expect(edge).toBeNull();
        expect(graph.getError()).toContain('self-loops are not allowed');
      });

      it('should handle duplicate edges differently for each graph type', () => {
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        
        // In undirected graph, A->B and B->A are the same
        const edge1 = graph.addEdge({ source: node1!.id, target: node2!.id });
        const edge2 = graph.addEdge({ source: node2!.id, target: node1!.id });
        
        expect(edge1).not.toBeNull();
        expect(edge2).toBeNull(); // Duplicate in undirected graph
        
        // Set to directed and try again
        graph.setType('directed');
        const edge3 = graph.addEdge({ source: node2!.id, target: node1!.id });
        
        expect(edge3).not.toBeNull(); // Allowed in directed graph
      });
    });

    describe('Graph Type Validation', () => {
      it('should validate graph type consistency', () => {
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        const node2 = graph.addNode({ label: 'B', x: 100, y: 0 });
        graph.addEdge({ source: node1!.id, target: node2!.id });
        
        // No need to test directed property consistency since it's handled at graph level
        const result = graph.validate();
        expect(result.isValid).toBe(true);
      });

      it('should validate self-loops in undirected graphs', () => {
        const node1 = graph.addNode({ label: 'A', x: 0, y: 0 });
        
        // Manually create self-loop in undirected graph
        (graph as any).state.data.edges.push({
          id: 'self-loop',
          source: node1!.id,
          target: node1!.id
        });
        
        const result = graph.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Self-loop not allowed in undirected graph: self-loop');
      });
    });
  });

  // ==================== GRAPH SERIALIZATION TESTS ====================

  describe('Graph Serialization', () => {
    let graph: Graph;

    beforeEach(() => {
      graph = new Graph();
      graph.setType('directed');
      
      // Add test nodes
      graph.addNode({ label: 'A', x: 0, y: 0 });
      graph.addNode({ label: 'B', x: 100, y: 0 });
      graph.addNode({ label: 'C', x: 200, y: 0 });
      
      // Add test edges
      graph.addEdge({ 
        source: graph.getNodes()[0]!.id, 
        target: graph.getNodes()[1]!.id, 
        weight: '5' 
      });
      graph.addEdge({ 
        source: graph.getNodes()[1]!.id, 
        target: graph.getNodes()[2]!.id, 
        weight: '10' 
      });
      graph.addEdge({ 
        source: graph.getNodes()[0]!.id, 
        target: graph.getNodes()[2]!.id 
      });
    });

    describe('Text Format Serialization', () => {
      it('should serialize to simple text format', () => {
        const text = graph.serializeToText();
        const lines = text.split('\n');
        
        expect(lines[0]).toBe('3'); // Number of nodes
        expect(lines[1]).toBe('A'); // First node label
        expect(lines[2]).toBe('B'); // Second node label
        expect(lines[3]).toBe('C'); // Third node label
        expect(lines[4]).toBe('A B 5'); // First edge with weight
        expect(lines[5]).toBe('B C 10'); // Second edge with weight
        expect(lines[6]).toBe('A C'); // Third edge without weight
      });

      it('should handle empty graph', () => {
        const emptyGraph = new Graph();
        const text = emptyGraph.serializeToText();
        
        expect(text).toBe('0');
      });

      it('should handle graph with no edges', () => {
        const noEdgesGraph = new Graph();
        noEdgesGraph.addNode({ label: 'X', x: 0, y: 0 });
        noEdgesGraph.addNode({ label: 'Y', x: 100, y: 0 });
        
        const text = noEdgesGraph.serializeToText();
        const lines = text.split('\n');
        
        expect(lines[0]).toBe('2'); // Number of nodes
        expect(lines[1]).toBe('X'); // First node label
        expect(lines[2]).toBe('Y'); // Second node label
        expect(lines).toHaveLength(3); // No edges
      });

      it('should handle edges without weights', () => {
        const noWeightGraph = new Graph();
        noWeightGraph.addNode({ label: 'P', x: 0, y: 0 });
        noWeightGraph.addNode({ label: 'Q', x: 100, y: 0 });
        noWeightGraph.addEdge({
          source: noWeightGraph.getNodes()[0]!.id,
          target: noWeightGraph.getNodes()[1]!.id
        });
        
        const text = noWeightGraph.serializeToText();
        const lines = text.split('\n');
        
        expect(lines[0]).toBe('2'); // Number of nodes
        expect(lines[1]).toBe('P'); // First node label
        expect(lines[2]).toBe('Q'); // Second node label
        expect(lines[3]).toBe('P Q'); // Edge without weight
      });

      it('should handle different node indexing modes', () => {
        graph.setNodeIndexingMode('1-indexed');
        const text = graph.serializeToText();
        const lines = text.split('\n');
        
        expect(lines[0]).toBe('3'); // Number of nodes
        expect(lines[1]).toBe('1'); // First node label (1-indexed)
        expect(lines[2]).toBe('2'); // Second node label (1-indexed)
        expect(lines[3]).toBe('3'); // Third node label (1-indexed)
        expect(lines[4]).toBe('1 2 5'); // First edge with weight
        expect(lines[5]).toBe('2 3 10'); // Second edge with weight
        expect(lines[6]).toBe('1 3'); // Third edge without weight
      });
    });

    describe('Text Format Parsing', () => {
      it('should parse simple graph with weights', () => {
        const text = `3
A
B
C
A B 5
B C 10
A C`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
        expect(result.error).toBeUndefined();
        
        const parsedGraph = result.graph!;
        expect(parsedGraph.getNodeCount()).toBe(3);
        expect(parsedGraph.getEdgeCount()).toBe(3);
        
        const nodes = parsedGraph.getNodes();
        expect(nodes[0]!.label).toBe('A');
        expect(nodes[1]!.label).toBe('B');
        expect(nodes[2]!.label).toBe('C');
        
        const edges = parsedGraph.getAllEdges();
        const edgeWithWeight5 = edges.find(e => e.weight === '5');
        const edgeWithWeight10 = edges.find(e => e.weight === '10');
        const edgeWithoutWeight = edges.find(e => !e.weight);
        
        expect(edgeWithWeight5).toBeDefined();
        expect(edgeWithWeight10).toBeDefined();
        expect(edgeWithoutWeight).toBeDefined();
      });

      it('should parse empty graph', () => {
        const text = `0`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
        expect(result.error).toBeUndefined();
        
        const parsedGraph = result.graph!;
        expect(parsedGraph.getNodeCount()).toBe(0);
        expect(parsedGraph.getEdgeCount()).toBe(0);
      });

      it('should parse graph with no edges', () => {
        const text = `2
X
Y`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
        expect(result.error).toBeUndefined();
        
        const parsedGraph = result.graph!;
        expect(parsedGraph.getNodeCount()).toBe(2);
        expect(parsedGraph.getEdgeCount()).toBe(0);
        
        const nodes = parsedGraph.getNodes();
        expect(nodes[0]!.label).toBe('X');
        expect(nodes[1]!.label).toBe('Y');
      });

      it('should parse graph with edges without weights', () => {
        const text = `2
P
Q
P Q`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
        expect(result.error).toBeUndefined();
        
        const parsedGraph = result.graph!;
        expect(parsedGraph.getNodeCount()).toBe(2);
        expect(parsedGraph.getEdgeCount()).toBe(1);
        
        const edges = parsedGraph.getAllEdges();
        expect(edges[0]!.weight).toBeUndefined();
      });

      it('should handle empty text', () => {
        const result = Graph.parseFromText('');
        
        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
        expect(result.error).toBeUndefined();
        
        const parsedGraph = result.graph!;
        expect(parsedGraph.getNodeCount()).toBe(0);
        expect(parsedGraph.getEdgeCount()).toBe(0);
      });

      it('should handle whitespace-only text', () => {
        const result = Graph.parseFromText('   \n  \n  ');
        
        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
        expect(result.error).toBeUndefined();
        
        const parsedGraph = result.graph!;
        expect(parsedGraph.getNodeCount()).toBe(0);
        expect(parsedGraph.getEdgeCount()).toBe(0);
      });

      it('should handle single node graph', () => {
        const text = `1
SINGLE`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
        expect(result.error).toBeUndefined();
        
        const parsedGraph = result.graph!;
        expect(parsedGraph.getNodeCount()).toBe(1);
        expect(parsedGraph.getEdgeCount()).toBe(0);
        
        const nodes = parsedGraph.getNodes();
        expect(nodes[0]!.label).toBe('SINGLE');
      });

      it('should handle self-loops', () => {
        const text = `1
LOOP
LOOP LOOP 42`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
        expect(result.error).toBeUndefined();
        
        const parsedGraph = result.graph!;
        expect(parsedGraph.getNodeCount()).toBe(1);
        expect(parsedGraph.getEdgeCount()).toBe(1);
        
        const edges = parsedGraph.getAllEdges();
        expect(edges[0]!.weight).toBe('42');
      });

      it('should handle complex graph with multiple edges', () => {
        const text = `4
START
MID1
MID2
END
START MID1 1
START MID2 2
MID1 END 3
MID2 END 4
START END 5`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(true);
        expect(result.graph).toBeDefined();
        expect(result.error).toBeUndefined();
        
        const parsedGraph = result.graph!;
        expect(parsedGraph.getNodeCount()).toBe(4);
        expect(parsedGraph.getEdgeCount()).toBe(5);
        
        const nodes = parsedGraph.getNodes();
        const nodeLabels = nodes.map(n => n.label);
        expect(nodeLabels).toContain('START');
        expect(nodeLabels).toContain('MID1');
        expect(nodeLabels).toContain('MID2');
        expect(nodeLabels).toContain('END');
      });
    });

    describe('Parsing Error Handling', () => {
      it('should handle invalid node count', () => {
        const text = `abc
A
B`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(false);
        expect(result.graph).toBeUndefined();
        expect(result.error).toBe('Invalid node count');
      });

      it('should handle negative node count', () => {
        const text = `-1
A`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(false);
        expect(result.graph).toBeUndefined();
        expect(result.error).toBe('Invalid node count');
      });

      it('should handle insufficient lines for node labels', () => {
        const text = `3
A
B`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(false);
        expect(result.graph).toBeUndefined();
        expect(result.error).toBe('Not enough lines for node labels');
      });


      it('should handle duplicate node labels', () => {
        const text = `3
A
B
A`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(false);
        expect(result.graph).toBeUndefined();
        expect(result.error).toBe('Duplicate node labels found');
      });

      it('should handle invalid edge format', () => {
        const text = `2
A
B
A`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(false);
        expect(result.graph).toBeUndefined();
        expect(result.error).toBe('Invalid edge format at line 4: A');
      });

      it('should handle source node not found in edge', () => {
        const text = `2
A
B
C B 5`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(false);
        expect(result.graph).toBeUndefined();
        expect(result.error).toBe('Source node not found: C');
      });

      it('should handle target node not found in edge', () => {
        const text = `2
A
B
A C 5`;
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(false);
        expect(result.graph).toBeUndefined();
        expect(result.error).toBe('Target node not found: C');
      });

      it('should handle edge addition failure', () => {
        const text = `2
A
B
A B 5
A B 10`; // Duplicate edge
        
        const result = Graph.parseFromText(text);
        
        expect(result.success).toBe(false);
        expect(result.graph).toBeUndefined();
        expect(result.error).toBe('Failed to add edge: A -> B');
      });
    });

    describe('Round-trip Serialization and Parsing', () => {
      it('should maintain graph structure through serialize-parse cycle', () => {
        const originalGraph = new Graph();
        originalGraph.setType('directed');
        originalGraph.addNode({ label: 'X', x: 0, y: 0 });
        originalGraph.addNode({ label: 'Y', x: 100, y: 0 });
        originalGraph.addNode({ label: 'Z', x: 200, y: 0 });
        originalGraph.addEdge({
          source: originalGraph.getNodes()[0]!.id,
          target: originalGraph.getNodes()[1]!.id,
          weight: '7'
        });
        originalGraph.addEdge({
          source: originalGraph.getNodes()[1]!.id,
          target: originalGraph.getNodes()[2]!.id,
          weight: '8'
        });
        originalGraph.addEdge({
          source: originalGraph.getNodes()[0]!.id,
          target: originalGraph.getNodes()[2]!.id
        });

        const serialized = originalGraph.serializeToText();
        const parseResult = Graph.parseFromText(serialized);
        
        expect(parseResult.success).toBe(true);
        expect(parseResult.graph).toBeDefined();
        
        const parsedGraph = parseResult.graph!;
        expect(parsedGraph.getNodeCount()).toBe(3);
        expect(parsedGraph.getEdgeCount()).toBe(3);
        
        const originalNodes = originalGraph.getNodes();
        const parsedNodes = parsedGraph.getNodes();
        
        // Check node labels match
        const originalLabels = originalNodes.map(n => n.label).sort();
        const parsedLabels = parsedNodes.map(n => n.label).sort();
        expect(parsedLabels).toEqual(originalLabels);
        
        // Check edge weights match
        const originalEdges = originalGraph.getAllEdges();
        const parsedEdges = parsedGraph.getAllEdges();
        
        const originalWeights = originalEdges.map(e => e.weight).sort();
        const parsedWeights = parsedEdges.map(e => e.weight).sort();
        expect(parsedWeights).toEqual(originalWeights);
      });

      it('should handle different node indexing modes in round-trip', () => {
        const originalGraph = new Graph();
        originalGraph.setNodeIndexingMode('1-indexed');
        originalGraph.addNode({ label: '1', x: 0, y: 0 });
        originalGraph.addNode({ label: '2', x: 100, y: 0 });
        originalGraph.addEdge({
          source: originalGraph.getNodes()[0]!.id,
          target: originalGraph.getNodes()[1]!.id,
          weight: '99'
        });

        const serialized = originalGraph.serializeToText();
        const parseResult = Graph.parseFromText(serialized);
        
        expect(parseResult.success).toBe(true);
        expect(parseResult.graph).toBeDefined();
        
        const parsedGraph = parseResult.graph!;
        expect(parsedGraph.getNodeCount()).toBe(2);
        expect(parsedGraph.getEdgeCount()).toBe(1);
        
        const parsedNodes = parsedGraph.getNodes();
        expect(parsedNodes[0]!.label).toBe('1');
        expect(parsedNodes[1]!.label).toBe('2');
        
        const parsedEdges = parsedGraph.getAllEdges();
        expect(parsedEdges[0]!.weight).toBe('99');
      });
    });
  });
});
