/**
 * Graph difference resolution utilities
 * Handles comparison and transformation between two graphs with different IDs
 */

import { Graph } from './Graph';
import { Node, Edge } from '../types/graph';

/**
 * Types of changes that can occur between graphs
 */
export enum ChangeType {
  NODE_LABEL_CHANGE = 'NODE_LABEL_CHANGE',
  NODE_ADD = 'NODE_ADD',
  NODE_REMOVE = 'NODE_REMOVE',
  EDGE_ADD = 'EDGE_ADD',
  EDGE_REMOVE = 'EDGE_REMOVE',
  EDGE_WEIGHT_CHANGE = 'EDGE_WEIGHT_CHANGE',
  GRAPH_TYPE_CHANGE = 'GRAPH_TYPE_CHANGE',
  INDEXING_MODE_CHANGE = 'INDEXING_MODE_CHANGE',
  MAX_NODES_CHANGE = 'MAX_NODES_CHANGE'
}

/**
 * Represents a match between nodes from original and edited graphs
 */
export interface NodeMatch {
  /** Node from original graph */
  originalNode: Node;
  /** Node from edited graph */
  editedNode: Node;
  /** Confidence score for the match (0-1) */
  confidence: number;
  /** Whether this is an exact match */
  isExact: boolean;
}

/**
 * Represents a match between edges from original and edited graphs
 */
export interface EdgeMatch {
  /** Edge from original graph */
  originalEdge: Edge;
  /** Edge from edited graph */
  editedEdge: Edge;
  /** Confidence score for the match (0-1) */
  confidence: number;
  /** Whether this is an exact match */
  isExact: boolean;
}

/**
 * Represents a single change operation
 */
export interface ChangeOperation {
  /** Type of change */
  type: ChangeType;
  /** Description of the change */
  description: string;
  /** Original value (if applicable) */
  originalValue?: any;
  /** New value (if applicable) */
  newValue?: any;
  /** Node involved in the change (if applicable) */
  node?: Node;
  /** Edge involved in the change (if applicable) */
  edge?: Edge;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Represents differences found in nodes
 */
export interface NodeDiff {
  /** Type of node change */
  type: ChangeType.NODE_ADD | ChangeType.NODE_REMOVE | ChangeType.NODE_LABEL_CHANGE;
  /** Original node (if applicable) */
  originalNode?: Node;
  /** New/edited node (if applicable) */
  newNode?: Node;
  /** Change description */
  description: string;
}

/**
 * Represents differences found in edges
 */
export interface EdgeDiff {
  /** Type of edge change */
  type: ChangeType.EDGE_ADD | ChangeType.EDGE_REMOVE | ChangeType.EDGE_WEIGHT_CHANGE;
  /** Original edge (if applicable) */
  originalEdge?: Edge;
  /** New/edited edge (if applicable) */
  newEdge?: Edge;
  /** Change description */
  description: string;
}

/**
 * Represents all matches found between two graphs
 */
export interface GraphMatches {
  /** Matched nodes */
  nodeMatches: NodeMatch[];
  /** Matched edges */
  edgeMatches: EdgeMatch[];
  /** Unmatched nodes from original graph */
  unmatchedOriginalNodes: Node[];
  /** Unmatched nodes from edited graph */
  unmatchedEditedNodes: Node[];
  /** Unmatched edges from original graph */
  unmatchedOriginalEdges: Edge[];
  /** Unmatched edges from edited graph */
  unmatchedEditedEdges: Edge[];
}

/**
 * Comprehensive result of graph comparison
 */
export interface GraphDiffResult {
  /** All change operations needed to transform original to edited */
  changes: ChangeOperation[];
  /** Node-specific differences */
  nodeDiffs: NodeDiff[];
  /** Edge-specific differences */
  edgeDiffs: EdgeDiff[];
  /** Graph property changes */
  propertyChanges: ChangeOperation[];
  /** Matching information */
  matches: GraphMatches;
  /** Summary statistics */
  summary: {
    totalChanges: number;
    nodeChanges: number;
    edgeChanges: number;
    propertyChanges: number;
    addedNodes: number;
    removedNodes: number;
    modifiedNodes: number;
    addedEdges: number;
    removedEdges: number;
    modifiedEdges: number;
  };
}

/**
 * Options for graph comparison
 */
export interface GraphComparisonOptions {
  /** Minimum confidence threshold for matches (0-1) */
  minConfidenceThreshold?: number;
  /** Whether to consider graph type changes */
  includeGraphTypeChanges?: boolean;
  /** Whether to consider indexing mode changes */
  includeIndexingModeChanges?: boolean;
  /** Whether to consider max nodes changes */
  includeMaxNodesChanges?: boolean;
  /** Custom node matching strategy */
  customNodeMatcher?: (original: Node[], edited: Node[]) => NodeMatch[];
  /** Custom edge matching strategy */
  customEdgeMatcher?: (original: Edge[], edited: Edge[], nodeMatches: NodeMatch[]) => EdgeMatch[];
}

/**
 * Result of applying changes to a graph
 */
export interface GraphTransformationResult {
  /** The transformed graph */
  transformedGraph: Graph;
  /** Whether the transformation was successful */
  success: boolean;
  /** Any errors that occurred during transformation */
  errors: string[];
  /** Warnings about the transformation */
  warnings: string[];
}

/**
 * Configuration for graph transformation
 */
export interface GraphTransformationOptions {
  /** Whether to validate the result after transformation */
  validateResult?: boolean;
  /** Whether to preserve original graph state */
  preserveOriginal?: boolean;
  /** Custom validation function */
  customValidator?: (graph: Graph) => { isValid: boolean; errors: string[] };
}

// ============================================================================
// IMPLEMENTATION FUNCTIONS
// ============================================================================

/**
 * Compares two graphs and returns detailed differences
 * Uses content-based matching since node/edge IDs may differ
 */
export function compareGraphs(
  original: Graph,
  edited: Graph,
  options: GraphComparisonOptions = {}
): GraphDiffResult {
  const {
    includeGraphTypeChanges = true,
    includeIndexingModeChanges = true,
    includeMaxNodesChanges = true
  } = options;

  const originalNodes = original.getNodes();
  const editedNodes = edited.getNodes();
  const originalEdges = original.getEdges();
  const editedEdges = edited.getEdges();

  // Find node matches
  const nodeMatches = findNodeMatches(originalNodes, editedNodes);
  
  // Find edge matches based on node matches
  const edgeMatches = findEdgeMatches(originalEdges, editedEdges, nodeMatches);

  // Identify unmatched nodes and edges
  const matchedOriginalNodeIds = new Set(nodeMatches.map(m => m.originalNode.id));
  const matchedEditedNodeIds = new Set(nodeMatches.map(m => m.editedNode.id));
  
  const unmatchedOriginalNodes = originalNodes.filter(n => !matchedOriginalNodeIds.has(n.id));
  const unmatchedEditedNodes = editedNodes.filter(n => !matchedEditedNodeIds.has(n.id));

  const matchedOriginalEdgeIds = new Set(edgeMatches.map(m => m.originalEdge.id));
  const matchedEditedEdgeIds = new Set(edgeMatches.map(m => m.editedEdge.id));
  
  const unmatchedOriginalEdges = originalEdges.filter(e => !matchedOriginalEdgeIds.has(e.id));
  const unmatchedEditedEdges = editedEdges.filter(e => !matchedEditedEdgeIds.has(e.id));

  // Create matches object
  const matches: GraphMatches = {
    nodeMatches,
    edgeMatches,
    unmatchedOriginalNodes,
    unmatchedEditedNodes,
    unmatchedOriginalEdges,
    unmatchedEditedEdges
  };

  // Generate change operations
  const changes: ChangeOperation[] = [];
  const nodeDiffs: NodeDiff[] = [];
  const edgeDiffs: EdgeDiff[] = [];
  const propertyChanges: ChangeOperation[] = [];

  // Process node changes
  processNodeChanges(matches, nodeDiffs, changes);
  
  // Process edge changes
  processEdgeChanges(matches, edgeDiffs, changes);
  
  // Process property changes
  if (includeGraphTypeChanges || includeIndexingModeChanges || includeMaxNodesChanges) {
    processPropertyChanges(original, edited, propertyChanges, options);
  }

  // Generate summary
  const summary = generateSummary(nodeDiffs, edgeDiffs, propertyChanges);

  return {
    changes,
    nodeDiffs,
    edgeDiffs,
    propertyChanges,
    matches,
    summary
  };
}

/**
 * Finds matches between nodes from original and edited graphs based on labels
 */
export function findNodeMatches(original: Node[], edited: Node[]): NodeMatch[] {
  const matches: NodeMatch[] = [];
  const usedEditedIndices = new Set<number>();

  for (const originalNode of original) {
    let bestMatch: { node: Node; index: number; confidence: number } | null = null;

    for (let i = 0; i < edited.length; i++) {
      if (usedEditedIndices.has(i)) continue;

      const editedNode = edited[i];
      if (!editedNode) continue;
      const confidence = calculateNodeMatchConfidence(originalNode, editedNode);

      if (confidence > 0 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { node: editedNode, index: i, confidence };
      }
    }

    if (bestMatch && bestMatch.confidence > 0.5) {
      matches.push({
        originalNode,
        editedNode: bestMatch.node,
        confidence: bestMatch.confidence,
        isExact: bestMatch.confidence === 1
      });
      usedEditedIndices.add(bestMatch.index);
    }
  }

  return matches;
}

/**
 * Finds matches between edges based on corresponding node matches
 */
export function findEdgeMatches(
  original: Edge[],
  edited: Edge[],
  nodeMatches: NodeMatch[]
): EdgeMatch[] {
  const matches: EdgeMatch[] = [];
  const usedEditedIndices = new Set<number>();

  // Create mapping from original node IDs to edited node IDs
  const nodeIdMap = new Map<number, number>();
  for (const match of nodeMatches) {
    nodeIdMap.set(match.originalNode.id, match.editedNode.id);
  }

  for (const originalEdge of original) {
    let bestMatch: { edge: Edge; index: number; confidence: number } | null = null;

    for (let i = 0; i < edited.length; i++) {
      if (usedEditedIndices.has(i)) continue;

      const editedEdge = edited[i];
      if (!editedEdge) continue;
      const confidence = calculateEdgeMatchConfidence(originalEdge, editedEdge, nodeIdMap);

      if (confidence > 0 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { edge: editedEdge, index: i, confidence };
      }
    }

    if (bestMatch && bestMatch.confidence > 0.5) {
      matches.push({
        originalEdge,
        editedEdge: bestMatch.edge,
        confidence: bestMatch.confidence,
        isExact: bestMatch.confidence === 1
      });
      usedEditedIndices.add(bestMatch.index);
    }
  }

  return matches;
}

/**
 * Calculates confidence score for node matching based on label similarity
 */
function calculateNodeMatchConfidence(original: Node, edited: Node): number {
  if (original.label === edited.label) {
    return 1.0; // Exact match
  }
  
  // Could add fuzzy matching here for similar labels
  // For now, only exact matches
  return 0;
}

/**
 * Calculates confidence score for edge matching based on node correspondence
 */
function calculateEdgeMatchConfidence(
  original: Edge,
  edited: Edge,
  nodeIdMap: Map<number, number>
): number {
  const originalSourceMapped = nodeIdMap.get(original.source);
  const originalTargetMapped = nodeIdMap.get(original.target);

  if (!originalSourceMapped || !originalTargetMapped) {
    return 0; // Can't match if nodes don't correspond
  }

  // Check if edge connects corresponding nodes
  const directMatch = originalSourceMapped === edited.source && originalTargetMapped === edited.target;
  const reverseMatch = originalSourceMapped === edited.target && originalTargetMapped === edited.source;

  if (directMatch || reverseMatch) {
    // Check weight similarity
    const weightMatch = original.weight === edited.weight;
    return weightMatch ? 1.0 : 0.8; // Slightly lower confidence if weights differ
  }

  return 0;
}

/**
 * Processes node changes and generates diffs and operations
 */
function processNodeChanges(
  matches: GraphMatches,
  nodeDiffs: NodeDiff[],
  changes: ChangeOperation[]
): void {
  // Process matched nodes for label changes
  for (const match of matches.nodeMatches) {
    if (!match.isExact) {
      const diff: NodeDiff = {
        type: ChangeType.NODE_LABEL_CHANGE,
        originalNode: match.originalNode,
        newNode: match.editedNode,
        description: `Node label changed from "${match.originalNode.label}" to "${match.editedNode.label}"`
      };
      nodeDiffs.push(diff);

      changes.push({
        type: ChangeType.NODE_LABEL_CHANGE,
        description: diff.description,
        originalValue: match.originalNode.label,
        newValue: match.editedNode.label,
        node: match.originalNode
      });
    }
  }

  // Process unmatched original nodes as removals
  for (const node of matches.unmatchedOriginalNodes) {
    const diff: NodeDiff = {
      type: ChangeType.NODE_REMOVE,
      originalNode: node,
      description: `Node "${node.label}" was removed`
    };
    nodeDiffs.push(diff);

    changes.push({
      type: ChangeType.NODE_REMOVE,
      description: diff.description,
      node
    });
  }

  // Process unmatched edited nodes as additions
  for (const node of matches.unmatchedEditedNodes) {
    const diff: NodeDiff = {
      type: ChangeType.NODE_ADD,
      newNode: node,
      description: `Node "${node.label}" was added`
    };
    nodeDiffs.push(diff);

    changes.push({
      type: ChangeType.NODE_ADD,
      description: diff.description,
      node
    });
  }
}

/**
 * Processes edge changes and generates diffs and operations
 */
function processEdgeChanges(
  matches: GraphMatches,
  edgeDiffs: EdgeDiff[],
  changes: ChangeOperation[]
): void {
  // Process matched edges for weight changes
  for (const match of matches.edgeMatches) {
    if (!match.isExact) {
      const diff: EdgeDiff = {
        type: ChangeType.EDGE_WEIGHT_CHANGE,
        originalEdge: match.originalEdge,
        newEdge: match.editedEdge,
        description: `Edge weight changed from "${match.originalEdge.weight || 'none'}" to "${match.editedEdge.weight || 'none'}"`
      };
      edgeDiffs.push(diff);

      changes.push({
        type: ChangeType.EDGE_WEIGHT_CHANGE,
        description: diff.description,
        originalValue: match.originalEdge.weight,
        newValue: match.editedEdge.weight,
        edge: match.originalEdge
      });
    }
  }

  // Process unmatched original edges as removals
  for (const edge of matches.unmatchedOriginalEdges) {
    const diff: EdgeDiff = {
      type: ChangeType.EDGE_REMOVE,
      originalEdge: edge,
      description: `Edge from node ${edge.source} to ${edge.target} was removed`
    };
    edgeDiffs.push(diff);

    changes.push({
      type: ChangeType.EDGE_REMOVE,
      description: diff.description,
      edge
    });
  }

  // Process unmatched edited edges as additions
  for (const edge of matches.unmatchedEditedEdges) {
    const diff: EdgeDiff = {
      type: ChangeType.EDGE_ADD,
      newEdge: edge,
      description: `Edge from node ${edge.source} to ${edge.target} was added`
    };
    edgeDiffs.push(diff);

    changes.push({
      type: ChangeType.EDGE_ADD,
      description: diff.description,
      edge
    });
  }
}

/**
 * Processes property changes between graphs
 */
function processPropertyChanges(
  original: Graph,
  edited: Graph,
  propertyChanges: ChangeOperation[],
  options: GraphComparisonOptions
): void {
  const { includeGraphTypeChanges, includeIndexingModeChanges, includeMaxNodesChanges } = options;

  if (includeGraphTypeChanges && original.getType() !== edited.getType()) {
    propertyChanges.push({
      type: ChangeType.GRAPH_TYPE_CHANGE,
      description: `Graph type changed from "${original.getType()}" to "${edited.getType()}"`,
      originalValue: original.getType(),
      newValue: edited.getType()
    });
  }

  if (includeIndexingModeChanges && original.getNodeIndexingMode() !== edited.getNodeIndexingMode()) {
    propertyChanges.push({
      type: ChangeType.INDEXING_MODE_CHANGE,
      description: `Node indexing mode changed from "${original.getNodeIndexingMode()}" to "${edited.getNodeIndexingMode()}"`,
      originalValue: original.getNodeIndexingMode(),
      newValue: edited.getNodeIndexingMode()
    });
  }

  if (includeMaxNodesChanges && original.getMaxNodes() !== edited.getMaxNodes()) {
    propertyChanges.push({
      type: ChangeType.MAX_NODES_CHANGE,
      description: `Max nodes changed from ${original.getMaxNodes()} to ${edited.getMaxNodes()}`,
      originalValue: original.getMaxNodes(),
      newValue: edited.getMaxNodes()
    });
  }
}

/**
 * Generates summary statistics for the comparison
 */
function generateSummary(
  nodeDiffs: NodeDiff[],
  edgeDiffs: EdgeDiff[],
  propertyChanges: ChangeOperation[]
): GraphDiffResult['summary'] {
  const addedNodes = nodeDiffs.filter(d => d.type === ChangeType.NODE_ADD).length;
  const removedNodes = nodeDiffs.filter(d => d.type === ChangeType.NODE_REMOVE).length;
  const modifiedNodes = nodeDiffs.filter(d => d.type === ChangeType.NODE_LABEL_CHANGE).length;
  
  const addedEdges = edgeDiffs.filter(d => d.type === ChangeType.EDGE_ADD).length;
  const removedEdges = edgeDiffs.filter(d => d.type === ChangeType.EDGE_REMOVE).length;
  const modifiedEdges = edgeDiffs.filter(d => d.type === ChangeType.EDGE_WEIGHT_CHANGE).length;

  return {
    totalChanges: nodeDiffs.length + edgeDiffs.length + propertyChanges.length,
    nodeChanges: nodeDiffs.length,
    edgeChanges: edgeDiffs.length,
    propertyChanges: propertyChanges.length,
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdges,
    removedEdges,
    modifiedEdges
  };
}

/**
 * Applies changes to transform the original graph into the edited version
 */
export function applyGraphChanges(
  original: Graph,
  changes: ChangeOperation[],
  options: GraphTransformationOptions = {}
): GraphTransformationResult {
  const { validateResult = true, preserveOriginal = true } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Create a copy of the original graph if preserving original
    const workingGraph = preserveOriginal ? new Graph(original.getData()) : original;

    // Apply changes in order
    for (const change of changes) {
      try {
        applyChange(workingGraph, change);
      } catch (error) {
        errors.push(`Failed to apply change "${change.description}": ${error}`);
      }
    }

    // Validate result if requested
    if (validateResult) {
      const validation = validateGraph(workingGraph);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    return {
      transformedGraph: workingGraph,
      success: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    return {
      transformedGraph: original,
      success: false,
      errors: [`Transformation failed: ${error}`],
      warnings
    };
  }
}

/**
 * Applies a single change operation to a graph
 */
function applyChange(graph: Graph, change: ChangeOperation): void {
  switch (change.type) {
    case ChangeType.NODE_ADD:
      if (change.node) {
        graph.addNode({ label: change.node.label, id: change.node.id });
      }
      break;
    
    case ChangeType.NODE_REMOVE:
      if (change.node) {
        graph.removeNode(change.node.id);
      }
      break;
    
    case ChangeType.NODE_LABEL_CHANGE:
      if (change.node && change.newValue) {
        graph.updateNode(change.node.id, { label: change.newValue });
      }
      break;
    
    case ChangeType.EDGE_ADD:
      if (change.edge) {
        graph.addEdge({
          source: change.edge.source,
          target: change.edge.target,
          ...(change.edge.weight && { weight: change.edge.weight })
        });
      }
      break;
    
    case ChangeType.EDGE_REMOVE:
      if (change.edge) {
        graph.removeEdge(change.edge.id);
      }
      break;
    
    case ChangeType.EDGE_WEIGHT_CHANGE:
      if (change.edge && change.newValue !== undefined) {
        graph.updateEdgeWeight(change.edge.id, change.newValue);
      }
      break;
    
    case ChangeType.GRAPH_TYPE_CHANGE:
      if (change.newValue) {
        graph.setType(change.newValue as any);
      }
      break;
    
    case ChangeType.INDEXING_MODE_CHANGE:
      if (change.newValue) {
        graph.setNodeIndexingMode(change.newValue as any);
      }
      break;
    
    case ChangeType.MAX_NODES_CHANGE:
      if (change.newValue) {
        // Note: Graph class doesn't have setMaxNodes method
        // This would need to be implemented in the Graph class if needed
        console.warn('setMaxNodes not implemented in Graph class');
      }
      break;
  }
}

/**
 * Validates a graph for consistency
 */
function validateGraph(graph: Graph): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation - check if graph has valid structure
  const nodes = graph.getNodes();
  const edges = graph.getEdges();
  
  // Check for orphaned edges
  const nodeIds = new Set(nodes.map(n => n.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source node ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target node ${edge.target}`);
    }
  }
  
  // Check for duplicate node IDs
  const nodeIdCounts = new Map<number, number>();
  for (const node of nodes) {
    nodeIdCounts.set(node.id, (nodeIdCounts.get(node.id) || 0) + 1);
  }
  for (const [id, count] of nodeIdCounts) {
    if (count > 1) {
      errors.push(`Duplicate node ID found: ${id}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
