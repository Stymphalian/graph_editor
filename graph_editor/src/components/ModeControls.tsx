import React from 'react';

export type Mode = 'edit' | 'delete' | 'view-force';

interface ModeControlsProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  className?: string;
}

const ModeControls: React.FC<ModeControlsProps> = ({
  currentMode,
  onModeChange,
  className = '',
}) => {
  const modes: { key: Mode; label: string; description: string }[] = [
    {
      key: 'edit',
      label: 'Edit',
      description: 'Create and modify nodes and edges',
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Remove nodes and edges',
    },
    {
      key: 'view-force',
      label: 'View/Force',
      description: 'View graph with force simulation',
    },
  ];

  return (
    <div className={`mode-controls ${className}`}>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700">Mode</h3>
        <div className="flex flex-col gap-2">
          {modes.map(mode => (
            <button
              key={mode.key}
              onClick={() => onModeChange(mode.key)}
              className={`
                px-4 py-3 text-sm font-medium rounded-md transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                text-left
                ${
                  currentMode === mode.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }
              `}
              title={mode.description}
              aria-pressed={currentMode === mode.key}
              aria-label={`Switch to ${mode.label} mode`}
            >
              <div className="font-semibold">{mode.label}</div>
              <div className="text-xs opacity-75 mt-1">{mode.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModeControls;
