import React, { useState, useEffect, useRef } from 'react';
import { GraphData } from '../types/graph';

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
  const [textContent, setTextContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Generate simple text representation from graph data
  const generateTextFromData = (graphData: GraphData): string => {
    const lines: string[] = [];
    
    // First line: number of nodes
    lines.push(graphData.nodes.length.toString());
    
    // Next lines: node labels (using index numbers by default)
    for (let i = 0; i < graphData.nodes.length; i++) {
      lines.push(i.toString());
    }
    
    // Remaining lines: edges
    graphData.edges.forEach(edge => {
      // Convert node labels to indices
      const sourceIndex = graphData.nodes.findIndex(node => node.label === edge.source);
      const targetIndex = graphData.nodes.findIndex(node => node.label === edge.target);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const edgeLine = `${sourceIndex} ${targetIndex}`;
        const weight = edge.weight ? ` ${edge.weight}` : '';
        lines.push(edgeLine + weight);
      }
    });
    
    return lines.join('\n');
  };

  // Generate line numbers
  const generateLineNumbers = (text: string): string => {
    const lines = text.split('\n');
    const lineCount = lines.length;
    return Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
  };

  // Update text content when data changes
  useEffect(() => {
    if (!isEditing) {
      setTextContent(generateTextFromData(data));
    }
  }, [data, isEditing]);

  // Update line numbers when text content changes
  useEffect(() => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.textContent = generateLineNumbers(textContent);
    }
  }, [textContent]);

  // Handle text area changes
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(event.target.value);
    setHasErrors(false); // Reset error state when user types
  };

  // Handle text area focus
  const handleFocus = () => {
    setIsEditing(true);
  };

  // Handle text area blur
  const handleBlur = () => {
    setIsEditing(false);
    // TODO: Parse text and update graph data (Task 4.4)
    // For now, just reset to current data
    setTextContent(generateTextFromData(data));
  };

  // Handle key events
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      // Cancel editing and revert to current data
      setIsEditing(false);
      setTextContent(generateTextFromData(data));
      setHasErrors(false);
    }
  };

  // Handle scroll synchronization between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className={`text-panel ${className}`}>
      <div className="text-panel-header">
        <h3 className="text-panel-title">Graph Data</h3>
      </div>
      <div className="text-panel-editor">
        <div 
          ref={lineNumbersRef}
          className="text-panel-line-numbers"
        >
          {generateLineNumbers(textContent)}
        </div>
        <textarea
          ref={textareaRef}
          value={textContent}
          onChange={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className={`graph-editor-textarea text-panel-textarea ${
            hasErrors ? 'text-panel-textarea-error' : ''
          }`}
          placeholder="Graph data will appear here..."
          rows={20}
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default TextPanel;
