import React from 'react';
import { D3Node } from '@/utils/d3Config';

interface NodeProps {
  node: D3Node;
  isSelected?: boolean;
  radius?: number;
  onNodeClick?: (node: D3Node) => void;
  onNodeDoubleClick?: (node: D3Node) => void;
  onNodeMouseEnter?: (node: D3Node) => void;
  onNodeMouseLeave?: (node: D3Node) => void;
  className?: string;
  style?: React.CSSProperties;
}

const Node: React.FC<NodeProps> = ({
  node,
  isSelected = false,
  radius = 20,
  onNodeClick,
  onNodeDoubleClick,
  onNodeMouseEnter,
  onNodeMouseLeave,
  className = '',
  style = {},
}) => {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onNodeClick?.(node);
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onNodeDoubleClick?.(node);
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    event.stopPropagation();
    onNodeMouseEnter?.(node);
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    event.stopPropagation();
    onNodeMouseLeave?.(node);
  };

  // Calculate node colors based on selection state
  const nodeFill = isSelected ? '#e3f2fd' : 'white';
  const nodeStroke = isSelected ? '#1976d2' : '#000000';
  const nodeStrokeWidth = isSelected ? 3 : 2;
  const labelFill = isSelected ? '#1976d2' : '#000000';

  return (
    <g
      className={`node ${className}`}
      data-node-label={node.label}
      data-testid={`node-${node.label}`}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Node circle */}
      <circle
        className="graph-node"
        r={radius}
        fill={nodeFill}
        stroke={nodeStroke}
        strokeWidth={nodeStrokeWidth}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
        }}
      />
      
      {/* Node label */}
      <text
        className="graph-node-label"
        textAnchor="middle"
        dy="0.35em"
        fill={labelFill}
        fontSize="12px"
        fontWeight="bold"
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {node.label}
      </text>
    </g>
  );
};

export default Node;
