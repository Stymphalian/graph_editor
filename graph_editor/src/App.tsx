import { useState, useMemo } from 'react';
import GraphViewer from './components/GraphViewer';
import { Graph } from './models/Graph';
import { Node, Edge } from './types/graph';

function App() {
  // Create a sample graph using the Graph model
  const graph = useMemo(() => {
    const g = new Graph({ type: 'directed' });

    // Add sample nodes and store their IDs
    const nodeA = g.addNode({ label: 'A', x: 100, y: 100 });
    const nodeB = g.addNode({ label: 'B', x: 300, y: 100 });
    const nodeC = g.addNode({ label: 'C', x: 300, y: 300 });
    const nodeD = g.addNode({ label: 'D', x: 100, y: 300 });

    // Add sample edges using the actual node labels
    if (nodeA && nodeB) g.addEdge({ source: nodeA.label, target: nodeB.label });
    if (nodeB && nodeC) g.addEdge({ source: nodeB.label, target: nodeC.label });
    if (nodeC && nodeD) g.addEdge({ source: nodeC.label, target: nodeD.label });
    if (nodeD && nodeA) g.addEdge({ source: nodeD.label, target: nodeA.label });

    return g;
  }, []);

  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(
    null
  );
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const handleNodeClick = (node: Node) => {
    console.log('Node clicked:', node);
    setSelectedNodeLabel(node.label);
    setSelectedEdgeId(null);
  };

  const handleEdgeClick = (edge: Edge) => {
    console.log('Edge clicked:', edge);
    setSelectedEdgeId(edge.id);
    setSelectedNodeLabel(null);
  };

  const handleNodeCreate = (x: number, y: number) => {
    console.log('Creating node at:', x, y);
    // This will be implemented in the next tasks
  };

  return (
    <div className="graph-editor-layout">
      <header className="graph-editor-header">
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', padding: '1rem 0' }}>
            Graph Editor
          </h1>
        </div>
      </header>

      <main className="graph-editor-main">
        <div className="graph-editor-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
            D3.js Graph Visualization Test
          </h2>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'white' }}>
            <GraphViewer
              data={graph.getData()}
              width={800}
              height={600}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onNodeCreate={handleNodeCreate}
              selectedNodeLabel={selectedNodeLabel}
              selectedEdgeId={selectedEdgeId}
              mode="edit"
            />
          </div>
          <p className="graph-editor-help-text" style={{ marginTop: '1rem' }}>
            Click and drag nodes to move them. The force simulation will
            automatically adjust the layout.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
