import React, { useState, useEffect, useRef } from 'react';
import { GraphData, GraphOperation } from '../types/graph';
import { Graph } from '../models/Graph';
import { useDebounce } from '../hooks/useDebounce';
import { usePrevious } from '../hooks/usePrevious';
import TextAreaWithLineNumbers from './TextAreaWithLineNumbers';
import { compareGraphs, GraphDiffResult, extractDataChangesFromText } from '../models/GraphUtils';

interface TextPanelProps {
  data: GraphData;
  onDataChange?: (newData: GraphDiffResult) => void;
  className?: string;
  lastOperation?: GraphOperation | undefined;
}

const TextPanel: React.FC<TextPanelProps> = ({ 
  data, 
  onDataChange, 
  className = '',
  lastOperation
}) => {
  // const { current: graphTextContent, previous: prevGraphTextContent, setValue: setGraphTextContent } = usePrevious<string>('');
  const [graphTextContent, setGraphTextContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const previousDataRef = useRef<GraphData | null>(null);
  
  // Debounce the text content with 0.5s delay for parsing
  const {current: debouncedTextContent, previous: prevGraphTextContent} = useDebounce(graphTextContent, 1000);

  // Generate text representation from graph data (edge list format)
  const generateTextFromData = (graphData: GraphData): string => {
    const lines: string[] = [];
    
    // First: node labels (one per line)
    graphData.nodes.forEach(node => {
      lines.push(node.label);
    });
    
    // Then: edges
    graphData.edges.forEach(edge => {
      // Find source and target nodes by ID
      const sourceNode = graphData.nodes.find(node => node.id === edge.source);
      const targetNode = graphData.nodes.find(node => node.id === edge.target);
      
      if (sourceNode && targetNode) {
        const edgeLine = `${sourceNode.label} ${targetNode.label}`;
        const weight = edge.weight ? ` ${edge.weight}` : '';
        lines.push(edgeLine + weight);
      }
    });
    
    return lines.join('\n');
  };

  // Partial text update methods for different operation types
  const updateTextForNodeAdd = (newNode: any): void => {
    const currentText = graphTextContent;
    const newLine = newNode.label;
    setGraphTextContent(currentText + (currentText ? '\n' : '') + newLine);
  };

  const updateTextForNodeLabelChange = (_nodeId: number, oldLabel: string, newLabel: string): void => {
    let updatedText = graphTextContent;
    
    // Replace all instances of the old label with the new label
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${oldLabel}\\b`, 'g');
    updatedText = updatedText.replace(regex, newLabel);
    
    setGraphTextContent(updatedText);
  };

  const updateTextForNodeRemove = (_nodeId: number, nodeLabel: string): void => {
    const lines = graphTextContent.split('\n');
    const filteredLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip lines that are just the node label
      if (trimmedLine === nodeLabel) {
        continue;
      }
      
      // Skip edge lines that contain the removed node
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const sourceLabel = parts[0];
        const targetLabel = parts[1];
        if (sourceLabel === nodeLabel || targetLabel === nodeLabel) {
          continue;
        }
      }
      
      filteredLines.push(line);
    }
    
    setGraphTextContent(filteredLines.join('\n'));
  };

  const updateTextForEdgeAdd = (edge: any, sourceLabel: string, targetLabel: string): void => {
    const currentText = graphTextContent;
    const edgeLine = `${sourceLabel} ${targetLabel}${edge.weight ? ` ${edge.weight}` : ''}`;
    setGraphTextContent(currentText + (currentText ? '\n' : '') + edgeLine);
  };

  const updateTextForEdgeRemove = (_edgeId: string, sourceLabel: string, targetLabel: string, weight?: string): void => {
    const lines = graphTextContent.split('\n');
    const filteredLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      const parts = trimmedLine.split(/\s+/);
      
      // Check if this line represents the edge to remove
      if (parts.length >= 2) {
        const lineSourceLabel = parts[0];
        const lineTargetLabel = parts[1];
        const lineWeight = parts.length >= 3 ? parts[2] : undefined;
        
        // Match the edge (considering both directions for undirected graphs)
        const isMatch = (lineSourceLabel === sourceLabel && lineTargetLabel === targetLabel) ||
                       (data.type === 'undirected' && lineSourceLabel === targetLabel && lineTargetLabel === sourceLabel);
        
        // Also check weight if specified
        const weightMatch = weight === undefined || lineWeight === weight;
        
        if (isMatch && weightMatch) {
          continue; // Skip this line
        }
      }
      
      filteredLines.push(line);
    }
    
    setGraphTextContent(filteredLines.join('\n'));
  };

  const updateTextForEdgeWeightChange = (_edgeId: string, sourceLabel: string, targetLabel: string, oldWeight: string | undefined, newWeight: string | undefined): void => {
    const lines = graphTextContent.split('\n');
    const updatedLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      const parts = trimmedLine.split(/\s+/);
      
      // Check if this line represents the edge to update
      if (parts.length >= 2) {
        const lineSourceLabel = parts[0];
        const lineTargetLabel = parts[1];
        const lineWeight = parts.length >= 3 ? parts[2] : undefined;
        
        // Match the edge (considering both directions for undirected graphs)
        const isMatch = (lineSourceLabel === sourceLabel && lineTargetLabel === targetLabel) ||
                       (data.type === 'undirected' && lineSourceLabel === targetLabel && lineTargetLabel === sourceLabel);
        
        // Also check weight if specified
        const weightMatch = oldWeight === undefined || lineWeight === oldWeight;
        
        if (isMatch && weightMatch) {
          // Update this line with the new weight
          const newLine = `${lineSourceLabel} ${lineTargetLabel}${newWeight ? ` ${newWeight}` : ''}`;
          updatedLines.push(newLine);
          continue;
        }
      }
      
      updatedLines.push(line);
    }
    
    setGraphTextContent(updatedLines.join('\n'));
  };

  const updateTextForIndexingModeChange = (): void => {
    // Regenerate the entire text from the new graph data
    setGraphTextContent(generateTextFromData(data));
  };

  // On first initialization, just get the full text-format of the graph
  useEffect(() => {
      if (!isInitialized) {
        const initialText = generateTextFromData(data);
        setGraphTextContent(initialText);
        setIsInitialized(true);
        previousDataRef.current = { ...data };
        return;
      }
  }, [data])

  // Update text content when data changes
  useEffect(() => {
    if (!isEditing) {
      // For subsequent updates, use partial updates based on the operation type
      if (lastOperation && previousDataRef.current) {
        
        switch (lastOperation.type) {
          case 'NODE_ADD':
            if (lastOperation.nodeId) {
              const newNode = data.nodes.find(node => node.id === lastOperation.nodeId);
              if (newNode) {
                updateTextForNodeAdd(newNode);
              }
            }
            break;
            
          case 'NODE_LABEL_CHANGE':
            if (lastOperation.nodeId && lastOperation.previousValue && lastOperation.newValue) {
              updateTextForNodeLabelChange(lastOperation.nodeId, lastOperation.previousValue, lastOperation.newValue);
            }
            break;
            
          case 'NODE_REMOVE':
            if (lastOperation.nodeId && lastOperation.previousValue) {
              updateTextForNodeRemove(lastOperation.nodeId, lastOperation.previousValue);
            }
            break;
            
          case 'EDGE_ADD':
            if (lastOperation.edgeId) {
              const newEdge = data.edges.find(edge => edge.id === lastOperation.edgeId);
              if (newEdge) {
                const sourceNode = data.nodes.find(node => node.id === newEdge.source);
                const targetNode = data.nodes.find(node => node.id === newEdge.target);
                if (sourceNode && targetNode) {
                  updateTextForEdgeAdd(newEdge, sourceNode.label, targetNode.label);
                }
              }
            }
            break;
            
          case 'EDGE_REMOVE':
            if (lastOperation.edgeId && lastOperation.data) {
              const { sourceLabel, targetLabel, weight } = lastOperation.data;
              updateTextForEdgeRemove(lastOperation.edgeId, sourceLabel, targetLabel, weight);
            }
            break;
            
          case 'EDGE_WEIGHT_CHANGE':
            if (lastOperation.edgeId && lastOperation.previousValue !== undefined && lastOperation.newValue !== undefined && lastOperation.data) {
              const { sourceLabel, targetLabel } = lastOperation.data;
              updateTextForEdgeWeightChange(lastOperation.edgeId, sourceLabel, targetLabel, lastOperation.previousValue, lastOperation.newValue);
            }
            break;
            
          case 'GRAPH_TYPE_CHANGE':
            // Do nothing for graph type changes
            break;
            
          case 'INDEXING_MODE_CHANGE':
            updateTextForIndexingModeChange();
            break;
            
          case 'MAX_NODES_CHANGE':
            // Do nothing for max nodes changes
            break;
            
          case 'TEXT_BASED_CHANGE':
            // Do nothing for text-based changes - the text is already correct
            break;
            
          default:
            // Fallback to full regeneration for unknown operations
            setGraphTextContent(generateTextFromData(data));
            break;
        }
      } else {
        // Fallback to full regeneration if no operation info is available
        setGraphTextContent(generateTextFromData(data));
      }
      
      // Update the previous data and text content references
      previousDataRef.current = { ...data };
    }
  }, [lastOperation]);

  // Handle debounced text parsing when user stops typing
  useEffect(() => {
      // Only parse if we're editing and the debounced content is different from current data
      if (isEditing && onDataChange) {
        let editedGraph = new Graph({}, data.nodeIndexingMode);
        editedGraph.setType(data.type);
        let result = Graph.parseFromText(debouncedTextContent, editedGraph);
        if (!result.success) {
          setHasErrors(true);
          return;
        }
        console.log("@@@@ editedGraph", data.type, data.nodeIndexingMode);

        let originalGraph = new Graph(data, data.nodeIndexingMode);
        originalGraph.setType(data.type);

        let diffResult = compareGraphs(originalGraph, editedGraph);
        if (diffResult.changes.length > 0) {
          onDataChange(diffResult);
        }

      }
    }, [debouncedTextContent]);



  // Handle graph text area changes
  const handleGraphTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // only set graphTextContent if it has changed.
    if (event.target.value !== graphTextContent) {
      setGraphTextContent(event.target.value);
      setHasErrors(false); // Reset error state when user types  
    }
  };

  // Handle graph text area focus
  const handleGraphTextFocus = () => {
    setIsEditing(true);
  };

  // Handle graph text area blur
  const handleGraphTextBlur = () => {
    setIsEditing(false);
    // // Parse the final text content when user finishes editing
    // if (onDataChange && graphTextContent !== generateTextFromData(data)) {
    //   parseTextToGraph(graphTextContent);
    // }
  };

  // Handle key events
  const handleGraphTextKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if (event.key === 'Escape') {
    //   // Cancel editing and revert to previous text content
    //   setIsEditing(false);
    //   setGraphTextContent(previousTextContentRef.current);
    //   setHasErrors(false);
    // }
  };


  return (
    <div className={`text-panel ${className}`}>
      <div className="text-panel-header">
        <h2 className="text-lg font-semibold text-gray-800 mb-0">Graph Data</h2>
      </div>
      
      {/* Node Count Textarea (Read-only) */}
      <div className="text-panel-section-compact">
        <label className="text-panel-label-compact">Node Count:</label>
        <textarea
          value={data.nodes.length.toString()}
          readOnly
          className="graph-editor-textarea text-panel-textarea text-panel-textarea-readonly text-panel-textarea-compact"
          rows={1}
          spellCheck={false}
        />
      </div>

      {/* Graph Representation Textarea (Editable) */}
      <div className="text-panel-section">
        <label className="text-panel-label">Graph Representation</label>
        <TextAreaWithLineNumbers
          value={graphTextContent}
          onChange={handleGraphTextChange}
          onFocus={handleGraphTextFocus}
          onBlur={handleGraphTextBlur}
          onKeyDown={handleGraphTextKeyDown}
          placeholder="Graph data will appear here..."
          rows={18}
          spellCheck={false}
          textareaClassName={hasErrors ? 'text-panel-textarea-error' : ''}
        />
      </div>
    </div>
  );
};

export default TextPanel;
