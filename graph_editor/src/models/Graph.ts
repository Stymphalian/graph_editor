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
  EdgeCreationDataWithLabels,
  NodeIndexingMode,
  GraphType,
} from '../types/graph';

export class Graph {
  private state: GraphState;

  constructor(
    initialData?: Partial<GraphData>,
    nodeIndexingMode: NodeIndexingMode = '0-indexed'
  ) {
    this.state = {
      data: {
        nodes: initialData?.nodes || [],
        edges: initialData?.edges || [],
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
   * Set node indexing mode (0-indexed, 1-indexed, custom)
   */
  setNodeIndexingMode(mode: NodeIndexingMode): void {
    if (this.state.data.nodeIndexingMode !== mode) {
      this.state.data.nodeIndexingMode = mode;
      
      // Re-label existing nodes based on their order in the array
      this.relabelNodes();
      
      this.state.isModified = true;
      this.clearError();
    }
  }

  /**
   * Re-label all nodes based on current indexing mode and their order in the array
   */
  private relabelNodes(): void {
    // Create a mapping of old labels to new labels
    const labelMapping = new Map<string, string>();
    
    // First pass: create the mapping and update node labels
    this.state.data.nodes.forEach((node, index) => {
      const oldLabel = node.label;
      const newLabel = this.generateNodeLabel(index);
      labelMapping.set(oldLabel, newLabel);
      node.label = newLabel;
    });
    
    // Second pass: update all edge references to use the new labels
    this.state.data.edges.forEach(edge => {
      const newSourceLabel = labelMapping.get(edge.source);
      const newTargetLabel = labelMapping.get(edge.target);
      
      if (newSourceLabel) {
        edge.source = newSourceLabel;
      }
      if (newTargetLabel) {
        edge.target = newTargetLabel;
      }
    });
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
   * Find the next available index for a new node label
   */
  private getNextAvailableIndex(): number {
    const existingLabels = this.state.data.nodes.map(node => node.label);
    
    // Find the highest numeric index that exists
    let maxIndex = -1;
    for (const label of existingLabels) {
      const numericValue = parseInt(label, 10);
      if (!isNaN(numericValue)) {
        maxIndex = Math.max(maxIndex, numericValue);
      }
    }
    
    // If no numeric labels exist, use the number of existing nodes
    if (maxIndex === -1) {
      return this.state.data.nodes.length;
    }

    if (this.getNodeIndexingMode() == "1-indexed") {
      return maxIndex;
    } else {
      // Start from the next index after the highest existing numeric label
      return maxIndex + 1;
    }
  }


  /**
   * Find a node by label
   */
  private findNodeByLabel(label: string): Node | undefined {
    return this.state.data.nodes.find(node => node.label === label);
  }

  /**
   * Find edges by source and target node labels
   */
  private findEdgesByNodeLabels(sourceLabel: string, targetLabel: string): Edge[] {
    return this.state.data.edges.filter(
      edge =>
        (edge.source === sourceLabel && edge.target === targetLabel) ||
        (this.state.data.type === 'undirected' &&
          edge.source === targetLabel &&
          edge.target === sourceLabel)
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
      ...(nodeData.x !== undefined && { x: nodeData.x }),
      ...(nodeData.y !== undefined && { y: nodeData.y }),
    };

    this.state.data.nodes.push(node);
    this.markModified();
    this.clearError();

    return { ...node };
  }

  /**
   * Add a node with auto-generated label based on indexing mode
   */
  addNodeWithAutoLabel(x?: number, y?: number): Node | null {
    const index = this.getNextAvailableIndex();
    const label = this.generateNodeLabel(index);
    return this.addNode({ label, ...(x !== undefined && { x }), ...(y !== undefined && { y }) });
  }

  /**
   * Get the next available label for a new node
   */
  getNextNodeLabel(): string {
    const index = this.getNextAvailableIndex();
    return this.generateNodeLabel(index);
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

    // Store the old label for edge reference updates
    const oldLabel = this.state.data.nodes[nodeIndex]!.label;
    const newLabel = updates.label;

    // Update the node
    this.state.data.nodes[nodeIndex] = {
      ...this.state.data.nodes[nodeIndex]!,
      ...updates,
    } as Node;

    // If the label changed, update all edge references
    if (newLabel && newLabel !== oldLabel) {
      this.state.data.edges.forEach(edge => {
        if (edge.source === oldLabel) {
          edge.source = newLabel;
        }
        if (edge.target === oldLabel) {
          edge.target = newLabel;
        }
      });
    }

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

  /**
   * Update node position by label
   */
  updateNodePosition(nodeLabel: string, x: number, y: number): boolean {
    const nodeIndex = this.state.data.nodes.findIndex(
      node => node.label === nodeLabel
    );
    if (nodeIndex === -1) {
      this.setError(
        `Cannot update node position: node with label '${nodeLabel}' not found`
      );
      return false;
    }

    this.state.data.nodes[nodeIndex] = {
      ...this.state.data.nodes[nodeIndex]!,
      x,
      y,
    };

    this.markModified();
    this.clearError();
    return true;
  }

  /**
   * Update multiple node positions at once
   */
  updateNodePositions(positions: Array<{ label: string; x: number; y: number }>): boolean {
    let hasChanges = false;
    
    for (const { label, x, y } of positions) {
      const node = this.findNodeByLabel(label);
      if (node) {
        // Only update if position actually changed
        const currentX = node.x || 0;
        const currentY = node.y || 0;
        const threshold = 1; // Only update if change is more than 1 pixel
        
        if (Math.abs(currentX - x) > threshold || Math.abs(currentY - y) > threshold) {
          const success = this.updateNodePosition(label, x, y);
          if (success) {
            hasChanges = true;
          }
        }
      }
    }
    
    return hasChanges;
  }

  /**
   * Get node position by label
   */
  getNodePosition(nodeLabel: string): { x: number; y: number } | null {
    const node = this.findNodeByLabel(nodeLabel);
    if (!node || node.x === undefined || node.y === undefined) {
      return null;
    }
    return { x: node.x, y: node.y };
  }

  // ==================== EDGE MANAGEMENT METHODS ====================

  /**
   * Add a new edge to the graph
   */
  addEdge(edgeData: EdgeCreationData): Edge | null {
    // Validate source and target nodes exist
    if (!this.findNodeByLabel(edgeData.source)) {
      this.setError(
        `Cannot add edge: source node '${edgeData.source}' not found`
      );
      return null;
    }

    if (!this.findNodeByLabel(edgeData.target)) {
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
    const existingEdges = this.findEdgesByNodeLabels(
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
      source: edgeData.source,
      target: edgeData.target,
      ...(edgeData.weight && { weight: edgeData.weight }),
    };

    this.state.data.edges.push(edge);
    this.markModified();
    this.clearError();

    return { ...edge };
  }

  addEdgeWithLabels(edgeData: EdgeCreationDataWithLabels): Edge | null {
    if (!this.findNodeByLabel(edgeData.sourceLabel)) {
      this.setError(`Cannot add edge: source node '${edgeData.sourceLabel}' not found`);
      return null;
    }
    if (!this.findNodeByLabel(edgeData.targetLabel)) {
      this.setError(`Cannot add edge: target node '${edgeData.targetLabel}' not found`);
      return null;
    }
    return this.addEdge({ source: edgeData.sourceLabel, target: edgeData.targetLabel, ...(edgeData.weight && { weight: edgeData.weight }) });
  }

  /**
   * Remove an edge by source and target node labels
   */
  removeEdgeByNodes(sourceLabel: string, targetLabel: string): boolean {
    const edgeIndex = this.state.data.edges.findIndex(
      edge => edge.source === sourceLabel && edge.target === targetLabel
    );
    if (edgeIndex === -1) {
      this.setError(`Cannot remove edge: edge between '${sourceLabel}' and '${targetLabel}' not found`);
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
  removeEdgesBetweenNodes(sourceLabel: string, targetLabel: string): number {
    const initialCount = this.state.data.edges.length;

    this.state.data.edges = this.state.data.edges.filter(
      edge =>
        !(edge.source === sourceLabel && edge.target === targetLabel) &&
        !(
          edge.source === targetLabel &&
          edge.target === sourceLabel &&
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
   * Update an edge by source and target node labels
   */
  updateEdgeByNodes(
    sourceLabel: string,
    targetLabel: string,
    updates: Partial<Omit<Edge, 'source' | 'target'>>
  ): Edge | null {
    const edgeIndex = this.state.data.edges.findIndex(
      edge => edge.source === sourceLabel && edge.target === targetLabel
    );
    if (edgeIndex === -1) {
      this.setError(`Cannot update edge: edge between '${sourceLabel}' and '${targetLabel}' not found`);
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
   * Get an edge by source and target node labels
   */
  getEdgeByNodes(sourceLabel: string, targetLabel: string): Edge | null {
    const edge = this.state.data.edges.find(
      edge => edge.source === sourceLabel && edge.target === targetLabel
    );
    return edge ? { ...edge } : null;
  }

  /**
   * Get all edges connected to a node
   */
  getEdgesByNode(nodeLabel: string): Edge[] {
    return this.state.data.edges
      .filter(edge => edge.source === nodeLabel || edge.target === nodeLabel)
      .map(edge => ({ ...edge }));
  }

  /**
   * Get edges between two specific nodes
   */
  getEdgesBetweenNodes(sourceLabel: string, targetLabel: string): Edge[] {
    return this.findEdgesByNodeLabels(sourceLabel, targetLabel).map(edge => ({ ...edge }));
  }

  /**
   * Get the number of edges
   */
  getEdgeCount(): number {
    return this.state.data.edges.length;
  }

  /**
   * Check if an edge exists between two nodes
   */
  hasEdgeBetween(sourceLabel: string, targetLabel: string): boolean {
    return this.findEdgesByNodeLabels(sourceLabel, targetLabel).length > 0;
  }

  /**
   * Get all edge tuples (source, target)
   */
  getEdgeTuples(): [string, string][] {
    return this.state.data.edges.map(edge => [edge.source, edge.target]);
  }

  /**
   * Update edge weight by source and target node labels
   */
  updateEdgeWeightByNodes(sourceLabel: string, targetLabel: string, weight: string): boolean {
    const result = this.updateEdgeByNodes(sourceLabel, targetLabel, { weight });
    return result !== null;
  }

  /**
   * Remove weight from an edge by source and target node labels
   */
  removeEdgeWeightByNodes(sourceLabel: string, targetLabel: string): boolean {
    const edge = this.getEdgeByNodes(sourceLabel, targetLabel);
    if (!edge) {
      this.setError(`Cannot remove weight: edge between '${sourceLabel}' and '${targetLabel}' not found`);
      return false;
    }

    const result = this.updateEdgeByNodes(sourceLabel, targetLabel, { weight: undefined as any });
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
      let edgeLine = `${edge.source} ${edge.target}`;

      if (edge.weight) {
        edgeLine += ` ${edge.weight}`;
      }

      result += `${edgeLine}\n`;
    }

    return result.trim();
  }

  /**
   * Parse graph from edge-list text format
   * Format: Each line is either a node label or an edge (from, to, [weight])
   * - Single element: node label
   * - Two elements: edge without weight
   * - Three elements: edge with weight
   * Invalid lines are ignored (duplicates, malformed lines)
   */
  static parseFromText(text: string, graph: Graph): {
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
        return { success: true, graph: graph };
      }

      // Track processed nodes and edges to avoid duplicates
      const processedNodes = new Set<string>();
      const processedEdges = new Set<string>();

      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!.trim();
        if (line.length === 0) continue;

        const parts = line.split(/\s+/);
        
        // Skip lines with too many parts (>3)
        if (parts.length > 3) {
          continue;
        }

        if (parts.length === 1) {
          // Single element: node label
          const label = parts[0]!;
          
          // Skip if node already exists
          if (processedNodes.has(label)) {
            continue;
          }

          // Add node (ignore errors for duplicates)
          const node = graph.addNode({ label });
          if (node) {
            processedNodes.add(label);
          }
        } else if (parts.length === 2 || parts.length === 3) {
          // Two or three elements: edge
          const sourceLabel = parts[0]!;
          const targetLabel = parts[1]!;
          const weight = parts.length === 3 ? parts[2]! : undefined;

          // Create edge key for duplicate detection
          const edgeKey = `${sourceLabel}->${targetLabel}`;
          
          // Skip if edge already exists
          if (processedEdges.has(edgeKey)) {
            continue;
          }

          // Ensure source node exists
          if (!processedNodes.has(sourceLabel)) {
            const sourceNode = graph.addNode({ label: sourceLabel });
            if (sourceNode) {
              processedNodes.add(sourceLabel);
            }
          }

          // Ensure target node exists
          if (!processedNodes.has(targetLabel)) {
            const targetNode = graph.addNode({ label: targetLabel });
            if (targetNode) {
              processedNodes.add(targetLabel);
            }
          }

          // Add edge (ignore errors for duplicates)
          const edgeData: EdgeCreationData = {
            source: sourceLabel,
            target: targetLabel,
          };

          if (weight !== undefined) {
            edgeData.weight = weight;
          }

          const edge = graph.addEdge(edgeData);
          if (edge) {
            processedEdges.add(edgeKey);
          }
        }
        // Lines with 0 parts (empty after trimming) are already filtered out
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