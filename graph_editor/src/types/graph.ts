/**
 * TypeScript interfaces for graph data structures
 * Supports directed/undirected graphs with up to 1000 nodes
 */

export type NodeIndexingMode = '0-indexed' | '1-indexed' | 'custom';

export type GraphType = 'directed' | 'undirected';

export interface Node {
  /** Display label for the node */
  label: string;
  /** X coordinate for node position */
  x?: number;
  /** Y coordinate for node position */
  y?: number;
}

export interface Edge {
  /** Source node label */
  source: string;
  /** Target node label */
  target: string;
  /** Edge weight as string value */
  weight?: string;
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
  error?: string | undefined;
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
  /** X coordinate for node position */
  x?: number;
  /** Y coordinate for node position */
  y?: number;
}

export interface EdgeCreationData {
  /** Source node label */
  source: string;
  /** Target node label */
  target: string;
  /** Edge weight */
  weight?: string;
}

export interface EdgeCreationDataWithLabels {
  /** Source node label */
  sourceLabel: string;
  /** Target node label */
  targetLabel: string;
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

export type GraphOperationType =
  | 'NODE_ADD'
  | 'NODE_LABEL_CHANGE'
  | 'NODE_REMOVE'
  | 'EDGE_ADD'
  | 'EDGE_REMOVE'
  | 'EDGE_WEIGHT_CHANGE'
  | 'GRAPH_TYPE_CHANGE'
  | 'INDEXING_MODE_CHANGE'
  | 'MAX_NODES_CHANGE'
  | 'TEXT_BASED_CHANGE';

export interface GraphOperation {
  /** Type of operation performed */
  type: GraphOperationType;
  /** Node label affected (for node operations) */
  nodeLabel?: string;
  /** Edge tuple (source, target) affected (for edge operations) */
  edgeTuple?: [string, string];
  /** Previous value (for updates) */
  previousValue?: string | undefined;
  /** New value (for updates) */
  newValue?: string | undefined;
  /** Additional operation data */
  data?: any;
}
