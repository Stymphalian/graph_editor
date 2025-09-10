import { useState, useMemo } from 'react';
import GraphViewer from './components/GraphViewer';
import TextPanel from './components/TextPanel';
import ModeControls from './components/ModeControls';
import GraphControls from './components/GraphControls';
import NodeIndexingControls from './components/NodeIndexingControls';
import VisualizationSettings from './components/VisualizationSettings';
import { Graph } from './models/Graph';
import {
  GraphData,
  GraphType,
  NodeIndexingMode,
  GraphOperation,
} from './types/graph';
import { Mode } from './components/ModeControls';
import { applyGraphChanges, GraphDiffResult } from './models/GraphUtils';

function App() {
  // Create a sample graph using the Graph model
  const graph = useMemo(() => {
    const g = new Graph({ type: 'directed', nodeIndexingMode: 'custom' });

    Graph.parseFromText(`
      2
      0
      5
      3
      4
      1
      0 2 10
      0 4 30
      0 5
      1 4
      1 5
      2 3
      2 4
      4 5
    `, g)

    // // Add sample nodes and store their IDs
    // const nodeA = g.addNode({ label: 'A' });
    // const nodeB = g.addNode({ label: 'B' });
    // const nodeC = g.addNode({ label: 'C' });
    // const nodeD = g.addNode({ label: 'D' });
    // const nodeD = g.addNode({ label: 'E' });
    // const nodeD = g.addNode({ label: 'F' });
    // const nodeD = g.addNode({ label: 'G' });

    // // Add sample edges using the actual node IDs
    // if (nodeA && nodeB)
    //   g.addEdge({ source: nodeA.label, target: nodeB.label, weight: '123' });
    // if (nodeB && nodeC) g.addEdge({ source: nodeB.label, target: nodeC.label });
    // if (nodeC && nodeD) g.addEdge({ source: nodeC.label, target: nodeD.label });
    // // if (nodeD && nodeA) g.addEdge({ source: nodeD.id, target: nodeA.id });

    return g;
  }, []);

  const [currentGraph] = useState<Graph>(graph);
  const [graphData, setGraphData] = useState<GraphData>(graph.getData());
  const [newNodePosition, setNewNodePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<Mode>('view-force');
  const [lastOperation, setLastOperation] = useState<
    GraphOperation | undefined
  >(undefined);
  const [nodeRadius, setNodeRadius] = useState<number>(20);
  const [edgeStrokeWidth, setEdgeStrokeWidth] = useState<number>(2);

  const handleNodeCreate = (x: number, y: number) => {
    console.log('Creating node at:', x, y);

    // Store the click coordinates for the new node
    setNewNodePosition({ x, y });

    // Create a new node with auto-generated label and coordinates
    const newNode = currentGraph.addNodeWithAutoLabel(x, y);

    if (newNode) {
      console.log('Node created:', newNode);
      // Set the operation for partial text updates
      setLastOperation({
        type: 'NODE_ADD',
        nodeLabel: newNode.label,
      });
      // Update the graph data state to trigger re-render without recreating the graph
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to create node:', currentGraph.getError());
      // Show error to user via the error callback
      const errorMessage = currentGraph.getError() || 'Failed to create node';
      handleError(errorMessage);
    }
  };

  const handleEdgeCreate = (sourceLabel: string, targetLabel: string) => {
    console.log('Creating edge:', sourceLabel, '->', targetLabel);

    // Create a new edge between the source and target nodes using their labels
    const newEdge = currentGraph.addEdge({
      source: sourceLabel,
      target: targetLabel,
    });

    if (newEdge) {
      console.log('Edge created:', newEdge);
      // Set the operation for partial text updates
      setLastOperation({
        type: 'EDGE_ADD',
        edgeTuple: [sourceLabel, targetLabel],
      });
      // Update the graph data state to trigger re-render without recreating the graph
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to create edge:', currentGraph.getError());
    }
  };

  const handleNodeLabelEdit = (nodeLabel: string, newLabel: string) => {
    console.log('Editing node label:', nodeLabel, '->', newLabel);

    // Get the current node to find the old label
    const currentNode = currentGraph
      .getNodes()
      .find(node => node.label === nodeLabel);
    const oldLabel = currentNode?.label;

    // Update the node label using the Graph model
    const updatedNode = currentGraph.updateNode(nodeLabel, { label: newLabel });

    if (updatedNode) {
      console.log('Node label updated:', updatedNode);
      // Set the operation for partial text updates
      setLastOperation({
        type: 'NODE_LABEL_CHANGE',
        nodeLabel: nodeLabel,
        previousValue: oldLabel,
        newValue: newLabel,
      });
      // Update the graph data state to trigger re-render
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to update node label:', currentGraph.getError());
      // Show error to user via the error callback
      const errorMessage =
        currentGraph.getError() || 'Failed to update node label';
      handleError(errorMessage);
    }
  };

  const handleNodeDelete = (nodeLabel: string) => {
    console.log('Deleting node:', nodeLabel);

    // Get the current node to find the label before deletion
    const currentNode = currentGraph
      .getNodes()
      .find(node => node.label === nodeLabel);
    const nodeLabelToDelete = currentNode?.label;

    // Remove the node using the Graph model
    const success = currentGraph.removeNode(nodeLabel);

    if (success) {
      console.log('Node deleted successfully');
      // Set the operation for partial text updates
      setLastOperation({
        type: 'NODE_REMOVE',
        nodeLabel: nodeLabel,
        previousValue: nodeLabelToDelete,
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

  const handleEdgeDelete = (sourceLabel: string, targetLabel: string) => {
    console.log(
      'handleEdgeDelete called with sourceLabel:',
      sourceLabel,
      'targetLabel:',
      targetLabel
    );
    // console.log('Current graph data before deletion:', currentGraph.getData());

    // Get the current edge to find the weight before deletion
    const currentEdge = currentGraph
      .getEdges()
      .find(edge => edge.source === sourceLabel && edge.target === targetLabel);
    let edgeData = null;
    if (currentEdge) {
      edgeData = {
        sourceLabel: currentEdge.source,
        targetLabel: currentEdge.target,
        weight: currentEdge.weight,
      };
    }

    // Remove the edge using the Graph model
    const success = currentGraph.removeEdgeByNodes(sourceLabel, targetLabel);

    console.log('removeEdgeByNodes result:', success);

    if (success) {
      console.log('Edge deleted successfully');
      // Set the operation for partial text updates
      setLastOperation({
        type: 'EDGE_REMOVE',
        edgeTuple: [sourceLabel, targetLabel],
        data: edgeData,
      });
      const newData = currentGraph.getData();
      // console.log('New graph data after deletion:', newData);
      // Update the graph data state to trigger re-render
      setGraphData(newData);
    } else {
      console.error('Failed to delete edge:', currentGraph.getError());
      // Show error to user via the error callback
      const errorMessage = currentGraph.getError() || 'Failed to delete edge';
      handleError(errorMessage);
    }
  };

  const handleEdgeWeightEdit = (
    sourceLabel: string,
    targetLabel: string,
    newWeight: string
  ) => {
    // Get the current edge to find the old weight
    const currentEdge = currentGraph
      .getEdges()
      .find(edge => edge.source === sourceLabel && edge.target === targetLabel);
    const oldWeight = currentEdge?.weight;
    let edgeData = null;
    if (currentEdge) {
      edgeData = {
        sourceLabel: currentEdge.source,
        targetLabel: currentEdge.target,
      };
    }

    // Update the edge weight using the Graph model
    const success = currentGraph.updateEdgeWeightByNodes(
      sourceLabel,
      targetLabel,
      newWeight
    );

    if (success) {
      // Set the operation for partial text updates
      const operation = {
        type: 'EDGE_WEIGHT_CHANGE' as const,
        edgeTuple: [sourceLabel, targetLabel] as [string, string],
        previousValue: oldWeight,
        newValue: newWeight,
        data: edgeData,
      };
      setLastOperation(operation);
      // Update the graph data state to trigger re-render
      setGraphData(currentGraph.getData());
    } else {
      // Show error to user via the error callback
      const errorMessage =
        currentGraph.getError() || 'Failed to update edge weight';
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
    // console.log('Current graph data when mode changes:', graphData);

    // Clear any ongoing operations when switching modes
    setErrorMessage(null);

    setCurrentMode(mode);
  };

  const handleModeTransitionCleanup = () => {
    // Clear any ongoing operations when switching modes
    setErrorMessage(null);
    // Additional cleanup can be added here as needed
  };

  const handleNodePositionUpdate = (
    positions: Array<{ label: string; x: number; y: number }>
  ) => {
    // Update node positions in the Graph model
    currentGraph.updateNodePositions(positions);
    // setGraphData(currentGraph.getData());
  };

  const handleNodeAnchorToggle = (nodeLabel: string) => {
    console.log('Toggling anchor state for node:', nodeLabel);
    
    const newAnchoredState = currentGraph.toggleNodeAnchored(nodeLabel);
    
    if (newAnchoredState !== null) {
      // Update the graph data state to trigger re-render
      setGraphData(currentGraph.getData());
    } else {
      console.error('Failed to toggle anchor state:', currentGraph.getError());
      const errorMessage = currentGraph.getError() || 'Failed to toggle anchor state';
      handleError(errorMessage);
    }
  };

  const handleGraphTypeChange = (type: GraphType) => {
    console.log('Graph type changed to:', type);

    // Update the graph type using the Graph model
    currentGraph.setType(type);

    // Set the operation for partial text updates (do nothing for graph type changes)
    setLastOperation({
      type: 'GRAPH_TYPE_CHANGE',
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
      type: 'INDEXING_MODE_CHANGE',
    });

    // Update the graph data state to trigger re-render
    setGraphData(currentGraph.getData());
  };

  const handleGraphDataChange = (newData: GraphDiffResult) => {
    console.log('Graph data changed from text panel:', newData);

    try {
      // Set the operation for bidirectional sync - this was a text-based change
      setLastOperation({
        type: 'TEXT_BASED_CHANGE',
      });

      applyGraphChanges(currentGraph, newData.changes);

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
            <div className="w-80 flex-shrink-0" style={{ maxHeight: 'calc(100vh - 120px)', overflow: 'hidden' }}>
              <TextPanel
                data={graphData}
                onDataChange={handleGraphDataChange}
                lastOperation={lastOperation}
                className="h-[calc(100vh-200px)] min-h-[400px]"
              />
            </div>

            {/* Graph Visualization Panel - Flexible width with minimum size constraint */}
            {/* Min width: 300px (D3 SVG) + 24px (p-3 padding) + 36px (buffer for header/help text) = 360px */}
            <div className="flex-1 min-w-[360px]">
              <div className="graph-editor-panel p-3">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Graph Visualization
                </h2>
                <div className="h-[calc(100vh-200px)] min-h-[400px]">
                  <GraphViewer
                    data={graphData}
                    onNodeCreate={handleNodeCreate}
                    onEdgeCreate={handleEdgeCreate}
                    onNodeLabelEdit={handleNodeLabelEdit}
                    onEdgeWeightEdit={handleEdgeWeightEdit}
                    onNodeDelete={handleNodeDelete}
                    onEdgeDelete={handleEdgeDelete}
                    onNodePositionUpdate={handleNodePositionUpdate}
                    onNodeAnchorToggle={handleNodeAnchorToggle}
                    onError={handleError}
                    errorMessage={errorMessage}
                    mode={currentMode}
                    newNodePosition={newNodePosition}
                    onNewNodePositioned={() => setNewNodePosition(null)}
                    onModeTransitionCleanup={handleModeTransitionCleanup}
                    nodeRadius={nodeRadius}
                    edgeStrokeWidth={edgeStrokeWidth}
                  />
                </div>
                <p className="graph-editor-help-text mt-4">
                  Click and drag nodes to move them. Right-click to anchor a node.
                  <br />
                  {currentMode == `view-force` && (
                    <span>
                      The force simulation will automatically adjust the layout.
                    </span>
                  )}
                  {currentMode == `edit` && (
                    <span>
                      Left-click empty space to create node. Select a node to start adding edges.
                      <br />
                      Double-click to edit a node's label or an edge's weight.
                    </span>
                  )}
                  {currentMode == `delete` && (
                    <span>
                      Select a node or edge to delete it.
                    </span>
                  )}
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
                  <VisualizationSettings
                    nodeRadius={nodeRadius}
                    edgeStrokeWidth={edgeStrokeWidth}
                    onNodeRadiusChange={setNodeRadius}
                    onEdgeStrokeWidthChange={setEdgeStrokeWidth}
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
