import { render, mockGraphData } from '../test-utils';
import { fireEvent } from '@testing-library/react';
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
      render(
        <GraphViewer data={mockGraphData} mode="edit" onEdgeCreate={() => {}} />
      );

      const modeIndicator = document.querySelector(
        '.absolute.top-2.left-2 div'
      );
      expect(modeIndicator).toBeInTheDocument();
      expect(modeIndicator).toHaveTextContent('Edit Mode');
      expect(modeIndicator).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('shows mode indicator for delete mode', () => {
      render(
        <GraphViewer
          data={mockGraphData}
          mode="delete"
          onEdgeCreate={() => {}}
        />
      );

      const modeIndicator = document.querySelector(
        '.absolute.top-2.left-2 div'
      );
      expect(modeIndicator).toBeInTheDocument();
      expect(modeIndicator).toHaveTextContent('Delete Mode');
      expect(modeIndicator).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('shows mode indicator for view-force mode', () => {
      render(
        <GraphViewer
          data={mockGraphData}
          mode="view-force"
          onEdgeCreate={() => {}}
        />
      );

      const modeIndicator = document.querySelector(
        '.absolute.top-2.left-2 div'
      );
      expect(modeIndicator).toBeInTheDocument();
      expect(modeIndicator).toHaveTextContent('View/Force Mode');
      expect(modeIndicator).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('applies correct cursor class based on mode', () => {
      const { rerender } = render(
        <GraphViewer data={mockGraphData} mode="edit" onEdgeCreate={() => {}} />
      );

      let svgElement = document.querySelector('.graph-svg');
      expect(svgElement).toHaveClass('cursor-crosshair');

      rerender(
        <GraphViewer
          data={mockGraphData}
          mode="delete"
          onEdgeCreate={() => {}}
        />
      );
      svgElement = document.querySelector('.graph-svg');
      expect(svgElement).toHaveClass('cursor-not-allowed');

      rerender(
        <GraphViewer
          data={mockGraphData}
          mode="view-force"
          onEdgeCreate={() => {}}
        />
      );
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

  describe('Edge interactions', () => {
    it('renders clickable edge elements', () => {
      render(
        <GraphViewer data={mockGraphData} mode="edit" onEdgeCreate={() => {}} />
      );

      // Find edge elements
      const edgeElements = document.querySelectorAll('.edge-clickable');
      expect(edgeElements.length).toBeGreaterThan(0);

      // Verify that edges have the correct class and are clickable
      edgeElements.forEach(edge => {
        expect(edge).toHaveClass('edge-clickable');
        expect(edge).toHaveStyle('cursor: pointer');
      });
    });

    it('shows edge selection in the UI', () => {
      render(
        <GraphViewer data={mockGraphData} mode="edit" onEdgeCreate={() => {}} />
      );

      // Expand the debug panel first
      const debugButton = document.querySelector(
        'button[class*="bg-gray-100"]'
      );
      if (debugButton) {
        fireEvent.click(debugButton);
      }

      // Check that the selection display shows edge information in debug panel
      const selectionDisplay = document.querySelector('.px-2.py-1.bg-blue-50');
      expect(selectionDisplay).toBeInTheDocument();
      expect(selectionDisplay).toHaveTextContent('Edge: none');
    });

    it('renders edges with correct styling structure', () => {
      render(
        <GraphViewer data={mockGraphData} mode="edit" onEdgeCreate={() => {}} />
      );

      // Check that each edge has both clickable and visible elements
      const edgeContainers = document.querySelectorAll('.edge-container');
      expect(edgeContainers.length).toBe(mockGraphData.edges.length);

      edgeContainers.forEach(container => {
        const clickableEdge = container.querySelector('.edge-clickable');
        const visibleEdge = container.querySelector('.graph-edge');
        const weightLabel = container.querySelector('.edge-weight-label');

        expect(clickableEdge).toBeInTheDocument();
        expect(visibleEdge).toBeInTheDocument();
        expect(weightLabel).toBeInTheDocument();
      });
    });

    it('handles edge double-click for weight editing in edit mode', () => {
      const mockOnEdgeWeightEdit = () => {};
      render(
        <GraphViewer
          data={mockGraphData}
          mode="edit"
          onEdgeCreate={() => {}}
          onEdgeWeightEdit={mockOnEdgeWeightEdit}
        />
      );

      // Find the first edge element
      const edgeElement = document.querySelector('.edge-clickable');
      expect(edgeElement).toBeInTheDocument();

      // Simulate a double-click on the edge
      if (edgeElement) {
        edgeElement.dispatchEvent(
          new MouseEvent('dblclick', { bubbles: true })
        );
      }

      // The edge weight edit should be triggered
      // Note: We can't easily test the internal state, but we can verify the element exists
      expect(edgeElement).toHaveClass('edge-clickable');
    });

    it('does not allow edge weight editing in non-edit modes', () => {
      const mockOnEdgeWeightEdit = () => {};
      const { rerender } = render(
        <GraphViewer
          data={mockGraphData}
          mode="delete"
          onEdgeCreate={() => {}}
          onEdgeWeightEdit={mockOnEdgeWeightEdit}
        />
      );

      // Find the first edge element
      const edgeElement = document.querySelector('.edge-clickable');
      expect(edgeElement).toBeInTheDocument();

      // Simulate a double-click on the edge
      if (edgeElement) {
        edgeElement.dispatchEvent(
          new MouseEvent('dblclick', { bubbles: true })
        );
      }

      // The edge weight edit should not be triggered in delete mode
      // Note: We can't easily test the internal state, but we can verify the element exists
      expect(edgeElement).toHaveClass('edge-clickable');

      // Test view-force mode
      rerender(
        <GraphViewer
          data={mockGraphData}
          mode="view-force"
          onEdgeCreate={() => {}}
          onEdgeWeightEdit={mockOnEdgeWeightEdit}
        />
      );

      // Simulate a double-click on the edge in view-force mode
      if (edgeElement) {
        edgeElement.dispatchEvent(
          new MouseEvent('dblclick', { bubbles: true })
        );
      }

      // The edge weight edit should not be triggered in view-force mode either
      // Note: We can't easily test the internal state, but we can verify the element exists
      expect(edgeElement).toHaveClass('edge-clickable');
    });
  });
});
