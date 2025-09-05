import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the GraphViewer component to avoid D3 dependencies
jest.mock('./components/GraphViewer', () => {
  return function MockGraphViewer() {
    return <div data-testid="graph-viewer">Mock Graph Viewer</div>;
  };
});

describe('App', () => {
  it('renders the graph editor title', () => {
    render(<App />);
    expect(screen.getByText('Graph Editor')).toBeInTheDocument();
  });

  it('renders the D3.js test section', () => {
    render(<App />);
    expect(screen.getByText('D3.js Graph Visualization Test')).toBeInTheDocument();
  });

  it('renders the help text', () => {
    render(<App />);
    expect(screen.getByText(/Click and drag nodes to move them/)).toBeInTheDocument();
  });

  it('has the correct layout structure', () => {
    render(<App />);
    
    // Check for main layout classes
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('graph-editor-main');
    
    // Check for header
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('graph-editor-header');
  });

  it('renders the graph viewer component', () => {
    render(<App />);
    
    // Check for mocked graph viewer
    const graphViewer = screen.getByTestId('graph-viewer');
    expect(graphViewer).toBeInTheDocument();
    expect(graphViewer).toHaveTextContent('Mock Graph Viewer');
  });
});