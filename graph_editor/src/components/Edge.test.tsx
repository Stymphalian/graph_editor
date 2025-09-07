import { 
  getEdgeStyling, 
  createEdgeEventHandlers, 
  applyEdgeStyling, 
} from './Edge';
import { D3Edge } from '@/utils/d3Config';

// Mock D3Edge for testing
const mockEdge: D3Edge = {
  id: 'edge-1',
  source: 1,
  target: 2,
  weight: '5',
};


describe('Edge Utility Functions', () => {
  describe('getEdgeStyling', () => {
    it('returns default styling for unselected edge', () => {
      const styling = getEdgeStyling(false);
      
      expect(styling.stroke).toBe('#000000');
      expect(styling.strokeWidth).toBe(2);
    });

    it('returns selected styling for selected edge', () => {
      const styling = getEdgeStyling(true);
      
      expect(styling.stroke).toBe('#1976d2');
      expect(styling.strokeWidth).toBe(3);
    });

    it('uses custom stroke color and width', () => {
      const styling = getEdgeStyling(false, '#ff0000', 4);
      
      expect(styling.stroke).toBe('#ff0000');
      expect(styling.strokeWidth).toBe(4);
    });

    it('applies selection styling to custom values', () => {
      const styling = getEdgeStyling(true, '#ff0000', 4);
      
      expect(styling.stroke).toBe('#1976d2');
      expect(styling.strokeWidth).toBe(5);
    });
  });

  describe('createEdgeEventHandlers', () => {
    it('creates event handlers that call the provided functions', () => {
      let clickedEdge: D3Edge | undefined;
      let doubleClickedEdge: D3Edge | undefined;
      let mouseEnteredEdge: D3Edge | undefined;
      let mouseLeftEdge: D3Edge | undefined;

      const handlers = {
        onEdgeClick: (edge: D3Edge) => { clickedEdge = edge; },
        onEdgeDoubleClick: (edge: D3Edge) => { doubleClickedEdge = edge; },
        onEdgeMouseEnter: (edge: D3Edge) => { mouseEnteredEdge = edge; },
        onEdgeMouseLeave: (edge: D3Edge) => { mouseLeftEdge = edge; },
      };

      const eventHandlers = createEdgeEventHandlers(mockEdge, handlers);
      
      // Test click handler
      eventHandlers.click(new Event('click'));
      expect(clickedEdge).toEqual(mockEdge);

      // Test double click handler
      eventHandlers.dblclick(new Event('dblclick'));
      expect(doubleClickedEdge).toEqual(mockEdge);

      // Test mouse enter handler
      eventHandlers.mouseenter(new Event('mouseenter'));
      expect(mouseEnteredEdge).toEqual(mockEdge);

      // Test mouse leave handler
      eventHandlers.mouseleave(new Event('mouseleave'));
      expect(mouseLeftEdge).toEqual(mockEdge);
    });

    it('handles missing event handlers gracefully', () => {
      const handlers = {};
      const eventHandlers = createEdgeEventHandlers(mockEdge, handlers);
      
      // Should not throw errors
      expect(() => {
        eventHandlers.click(new Event('click'));
        eventHandlers.dblclick(new Event('dblclick'));
        eventHandlers.mouseenter(new Event('mouseenter'));
        eventHandlers.mouseleave(new Event('mouseleave'));
      }).not.toThrow();
    });
  });


  describe('applyEdgeStyling', () => {
    it('applies styling to a mock D3 selection', () => {
      // Mock D3 selection
      const calls: any[] = [];
      const mockSelection = {
        attr: (attr: string, value: any) => {
          calls.push({ method: 'attr', args: [attr, value] });
          return mockSelection;
        },
        style: (prop: string, value: any) => {
          calls.push({ method: 'style', args: [prop, value] });
          return mockSelection;
        },
        select: (selector: string) => {
          calls.push({ method: 'select', args: [selector] });
          return {
            empty: () => false,
            attr: (attr: string, value: any) => {
              calls.push({ method: 'textAttr', args: [attr, value] });
              return mockSelection;
            },
            style: (prop: string, value: any) => {
              calls.push({ method: 'textStyle', args: [prop, value] });
              return mockSelection;
            },
          };
        },
      };

      applyEdgeStyling(mockSelection, true, '#ff0000', 4, true);

      // Verify line styling was applied
      expect(calls.some(call => call.method === 'attr' && call.args[0] === 'stroke' && call.args[1] === '#1976d2')).toBe(true);
      expect(calls.some(call => call.method === 'attr' && call.args[0] === 'stroke-width' && call.args[1] === 5)).toBe(true);
      expect(calls.some(call => call.method === 'attr' && call.args[0] === 'marker-end' && call.args[1] === 'url(#arrowhead)')).toBe(true);
      expect(calls.some(call => call.method === 'style' && call.args[0] === 'cursor' && call.args[1] === 'pointer')).toBe(true);
      expect(calls.some(call => call.method === 'style' && call.args[0] === 'transition' && call.args[1] === 'all 0.2s ease-in-out')).toBe(true);

      // Verify weight text styling was applied
      expect(calls.some(call => call.method === 'select' && call.args[0] === 'text')).toBe(true);
    });

    it('removes arrow marker for undirected edges', () => {
      const calls: any[] = [];
      const mockSelection = {
        attr: (attr: string, value: any) => {
          calls.push({ method: 'attr', args: [attr, value] });
          return mockSelection;
        },
        style: (prop: string, value: any) => {
          calls.push({ method: 'style', args: [prop, value] });
          return mockSelection;
        },
        select: (selector: string) => {
          calls.push({ method: 'select', args: [selector] });
          return {
            empty: () => false,
            attr: () => mockSelection,
            style: () => mockSelection,
          };
        },
      };

      applyEdgeStyling(mockSelection, false, '#000000', 2, false);

      expect(calls.some(call => call.method === 'attr' && call.args[0] === 'marker-end' && call.args[1] === null)).toBe(true);
    });
  });
});
