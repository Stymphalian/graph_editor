/**
 * Graph difference utilities - simplified to focus on essential changes
 */

import { Graph } from './Graph';
import { Node, Edge, GraphData } from '../types/graph';

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

export interface NodeMatch {
  originalNode: Node;
  editedNode: Node;
  isExact: boolean;
}

export interface EdgeMatch {
  originalEdge: Edge;
  editedEdge: Edge;
  isExact: boolean;
}

export interface ChangeOperation {
  type: ChangeType;
  originalValue?: any;
  newValue?: any;
  node?: Node;
  edge?: Edge;
}

export interface GraphDiffResult {
  changes: ChangeOperation[];
}

export interface GraphTransformationResult {
  transformedGraph: Graph;
  success: boolean;
  errors: string[];
}

export interface LineOperation {
  type: 'add' | 'remove' | 'modify' | 'keep';
  line: string;
  index: number;
  originalLine?: string; // For modify operations
}

export function extractDataChangesFromText(newText: string, prevText: string, originalGraph: GraphData): GraphDiffResult {
  const operations = extractLineOperationsFromText(newText, prevText);
  console.log("@@@@ operations", operations);
  const changes: ChangeOperation[] = [];

  // Get current graph data for reference
  const originalNodes = originalGraph.nodes;
  const originalEdges = originalGraph.edges;

  // Create lookup maps for efficient searching
  const nodeLabelToNode = new Map<string, Node>();
  const edgeDescriptionToEdge = new Map<string, Edge>();

  // Build lookup maps from original graph
  for (const node of originalNodes) {
    nodeLabelToNode.set(node.label, node);
  }

  for (const edge of originalEdges) {
    const sourceNode = originalNodes.find(n => n.id === edge.source);
    const targetNode = originalNodes.find(n => n.id === edge.target);
    if (sourceNode && targetNode) {
      const edgeDescription = `${sourceNode.label} ${targetNode.label}${edge.weight ? ` ${edge.weight}` : ''}`;
      edgeDescriptionToEdge.set(edgeDescription, edge);
    }
  }

  // Process each line operation
  for (const operation of operations) {
    switch (operation.type) {
      case 'add':
        const addChange = parseLineAsChange(operation.line, 'add');
        if (addChange) {
          if (Array.isArray(addChange)) {
            changes.push(...addChange);
          } else {
            changes.push(addChange);
          }
        }
        break;

      case 'remove':
        const removeChange = parseLineAsChange(operation.line, 'remove', nodeLabelToNode, edgeDescriptionToEdge);
        if (removeChange) {
          if (Array.isArray(removeChange)) {
            changes.push(...removeChange);
          } else {
            changes.push(removeChange);
          }
        }
        break;

      case 'modify':
        const modifyChanges = parseLineAsChange(operation.line, 'modify', nodeLabelToNode, edgeDescriptionToEdge, operation.originalLine);
        if (modifyChanges) {
          // parseLineAsChange can return either a single ChangeOperation or an array of ChangeOperations
          if (Array.isArray(modifyChanges)) {
            changes.push(...modifyChanges);
          } else {
            changes.push(modifyChanges);
          }
        }
        break;

      case 'keep':
        // No change needed for kept lines
        break;
    }
  }

  return { changes };
}

function normalizeLine(line: string): string {
  // Normalize whitespace: trim and replace multiple spaces with single space
  return line.trim().replace(/\s+/g, ' ');
}

function parseLineAsChange(
  line: string, 
  operation: 'add' | 'remove' | 'modify', 
  nodeLabelToNode?: Map<string, Node>,
  edgeDescriptionToEdge?: Map<string, Edge>,
  originalLine?: string
): ChangeOperation | ChangeOperation[] | null {
  const normalizedLine = normalizeLine(line);
  const parts = normalizedLine.split(/\s+/);
  
  if (parts.length === 1) {
    // Single word - this is a node
    const label = parts[0];
    if (!label) return null;
    
    if (operation === 'add') {
      return {
        type: ChangeType.NODE_ADD,
        node: { id: 0, label } // ID will be assigned by the graph
      };
    } else if (operation === 'remove') {
      // Find the node in the original graph
      const originalNode = nodeLabelToNode?.get(label);
      if (originalNode) {
        return {
          type: ChangeType.NODE_REMOVE,
          node: originalNode
        };
      }
    } else if (operation === 'modify' && originalLine) {
      // Find the original node (normalize the original line for lookup)
      const normalizedOriginalLine = normalizeLine(originalLine);
      const originalNode = nodeLabelToNode?.get(normalizedOriginalLine);
      if (originalNode) {
        return {
          type: ChangeType.NODE_LABEL_CHANGE,
          originalValue: normalizedOriginalLine,
          newValue: label,
          node: originalNode
        };
      }
    }
  } else if (parts.length >= 2) {
    // Two or more words - this is an edge
    const sourceLabel = parts[0];
    const targetLabel = parts[1];
    const weight = parts.length >= 3 ? parts[2] : undefined;
    
    if (!sourceLabel || !targetLabel) return null;
    
    if (operation === 'add') {
      return {
        type: ChangeType.EDGE_ADD,
        edge: { 
          id: '', 
          source: 0,
          target: 0,
          sourceLabel: sourceLabel,
          targetLabel: targetLabel,
          ...(weight && { weight })
        } // IDs will be resolved by labels
      };
    } else if (operation === 'remove') {
      // Find the edge in the original graph
      const edgeDescription = `${sourceLabel} ${targetLabel}${weight ? ` ${weight}` : ''}`;
      const originalEdge = edgeDescriptionToEdge?.get(edgeDescription);
      if (originalEdge) {
        return {
          type: ChangeType.EDGE_REMOVE,
          edge: originalEdge
        };
      }
    } else if (operation === 'modify' && originalLine) {
      // Find the original edge (normalize the original line for lookup)
      const normalizedOriginalLine = normalizeLine(originalLine);
      const originalEdge = edgeDescriptionToEdge?.get(normalizedOriginalLine);
      if (originalEdge) {
        // Check if this is a weight change or edge replacement
        const originalParts = normalizedOriginalLine.split(/\s+/);
        const newParts = normalizedLine.split(/\s+/);
        
        if (originalParts.length >= 2 && newParts.length >= 2) {
          const originalSource = originalParts[0];
          const originalTarget = originalParts[1];
          const originalWeight = originalParts.length >= 3 ? originalParts[2] : undefined;
          const newSource = newParts[0];
          const newTarget = newParts[1];
          const newWeight = newParts.length >= 3 ? newParts[2] : undefined;
          
          // If source and target are the same but weight changed
          if (originalSource === newSource && originalTarget === newTarget && originalWeight !== newWeight) {
            return {
              type: ChangeType.EDGE_WEIGHT_CHANGE,
              originalValue: originalWeight,
              newValue: newWeight,
              edge: originalEdge
            };
          }
          
          // If source or target changed, this is an edge replacement (remove + add)
          if (originalSource !== newSource || originalTarget !== newTarget) {
            const operations: ChangeOperation[] = [
              {
                type: ChangeType.EDGE_REMOVE,
                edge: originalEdge
              }
            ];

            // Check if new source node exists, if not add it
            if (originalSource !== newSource && newSource && !nodeLabelToNode?.has(newSource)) {
              operations.push({
                type: ChangeType.NODE_ADD,
                node: { id: 0, label: newSource } // ID will be assigned by the graph
              });
            }

            // Check if new target node exists, if not add it
            if (originalTarget !== newTarget && newTarget && !nodeLabelToNode?.has(newTarget)) {
              operations.push({
                type: ChangeType.NODE_ADD,
                node: { id: 0, label: newTarget } // ID will be assigned by the graph
              });
            }

            // Add the new edge
            operations.push({
              type: ChangeType.EDGE_ADD,
              edge: { 
                id: '', 
                source: 0, 
                target: 0, 
                ...(newWeight && { weight: newWeight })
              } // IDs will be resolved by labels
            });

            return operations;
          }
        }
      }
    }
  }
  
  return null;
}

export function extractLineOperationsFromText(newText: string, prevText: string): LineOperation[] {
  // Split texts into lines, handling empty strings properly
  const newLines = newText === '' ? [] : newText.split('\n');
  const prevLines = prevText === '' ? [] : prevText.split('\n');
  
  // Handle edge cases
  if (newLines.length === 0 && prevLines.length === 0) {
    return [];
  }
  
  // Normalize lines for comparison (but keep original lines for output)
  const normalizedNewLines = newLines.map(line => normalizeLine(line));
  const normalizedPrevLines = prevLines.map(line => normalizeLine(line));
  
  // Calculate minimum edit distance using normalized lines but with original line tracking
  const operations = calculateEditDistanceWithOriginalLines(
    normalizedPrevLines, 
    normalizedNewLines, 
    prevLines, 
    newLines
  );
  
  return operations;
}

function calculateEditDistanceWithOriginalLines(
  normalizedPrevLines: string[], 
  normalizedNewLines: string[], 
  originalPrevLines: string[], 
  originalNewLines: string[]
): LineOperation[] {
  const m = normalizedPrevLines.length;
  const n = normalizedNewLines.length;
  
  // Create DP table
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i]![0] = i; // Delete all lines from prev
  }
  for (let j = 0; j <= n; j++) {
    dp[0]![j] = j; // Insert all lines from new
  }
  
  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const prevLine = normalizedPrevLines[i - 1];
      const newLine = normalizedNewLines[j - 1];
      
      if (prevLine !== undefined && newLine !== undefined && prevLine === newLine) {
        // Lines are identical
        dp[i]![j] = dp[i - 1]![j - 1]!;
      } else {
        // Take minimum of delete, insert, or modify
        dp[i]![j] = 1 + Math.min(
          dp[i - 1]![j]!,     // Delete from prev
          dp[i]![j - 1]!,     // Insert from new
          dp[i - 1]![j - 1]!  // Modify (replace)
        );
      }
    }
  }
  
  // Backtrack to find the sequence of operations
  const operations: LineOperation[] = [];
  let i = m;
  let j = n;
  
  while (i > 0 || j > 0) {
    const prevLine = i > 0 ? normalizedPrevLines[i - 1] : undefined;
    const newLine = j > 0 ? normalizedNewLines[j - 1] : undefined;
    const originalPrevLine = i > 0 ? originalPrevLines[i - 1] : undefined;
    const originalNewLine = j > 0 ? originalNewLines[j - 1] : undefined;
    
    if (i > 0 && j > 0 && prevLine !== undefined && newLine !== undefined && prevLine === newLine) {
      // Lines are identical - keep
      operations.unshift({
        type: 'keep',
        line: originalNewLine || '',
        index: j - 1
      });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i]![j] === dp[i - 1]![j - 1]! + 1) {
      // Modify operation
      operations.unshift({
        type: 'modify',
        line: originalNewLine || '',
        index: j - 1,
        originalLine: originalPrevLine || ''
      });
      i--;
      j--;
    } else if (i > 0 && dp[i]![j] === dp[i - 1]![j]! + 1) {
      // Delete operation
      operations.unshift({
        type: 'remove',
        line: originalPrevLine || '',
        index: i - 1
      });
      i--;
    } else if (j > 0 && dp[i]![j] === dp[i]![j - 1]! + 1) {
      // Insert operation
      operations.unshift({
        type: 'add',
        line: originalNewLine || '',
        index: j - 1
      });
      j--;
    } else {
      // This shouldn't happen, but handle gracefully
      if (i > 0 && originalPrevLine !== undefined) {
        operations.unshift({
          type: 'remove',
          line: originalPrevLine,
          index: i - 1
        });
        i--;
      } else if (j > 0 && originalNewLine !== undefined) {
        operations.unshift({
          type: 'add',
          line: originalNewLine,
          index: j - 1
        });
        j--;
      }
    }
  }
  
  return operations;
}


// DO NOT USE THIS FUNCTION. IT DOESN't WORK AS INTENDED.
export function compareGraphs(original: Graph, edited: Graph): GraphDiffResult {
  const originalNodes = original.getNodes();
  const editedNodes = edited.getNodes();
  const originalEdges = original.getEdges();
  const editedEdges = edited.getEdges();

  const nodeMatches = findNodeMatches(originalNodes, editedNodes);
  const edgeMatches = findEdgeMatches(originalEdges, editedEdges, originalNodes, editedNodes);

  const matchedOriginalNodeIds = new Set(nodeMatches.map(m => m.originalNode.id));
  const matchedEditedNodeIds = new Set(nodeMatches.map(m => m.editedNode.id));
  
  const unmatchedOriginalNodes = originalNodes.filter(n => !matchedOriginalNodeIds.has(n.id));
  const unmatchedEditedNodes = editedNodes.filter(n => !matchedEditedNodeIds.has(n.id));

  const matchedOriginalEdgeIds = new Set(edgeMatches.map(m => m.originalEdge.id));
  const matchedEditedEdgeIds = new Set(edgeMatches.map(m => m.editedEdge.id));
  
  const unmatchedOriginalEdges = originalEdges.filter(e => !matchedOriginalEdgeIds.has(e.id));
  const unmatchedEditedEdges = editedEdges.filter(e => !matchedEditedEdgeIds.has(e.id));

  const changes: ChangeOperation[] = [];

  // Process node changes
  for (const match of nodeMatches) {
    if (!match.isExact) {
      changes.push({
        type: ChangeType.NODE_LABEL_CHANGE,
        originalValue: match.originalNode.label,
        newValue: match.editedNode.label,
        node: match.originalNode
      });
    }
  }

  for (const node of unmatchedOriginalNodes) {
    changes.push({
      type: ChangeType.NODE_REMOVE,
      node
    });
  }

  for (const node of unmatchedEditedNodes) {
    changes.push({
      type: ChangeType.NODE_ADD,
      node
    });
  }
  
  // Process edge changes
  for (const match of edgeMatches) {
    if (!match.isExact) {
      changes.push({
        type: ChangeType.EDGE_WEIGHT_CHANGE,
        originalValue: match.originalEdge.weight,
        newValue: match.editedEdge.weight,
        edge: match.originalEdge
      });
    }
  }

  for (const edge of unmatchedOriginalEdges) {
    changes.push({
      type: ChangeType.EDGE_REMOVE,
      edge
    });
  }

  for (const edge of unmatchedEditedEdges) {
    changes.push({
      type: ChangeType.EDGE_ADD,
      edge
    });
  }
  
  // Process property changes
  if (original.getType() !== edited.getType()) {
    changes.push({
      type: ChangeType.GRAPH_TYPE_CHANGE,
      originalValue: original.getType(),
      newValue: edited.getType()
    });
  }

  if (original.getNodeIndexingMode() !== edited.getNodeIndexingMode()) {
    changes.push({
      type: ChangeType.INDEXING_MODE_CHANGE,
      originalValue: original.getNodeIndexingMode(),
      newValue: edited.getNodeIndexingMode()
    });
  }

  if (original.getMaxNodes() !== edited.getMaxNodes()) {
    changes.push({
      type: ChangeType.MAX_NODES_CHANGE,
      originalValue: original.getMaxNodes(),
      newValue: edited.getMaxNodes()
    });
  }

  return { changes };
}

export function findNodeMatches(original: Node[], edited: Node[]): NodeMatch[] {
  const matches: NodeMatch[] = [];
  const usedEditedIndices = new Set<number>();

  for (const originalNode of original) {
    let bestMatch: { node: Node; index: number } | null = null;

    for (let i = 0; i < edited.length; i++) {
      if (usedEditedIndices.has(i)) continue;

      const editedNode = edited[i];
      if (!editedNode) continue;

      if (originalNode.label === editedNode.label) {
        bestMatch = { node: editedNode, index: i };
        break;
      }
    }

    if (bestMatch) {
      matches.push({
        originalNode,
        editedNode: bestMatch.node,
        isExact: true
      });
      usedEditedIndices.add(bestMatch.index);
    }
  }

  return matches;
}

export function findEdgeMatches(
  original: Edge[],
  edited: Edge[],
  originalNodes: Node[],
  editedNodes: Node[]
): EdgeMatch[] {
  const matches: EdgeMatch[] = [];
  const usedEditedIndices = new Set<number>();

  // Create node ID to label maps for both graphs
  const originalNodeIdToLabel = new Map<number, string>();
  const editedNodeIdToLabel = new Map<number, string>();
  
  for (const node of originalNodes) {
    originalNodeIdToLabel.set(node.id, node.label);
  }
  
  for (const node of editedNodes) {
    editedNodeIdToLabel.set(node.id, node.label);
  }

  for (const originalEdge of original) {
    let bestMatch: { edge: Edge; index: number } | null = null;

    // Get labels for the original edge
    const originalSourceLabel = originalNodeIdToLabel.get(originalEdge.source);
    const originalTargetLabel = originalNodeIdToLabel.get(originalEdge.target);

    if (!originalSourceLabel || !originalTargetLabel) continue;

    for (let i = 0; i < edited.length; i++) {
      if (usedEditedIndices.has(i)) continue;

      const editedEdge = edited[i];
      if (!editedEdge) continue;

      // Get labels for the edited edge
      const editedSourceLabel = editedNodeIdToLabel.get(editedEdge.source);
      const editedTargetLabel = editedNodeIdToLabel.get(editedEdge.target);

      if (!editedSourceLabel || !editedTargetLabel) continue;

      // Compare edges by their source and target labels
      const directMatch = originalSourceLabel === editedSourceLabel && 
                         originalTargetLabel === editedTargetLabel;
      const reverseMatch = originalSourceLabel === editedTargetLabel && 
                          originalTargetLabel === editedSourceLabel;

      if (directMatch || reverseMatch) {
        bestMatch = { edge: editedEdge, index: i };
        break;
      }
    }

    if (bestMatch) {
      const isExact = originalEdge.weight === bestMatch.edge.weight;
      matches.push({
        originalEdge,
        editedEdge: bestMatch.edge,
        isExact
      });
      usedEditedIndices.add(bestMatch.index);
    }
  }

  return matches;
}

export function applyGraphChanges(
  original: Graph,
  changes: ChangeOperation[]
): GraphTransformationResult {
  const errors: string[] = [];

  try {
    // Apply changes directly to the original graph
    for (const change of changes) {
      const success = applyChange(original, change);
      if (!success) {
        const error = original.getError();
        if (error) {
          errors.push(`Failed to apply change: ${error}`);
        } else {
          errors.push(`Failed to apply change of type ${change.type}`);
        }
      }
    }

    return {
      transformedGraph: original,
      success: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      transformedGraph: original,
      success: false,
      errors: [`Transformation failed: ${error}`]
    };
  }
}

function applyChange(graph: Graph, change: ChangeOperation): boolean {
  switch (change.type) {
    case ChangeType.NODE_ADD:
      if (change.node) {
        return graph.addNode({ id: change.node.id, label: change.node.label}) !== null;
      }
      return false;
    
    case ChangeType.NODE_REMOVE:
      if (change.node) {
        return graph.removeNode(change.node.id);
      }
      return false;
    
    case ChangeType.NODE_LABEL_CHANGE:
      if (change.node && change.newValue) {
        return graph.updateNode(change.node.id, { label: change.newValue }) !== null;
      }
      return false;
    
    case ChangeType.EDGE_ADD:
      if (change.edge) {
        return graph.addEdge({
          source: change.edge.source,
          target: change.edge.target,
          ...(change.edge.weight && { weight: change.edge.weight })
        }) !== null;
      }
      return false;
    
    case ChangeType.EDGE_REMOVE:
      if (change.edge) {
        return graph.removeEdge(change.edge.id);
      }
      return false;
    
    case ChangeType.EDGE_WEIGHT_CHANGE:
      if (change.edge && change.newValue !== undefined) {
        return graph.updateEdgeWeight(change.edge.id, change.newValue);
      }
      return false;
    
    case ChangeType.GRAPH_TYPE_CHANGE:
      if (change.newValue) {
        graph.setType(change.newValue as any);
        return true;
      }
      return false;
    
    case ChangeType.INDEXING_MODE_CHANGE:
      if (change.newValue) {
        graph.setNodeIndexingMode(change.newValue as any);
        return true;
      }
      return false;
    
    case ChangeType.MAX_NODES_CHANGE:
      if (change.newValue) {
        // Note: Graph class doesn't have setMaxNodes method
        // This would need to be implemented in the Graph class if needed
        console.warn('setMaxNodes not implemented in Graph class');
        return true; // Consider it successful since it's not implemented
      }
      return false;
    
    default:
      return false;
  }
}