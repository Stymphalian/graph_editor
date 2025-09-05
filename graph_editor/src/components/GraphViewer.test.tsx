import { render, mockGraphData } from '../test-utils';
import GraphViewer from './GraphViewer';

describe('GraphViewer', () => {
  it('renders without crashing', () => {
    render(<GraphViewer data={mockGraphData} />);

    // Check that the SVG container is rendered
    const svgElement = document.querySelector('.graph-svg');
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass('graph-svg');
  });

  it('renders the correct number of nodes', () => {
    render(<GraphViewer data={mockGraphData} />);
    
    // Check that all nodes are rendered
    const nodeGroups = document.querySelectorAll('.node');
    expect(nodeGroups).toHaveLength(mockGraphData.nodes.length);
  });

  it('renders node labels with correct IDs', () => {
    render(<GraphViewer data={mockGraphData} />);
    
    // Check that each node has a label with the correct ID
    const nodeLabels = document.querySelectorAll('.graph-node-label');
    expect(nodeLabels).toHaveLength(mockGraphData.nodes.length);
    
    // Check that the text content matches expected node IDs
    const labelTexts = Array.from(nodeLabels).map(label => label.textContent);
    mockGraphData.nodes.forEach((node) => {
      expect(labelTexts).toContain(node.id);
    });
  });

  it('renders the correct number of edges', () => {
    render(<GraphViewer data={mockGraphData} />);
    
    // Check that all edges are rendered
    const edgeLines = document.querySelectorAll('.graph-edge');
    expect(edgeLines).toHaveLength(mockGraphData.edges.length);
  });

  it('renders edges with correct structure', () => {
    render(<GraphViewer data={mockGraphData} />);
    
    // Check that edges are SVG line elements
    const edgeLines = document.querySelectorAll('.graph-edge');
    edgeLines.forEach(edge => {
      expect(edge.tagName).toBe('line');
      expect(edge).toHaveClass('graph-edge');
    });
  });
});
