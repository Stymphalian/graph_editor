import React from 'react';
import { NodeIndexingMode } from '../types/graph';

interface NodeIndexingControlsProps {
  nodeIndexingMode: NodeIndexingMode;
  onNodeIndexingModeChange: (mode: NodeIndexingMode) => void;
  className?: string;
}

const NodeIndexingControls: React.FC<NodeIndexingControlsProps> = ({
  nodeIndexingMode,
  onNodeIndexingModeChange,
  className = '',
}) => {
  const indexingModes: { key: NodeIndexingMode; label: string; description: string }[] = [
    {
      key: '0-indexed',
      label: '0-Indexed',
      description: 'Nodes labeled 0, 1, 2, 3...'
    },
    {
      key: '1-indexed',
      label: '1-Indexed',
      description: 'Nodes labeled 1, 2, 3, 4...'
    },
    {
      key: 'custom',
      label: 'Custom',
      description: 'Custom labels (A, B, C...)'
    }
  ];

  return (
    <div className={`node-indexing-controls ${className}`}>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700">Node Indexing</h3>
        <div className="flex flex-col gap-2">
          {indexingModes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => onNodeIndexingModeChange(mode.key)}
              className={`
                px-4 py-3 text-sm font-medium rounded-md transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                text-left
                ${nodeIndexingMode === mode.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }
              `}
              title={mode.description}
              aria-pressed={nodeIndexingMode === mode.key}
              aria-label={`Switch to ${mode.label} indexing`}
            >
              <div className="font-semibold">{mode.label}</div>
              <div className="text-xs opacity-75 mt-1">
                {mode.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NodeIndexingControls;
