import React, { useState } from 'react';

interface VisualizationSettingsProps {
  nodeRadius: number;
  edgeStrokeWidth: number;
  onNodeRadiusChange: (radius: number) => void;
  onEdgeStrokeWidthChange: (width: number) => void;
  className?: string;
}

const VisualizationSettings: React.FC<VisualizationSettingsProps> = ({
  nodeRadius,
  edgeStrokeWidth,
  onNodeRadiusChange,
  onEdgeStrokeWidthChange,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    onNodeRadiusChange(20);
    onEdgeStrokeWidthChange(2);
  };

  return (
    <div className={`graph-editor-controls ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors rounded-t-md"
      >
        <h3 className="text-sm font-semibold text-gray-800">
          Visualization Settings
        </h3>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2">
          <div className="space-y-3">
            {/* Node Radius Control */}
            <div>
              <label className="graph-editor-label">
                Node Radius: {nodeRadius}px
              </label>
              <input
                type="range"
                min="8"
                max="30"
                step="1"
                value={nodeRadius}
                onChange={e => onNodeRadiusChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>8px</span>
                <span>30px</span>
              </div>
            </div>

            {/* Edge Stroke Width Control */}
            <div>
              <label className="graph-editor-label">
                Edge Stroke Width: {edgeStrokeWidth}px
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={edgeStrokeWidth}
                onChange={e =>
                  onEdgeStrokeWidthChange(parseFloat(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5px</span>
                <span>5px</span>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full graph-editor-button graph-editor-button-secondary"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizationSettings;
