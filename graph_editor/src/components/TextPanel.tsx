import React, { useState, useEffect } from 'react';
import { GraphData } from '../types/graph';
import TextAreaWithLineNumbers from './TextAreaWithLineNumbers';

interface TextPanelProps {
  data: GraphData;
  onDataChange?: (newData: GraphData) => void;
  className?: string;
}

const TextPanel: React.FC<TextPanelProps> = ({ 
  data, 
  onDataChange: _onDataChange, 
  className = '' 
}) => {
  const [graphTextContent, setGraphTextContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hasErrors, setHasErrors] = useState<boolean>(false);

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

  // Update text content when data changes
  useEffect(() => {
    if (!isEditing) {
      setGraphTextContent(generateTextFromData(data));
    }
  }, [data, isEditing]);

  // Handle graph text area changes
  const handleGraphTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGraphTextContent(event.target.value);
    setHasErrors(false); // Reset error state when user types
  };

  // Handle graph text area focus
  const handleGraphTextFocus = () => {
    setIsEditing(true);
  };

  // Handle graph text area blur
  const handleGraphTextBlur = () => {
    setIsEditing(false);
    // TODO: Parse text and update graph data (Task 4.5)
    // For now, just reset to current data
    setGraphTextContent(generateTextFromData(data));
  };

  // Handle key events
  const handleGraphTextKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      // Cancel editing and revert to current data
      setIsEditing(false);
      setGraphTextContent(generateTextFromData(data));
      setHasErrors(false);
    }
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
