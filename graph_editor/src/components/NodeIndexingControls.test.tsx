import { render, screen, fireEvent } from '@testing-library/react';
import NodeIndexingControls from './NodeIndexingControls';
import { NodeIndexingMode } from '../types/graph';

describe('NodeIndexingControls', () => {
  const mockOnNodeIndexingModeChange = () => {};

  it('renders all node indexing mode options', () => {
    render(
      <NodeIndexingControls
        nodeIndexingMode="0-indexed"
        onNodeIndexingModeChange={mockOnNodeIndexingModeChange}
      />
    );

    expect(screen.getByText('0-Indexed')).toBeInTheDocument();
    expect(screen.getByText('1-Indexed')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('shows the correct active state for 0-indexed mode', () => {
    render(
      <NodeIndexingControls
        nodeIndexingMode="0-indexed"
        onNodeIndexingModeChange={mockOnNodeIndexingModeChange}
      />
    );

    const zeroIndexedButton = screen.getByRole('button', { name: /Switch to 0-Indexed indexing/i });
    const oneIndexedButton = screen.getByRole('button', { name: /Switch to 1-Indexed indexing/i });
    const customButton = screen.getByRole('button', { name: /Switch to Custom indexing/i });

    expect(zeroIndexedButton).toHaveClass('bg-blue-600', 'text-white');
    expect(oneIndexedButton).toHaveClass('bg-white', 'text-gray-700');
    expect(customButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('shows the correct active state for 1-indexed mode', () => {
    render(
      <NodeIndexingControls
        nodeIndexingMode="1-indexed"
        onNodeIndexingModeChange={mockOnNodeIndexingModeChange}
      />
    );

    const zeroIndexedButton = screen.getByRole('button', { name: /Switch to 0-Indexed indexing/i });
    const oneIndexedButton = screen.getByRole('button', { name: /Switch to 1-Indexed indexing/i });
    const customButton = screen.getByRole('button', { name: /Switch to Custom indexing/i });

    expect(oneIndexedButton).toHaveClass('bg-blue-600', 'text-white');
    expect(zeroIndexedButton).toHaveClass('bg-white', 'text-gray-700');
    expect(customButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('shows the correct active state for custom mode', () => {
    render(
      <NodeIndexingControls
        nodeIndexingMode="custom"
        onNodeIndexingModeChange={mockOnNodeIndexingModeChange}
      />
    );

    const zeroIndexedButton = screen.getByRole('button', { name: /Switch to 0-Indexed indexing/i });
    const oneIndexedButton = screen.getByRole('button', { name: /Switch to 1-Indexed indexing/i });
    const customButton = screen.getByRole('button', { name: /Switch to Custom indexing/i });

    expect(customButton).toHaveClass('bg-blue-600', 'text-white');
    expect(zeroIndexedButton).toHaveClass('bg-white', 'text-gray-700');
    expect(oneIndexedButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('calls onNodeIndexingModeChange when 0-indexed button is clicked', () => {
    let calledWith: NodeIndexingMode | null = null;
    const testOnNodeIndexingModeChange = (mode: NodeIndexingMode) => {
      calledWith = mode;
    };

    render(
      <NodeIndexingControls
        nodeIndexingMode="1-indexed"
        onNodeIndexingModeChange={testOnNodeIndexingModeChange}
      />
    );

    const zeroIndexedButton = screen.getByText('0-Indexed').closest('button');
    fireEvent.click(zeroIndexedButton!);

    expect(calledWith).toBe('0-indexed');
  });

  it('calls onNodeIndexingModeChange when 1-indexed button is clicked', () => {
    let calledWith: NodeIndexingMode | null = null;
    const testOnNodeIndexingModeChange = (mode: NodeIndexingMode) => {
      calledWith = mode;
    };

    render(
      <NodeIndexingControls
        nodeIndexingMode="0-indexed"
        onNodeIndexingModeChange={testOnNodeIndexingModeChange}
      />
    );

    const oneIndexedButton = screen.getByText('1-Indexed').closest('button');
    fireEvent.click(oneIndexedButton!);

    expect(calledWith).toBe('1-indexed');
  });

  it('calls onNodeIndexingModeChange when custom button is clicked', () => {
    let calledWith: NodeIndexingMode | null = null;
    const testOnNodeIndexingModeChange = (mode: NodeIndexingMode) => {
      calledWith = mode;
    };

    render(
      <NodeIndexingControls
        nodeIndexingMode="0-indexed"
        onNodeIndexingModeChange={testOnNodeIndexingModeChange}
      />
    );

    const customButton = screen.getByText('Custom').closest('button');
    fireEvent.click(customButton!);

    expect(calledWith).toBe('custom');
  });

  it('displays correct descriptions for each indexing mode', () => {
    render(
      <NodeIndexingControls
        nodeIndexingMode="0-indexed"
        onNodeIndexingModeChange={mockOnNodeIndexingModeChange}
      />
    );

    expect(screen.getByText('Nodes labeled 0, 1, 2, 3...')).toBeInTheDocument();
    expect(screen.getByText('Nodes labeled 1, 2, 3, 4...')).toBeInTheDocument();
    expect(screen.getByText('Custom labels (A, B, C...)')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <NodeIndexingControls
        nodeIndexingMode="0-indexed"
        onNodeIndexingModeChange={mockOnNodeIndexingModeChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <NodeIndexingControls
        nodeIndexingMode="0-indexed"
        onNodeIndexingModeChange={mockOnNodeIndexingModeChange}
      />
    );

    const zeroIndexedButton = screen.getByRole('button', { name: /Switch to 0-Indexed indexing/i });
    const oneIndexedButton = screen.getByRole('button', { name: /Switch to 1-Indexed indexing/i });
    const customButton = screen.getByRole('button', { name: /Switch to Custom indexing/i });

    expect(zeroIndexedButton).toHaveAttribute('aria-pressed', 'true');
    expect(oneIndexedButton).toHaveAttribute('aria-pressed', 'false');
    expect(customButton).toHaveAttribute('aria-pressed', 'false');
    expect(zeroIndexedButton).toHaveAttribute('title', 'Nodes labeled 0, 1, 2, 3...');
    expect(oneIndexedButton).toHaveAttribute('title', 'Nodes labeled 1, 2, 3, 4...');
    expect(customButton).toHaveAttribute('title', 'Custom labels (A, B, C...)');
  });
});
