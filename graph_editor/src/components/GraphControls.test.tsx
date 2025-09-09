import { render, screen, fireEvent } from '@testing-library/react';
import GraphControls from './GraphControls';
import { GraphType } from '../types/graph';

describe('GraphControls', () => {
  const mockOnGraphTypeChange = () => {};

  it('renders both graph type options', () => {
    render(
      <GraphControls
        graphType="directed"
        onGraphTypeChange={mockOnGraphTypeChange}
      />
    );

    expect(screen.getByText('Directed')).toBeInTheDocument();
    expect(screen.getByText('Undirected')).toBeInTheDocument();
  });

  it('shows the correct active state for directed graph', () => {
    render(
      <GraphControls
        graphType="directed"
        onGraphTypeChange={mockOnGraphTypeChange}
      />
    );

    const directedButton = screen.getByRole('button', { name: /Switch to Directed graph/i });
    const undirectedButton = screen.getByRole('button', { name: /Switch to Undirected graph/i });

    expect(directedButton).toHaveClass('bg-blue-600', 'text-white');
    expect(undirectedButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('shows the correct active state for undirected graph', () => {
    render(
      <GraphControls
        graphType="undirected"
        onGraphTypeChange={mockOnGraphTypeChange}
      />
    );

    const directedButton = screen.getByRole('button', { name: /Switch to Directed graph/i });
    const undirectedButton = screen.getByRole('button', { name: /Switch to Undirected graph/i });

    expect(undirectedButton).toHaveClass('bg-blue-600', 'text-white');
    expect(directedButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('calls onGraphTypeChange when directed button is clicked', () => {
    let calledWith: GraphType | null = null;
    const testOnGraphTypeChange = (type: GraphType) => {
      calledWith = type;
    };

    render(
      <GraphControls
        graphType="undirected"
        onGraphTypeChange={testOnGraphTypeChange}
      />
    );

    const directedButton = screen.getByText('Directed').closest('button');
    fireEvent.click(directedButton!);

    expect(calledWith).toBe('directed');
  });

  it('calls onGraphTypeChange when undirected button is clicked', () => {
    let calledWith: GraphType | null = null;
    const testOnGraphTypeChange = (type: GraphType) => {
      calledWith = type;
    };

    render(
      <GraphControls
        graphType="directed"
        onGraphTypeChange={testOnGraphTypeChange}
      />
    );

    const undirectedButton = screen.getByText('Undirected').closest('button');
    fireEvent.click(undirectedButton!);

    expect(calledWith).toBe('undirected');
  });

  it('displays correct descriptions for each graph type', () => {
    render(
      <GraphControls
        graphType="directed"
        onGraphTypeChange={mockOnGraphTypeChange}
      />
    );

    expect(screen.getByText('Edges have direction (A → B)')).toBeInTheDocument();
    expect(screen.getByText('Edges are bidirectional (A ↔ B)')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <GraphControls
        graphType="directed"
        onGraphTypeChange={mockOnGraphTypeChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <GraphControls
        graphType="directed"
        onGraphTypeChange={mockOnGraphTypeChange}
      />
    );

    const directedButton = screen.getByRole('button', { name: /Switch to Directed graph/i });
    const undirectedButton = screen.getByRole('button', { name: /Switch to Undirected graph/i });

    expect(directedButton).toHaveAttribute('aria-pressed', 'true');
    expect(undirectedButton).toHaveAttribute('aria-pressed', 'false');
    expect(directedButton).toHaveAttribute('title', 'Edges have direction (A → B)');
    expect(undirectedButton).toHaveAttribute('title', 'Edges are bidirectional (A ↔ B)');
  });
});
