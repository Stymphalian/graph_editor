import { render, mockGraphData } from '../test-utils';
import GraphViewer from './GraphViewer';

describe('GraphViewer', () => {
  it('renders without crashing', () => {
    render(<GraphViewer data={mockGraphData} onEdgeCreate={() => {}} />);

    // Check that the SVG container is rendered
    const svgElement = document.querySelector('.graph-svg');
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass('graph-svg');
  });

  it('renders the correct number of nodes', () => {
    render(<GraphViewer data={mockGraphData} onEdgeCreate={() => {}} />);

    // Check that all nodes are rendered
    const nodeGroups = document.querySelectorAll('.node');
    expect(nodeGroups).toHaveLength(mockGraphData.nodes.length);
  });

  it('renders node labels with correct labels', () => {
    render(<GraphViewer data={mockGraphData} onEdgeCreate={() => {}} />);

    // Check that each node has a label with the correct label
    const nodeLabels = document.querySelectorAll('.graph-node-label');
    expect(nodeLabels).toHaveLength(mockGraphData.nodes.length);

    // Check that the text content matches expected node labels
    const labelTexts = Array.from(nodeLabels).map(label => label.textContent);
    mockGraphData.nodes.forEach(node => {
      expect(labelTexts).toContain(node.label);
    });
  });

  it('renders the correct number of edges', () => {
    render(<GraphViewer data={mockGraphData} onEdgeCreate={() => {}} />);

    // Check that all edges are rendered
    const edgeLines = document.querySelectorAll('.graph-edge');
    expect(edgeLines).toHaveLength(mockGraphData.edges.length);
  });

  it('renders edges with correct structure', () => {
    render(<GraphViewer data={mockGraphData} onEdgeCreate={() => {}} />);

    // Check that edges are SVG line elements
    const edgeLines = document.querySelectorAll('.graph-edge');
    edgeLines.forEach(edge => {
      expect(edge.tagName).toBe('line');
      expect(edge).toHaveClass('graph-edge');
    });
  });

  describe('Mode-specific behaviors', () => {
    it('shows mode indicator for edit mode', () => {
      render(<GraphViewer data={mockGraphData} mode="edit" onEdgeCreate={() => {}} />);
      
      const modeIndicator = document.querySelector('.absolute.top-2.left-2 div');
      expect(modeIndicator).toBeInTheDocument();
      expect(modeIndicator).toHaveTextContent('Edit Mode');
      expect(modeIndicator).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('shows mode indicator for delete mode', () => {
      render(<GraphViewer data={mockGraphData} mode="delete" onEdgeCreate={() => {}} />);
      
      const modeIndicator = document.querySelector('.absolute.top-2.left-2 div');
      expect(modeIndicator).toBeInTheDocument();
      expect(modeIndicator).toHaveTextContent('Delete Mode');
      expect(modeIndicator).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('shows mode indicator for view-force mode', () => {
      render(<GraphViewer data={mockGraphData} mode="view-force" onEdgeCreate={() => {}} />);
      
      const modeIndicator = document.querySelector('.absolute.top-2.left-2 div');
      expect(modeIndicator).toBeInTheDocument();
      expect(modeIndicator).toHaveTextContent('View/Force Mode');
      expect(modeIndicator).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('applies correct cursor class based on mode', () => {
      const { rerender } = render(<GraphViewer data={mockGraphData} mode="edit" onEdgeCreate={() => {}} />);
      
      let svgElement = document.querySelector('.graph-svg');
      expect(svgElement).toHaveClass('cursor-crosshair');
      
      rerender(<GraphViewer data={mockGraphData} mode="delete" onEdgeCreate={() => {}} />);
      svgElement = document.querySelector('.graph-svg');
      expect(svgElement).toHaveClass('cursor-not-allowed');
      
      rerender(<GraphViewer data={mockGraphData} mode="view-force" onEdgeCreate={() => {}} />);
      svgElement = document.querySelector('.graph-svg');
      expect(svgElement).toHaveClass('cursor-grab');
    });

    it('calls mode transition cleanup callback when mode changes', () => {
      let cleanupCalled = false;
      const mockCleanup = () => {
        cleanupCalled = true;
      };
      
      const { rerender } = render(
        <GraphViewer 
          data={mockGraphData} 
          mode="edit" 
          onEdgeCreate={() => {}} 
          onModeTransitionCleanup={mockCleanup}
        />
      );
      
      // Change mode to trigger cleanup
      rerender(
        <GraphViewer 
          data={mockGraphData} 
          mode="delete" 
          onEdgeCreate={() => {}} 
          onModeTransitionCleanup={mockCleanup}
        />
      );
      
      expect(cleanupCalled).toBe(true);
    });
  });

});
