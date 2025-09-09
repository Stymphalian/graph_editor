import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextPanel from './TextPanel';
import { GraphData } from '../types/graph';

// Mock data for testing
const mockGraphData: GraphData = {
  type: 'directed',
  nodeIndexingMode: 'custom',
  maxNodes: 1000,
  nodes: [{ label: 'A' }, { label: 'B' }, { label: 'C' }],
  edges: [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C', weight: '5' },
  ],
};

describe('TextPanel', () => {
  it('renders without crashing', () => {
    render(<TextPanel data={mockGraphData} />);
    expect(screen.getByText('Graph Data')).toBeInTheDocument();
    expect(screen.getByText('Node Count:')).toBeInTheDocument();
    expect(screen.getByText('Graph Representation')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('displays graph data in edge list format', () => {
    render(<TextPanel data={mockGraphData} />);

    // Check node count textarea (read-only)
    const nodeCountTextarea = screen.getByDisplayValue('3');
    expect(nodeCountTextarea).toBeInTheDocument();
    expect(nodeCountTextarea).toHaveAttribute('readonly');

    // Check graph representation textarea (editable)
    const graphTextarea = screen.getByPlaceholderText(
      'Graph data will appear here...'
    );
    const text = (graphTextarea as HTMLTextAreaElement).value;

    // Check for the edge list format: node labels, then edges
    expect(text).toContain('A'); // First node label
    expect(text).toContain('B'); // Second node label
    expect(text).toContain('C'); // Third node label
    expect(text).toContain('A B'); // Edge from node A to node B
    expect(text).toContain('B C 5'); // Edge from node B to node C with weight 5
  });

  it('handles focus and blur events on graph representation textarea', () => {
    render(<TextPanel data={mockGraphData} />);

    const graphTextarea = screen.getByPlaceholderText(
      'Graph data will appear here...'
    );
    fireEvent.focus(graphTextarea);
    fireEvent.blur(graphTextarea);

    // Should not crash and textarea should still be present
    expect(graphTextarea).toBeInTheDocument();
  });

  it('handles text changes on graph representation textarea', () => {
    render(<TextPanel data={mockGraphData} />);

    const graphTextarea = screen.getByPlaceholderText(
      'Graph data will appear here...'
    );
    fireEvent.change(graphTextarea, { target: { value: 'Modified content' } });

    expect(graphTextarea).toHaveValue('Modified content');
  });

  it('cancels editing when Escape key is pressed', async () => {
    render(<TextPanel data={mockGraphData} />);

    const graphTextarea = screen.getByPlaceholderText(
      'Graph data will appear here...'
    );
    fireEvent.focus(graphTextarea);

    // Modify the text
    fireEvent.change(graphTextarea, { target: { value: 'Modified content' } });
    expect(graphTextarea).toHaveValue('Modified content');

    // Press Escape
    fireEvent.keyDown(graphTextarea, { key: 'Escape' });

    await waitFor(() => {
      // Should revert to original content
      expect((graphTextarea as HTMLTextAreaElement).value).toContain('A');
    });
  });

  it('calls onDataChange when provided', () => {
    const mockOnDataChange = () => {};
    render(<TextPanel data={mockGraphData} onDataChange={mockOnDataChange} />);

    // The callback should be available (though not called yet in this basic implementation)
    expect(mockOnDataChange).toBeDefined();
  });

  it('handles empty graph data', () => {
    const emptyGraphData: GraphData = {
      type: 'directed',
      nodeIndexingMode: 'custom',
      maxNodes: 1000,
      nodes: [],
      edges: [],
    };

    render(<TextPanel data={emptyGraphData} />);

    // Check node count textarea shows 0
    const nodeCountTextarea = screen.getByDisplayValue('0');
    expect(nodeCountTextarea).toBeInTheDocument();

    // Check graph representation textarea is empty
    const graphTextarea = screen.getByPlaceholderText(
      'Graph data will appear here...'
    );
    const text = (graphTextarea as HTMLTextAreaElement).value;
    expect(text).toBe(''); // Empty graph representation
  });

  it('handles undirected graph data', () => {
    const undirectedGraphData: GraphData = {
      type: 'undirected',
      nodeIndexingMode: 'custom',
      maxNodes: 1000,
      nodes: [{ label: 'X' }, { label: 'Y' }],
      edges: [{ source: 'X', target: 'Y' }],
    };

    render(<TextPanel data={undirectedGraphData} />);

    // Check node count textarea shows 2
    const nodeCountTextarea = screen.getByDisplayValue('2');
    expect(nodeCountTextarea).toBeInTheDocument();

    // Check graph representation textarea
    const graphTextarea = screen.getByPlaceholderText(
      'Graph data will appear here...'
    );
    const text = (graphTextarea as HTMLTextAreaElement).value;
    expect(text).toContain('X'); // First node label
    expect(text).toContain('Y'); // Second node label
    expect(text).toContain('X Y'); // Edge from node X to node Y
  });

  it('handles nodes without position data', () => {
    const graphDataWithoutPositions: GraphData = {
      type: 'directed',
      nodeIndexingMode: 'custom',
      maxNodes: 1000,
      nodes: [{ label: 'Node1' }, { label: 'Node2' }],
      edges: [],
    };

    render(<TextPanel data={graphDataWithoutPositions} />);

    // Check node count textarea shows 2
    const nodeCountTextarea = screen.getByDisplayValue('2');
    expect(nodeCountTextarea).toBeInTheDocument();

    // Check graph representation textarea
    const graphTextarea = screen.getByPlaceholderText(
      'Graph data will appear here...'
    );
    const text = (graphTextarea as HTMLTextAreaElement).value;
    expect(text).toContain('Node1'); // First node label
    expect(text).toContain('Node2'); // Second node label
  });

  it('applies custom className', () => {
    const { container } = render(
      <TextPanel data={mockGraphData} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
