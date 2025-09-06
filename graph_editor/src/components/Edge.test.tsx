import { 
  getEdgeStyling, 
  createEdgeEventHandlers, 
  applyEdgeStyling, 
  createEdgeElement 
} from './Edge';
import { D3Edge, D3Node } from '@/utils/d3Config';

// Mock D3Edge and D3Node for testing
const mockEdge: D3Edge = {
  id: 'edge-1',
  source: 'A',
  target: 'B',
  weight: '5',
};

const mockSourceNode: D3Node = {
  label: 'A',
  x: 100,
  y: 100,
};

const mockTargetNode: D3Node = {
  label: 'B',
  x: 200,
  y: 200,
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

  describe('createEdgeElement', () => {
    it('creates edge element with default configuration', () => {
      const element = createEdgeElement(mockEdge, mockSourceNode, mockTargetNode);
      
      expect(element.tag).toBe('g');
      expect(element.attributes.class).toBe('edge ');
      expect(element.attributes['data-edge-id']).toBe('edge-1');
      expect(element.attributes['data-testid']).toBe('edge-edge-1');
      expect(element.children).toHaveLength(2); // line + weight text
      
      // Check line element
      const line = element.children[0];
      expect(line.tag).toBe('line');
      expect(line.attributes.class).toBe('graph-edge');
      expect(line.attributes.x1).toBe(100);
      expect(line.attributes.y1).toBe(100);
      expect(line.attributes.x2).toBe(200);
      expect(line.attributes.y2).toBe(200);
      expect(line.attributes.stroke).toBe('#000000');
      expect(line.attributes['stroke-width']).toBe(2);
      expect(line.attributes['marker-end']).toBeUndefined();
      
      // Check weight text element
      const text = element.children[1];
      expect(text.tag).toBe('text');
      expect(text.attributes.class).toBe('graph-edge-weight');
      expect(text.text).toBe('5');
      expect(text.attributes.x).toBe(150); // (100 + 200) / 2
      expect(text.attributes.y).toBe(150); // (100 + 200) / 2
    });

    it('creates edge element with custom configuration', () => {
      const config = {
        isSelected: true,
        isDirected: true,
        strokeWidth: 4,
        strokeColor: '#ff0000',
        className: 'custom-edge',
      };
      
      const element = createEdgeElement(mockEdge, mockSourceNode, mockTargetNode, config);
      
      expect(element.attributes.class).toBe('edge custom-edge');
      
      const line = element.children[0];
      expect(line.attributes.stroke).toBe('#1976d2'); // selected color overrides custom
      expect(line.attributes['stroke-width']).toBe(5); // selected width overrides custom
      expect(line.attributes['marker-end']).toBe('url(#arrowhead)');
    });

    it('creates edge element without weight when not present', () => {
      const edgeWithoutWeight: D3Edge = {
        id: 'edge-2',
        source: 'A',
        target: 'B',
      };
      
      const element = createEdgeElement(edgeWithoutWeight, mockSourceNode, mockTargetNode);
      
      expect(element.children).toHaveLength(1); // only line, no weight text
      expect(element.children[0].tag).toBe('line');
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
