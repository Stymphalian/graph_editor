/**
 * Graph class - Single source of truth for graph data
 * Manages nodes, edges, and graph state with comprehensive validation
 */

import {
  Node,
  Edge,
  GraphData,
  GraphState,
  GraphValidationResult,
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

      // No need to update edges - graph type is handled at the top level

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
   * Convert directed graph to undirected
   * This will merge bidirectional edges and remove duplicates
   */
  convertToUndirected(): void {
    if (this.state.data.type === 'undirected') {
      return; // Already undirected
    }

    const processedEdges = new Set<string>();
    const newEdges: Edge[] = [];

    for (const edge of this.state.data.edges) {
      // Create a canonical key for undirected edges (smaller ID first)
      const canonicalKey =
        edge.source < edge.target
          ? `${edge.source}-${edge.target}`
          : `${edge.target}-${edge.source}`;

      if (!processedEdges.has(canonicalKey)) {
        // Keep the edge with the smaller source ID
        const newEdge: Edge = {
          ...edge,
          id: this.generateEdgeId(),
          source: edge.source < edge.target ? edge.source : edge.target,
          target: edge.source < edge.target ? edge.target : edge.source,
        };
        newEdges.push(newEdge);
        processedEdges.add(canonicalKey);
      }
    }

    this.state.data.edges = newEdges;
    this.state.data.type = 'undirected';
    this.markModified();
  }

  /**
   * Convert undirected graph to directed
   * This will keep the single edge from source to target
   */
  convertToDirected(): void {
    if (this.state.data.type === 'directed') {
      return; // Already directed
    }

    // Simply change the graph type - edges remain the same
    this.state.data.type = 'directed';
    this.markModified();
  }

  /**
   * Get graph statistics specific to the graph type
   */
  getGraphTypeStats(): {
    isDirected: boolean;
    isUndirected: boolean;
    totalEdges: number;
    uniqueConnections: number;
    bidirectionalEdges: number;
    selfLoops: number;
    maxInDegree: number;
    maxOutDegree: number;
    maxDegree: number;
  } {
    const isDirected = this.isDirected();
    const isUndirected = this.isUndirected();
    const totalEdges = this.state.data.edges.length;

    let uniqueConnections = 0;
    let bidirectionalEdges = 0;
    let selfLoops = 0;
    let maxInDegree = 0;
    let maxOutDegree = 0;
    let maxDegree = 0;

    if (isDirected) {
      // For directed graphs, count unique connections and bidirectional pairs
      const connectionMap = new Map<string, Set<string>>();
      const bidirectionalPairs = new Set<string>();

      for (const edge of this.state.data.edges) {
        if (edge.source === edge.target) {
          selfLoops++;
        } else {
          // Track connections
          if (!connectionMap.has(edge.source)) {
            connectionMap.set(edge.source, new Set());
          }
          connectionMap.get(edge.source)!.add(edge.target);

          // Check for bidirectional connections
          const reverseKey = `${edge.target}-${edge.source}`;
          const forwardKey = `${edge.source}-${edge.target}`;

          if (bidirectionalPairs.has(reverseKey)) {
            bidirectionalEdges++;
          } else {
            bidirectionalPairs.add(forwardKey);
          }
        }
      }

      uniqueConnections = bidirectionalPairs.size;

      // Calculate degrees
      for (const node of this.state.data.nodes) {
        const inDegree = this.getNodeInDegree(node.label);
        const outDegree = this.getNodeOutDegree(node.label);
        const degree = this.getNodeDegree(node.label);

        maxInDegree = Math.max(maxInDegree, inDegree);
        maxOutDegree = Math.max(maxOutDegree, outDegree);
        maxDegree = Math.max(maxDegree, degree);
      }
    } else {
      // For undirected graphs, count unique connections
      const connectionSet = new Set<string>();

      for (const edge of this.state.data.edges) {
        if (edge.source === edge.target) {
          selfLoops++;
        } else {
          // Create canonical key for undirected edges
          const canonicalKey =
            edge.source < edge.target
              ? `${edge.source}-${edge.target}`
              : `${edge.target}-${edge.source}`;
          connectionSet.add(canonicalKey);
        }
      }

      uniqueConnections = connectionSet.size;
      bidirectionalEdges = 0; // Not applicable for undirected graphs

      // Calculate degrees
      for (const node of this.state.data.nodes) {
        const degree = this.getNodeDegree(node.label);
        maxDegree = Math.max(maxDegree, degree);
      }

      maxInDegree = maxDegree; // For undirected graphs, in-degree = out-degree = degree
      maxOutDegree = maxDegree;
    }

    return {
      isDirected,
      isUndirected,
      totalEdges,
      uniqueConnections,
      bidirectionalEdges,
      selfLoops,
      maxInDegree,
      maxOutDegree,
      maxDegree,
    };
  }

  /**
   * Get neighbors of a node (considering graph type)
   */
  getNeighbors(nodeId: string): Node[] {
    const neighbors: Node[] = [];
    const neighborIds = new Set<string>();

    for (const edge of this.state.data.edges) {
      if (edge.source === nodeId) {
        neighborIds.add(edge.target);
      } else if (edge.target === nodeId) {
        neighborIds.add(edge.source);
      }
    }

    for (const neighborId of neighborIds) {
      const neighbor = this.findNodeById(neighborId);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * Get incoming neighbors of a node (for directed graphs)
   */
  getIncomingNeighbors(nodeId: string): Node[] {
    if (this.isUndirected()) {
      return this.getNeighbors(nodeId); // For undirected graphs, all neighbors are both incoming and outgoing
    }

    const neighbors: Node[] = [];
    const neighborIds = new Set<string>();

    for (const edge of this.state.data.edges) {
      if (edge.target === nodeId && edge.source !== nodeId) {
        neighborIds.add(edge.source);
      }
    }

    for (const neighborId of neighborIds) {
      const neighbor = this.findNodeById(neighborId);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * Get outgoing neighbors of a node (for directed graphs)
   */
  getOutgoingNeighbors(nodeId: string): Node[] {
    if (this.isUndirected()) {
      return this.getNeighbors(nodeId); // For undirected graphs, all neighbors are both incoming and outgoing
    }

    const neighbors: Node[] = [];
    const neighborIds = new Set<string>();

    for (const edge of this.state.data.edges) {
      if (edge.source === nodeId && edge.target !== nodeId) {
        neighborIds.add(edge.target);
      }
    }

    for (const neighborId of neighborIds) {
      const neighbor = this.findNodeById(neighborId);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * Check if two nodes are adjacent (connected by an edge)
   */
  areAdjacent(nodeId1: string, nodeId2: string): boolean {
    return this.hasEdgeBetween(nodeId1, nodeId2);
  }

  /**
   * Get the path between two nodes (BFS-based)
   */
  getPath(sourceId: string, targetId: string): string[] | null {
    if (sourceId === targetId) {
      return [sourceId];
    }

    const queue: string[] = [sourceId];
    const visited = new Set<string>();
    const parent = new Map<string, string>();

    visited.add(sourceId);

    while (queue.length > 0) {
      const current = queue.shift()!;

      const neighbors = this.isDirected()
        ? this.getOutgoingNeighbors(current)
        : this.getNeighbors(current);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.label)) {
          visited.add(neighbor.label);
          parent.set(neighbor.label, current);
          queue.push(neighbor.label);

          if (neighbor.label === targetId) {
            // Reconstruct path
            const path: string[] = [];
            let node = targetId;
            while (node) {
              path.unshift(node);
              node = parent.get(node) || '';
            }
            return path;
          }
        }
      }
    }

    return null; // No path found
  }

  /**
   * Get all paths between two nodes (DFS-based)
   */
  getAllPaths(
    sourceId: string,
    targetId: string,
    maxPaths: number = 10
  ): string[][] {
    if (sourceId === targetId) {
      return [[sourceId]];
    }

    const paths: string[][] = [];
    const visited = new Set<string>();

    const dfs = (current: string, path: string[]) => {
      if (paths.length >= maxPaths) return;

      if (current === targetId) {
        paths.push([...path, current]);
        return;
      }

      visited.add(current);
      const neighbors = this.isDirected()
        ? this.getOutgoingNeighbors(current)
        : this.getNeighbors(current);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.label)) {
          dfs(neighbor.label, [...path, current]);
        }
      }
      visited.delete(current);
    };

    dfs(sourceId, []);
    return paths;
  }

  /**
   * Set node indexing mode
   */
  setNodeIndexingMode(mode: NodeIndexingMode): void {
    if (this.state.data.nodeIndexingMode !== mode) {
      this.state.data.nodeIndexingMode = mode;
      // Note: With label-based nodes, we don't regenerate existing labels
      // as they serve as unique identifiers. Indexing mode only affects new nodes.
      this.state.isModified = true;
      this.clearError();
    }
  }

  /**
   * Regenerate all node labels based on current indexing mode
   */
  regenerateAllNodeLabels(): void {
    this.state.data.nodes = this.state.data.nodes.map((node, index) => ({
      ...node,
      label: this.generateNodeLabel(index),
    }));
  }

  /**
   * Set maximum number of nodes
   */
  setMaxNodes(maxNodes: number): void {
    if (this.state.data.maxNodes !== maxNodes) {
      this.state.data.maxNodes = Math.max(1, Math.min(10000, maxNodes));
      this.state.isModified = true;
      this.clearError();
    }
  }

  /**
   * Generate a unique edge ID
   */
  private generateEdgeId(): string {
    return `edge_${++this.edgeIdCounter}`;
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
        return index.toString(); // Use index number instead of "Node X"
      default:
        return index.toString();
    }
  }

  /**
   * Find a node by label (now using label as ID)
   */
  private findNodeById(label: string): Node | undefined {
    return this.state.data.nodes.find(node => node.label === label);
  }

  /**
   * Find an edge by ID
   */
  private findEdgeById(id: string): Edge | undefined {
    return this.state.data.edges.find(edge => edge.id === id);
  }

  /**
   * Find edges by source and target nodes
   */
  private findEdgesByNodes(sourceId: string, targetId: string): Edge[] {
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
   * Validate the current graph state
   */
  validate(): GraphValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    this.validateBasicStructure(errors, warnings);

    // Node validation
    this.validateNodes(errors, warnings);

    // Edge validation
    this.validateEdges(errors, warnings);

    // Graph topology validation
    this.validateGraphTopology(errors, warnings);

    // Graph constraints validation
    this.validateGraphConstraints(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate basic graph structure
   */
  private validateBasicStructure(errors: string[], warnings: string[]): void {
    // Check node count
    if (this.state.data.nodes.length > this.state.data.maxNodes) {
      errors.push(
        `Graph exceeds maximum node count of ${this.state.data.maxNodes}`
      );
    }

    // Check for empty graph
    if (
      this.state.data.nodes.length === 0 &&
      this.state.data.edges.length > 0
    ) {
      errors.push('Graph has edges but no nodes');
    }

    // Check for negative coordinates
    for (const node of this.state.data.nodes) {
      if (node.x < 0 || node.y < 0) {
        warnings.push(
          `Node ${node.label} has negative coordinates: (${node.x}, ${node.y})`
        );
      }
    }
  }

  /**
   * Validate nodes
   */
  private validateNodes(errors: string[], warnings: string[]): void {
    const nodeLabels = new Set<string>();

    for (const node of this.state.data.nodes) {
      // Check for duplicate node labels (now labels serve as IDs)
      if (nodeLabels.has(node.label)) {
        errors.push(`Duplicate node label: ${node.label}`);
      }
      nodeLabels.add(node.label);

      // Check for empty or invalid labels
      if (!node.label || node.label.trim().length === 0) {
        errors.push(`Node has empty or invalid label`);
      }

      // Check for extremely large coordinates
      if (Math.abs(node.x) > 10000 || Math.abs(node.y) > 10000) {
        warnings.push(
          `Node ${node.label} has very large coordinates: (${node.x}, ${node.y})`
        );
      }

      // Check for NaN coordinates
      if (isNaN(node.x) || isNaN(node.y)) {
        errors.push(
          `Node ${node.label} has invalid coordinates: (${node.x}, ${node.y})`
        );
      }
    }
  }

  /**
   * Validate edges
   */
  private validateEdges(errors: string[], warnings: string[]): void {
    const edgeIds = new Set<string>();
    const edgePairs = new Set<string>();

    for (const edge of this.state.data.edges) {
      // Check for duplicate edge IDs
      if (edgeIds.has(edge.id)) {
        errors.push(`Duplicate edge ID: ${edge.id}`);
      }
      edgeIds.add(edge.id);

      // Check for invalid edge references
      if (!this.findNodeById(edge.source)) {
        errors.push(
          `Edge ${edge.id} references non-existent source node: ${edge.source}`
        );
      }
      if (!this.findNodeById(edge.target)) {
        errors.push(
          `Edge ${edge.id} references non-existent target node: ${edge.target}`
        );
      }

      // Check for self-loops in undirected graphs
      if (
        this.state.data.type === 'undirected' &&
        edge.source === edge.target
      ) {
        errors.push(`Self-loop not allowed in undirected graph: ${edge.id}`);
      }

      // Check for duplicate edges (considering direction)
      const edgeKey =
        this.state.data.type === 'directed'
          ? `${edge.source}->${edge.target}`
          : edge.source < edge.target
            ? `${edge.source}-${edge.target}`
            : `${edge.target}-${edge.source}`;

      if (edgePairs.has(edgeKey)) {
        errors.push(`Duplicate edge between ${edge.source} and ${edge.target}`);
      }
      edgePairs.add(edgeKey);

      // Check for invalid weight format
      if (edge.weight !== undefined && edge.weight !== null) {
        if (typeof edge.weight !== 'string') {
          errors.push(
            `Edge ${edge.id} has invalid weight type: ${typeof edge.weight}`
          );
        } else if (edge.weight.trim().length === 0) {
          warnings.push(`Edge ${edge.id} has empty weight`);
        }
      }

      // No need to check directed property - it's handled at graph level
    }
  }

  /**
   * Validate graph topology
   */
  private validateGraphTopology(_errors: string[], warnings: string[]): void {
    // Check for isolated nodes
    const connectedNodes = new Set<string>();
    for (const edge of this.state.data.edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    for (const node of this.state.data.nodes) {
      if (!connectedNodes.has(node.label)) {
        warnings.push(`Isolated node detected: ${node.label}`);
      }
    }

    // Check for disconnected components
    const components = this.findConnectedComponents();
    if (components.length > 1) {
      warnings.push(`Graph has ${components.length} disconnected components`);
    }

    // Check for cycles in directed graphs
    if (this.state.data.type === 'directed') {
      const hasCycle = this.hasCycle();
      if (hasCycle) {
        warnings.push('Directed graph contains cycles');
      }
    }
  }

  /**
   * Validate graph constraints
   */
  private validateGraphConstraints(
    _errors: string[],
    warnings: string[]
  ): void {
    // Check for maximum degree constraints
    const maxDegree = Math.max(
      ...this.state.data.nodes.map(node => this.getNodeDegree(node.label))
    );
    if (maxDegree > 50) {
      warnings.push(`Node with high degree detected: ${maxDegree} connections`);
    }

    // Check for graph density
    const maxPossibleEdges =
      this.state.data.type === 'directed'
        ? this.state.data.nodes.length * (this.state.data.nodes.length - 1)
        : (this.state.data.nodes.length * (this.state.data.nodes.length - 1)) /
          2;

    const density = this.state.data.edges.length / maxPossibleEdges;
    if (density > 0.8) {
      warnings.push(
        `Graph is very dense: ${(density * 100).toFixed(1)}% of possible edges present`
      );
    } else if (density < 0.1 && this.state.data.nodes.length > 5) {
      warnings.push(
        `Graph is very sparse: ${(density * 100).toFixed(1)}% of possible edges present`
      );
    }

    // Check for node positioning constraints
    this.validateNodePositions(warnings);
  }

  /**
   * Validate node positions for potential issues
   */
  private validateNodePositions(warnings: string[]): void {
    const positions = new Map<string, string>();

    for (const node of this.state.data.nodes) {
      const posKey = `${node.x},${node.y}`;
      if (positions.has(posKey)) {
        const existingNodeLabel = positions.get(posKey)!;
        warnings.push(
          `Nodes ${node.label} and ${existingNodeLabel} are positioned at the same coordinates: (${node.x}, ${node.y})`
        );
      }
      positions.set(posKey, node.label);
    }

    // Check for nodes too close together
    for (let i = 0; i < this.state.data.nodes.length; i++) {
      for (let j = i + 1; j < this.state.data.nodes.length; j++) {
        const node1 = this.state.data.nodes[i]!;
        const node2 = this.state.data.nodes[j]!;
        const distance = Math.sqrt(
          (node1.x - node2.x) ** 2 + (node1.y - node2.y) ** 2
        );

        if (distance < 10) {
          warnings.push(
            `Nodes ${node1.label} and ${node2.label} are very close together: distance ${distance.toFixed(1)}`
          );
        }
      }
    }
  }

  /**
   * Find connected components in the graph
   */
  private findConnectedComponents(): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const node of this.state.data.nodes) {
      if (!visited.has(node.label)) {
        const component: string[] = [];
        this.dfsComponent(node.label, visited, component);
        components.push(component);
      }
    }

    return components;
  }

  /**
   * Depth-first search to find connected component
   */
  private dfsComponent(
    nodeLabel: string,
    visited: Set<string>,
    component: string[]
  ): void {
    visited.add(nodeLabel);
    component.push(nodeLabel);

    const edges = this.getEdgesByNode(nodeLabel);
    for (const edge of edges) {
      const neighborLabel =
        edge.source === nodeLabel ? edge.target : edge.source;
      if (!visited.has(neighborLabel)) {
        this.dfsComponent(neighborLabel, visited, component);
      }
    }
  }

  /**
   * Check if the graph has cycles (for directed graphs)
   */
  private hasCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of this.state.data.nodes) {
      if (!visited.has(node.label)) {
        if (this.hasCycleDFS(node.label, visited, recursionStack)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * DFS helper to detect cycles
   */
  private hasCycleDFS(
    nodeLabel: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(nodeLabel);
    recursionStack.add(nodeLabel);

    const edges = this.getEdgesBySource(nodeLabel);
    for (const edge of edges) {
      if (!visited.has(edge.target)) {
        if (this.hasCycleDFS(edge.target, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(edge.target)) {
        return true;
      }
    }

    recursionStack.delete(nodeLabel);
    return false;
  }

  /**
   * Validate a specific operation before performing it
   */
  validateOperation(
    operation: 'addNode' | 'addEdge' | 'removeNode' | 'removeEdge',
    data?: any
  ): GraphValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (operation) {
      case 'addNode':
        if (this.state.data.nodes.length >= this.state.data.maxNodes) {
          errors.push(
            `Cannot add node: maximum node limit of ${this.state.data.maxNodes} reached`
          );
        }
        if (data?.label && this.hasNodeWithLabel(data.label)) {
          errors.push(`Cannot add node: label '${data.label}' already exists`);
        }
        break;

      case 'addEdge':
        if (data?.source && !this.findNodeById(data.source)) {
          errors.push(
            `Cannot add edge: source node '${data.source}' not found`
          );
        }
        if (data?.target && !this.findNodeById(data.target)) {
          errors.push(
            `Cannot add edge: target node '${data.target}' not found`
          );
        }
        if (
          data?.source === data?.target &&
          this.state.data.type === 'undirected'
        ) {
          errors.push(
            'Cannot add edge: self-loops are not allowed in undirected graphs'
          );
        }
        if (
          data?.source &&
          data?.target &&
          this.hasEdgeBetween(data.source, data.target)
        ) {
          errors.push(
            `Cannot add edge: edge between '${data.source}' and '${data.target}' already exists`
          );
        }
        break;

      case 'removeNode':
        if (data?.nodeLabel && !this.findNodeByLabel(data.nodeLabel)) {
          errors.push(`Cannot remove node: node '${data.nodeLabel}' not found`);
        }
        break;

      case 'removeEdge':
        if (data?.edgeId && !this.findEdgeById(data.edgeId)) {
          errors.push(`Cannot remove edge: edge '${data.edgeId}' not found`);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
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

    const node: Node = {
      label: nodeData.label,
      x: nodeData.x,
      y: nodeData.y,
      selected: false,
      dragging: false,
    };

    this.state.data.nodes.push(node);
    this.markModified();
    this.clearError();

    return { ...node };
  }

  /**
   * Add a node with auto-generated label based on indexing mode
   */
  addNodeWithAutoLabel(x: number, y: number): Node | null {
    const label = this.generateNodeLabel(this.state.data.nodes.length);
    return this.addNode({ label, x, y });
  }

  /**
   * Get the next available label for a new node
   */
  getNextNodeLabel(): string {
    return this.generateNodeLabel(this.state.data.nodes.length);
  }

  /**
   * Update multiple node labels based on current indexing mode
   */
  updateNodeLabels(nodeIds: string[]): {
    success: boolean;
    updated: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let updated = 0;

    for (const nodeLabel of nodeIds) {
      const nodeIndex = this.state.data.nodes.findIndex(
        node => node.label === nodeLabel
      );
      if (nodeIndex === -1) {
        errors.push(`Node with label '${nodeLabel}' not found`);
        continue;
      }

      const newLabel = this.generateNodeLabel(nodeIndex);
      const existingNode = this.state.data.nodes.find(
        n => n.label === newLabel && n.label !== nodeLabel
      );

      if (existingNode) {
        errors.push(
          `Label '${newLabel}' already exists for node '${existingNode.label}'`
        );
        continue;
      }

      const node = this.state.data.nodes[nodeIndex];
      if (node) {
        this.state.data.nodes[nodeIndex] = {
          ...node,
          label: newLabel,
        };
      }
      updated++;
    }

    if (updated > 0) {
      this.markModified();
      this.clearError();
    }

    return {
      success: errors.length === 0,
      updated,
      errors,
    };
  }

  /**
   * Get all available node labels in the current indexing mode
   */
  getAvailableNodeLabels(count: number = 10): string[] {
    const labels: string[] = [];
    const startIndex = this.state.data.nodes.length;

    for (let i = 0; i < count; i++) {
      labels.push(this.generateNodeLabel(startIndex + i));
    }

    return labels;
  }

  /**
   * Check if a label is valid for the current indexing mode
   */
  isValidNodeLabel(label: string): boolean {
    const { nodeIndexingMode } = this.state.data;

    switch (nodeIndexingMode) {
      case '0-indexed':
        return /^\d+$/.test(label) && parseInt(label) >= 0;
      case '1-indexed':
        return /^\d+$/.test(label) && parseInt(label) >= 1;
      case 'custom':
        return /^\d+$/.test(label) && parseInt(label) >= 0; // Same as 0-indexed for custom mode
      default:
        return /^\d+$/.test(label);
    }
  }

  /**
   * Get the expected label format for the current indexing mode
   */
  getLabelFormat(): string {
    const { nodeIndexingMode } = this.state.data;

    switch (nodeIndexingMode) {
      case '0-indexed':
        return 'Numeric (0, 1, 2, ...)';
      case '1-indexed':
        return 'Numeric (1, 2, 3, ...)';
      case 'custom':
        return 'Numeric (0, 1, 2, ...)'; // Same as 0-indexed for custom mode
      default:
        return 'Numeric (0, 1, 2, ...)';
    }
  }

  /**
   * Remove a node by label
   */
  removeNode(nodeLabel: string): boolean {
    const nodeIndex = this.state.data.nodes.findIndex(
      node => node.label === nodeLabel
    );
    if (nodeIndex === -1) {
      this.setError(
        `Cannot remove node: node with label '${nodeLabel}' not found`
      );
      return false;
    }

    // Remove all edges connected to this node
    this.state.data.edges = this.state.data.edges.filter(
      edge => edge.source !== nodeLabel && edge.target !== nodeLabel
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
  updateNode(nodeLabel: string, updates: Partial<Node>): Node | null {
    const nodeIndex = this.state.data.nodes.findIndex(
      node => node.label === nodeLabel
    );
    if (nodeIndex === -1) {
      this.setError(
        `Cannot update node: node with label '${nodeLabel}' not found`
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
    const node = this.findNodeById(nodeLabel);
    return node ? { ...node } : null;
  }

  /**
   * Find a node by label (internal method)
   */
  private findNodeByLabel(label: string): Node | undefined {
    return this.state.data.nodes.find(node => node.label === label);
  }

  /**
   * Get all nodes with a specific label pattern
   */
  getNodesByLabelPattern(pattern: string | RegExp): Node[] {
    const regex =
      pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
    return this.state.data.nodes
      .filter(node => regex.test(node.label))
      .map(node => ({ ...node }));
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
    return this.findNodeById(nodeLabel) !== undefined;
  }

  /**
   * Check if a node exists by label (alias for hasNode)
   */
  hasNodeWithLabel(label: string): boolean {
    return this.findNodeByLabel(label) !== undefined;
  }

  /**
   * Get all node labels
   */
  getNodeLabels(): string[] {
    return this.state.data.nodes.map(node => node.label);
  }

  /**
   * Select a node by label
   */
  selectNode(nodeLabel: string): boolean {
    const node = this.findNodeById(nodeLabel);
    if (!node) {
      this.setError(
        `Cannot select node: node with label '${nodeLabel}' not found`
      );
      return false;
    }

    node.selected = true;
    this.markModified();
    this.clearError();
    return true;
  }

  /**
   * Deselect a node by label
   */
  deselectNode(nodeLabel: string): boolean {
    const node = this.findNodeById(nodeLabel);
    if (!node) {
      this.setError(
        `Cannot deselect node: node with label '${nodeLabel}' not found`
      );
      return false;
    }

    node.selected = false;
    this.markModified();
    this.clearError();
    return true;
  }

  /**
   * Toggle node selection
   */
  toggleNodeSelection(nodeLabel: string): boolean {
    const node = this.findNodeById(nodeLabel);
    if (!node) {
      this.setError(
        `Cannot toggle node selection: node with label '${nodeLabel}' not found`
      );
      return false;
    }

    node.selected = !node.selected;
    this.markModified();
    this.clearError();
    return true;
  }

  /**
   * Clear all node selections
   */
  clearNodeSelections(): void {
    this.state.data.nodes.forEach(node => {
      node.selected = false;
    });
    this.markModified();
  }

  /**
   * Get all selected nodes
   */
  getSelectedNodes(): Node[] {
    return this.state.data.nodes
      .filter(node => node.selected)
      .map(node => ({ ...node }));
  }

  /**
   * Set node dragging state
   */
  setNodeDragging(nodeLabel: string, dragging: boolean): boolean {
    const node = this.findNodeById(nodeLabel);
    if (!node) {
      this.setError(
        `Cannot set dragging state: node with label '${nodeLabel}' not found`
      );
      return false;
    }

    node.dragging = dragging;
    this.markModified();
    this.clearError();
    return true;
  }

  /**
   * Move a node to new coordinates
   */
  moveNode(nodeLabel: string, x: number, y: number): boolean {
    const result = this.updateNode(nodeLabel, { x, y });
    return result !== null;
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
    const existingEdges = this.findEdgesByNodes(
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
      selected: false,
    };

    this.state.data.edges.push(edge);
    this.markModified();
    this.clearError();

    return { ...edge };
  }

  /**
   * Add an edge with auto-generated weight
   */
  addEdgeWithWeight(
    sourceId: string,
    targetId: string,
    weight?: string
  ): Edge | null {
    return this.addEdge({
      source: sourceId,
      target: targetId,
      ...(weight && { weight }),
    });
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
  removeEdgesBetweenNodes(sourceId: string, targetId: string): number {
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
  getEdgesByNode(nodeId: string): Edge[] {
    return this.state.data.edges
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .map(edge => ({ ...edge }));
  }

  /**
   * Get edges by source node
   */
  getEdgesBySource(sourceId: string): Edge[] {
    return this.state.data.edges
      .filter(edge => edge.source === sourceId)
      .map(edge => ({ ...edge }));
  }

  /**
   * Get edges by target node
   */
  getEdgesByTarget(targetId: string): Edge[] {
    return this.state.data.edges
      .filter(edge => edge.target === targetId)
      .map(edge => ({ ...edge }));
  }

  /**
   * Get edges between two specific nodes
   */
  getEdgesBetweenNodes(sourceId: string, targetId: string): Edge[] {
    return this.findEdgesByNodes(sourceId, targetId).map(edge => ({ ...edge }));
  }

  /**
   * Get all edges
   */
  getAllEdges(): Edge[] {
    return this.state.data.edges.map(edge => ({ ...edge }));
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
  hasEdgeBetween(sourceId: string, targetId: string): boolean {
    return this.findEdgesByNodes(sourceId, targetId).length > 0;
  }

  /**
   * Get all edge IDs
   */
  getEdgeIds(): string[] {
    return this.state.data.edges.map(edge => edge.id);
  }

  /**
   * Select an edge by ID
   */
  selectEdge(edgeId: string): boolean {
    const edge = this.findEdgeById(edgeId);
    if (!edge) {
      this.setError(`Cannot select edge: edge with ID '${edgeId}' not found`);
      return false;
    }

    edge.selected = true;
    this.markModified();
    this.clearError();
    return true;
  }

  /**
   * Deselect an edge by ID
   */
  deselectEdge(edgeId: string): boolean {
    const edge = this.findEdgeById(edgeId);
    if (!edge) {
      this.setError(`Cannot deselect edge: edge with ID '${edgeId}' not found`);
      return false;
    }

    edge.selected = false;
    this.markModified();
    this.clearError();
    return true;
  }

  /**
   * Toggle edge selection
   */
  toggleEdgeSelection(edgeId: string): boolean {
    const edge = this.findEdgeById(edgeId);
    if (!edge) {
      this.setError(
        `Cannot toggle edge selection: edge with ID '${edgeId}' not found`
      );
      return false;
    }

    edge.selected = !edge.selected;
    this.markModified();
    this.clearError();
    return true;
  }

  /**
   * Clear all edge selections
   */
  clearEdgeSelections(): void {
    this.state.data.edges.forEach(edge => {
      edge.selected = false;
    });
    this.markModified();
  }

  /**
   * Get all selected edges
   */
  getSelectedEdges(): Edge[] {
    return this.state.data.edges
      .filter(edge => edge.selected)
      .map(edge => ({ ...edge }));
  }

  /**
   * Get edges with a specific weight
   */
  getEdgesByWeight(weight: string): Edge[] {
    return this.state.data.edges
      .filter(edge => edge.weight === weight)
      .map(edge => ({ ...edge }));
  }

  /**
   * Get edges with weights matching a pattern
   */
  getEdgesByWeightPattern(pattern: string | RegExp): Edge[] {
    const regex =
      pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
    return this.state.data.edges
      .filter(edge => edge.weight && regex.test(edge.weight))
      .map(edge => ({ ...edge }));
  }

  /**
   * Get all unique edge weights
   */
  getEdgeWeights(): string[] {
    const weights = new Set<string>();
    this.state.data.edges.forEach(edge => {
      if (edge.weight) {
        weights.add(edge.weight);
      }
    });
    return Array.from(weights);
  }

  /**
   * Update edge weight
   */
  updateEdgeWeight(edgeId: string, weight: string): boolean {
    const result = this.updateEdge(edgeId, { weight });
    return result !== null;
  }

  /**
   * Check if a weight is valid for the current graph
   */
  isValidEdgeWeight(weight: string): { valid: boolean; reason?: string } {
    if (typeof weight !== 'string') {
      return { valid: false, reason: 'Weight must be a string' };
    }

    if (weight.trim().length === 0) {
      return { valid: false, reason: 'Weight cannot be empty' };
    }

    // Check for reasonable length
    if (weight.length > 100) {
      return {
        valid: false,
        reason: 'Weight is too long (max 100 characters)',
      };
    }

    return { valid: true };
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
   * Set weight for multiple edges
   */
  setEdgeWeights(
    edgeIds: string[],
    weight: string
  ): { success: boolean; updated: number; errors: string[] } {
    const errors: string[] = [];
    let updated = 0;

    const validation = this.isValidEdgeWeight(weight);
    if (!validation.valid) {
      return {
        success: false,
        updated: 0,
        errors: [validation.reason!],
      };
    }

    for (const edgeId of edgeIds) {
      const edge = this.findEdgeById(edgeId);
      if (!edge) {
        errors.push(`Edge with ID '${edgeId}' not found`);
        continue;
      }

      const result = this.updateEdge(edgeId, { weight });
      if (result) {
        updated++;
      } else {
        errors.push(`Failed to update edge '${edgeId}'`);
      }
    }

    if (updated > 0) {
      this.markModified();
      this.clearError();
    }

    return {
      success: errors.length === 0,
      updated,
      errors,
    };
  }

  /**
   * Remove all edges from the graph
   */
  clearAllEdges(): void {
    this.state.data.edges = [];
    this.markModified();
  }

  /**
   * Get the degree of a node (number of connected edges)
   */
  getNodeDegree(nodeId: string): number {
    return this.getEdgesByNode(nodeId).length;
  }

  /**
   * Get the in-degree of a node (number of incoming edges)
   */
  getNodeInDegree(nodeId: string): number {
    return this.getEdgesByTarget(nodeId).length;
  }

  /**
   * Get the out-degree of a node (number of outgoing edges)
   */
  getNodeOutDegree(nodeId: string): number {
    return this.getEdgesBySource(nodeId).length;
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
      const sourceLabel = edge.source;
      const targetLabel = edge.target;

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

      // Add nodes with default positions
      for (let i = 0; i < nodeLabels.length; i++) {
        const success = graph.addNode({
          label: nodeLabels[i]!,
          x: i * 100, // Default spacing
          y: 0,
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
          source: sourceNode.label,
          target: targetNode.label,
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
