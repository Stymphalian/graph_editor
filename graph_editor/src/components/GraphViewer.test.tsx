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

  it('handles node selection and deselection correctly', () => {
    const mockOnNodeClick = jest.fn();
    const { rerender } = render(
      <GraphViewer 
        data={mockGraphData} 
        onNodeClick={mockOnNodeClick}
        selectedNodeLabel={null}
        mode="edit"
      />
    );

    // Get the first node
    const firstNode = document.querySelector('[data-node-label="A"]');
    expect(firstNode).toBeInTheDocument();

    // Simulate clicking the first node
    firstNode?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    // Should call onNodeClick with the node
    expect(mockOnNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'A' })
    );

    // Clear the mock
    mockOnNodeClick.mockClear();

    // Now render with the node selected
    rerender(
      <GraphViewer 
        data={mockGraphData} 
        onNodeClick={mockOnNodeClick}
        selectedNodeLabel="A"
        mode="edit"
      />
    );

    // Click the same node again (should deselect)
    firstNode?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    // Should call onNodeClick again (for deselection)
    expect(mockOnNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'A' })
    );
  });
});
