import { useState, useMemo } from 'react';
import GraphViewer from './components/GraphViewer';
import TextPanel from './components/TextPanel';
import ModeControls from './components/ModeControls';
import GraphControls from './components/GraphControls';
import NodeIndexingControls from './components/NodeIndexingControls';
import { Graph } from './models/Graph';
import { GraphData, GraphType, NodeIndexingMode, GraphOperation } from './types/graph';
import { Mode } from './components/ModeControls';

function App() {
  // Create a sample graph using the Graph model
  const graph = useMemo(() => {
    const g = new Graph({ type: 'directed', nodeIndexingMode: "custom" });

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
  const [lastOperation, setLastOperation] = useState<GraphOperation | undefined>(undefined);

  const handleNodeCreate = (x: number, y: number) => {
    console.log('Creating node at:', x, y);
    
    // Store the click coordinates for the new node
    setNewNodePosition({ x, y });
    
    // Create a new node with auto-generated label
    const newNode = currentGraph.addNodeWithAutoLabel();
    
    if (newNode) {
      console.log('Node created:', newNode);
      // Set the operation for partial text updates
      setLastOperation({
        type: 'NODE_ADD',
        nodeId: newNode.id
      });
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
      // Set the operation for partial text updates
      setLastOperation({
        type: 'EDGE_ADD',
        edgeId: newEdge.id
      });
      // Update the graph data state to trigger re-render without recreating the graph
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to create edge:', currentGraph.getError());
    }
  };

  const handleNodeLabelEdit = (nodeId: number, newLabel: string) => {
    console.log('Editing node label:', nodeId, '->', newLabel);
    
    // Get the current node to find the old label
    const currentNode = currentGraph.getNodes().find(node => node.id === nodeId);
    const oldLabel = currentNode?.label;
    
    // Update the node label using the Graph model
    const updatedNode = currentGraph.updateNode(nodeId, { label: newLabel });
    
    if (updatedNode) {
      console.log('Node label updated:', updatedNode);
      // Set the operation for partial text updates
      setLastOperation({
        type: 'NODE_LABEL_CHANGE',
        nodeId: nodeId,
        previousValue: oldLabel,
        newValue: newLabel
      });
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
    
    // Get the current node to find the label before deletion
    const currentNode = currentGraph.getNodes().find(node => node.id === nodeId);
    const nodeLabel = currentNode?.label;
    
    // Remove the node using the Graph model
    const success = currentGraph.removeNode(nodeId);
    
    if (success) {
      console.log('Node deleted successfully');
      // Set the operation for partial text updates
      setLastOperation({
        type: 'NODE_REMOVE',
        nodeId: nodeId,
        previousValue: nodeLabel
      });
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
    
    // Get the current edge to find the source and target labels before deletion
    const currentEdge = currentGraph.getEdges().find(edge => edge.id === edgeId);
    let edgeData = null;
    if (currentEdge) {
      const sourceNode = currentGraph.getNodes().find(node => node.id === currentEdge.source);
      const targetNode = currentGraph.getNodes().find(node => node.id === currentEdge.target);
      if (sourceNode && targetNode) {
        edgeData = {
          sourceLabel: sourceNode.label,
          targetLabel: targetNode.label,
          weight: currentEdge.weight
        };
      }
    }
    
    // Remove the edge using the Graph model
    const success = currentGraph.removeEdge(edgeId);
    
    console.log('removeEdge result:', success);
    
    if (success) {
      console.log('Edge deleted successfully');
      // Set the operation for partial text updates
      setLastOperation({
        type: 'EDGE_REMOVE',
        edgeId: edgeId,
        data: edgeData
      });
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
    
    // Get the current edge to find the old weight and node labels
    const currentEdge = currentGraph.getEdges().find(edge => edge.id === edgeId);
    const oldWeight = currentEdge?.weight;
    let edgeData = null;
    if (currentEdge) {
      const sourceNode = currentGraph.getNodes().find(node => node.id === currentEdge.source);
      const targetNode = currentGraph.getNodes().find(node => node.id === currentEdge.target);
      if (sourceNode && targetNode) {
        edgeData = {
          sourceLabel: sourceNode.label,
          targetLabel: targetNode.label
        };
      }
    }
    
    // Update the edge weight using the Graph model
    const success = currentGraph.updateEdgeWeight(edgeId, newWeight);
    
    if (success) {
      console.log('Edge weight updated successfully');
      // Set the operation for partial text updates
      setLastOperation({
        type: 'EDGE_WEIGHT_CHANGE',
        edgeId: edgeId,
        previousValue: oldWeight,
        newValue: newWeight,
        data: edgeData
      });
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
    
    // Clear any ongoing operations when switching modes
    setErrorMessage(null);
    
    setCurrentMode(mode);
  };

  const handleModeTransitionCleanup = () => {
    console.log('Performing mode transition cleanup');
    // Clear any ongoing operations when switching modes
    setErrorMessage(null);
    // Additional cleanup can be added here as needed
  };

  const handleGraphTypeChange = (type: GraphType) => {
    console.log('Graph type changed to:', type);
    
    // Update the graph type using the Graph model
    currentGraph.setType(type);
    
    // Set the operation for partial text updates (do nothing for graph type changes)
    setLastOperation({
      type: 'GRAPH_TYPE_CHANGE'
    });
    
    // Update the graph data state to trigger re-render
    setGraphData(currentGraph.getData());
  };

  const handleNodeIndexingModeChange = (mode: NodeIndexingMode) => {
    console.log('Node indexing mode changed to:', mode);
    
    // Update the node indexing mode using the Graph model
    currentGraph.setNodeIndexingMode(mode);
    
    // Set the operation for partial text updates (regenerate entire text)
    setLastOperation({
      type: 'INDEXING_MODE_CHANGE'
    });
    
    // Update the graph data state to trigger re-render
    setGraphData(currentGraph.getData());
  };

  const handleGraphDataChange = (newData: GraphData) => {
    console.log('Graph data changed from text panel:', newData);
    
    try {
      // Update the current graph with the new data
      // First, clear the existing graph
      currentGraph.reset();
      
      // Set the graph type and indexing mode
      currentGraph.setType(newData.type);
      currentGraph.setNodeIndexingMode(newData.nodeIndexingMode);
      
      // Add all nodes from the new data
      for (const node of newData.nodes) {
        const addedNode = currentGraph.addNode({ 
          label: node.label, 
          id: node.id 
        });
        if (!addedNode) {
          console.error('Failed to add node:', currentGraph.getError());
          return;
        }
      }
      
      // Add all edges from the new data
      for (const edge of newData.edges) {
        const addedEdge = currentGraph.addEdge({
          source: edge.source,
          target: edge.target,
          ...(edge.weight && { weight: edge.weight })
        });
        if (!addedEdge) {
          console.error('Failed to add edge:', currentGraph.getError());
          return;
        }
      }
      
      // Update the graph data state to trigger re-render
      setGraphData(currentGraph.getData());
      console.log('Graph successfully updated from text panel');
      
    } catch (error) {
      console.error('Error updating graph from text panel:', error);
      handleError('Failed to update graph from text input');
    }
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
                lastOperation={lastOperation}
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
                    onModeTransitionCleanup={handleModeTransitionCleanup}
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
                <div className="space-y-6">
                  <ModeControls
                    currentMode={currentMode}
                    onModeChange={handleModeChange}
                    className="w-full"
                  />
                  <GraphControls
                    graphType={graphData.type}
                    onGraphTypeChange={handleGraphTypeChange}
                    className="w-full"
                  />
                  <NodeIndexingControls
                    nodeIndexingMode={graphData.nodeIndexingMode}
                    onNodeIndexingModeChange={handleNodeIndexingModeChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
