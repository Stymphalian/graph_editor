import { useState, useMemo } from 'react';
import GraphViewer from './components/GraphViewer';
import TextPanel from './components/TextPanel';
import { Graph } from './models/Graph';
import { Node, Edge } from './types/graph';

function App() {
  // Create a sample graph using the Graph model
  const graph = useMemo(() => {
    const g = new Graph({ type: 'directed' });

    // Add sample nodes and store their IDs
    const nodeA = g.addNode({ label: 'A' });
    const nodeB = g.addNode({ label: 'B' });
    const nodeC = g.addNode({ label: 'C' });
    const nodeD = g.addNode({ label: 'D' });

    // Add sample edges using the actual node labels
    if (nodeA && nodeB) g.addEdge({ source: nodeA.label, target: nodeB.label });
    if (nodeB && nodeC) g.addEdge({ source: nodeB.label, target: nodeC.label });
    if (nodeC && nodeD) g.addEdge({ source: nodeC.label, target: nodeD.label });
    // if (nodeD && nodeA) g.addEdge({ source: nodeD.label, target: nodeA.label });

    return g;
  }, []);

  const [selectedNodeLabel] = useState<string | null>(null);
  const [selectedEdgeId] = useState<string | null>(null);
  const [currentGraph] = useState<Graph>(graph);

  const handleNodeClick = (node: Node) => {
    console.log('Node clicked', node);
    // setSelectedNodeLabel(node.label);
    // setSelectedEdgeId(null);
  };

  const handleEdgeClick = (edge: Edge) => {
    console.log('Edge clicked:', edge);
    // setSelectedEdgeId(edge.id);
    // setSelectedNodeLabel(null);
  };

  const handleNodeCreate = (x: number, y: number) => {
    console.log('Creating node at:', x, y);
    // graph.addNodeWithAutoLabel(x, y);
    // This will be implemented in the next tasks
  };

  const handleEdgeCreate = (sourceLabel: string, targetLabel: string) => {
    console.log('Creating edge:', sourceLabel, '->', targetLabel);
    // graph.addEdge({ source: sourceLabel, target: targetLabel });
    // This will be implemented in the next tasks
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
                data={currentGraph.getData()}
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
                    data={currentGraph.getData()}
                    width={800}
                    height={600}
                    onNodeClick={handleNodeClick}
                    onEdgeClick={handleEdgeClick}
                    onNodeCreate={handleNodeCreate}
                    onEdgeCreate={handleEdgeCreate}
                    selectedNodeLabel={selectedNodeLabel}
                    selectedEdgeId={selectedEdgeId}
                    mode="edit"
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
