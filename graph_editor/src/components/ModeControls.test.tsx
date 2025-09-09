import { render, screen, fireEvent } from '@testing-library/react';
import ModeControls, { Mode } from './ModeControls';

describe('ModeControls', () => {
  const mockOnModeChange = () => {};

  it('renders all mode buttons', () => {
    render(<ModeControls currentMode="edit" onModeChange={mockOnModeChange} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('View/Force')).toBeInTheDocument();
  });

  it('shows current mode as active', () => {
    render(
      <ModeControls currentMode="delete" onModeChange={mockOnModeChange} />
    );

    const deleteButton = screen.getByText('Delete').closest('button');
    expect(deleteButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('shows non-current modes as inactive', () => {
    render(<ModeControls currentMode="edit" onModeChange={mockOnModeChange} />);

    const deleteButton = screen.getByText('Delete').closest('button');
    const viewForceButton = screen.getByText('View/Force').closest('button');

    expect(deleteButton).toHaveClass('bg-white', 'text-gray-700');
    expect(viewForceButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('calls onModeChange when button is clicked', () => {
    let calledWith: Mode | null = null;
    const testOnModeChange = (mode: Mode) => {
      calledWith = mode;
    };

    render(<ModeControls currentMode="edit" onModeChange={testOnModeChange} />);

    const deleteButton = screen.getByText('Delete').closest('button');
    fireEvent.click(deleteButton!);

    expect(calledWith).toBe('delete');
  });

  it('displays mode description', () => {
    render(<ModeControls currentMode="edit" onModeChange={mockOnModeChange} />);

    expect(
      screen.getByText('Create and modify nodes and edges')
    ).toBeInTheDocument();
  });

  it('updates description when mode changes', () => {
    const { rerender } = render(
      <ModeControls currentMode="edit" onModeChange={mockOnModeChange} />
    );

    expect(
      screen.getByText('Create and modify nodes and edges')
    ).toBeInTheDocument();

    rerender(
      <ModeControls currentMode="delete" onModeChange={mockOnModeChange} />
    );

    expect(screen.getByText('Remove nodes and edges')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ModeControls
        currentMode="edit"
        onModeChange={mockOnModeChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<ModeControls currentMode="edit" onModeChange={mockOnModeChange} />);

    const editButton = screen.getByText('Edit').closest('button');
    expect(editButton).toHaveAttribute('aria-pressed', 'true');
    expect(editButton).toHaveAttribute('aria-label', 'Switch to Edit mode');

    const deleteButton = screen.getByText('Delete').closest('button');
    expect(deleteButton).toHaveAttribute('aria-pressed', 'false');
    expect(deleteButton).toHaveAttribute('aria-label', 'Switch to Delete mode');
  });
});
