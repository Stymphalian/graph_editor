/**
 * Simplified Graph class - Single source of truth for graph data
 * Manages nodes and edges with basic operations only
 */

import {
  Node,
  Edge,
  GraphData,
  GraphState,
  NodeCreationData,
  EdgeCreationData,
  NodeIndexingMode,
  GraphType,
} from '../types/graph';

export class Graph {
  private state: GraphState;
  private nodeIdCounter: number = 0;
  private edgeIdCounter: number = 0;

  constructor(
    initialData?: Partial<GraphData>,
    nodeIndexingMode: NodeIndexingMode = '0-indexed'
  ) {
    this.state = {
      data: {
        nodes: [],
        edges: [],
        type: initialData?.type || 'undirected',
        nodeIndexingMode,
        maxNodes: 1000,
        ...initialData,
      },
      isModified: false,
    };
  }

  /**
   * Get the current graph state
   */
  getState(): GraphState {
    return { ...this.state };
  }

  /**
   * Get the current graph data
   */
  getData(): GraphData {
    return { ...this.state.data };
  }

  /**
   * Get all nodes
   */
  getNodes(): Node[] {
    return [...this.state.data.nodes];
  }

  /**
   * Get all edges
   */
  getEdges(): Edge[] {
    return [...this.state.data.edges];
  }

  /**
   * Get graph type
   */
  getType(): GraphType {
    return this.state.data.type;
  }

  /**
   * Get node indexing mode
   */
  getNodeIndexingMode(): NodeIndexingMode {
    return this.state.data.nodeIndexingMode;
  }

  /**
   * Get maximum number of nodes allowed
   */
  getMaxNodes(): number {
    return this.state.data.maxNodes;
  }

  /**
   * Check if graph has been modified
   */
  isModified(): boolean {
    return this.state.isModified;
  }

  /**
   * Get current error message
   */
  getError(): string | undefined {
    return this.state.error;
  }

  /**
   * Clear any error state
   */
  clearError(): void {
    this.state.error = undefined;
  }

  /**
   * Set graph type (directed/undirected)
   */
  setType(type: GraphType): void {
    if (this.state.data.type !== type) {
      this.state.data.type = type;
      this.state.isModified = true;
      this.clearError();
    }
  }

  /**
   * Check if the graph is directed
   */
  isDirected(): boolean {
    return this.state.data.type === 'directed';
  }

  /**
   * Check if the graph is undirected
   */
  isUndirected(): boolean {
    return this.state.data.type === 'undirected';
  }

  /**
   * Generate a unique edge ID
   */
  private generateEdgeId(): string {
    return `edge_${++this.edgeIdCounter}`;
  }

  /**
   * Generate a unique node ID
   */
  private generateNodeId(): number {
    return ++this.nodeIdCounter;
  }

  /**
   * Generate a node label based on indexing mode
   */
  private generateNodeLabel(index: number): string {
    const { nodeIndexingMode } = this.state.data;

    switch (nodeIndexingMode) {
      case '0-indexed':
        return index.toString();
      case '1-indexed':
        return (index + 1).toString();
      case 'custom':
        return index.toString();
      default:
        return index.toString();
    }
  }

  /**
   * Find a node by ID
   */
  private findNodeById(id: number): Node | undefined {
    return this.state.data.nodes.find(node => node.id === id);
  }

  /**
   * Find a node by label
   */
  private findNodeByLabel(label: string): Node | undefined {
    return this.state.data.nodes.find(node => node.label === label);
  }

  /**
   * Find an edge by ID
   */
  private findEdgeById(id: string): Edge | undefined {
    return this.state.data.edges.find(edge => edge.id === id);
  }

  /**
   * Find edges by source and target node IDs
   */
  private findEdgesByNodeIds(sourceId: number, targetId: number): Edge[] {
    return this.state.data.edges.filter(
      edge =>
        (edge.source === sourceId && edge.target === targetId) ||
        (this.state.data.type === 'undirected' &&
          edge.source === targetId &&
          edge.target === sourceId)
    );
  }

  /**
   * Mark the graph as modified
   */
  private markModified(): void {
    this.state.isModified = true;
    this.clearError();
  }

  /**
   * Set error state
   */
  private setError(error: string): void {
    this.state.error = error;
  }

  /**
   * Reset the graph to empty state
   */
  reset(): void {
    this.state = {
      data: {
        nodes: [],
        edges: [],
        type: this.state.data.type,
        nodeIndexingMode: this.state.data.nodeIndexingMode,
        maxNodes: this.state.data.maxNodes,
      },
      isModified: false,
    };
    this.nodeIdCounter = 0;
    this.edgeIdCounter = 0;
    this.clearError();
  }

  /**
   * Create a deep copy of the graph
   */
  clone(): Graph {
    const clonedGraph = new Graph();
    clonedGraph.state = {
      data: {
        nodes: this.state.data.nodes.map(node => ({ ...node })),
        edges: this.state.data.edges.map(edge => ({ ...edge })),
        type: this.state.data.type,
        nodeIndexingMode: this.state.data.nodeIndexingMode,
        maxNodes: this.state.data.maxNodes,
      },
      isModified: this.state.isModified,
      error: this.state.error,
    };
    clonedGraph.nodeIdCounter = this.nodeIdCounter;
    clonedGraph.edgeIdCounter = this.edgeIdCounter;
    return clonedGraph;
  }

  // ==================== NODE MANAGEMENT METHODS ====================

  /**
   * Add a new node to the graph
   */
  addNode(nodeData: NodeCreationData): Node | null {
    // Check if we've reached the maximum node limit
    if (this.state.data.nodes.length >= this.state.data.maxNodes) {
      this.setError(
        `Cannot add node: maximum node limit of ${this.state.data.maxNodes} reached`
      );
      return null;
    }

    // Check if label already exists
    if (this.findNodeByLabel(nodeData.label)) {
      this.setError(
        `Cannot add node: label '${nodeData.label}' already exists`
      );
      return null;
    }

    // Generate ID if not provided
    const id = nodeData.id ?? this.generateNodeId();
    
    // Check if ID already exists
    if (this.findNodeById(id)) {
      this.setError(
        `Cannot add node: ID '${id}' already exists`
      );
      return null;
    }

    const node: Node = {
      id,
      label: nodeData.label,
    };

    this.state.data.nodes.push(node);
    this.markModified();
    this.clearError();

    return { ...node };
  }

  /**
   * Add a node with auto-generated label based on indexing mode
   */
  addNodeWithAutoLabel(): Node | null {
    const label = this.generateNodeLabel(this.state.data.nodes.length);
    return this.addNode({ label });
  }

  /**
   * Get the next available label for a new node
   */
  getNextNodeLabel(): string {
    return this.generateNodeLabel(this.state.data.nodes.length);
  }

  /**
   * Remove a node by label
   */
  removeNode(nodeId: number): boolean {
    const nodeIndex = this.state.data.nodes.findIndex(
      node => node.id === nodeId
    );
    if (nodeIndex === -1) {
      this.setError(
        `Cannot remove node: node with ID '${nodeId}' not found`
      );
      return false;
    }

    // Remove all edges connected to this node
    this.state.data.edges = this.state.data.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );

    // Remove the node
    this.state.data.nodes.splice(nodeIndex, 1);
    this.markModified();
    this.clearError();

    return true;
  }

  /**
   * Update a node by label
   */
  updateNode(nodeId: number, updates: Partial<Node>): Node | null {
    const nodeIndex = this.state.data.nodes.findIndex(
      node => node.id === nodeId
    );
    if (nodeIndex === -1) {
      this.setError(
        `Cannot update node: node with ID '${nodeId}' not found`
      );
      return null;
    }

    // Check if label update would create a duplicate
    if (
      updates.label &&
      updates.label !== this.state.data.nodes[nodeIndex]!.label
    ) {
      if (this.findNodeByLabel(updates.label)) {
        this.setError(
          `Cannot update node: label '${updates.label}' already exists`
        );
        return null;
      }
    }

    // Update the node
    this.state.data.nodes[nodeIndex] = {
      ...this.state.data.nodes[nodeIndex]!,
      ...updates,
    } as Node;

    this.markModified();
    this.clearError();

    return { ...this.state.data.nodes[nodeIndex]! };
  }

  /**
   * Get a node by label
   */
  getNodeByLabel(nodeLabel: string): Node | null {
    const node = this.findNodeByLabel(nodeLabel);
    return node ? { ...node } : null;
  }

  /**
   * Get the number of nodes
   */
  getNodeCount(): number {
    return this.state.data.nodes.length;
  }

  /**
   * Check if a node exists by label
   */
  hasNode(nodeLabel: string): boolean {
    return this.findNodeByLabel(nodeLabel) !== undefined;
  }

  /**
   * Get all node labels
   */
  getNodeLabels(): string[] {
    return this.state.data.nodes.map(node => node.label);
  }

  // ==================== EDGE MANAGEMENT METHODS ====================

  /**
   * Add a new edge to the graph
   */
  addEdge(edgeData: EdgeCreationData): Edge | null {
    // Validate source and target nodes exist
    if (!this.findNodeById(edgeData.source)) {
      this.setError(
        `Cannot add edge: source node '${edgeData.source}' not found`
      );
      return null;
    }

    if (!this.findNodeById(edgeData.target)) {
      this.setError(
        `Cannot add edge: target node '${edgeData.target}' not found`
      );
      return null;
    }

    // Check for self-loops in undirected graphs
    if (
      this.state.data.type === 'undirected' &&
      edgeData.source === edgeData.target
    ) {
      this.setError(
        'Cannot add edge: self-loops are not allowed in undirected graphs'
      );
      return null;
    }

    // Check for duplicate edges
    const existingEdges = this.findEdgesByNodeIds(
      edgeData.source,
      edgeData.target
    );
    if (existingEdges.length > 0) {
      this.setError(
        `Cannot add edge: edge between '${edgeData.source}' and '${edgeData.target}' already exists`
      );
      return null;
    }

    const edge: Edge = {
      id: this.generateEdgeId(),
      source: edgeData.source,
      target: edgeData.target,
      ...(edgeData.weight && { weight: edgeData.weight }),
    };

    this.state.data.edges.push(edge);
    this.markModified();
    this.clearError();

    return { ...edge };
  }

  /**
   * Remove an edge by ID
   */
  removeEdge(edgeId: string): boolean {
    const edgeIndex = this.state.data.edges.findIndex(
      edge => edge.id === edgeId
    );
    if (edgeIndex === -1) {
      this.setError(`Cannot remove edge: edge with ID '${edgeId}' not found`);
      return false;
    }

    this.state.data.edges.splice(edgeIndex, 1);
    this.markModified();
    this.clearError();

    return true;
  }

  /**
   * Remove edges between two nodes
   */
  removeEdgesBetweenNodes(sourceId: number, targetId: number): number {
    const initialCount = this.state.data.edges.length;

    this.state.data.edges = this.state.data.edges.filter(
      edge =>
        !(edge.source === sourceId && edge.target === targetId) &&
        !(
          edge.source === targetId &&
          edge.target === sourceId &&
          this.state.data.type === 'undirected'
        )
    );

    const removedCount = initialCount - this.state.data.edges.length;
    if (removedCount > 0) {
      this.markModified();
      this.clearError();
    }

    return removedCount;
  }

  /**
   * Update an edge by ID
   */
  updateEdge(
    edgeId: string,
    updates: Partial<Omit<Edge, 'id' | 'source' | 'target'>>
  ): Edge | null {
    const edgeIndex = this.state.data.edges.findIndex(
      edge => edge.id === edgeId
    );
    if (edgeIndex === -1) {
      this.setError(`Cannot update edge: edge with ID '${edgeId}' not found`);
      return null;
    }

    // Update the edge
    this.state.data.edges[edgeIndex] = {
      ...this.state.data.edges[edgeIndex]!,
      ...updates,
    } as Edge;

    this.markModified();
    this.clearError();

    return { ...this.state.data.edges[edgeIndex]! };
  }

  /**
   * Get an edge by ID
   */
  getEdgeById(edgeId: string): Edge | null {
    const edge = this.findEdgeById(edgeId);
    return edge ? { ...edge } : null;
  }

  /**
   * Get all edges connected to a node
   */
  getEdgesByNode(nodeId: number): Edge[] {
    return this.state.data.edges
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .map(edge => ({ ...edge }));
  }

  /**
   * Get edges between two specific nodes
   */
  getEdgesBetweenNodes(sourceId: number, targetId: number): Edge[] {
    return this.findEdgesByNodeIds(sourceId, targetId).map(edge => ({ ...edge }));
  }

  /**
   * Get the number of edges
   */
  getEdgeCount(): number {
    return this.state.data.edges.length;
  }

  /**
   * Check if an edge exists by ID
   */
  hasEdge(edgeId: string): boolean {
    return this.findEdgeById(edgeId) !== undefined;
  }

  /**
   * Check if an edge exists between two nodes
   */
  hasEdgeBetween(sourceId: number, targetId: number): boolean {
    return this.findEdgesByNodeIds(sourceId, targetId).length > 0;
  }

  /**
   * Get all edge IDs
   */
  getEdgeIds(): string[] {
    return this.state.data.edges.map(edge => edge.id);
  }

  /**
   * Update edge weight
   */
  updateEdgeWeight(edgeId: string, weight: string): boolean {
    const result = this.updateEdge(edgeId, { weight });
    return result !== null;
  }

  /**
   * Remove weight from an edge
   */
  removeEdgeWeight(edgeId: string): boolean {
    const edge = this.findEdgeById(edgeId);
    if (!edge) {
      this.setError(`Cannot remove weight: edge with ID '${edgeId}' not found`);
      return false;
    }

    const result = this.updateEdge(edgeId, { weight: undefined as any });
    return result !== null;
  }

  /**
   * Remove all edges from the graph
   */
  clearAllEdges(): void {
    this.state.data.edges = [];
    this.markModified();
  }

  // ==================== GRAPH SERIALIZATION METHODS ====================

  /**
   * Serialize graph to simple text format
   * Format: number of nodes, then node labels, then edges
   */
  serializeToText(): string {
    const nodes = this.state.data.nodes;
    const edges = this.state.data.edges;

    let result = '';

    // Number of nodes
    result += `${nodes.length}\n`;

    // Node labels (one per line)
    for (const node of nodes) {
      result += `${node.label}\n`;
    }

    // Edges (source target weight)
    for (const edge of edges) {
      const sourceNode = this.findNodeById(edge.source);
      if (!sourceNode) continue;
      const sourceLabel = sourceNode.label;
      const targetNode = this.findNodeById(edge.target);
      if (!targetNode) continue;
      const targetLabel = targetNode.label;

      let edgeLine = `${sourceLabel} ${targetLabel}`;

      if (edge.weight) {
        edgeLine += ` ${edge.weight}`;
      }

      result += `${edgeLine}\n`;
    }

    return result.trim();
  }

  /**
   * Parse graph from simple text format
   * Format: number of nodes, then node labels, then edges
   */
  static parseFromText(text: string): {
    success: boolean;
    graph?: Graph;
    error?: string;
  } {
    try {
      const lines = text
        .trim()
        .split('\n')
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        return { success: true, graph: new Graph() };
      }

      // Parse number of nodes
      const nodeCount = parseInt(lines[0]!);
      if (isNaN(nodeCount) || nodeCount < 0) {
        return { success: false, error: 'Invalid node count' };
      }

      if (nodeCount === 0) {
        return { success: true, graph: new Graph() };
      }

      // Parse node labels
      if (lines.length < nodeCount + 1) {
        return { success: false, error: 'Not enough lines for node labels' };
      }

      const nodeLabels: string[] = [];
      for (let i = 1; i <= nodeCount; i++) {
        const label = lines[i]!.trim();
        if (label.length === 0) {
          return { success: false, error: `Empty node label at line ${i + 1}` };
        }
        nodeLabels.push(label);
      }

      // Check for duplicate labels
      const uniqueLabels = new Set(nodeLabels);
      if (uniqueLabels.size !== nodeLabels.length) {
        return { success: false, error: 'Duplicate node labels found' };
      }

      // Create graph and add nodes
      const graph = new Graph();
      graph.setType('directed'); // Allow self-loops and directed edges

      // Add nodes
      for (let i = 0; i < nodeLabels.length; i++) {
        const success = graph.addNode({
          label: nodeLabels[i]!,
        });

        if (!success) {
          return {
            success: false,
            error: `Failed to add node: ${nodeLabels[i]}`,
          };
        }
      }

      // Parse edges
      const edgeLines = lines.slice(nodeCount + 1);
      for (let i = 0; i < edgeLines.length; i++) {
        const line = edgeLines[i]!.trim();
        if (line.length === 0) continue;

        const parts = line.split(/\s+/);
        if (parts.length < 2) {
          return {
            success: false,
            error: `Invalid edge format at line ${nodeCount + 2 + i}: ${line}`,
          };
        }

        const sourceLabel = parts[0]!;
        const targetLabel = parts[1]!;
        const weight = parts.length > 2 ? parts[2]! : undefined;

        // Find source and target nodes
        const sourceNode = graph.getNodes().find(n => n.label === sourceLabel);
        const targetNode = graph.getNodes().find(n => n.label === targetLabel);

        if (!sourceNode) {
          return {
            success: false,
            error: `Source node not found: ${sourceLabel}`,
          };
        }
        if (!targetNode) {
          return {
            success: false,
            error: `Target node not found: ${targetLabel}`,
          };
        }

        // Add edge
        const edgeData: EdgeCreationData = {
          source: sourceNode.id,
          target: targetNode.id,
        };

        if (weight !== undefined) {
          edgeData.weight = weight;
        }

        const success = graph.addEdge(edgeData);
        if (!success) {
          return {
            success: false,
            error: `Failed to add edge: ${sourceLabel} -> ${targetLabel}`,
          };
        }
      }

      return { success: true, graph };
    } catch (error) {
      return {
        success: false,
        error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}