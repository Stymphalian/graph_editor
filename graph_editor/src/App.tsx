import { useState } from 'react'
import GraphViewer from './components/GraphViewer'
import { D3Node, D3Edge } from './utils/d3Config'

function App() {
  // Sample graph data for testing D3 integration
  const [graphData] = useState({
    nodes: [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
      { id: 'D' }
    ],
    edges: [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'C' },
      { source: 'C', target: 'D' },
      { source: 'D', target: 'A' }
    ]
  });

  const handleNodeClick = (node: D3Node) => {
    console.log('Node clicked:', node);
  };

  const handleEdgeClick = (edge: D3Edge) => {
    console.log('Edge clicked:', edge);
  };

  return (
    <div className="graph-editor-layout">
      <header className="graph-editor-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 py-4">
            Graph Editor
          </h1>
        </div>
      </header>
      
      <main className="graph-editor-main">
        <div className="graph-editor-panel p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            D3.js Graph Visualization Test
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <GraphViewer
              data={graphData}
              width={800}
              height={600}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
            />
          </div>
          <p className="graph-editor-help-text mt-4">
            Click and drag nodes to move them. The force simulation will automatically adjust the layout.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
