import { useState, useMemo } from 'react';
import GraphViewer from './components/GraphViewer';
import TextPanel from './components/TextPanel';
import { Graph } from './models/Graph';
import { GraphData } from './types/graph';

function App() {
  // Create a sample graph using the Graph model
  const graph = useMemo(() => {
    const g = new Graph({ type: 'directed' });

    // Add sample nodes and store their IDs
    const nodeA = g.addNode({ label: 'A' });
    const nodeB = g.addNode({ label: 'B' });
    const nodeC = g.addNode({ label: 'C' });
    const nodeD = g.addNode({ label: 'D' });

    // Add sample edges using the actual node IDs
    if (nodeA && nodeB) g.addEdge({ source: nodeA.id, target: nodeB.id });
    if (nodeB && nodeC) g.addEdge({ source: nodeB.id, target: nodeC.id });
    if (nodeC && nodeD) g.addEdge({ source: nodeC.id, target: nodeD.id });
    // if (nodeD && nodeA) g.addEdge({ source: nodeD.id, target: nodeA.id });

    return g;
  }, []);

  const [currentGraph] = useState<Graph>(graph);
  const [graphData, setGraphData] = useState<GraphData>(graph.getData());
  const [newNodePosition, setNewNodePosition] = useState<{ x: number; y: number } | null>(null);

  const handleNodeCreate = (x: number, y: number) => {
    console.log('Creating node at:', x, y);
    
    // Store the click coordinates for the new node
    setNewNodePosition({ x, y });
    
    // Create a new node with auto-generated label
    const newNode = currentGraph.addNodeWithAutoLabel();
    
    if (newNode) {
      console.log('Node created:', newNode);
      // Update the graph data state to trigger re-render without recreating the graph
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to create node:', currentGraph.getError());
    }
  };

  const handleEdgeCreate = (sourceId: number, targetId: number) => {
    console.log('Creating edge:', sourceId, '->', targetId);
    
    // Create a new edge between the source and target nodes using their IDs
    const newEdge = currentGraph.addEdge({ 
      source: sourceId, 
      target: targetId 
    });
    
    if (newEdge) {
      console.log('Edge created:', newEdge);
      // Update the graph data state to trigger re-render without recreating the graph
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to create edge:', currentGraph.getError());
    }
  };

  const handleGraphDataChange = (newData: any) => {
    console.log('Graph data changed:', newData);
    // TODO: Implement graph data parsing and updating (Task 4.4)
  };

  return (
    <div className="graph-editor-layout">
      <header className="graph-editor-header">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 py-4">
            Graph Editor
          </h1>
        </div>
      </header>

      <main className="graph-editor-main">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            {/* Text Panel - 1/3 width */}
            <div className="w-1/3">
              <TextPanel
                data={graphData}
                onDataChange={handleGraphDataChange}
                className="h-[600px]"
              />
            </div>

            {/* Graph Visualization Panel - 2/3 width */}
            <div className="w-2/3">
              <div className="graph-editor-panel p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Graph Visualization
                </h2>
                <div className="h-[600px]">
                  <GraphViewer
                    data={graphData}
                    width={800}
                    height={600}
                    onNodeCreate={handleNodeCreate}
                    onEdgeCreate={handleEdgeCreate}
                    mode="edit"
                    newNodePosition={newNodePosition}
                    onNewNodePositioned={() => setNewNodePosition(null)}
                  />
                </div>
                <p className="graph-editor-help-text mt-4">
                  Click and drag nodes to move them. The force simulation will
                  automatically adjust the layout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
