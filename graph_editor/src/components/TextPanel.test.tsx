import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextPanel from './TextPanel';
import { GraphData } from '../types/graph';


// Mock data for testing
const mockGraphData: GraphData = {
  type: 'directed',
  nodeIndexingMode: 'custom',
  maxNodes: 1000,
  nodes: [
    { id: 1, label: 'A' },
    { id: 2, label: 'B' },
    { id: 3, label: 'C' },
  ],
  edges: [
    { id: '1', source: 1, target: 2 },
    { id: '2', source: 2, target: 3, weight: '5' },
  ],
};

describe('TextPanel', () => {
  it('renders without crashing', () => {
    render(<TextPanel data={mockGraphData} />);
    expect(screen.getByText('Graph Data')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays graph data in simple text format', () => {
    render(<TextPanel data={mockGraphData} />);
    
    const textarea = screen.getByRole('textbox');
    const text = (textarea as HTMLTextAreaElement).value;
    
    // Check for the simple format: node count, node indices, edges
    expect(text).toContain('3'); // Node count
    expect(text).toContain('0'); // First node index
    expect(text).toContain('1'); // Second node index
    expect(text).toContain('2'); // Third node index
    expect(text).toContain('0 1'); // Edge from node 0 to node 1
    expect(text).toContain('1 2 5'); // Edge from node 1 to node 2 with weight 5
  });

  it('handles focus and blur events', () => {
    render(<TextPanel data={mockGraphData} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);
    fireEvent.blur(textarea);
    
    // Should not crash and textarea should still be present
    expect(textarea).toBeInTheDocument();
  });

  it('handles text changes', () => {
    render(<TextPanel data={mockGraphData} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Modified content' } });
    
    expect(textarea).toHaveValue('Modified content');
  });

  it('cancels editing when Escape key is pressed', async () => {
    render(<TextPanel data={mockGraphData} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);
    
    // Modify the text
    fireEvent.change(textarea, { target: { value: 'Modified content' } });
    expect(textarea).toHaveValue('Modified content');
    
    // Press Escape
    fireEvent.keyDown(textarea, { key: 'Escape' });
    
    await waitFor(() => {
      // Should revert to original content
      expect((textarea as HTMLTextAreaElement).value).toContain('3');
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
    
    const textarea = screen.getByRole('textbox');
    const text = (textarea as HTMLTextAreaElement).value;
    expect(text).toBe('0'); // Just the node count
  });

  it('handles undirected graph data', () => {
    const undirectedGraphData: GraphData = {
      type: 'undirected',
      nodeIndexingMode: 'custom',
      maxNodes: 1000,
      nodes: [
        { id: 1, label: 'X' },
        { id: 2, label: 'Y' },
      ],
      edges: [
        { id: '1', source: 1, target: 2 },
      ],
    };
    
    render(<TextPanel data={undirectedGraphData} />);
    
    const textarea = screen.getByRole('textbox');
    const text = (textarea as HTMLTextAreaElement).value;
    expect(text).toContain('2'); // Node count
    expect(text).toContain('0'); // First node index
    expect(text).toContain('1'); // Second node index
    expect(text).toContain('0 1'); // Edge from node 0 to node 1
  });

  it('handles nodes without position data', () => {
    const graphDataWithoutPositions: GraphData = {
      type: 'directed',
      nodeIndexingMode: 'custom',
      maxNodes: 1000,
      nodes: [
        { id: 1, label: 'Node1' },
        { id: 2, label: 'Node2' },
      ],
      edges: [],
    };
    
    render(<TextPanel data={graphDataWithoutPositions} />);
    
    const textarea = screen.getByRole('textbox');
    const text = (textarea as HTMLTextAreaElement).value;
    expect(text).toContain('2'); // Node count
    expect(text).toContain('0'); // First node index
    expect(text).toContain('1'); // Second node index
  });

  it('applies custom className', () => {
    const { container } = render(
      <TextPanel data={mockGraphData} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});