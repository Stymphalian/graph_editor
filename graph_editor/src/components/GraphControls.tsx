import React from 'react';
import { GraphType } from '../types/graph';

interface GraphControlsProps {
  graphType: GraphType;
  onGraphTypeChange: (type: GraphType) => void;
  className?: string;
}

const GraphControls: React.FC<GraphControlsProps> = ({
  graphType,
  onGraphTypeChange,
  className = '',
}) => {
  const graphTypes: { key: GraphType; label: string; description: string }[] = [
    {
      key: 'directed',
      label: 'Directed',
      description: 'Edges have direction (A → B)'
    },
    {
      key: 'undirected',
      label: 'Undirected',
      description: 'Edges are bidirectional (A ↔ B)'
    }
  ];

  return (
    <div className={`graph-controls ${className}`}>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700">Graph Type</h3>
        <div className="flex flex-col gap-2">
          {graphTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => onGraphTypeChange(type.key)}
              className={`
                px-4 py-3 text-sm font-medium rounded-md transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                text-left
                ${graphType === type.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }
              `}
              title={type.description}
              aria-pressed={graphType === type.key}
              aria-label={`Switch to ${type.label} graph`}
            >
              <div className="font-semibold">{type.label}</div>
              <div className="text-xs opacity-75 mt-1">
                {type.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GraphControls;
