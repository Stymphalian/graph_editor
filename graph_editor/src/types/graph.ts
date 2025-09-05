/**
 * TypeScript interfaces for graph data structures
 * Supports directed/undirected graphs with up to 1000 nodes
 */

export type NodeIndexingMode = '0-indexed' | '1-indexed' | 'custom';

export type GraphType = 'directed' | 'undirected';

export interface Node {
  /** Display label for the node (also serves as unique identifier) */
  label: string;
  /** X coordinate for rendering */
  x: number;
  /** Y coordinate for rendering */
  y: number;
  /** Whether the node is selected */
  selected?: boolean;
  /** Whether the node is being dragged */
  dragging?: boolean;
}

export interface Edge {
  /** Unique identifier for the edge */
  id: string;
  /** Source node label */
  source: string;
  /** Target node label */
  target: string;
  /** Edge weight as string value */
  weight?: string;
  /** Whether the edge is selected */
  selected?: boolean;
}

export interface GraphData {
  /** Array of all nodes in the graph */
  nodes: Node[];
  /** Array of all edges in the graph */
  edges: Edge[];
  /** Type of graph (directed or undirected) */
  type: GraphType;
  /** Node indexing mode */
  nodeIndexingMode: NodeIndexingMode;
  /** Maximum number of nodes allowed */
  maxNodes: number;
}

export interface GraphState {
  /** Current graph data */
  data: GraphData;
  /** Whether the graph has been modified since last save */
  isModified: boolean;
  /** Current error message, if any */
  error?: string|undefined;
}

export interface GraphValidationResult {
  /** Whether the graph is valid */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
  /** Array of validation warning messages */
  warnings: string[];
}

export interface NodeCreationData {
  /** Label for the new node */
  label: string;
  /** X coordinate for the new node */
  x: number;
  /** Y coordinate for the new node */
  y: number;
}

export interface EdgeCreationData {
  /** Source node label */
  source: string;
  /** Target node label */
  target: string;
  /** Edge weight */
  weight?: string;
}

export interface GraphSerializationOptions {
  /** Whether to include node positions in serialization */
  includePositions: boolean;
  /** Whether to include edge weights in serialization */
  includeWeights: boolean;
  /** Custom formatting options */
  format?: 'compact' | 'readable';
}

export interface TextFormatData {
  /** Number of nodes */
  nodeCount: number;
  /** Graph type */
  graphType: GraphType;
  /** Array of edge data in text format */
  edges: string[];
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}
