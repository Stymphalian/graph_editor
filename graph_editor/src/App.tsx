import { useState, useMemo } from 'react';
import GraphViewer from './components/GraphViewer';
import TextPanel from './components/TextPanel';
import ModeControls from './components/ModeControls';
import { Graph } from './models/Graph';
import { GraphData } from './types/graph';
import { Mode } from './components/ModeControls';

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
    if (nodeA && nodeB) g.addEdge({ source: nodeA.id, target: nodeB.id, weight: '123456' });
    if (nodeB && nodeC) g.addEdge({ source: nodeB.id, target: nodeC.id });
    if (nodeC && nodeD) g.addEdge({ source: nodeC.id, target: nodeD.id });
    // if (nodeD && nodeA) g.addEdge({ source: nodeD.id, target: nodeA.id });

    return g;
  }, []);

  const [currentGraph] = useState<Graph>(graph);
  const [graphData, setGraphData] = useState<GraphData>(graph.getData());
  const [newNodePosition, setNewNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<Mode>('edit');

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

  const handleNodeLabelEdit = (nodeId: number, newLabel: string) => {
    console.log('Editing node label:', nodeId, '->', newLabel);
    
    // Update the node label using the Graph model
    const updatedNode = currentGraph.updateNode(nodeId, { label: newLabel });
    
    if (updatedNode) {
      console.log('Node label updated:', updatedNode);
      // Update the graph data state to trigger re-render
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to update node label:', currentGraph.getError());
      // Show error to user via the error callback
      const errorMessage = currentGraph.getError() || 'Failed to update node label';
      handleError(errorMessage);
    }
  };

  const handleNodeDelete = (nodeId: number) => {
    console.log('Deleting node:', nodeId);
    
    // Remove the node using the Graph model
    const success = currentGraph.removeNode(nodeId);
    
    if (success) {
      console.log('Node deleted successfully');
      // Update the graph data state to trigger re-render
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to delete node:', currentGraph.getError());
      // Show error to user via the error callback
      const errorMessage = currentGraph.getError() || 'Failed to delete node';
      handleError(errorMessage);
    }
  };

  const handleEdgeDelete = (edgeId: string) => {
    console.log('handleEdgeDelete called with edgeId:', edgeId);
    console.log('Current graph data before deletion:', currentGraph.getData());
    
    // Remove the edge using the Graph model
    const success = currentGraph.removeEdge(edgeId);
    
    console.log('removeEdge result:', success);
    
    if (success) {
      console.log('Edge deleted successfully');
      const newData = currentGraph.getData();
      console.log('New graph data after deletion:', newData);
      // Update the graph data state to trigger re-render
      setGraphData(newData);
    } else {
      console.error('Failed to delete edge:', currentGraph.getError());
      // Show error to user via the error callback
      const errorMessage = currentGraph.getError() || 'Failed to delete edge';
      handleError(errorMessage);
    }
  };

  const handleEdgeWeightEdit = (edgeId: string, newWeight: string) => {
    console.log('Editing edge weight:', edgeId, '->', newWeight);
    
    // Update the edge weight using the Graph model
    const success = currentGraph.updateEdgeWeight(edgeId, newWeight);
    
    if (success) {
      console.log('Edge weight updated successfully');
      // Update the graph data state to trigger re-render
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to update edge weight:', currentGraph.getError());
      // Show error to user via the error callback
      const errorMessage = currentGraph.getError() || 'Failed to update edge weight';
      handleError(errorMessage);
    }
  };

  const handleError = (message: string) => {
    // This will be passed to GraphViewer to display the error
    if (message === '') {
      setErrorMessage(null);
    } else {
      setErrorMessage(message);
      // Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  const handleModeChange = (mode: Mode) => {
    console.log('Mode changed to:', mode);
    console.log('Current graph data when mode changes:', graphData);
    setCurrentMode(mode);
  };

  const handleGraphDataChange = (newData: any) => {
    console.log('Graph data changed:', newData);
    // TODO: Implement graph data parsing and updating (Task 4.4)
  };

  return (
    <div className="graph-editor-layout">
      <header className="graph-editor-header">
        <div className="w-full px-2">
          <h1 className="text-2xl font-bold text-gray-900 py-3">
            Graph Editor
          </h1>
        </div>
      </header>

      <main className="graph-editor-main">
        <div className="w-full px-2 py-4">
          <div className="flex gap-4">
            {/* Text Panel - Fixed width */}
            <div className="w-80 flex-shrink-0">
              <TextPanel
                data={graphData}
                onDataChange={handleGraphDataChange}
                className="h-[calc(100vh-200px)] min-h-[400px]"
              />
            </div>

            {/* Graph Visualization Panel - Flexible width */}
            <div className="flex-1 min-w-0">
              <div className="graph-editor-panel p-3">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Graph Visualization
                </h2>
                <div className="h-[calc(100vh-200px)] min-h-[400px]">
                  <GraphViewer
                    data={graphData}
                    height={300}
                    onNodeCreate={handleNodeCreate}
                    onEdgeCreate={handleEdgeCreate}
                    onNodeLabelEdit={handleNodeLabelEdit}
                    onEdgeWeightEdit={handleEdgeWeightEdit}
                    onNodeDelete={handleNodeDelete}
                    onEdgeDelete={handleEdgeDelete}
                    onError={handleError}
                    errorMessage={errorMessage}
                    mode={currentMode}
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

            {/* Mode Controls Panel - Fixed width */}
            <div className="w-64 flex-shrink-0">
              <div className="graph-editor-panel p-3">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Controls
                </h2>
                <ModeControls
                  currentMode={currentMode}
                  onModeChange={handleModeChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
