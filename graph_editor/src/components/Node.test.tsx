import { 
  getNodeStyling, 
  createNodeEventHandlers, 
  applyNodeStyling, 
} from './Node';
import { D3Node } from '@/utils/d3Config';

// Mock D3Node for testing
const mockNode: D3Node = {
  id: 1,
  label: 'A',
  x: 100,
  y: 100,
};

describe('Node Utility Functions', () => {
  describe('getNodeStyling', () => {
    it('returns default styling for unselected node', () => {
      const styling = getNodeStyling(false);
      
      expect(styling.fill).toBe('white');
      expect(styling.stroke).toBe('#000000');
      expect(styling.strokeWidth).toBe(2);
      expect(styling.labelFill).toBe('#000000');
    });

    it('returns selected styling for selected node', () => {
      const styling = getNodeStyling(true);
      
      expect(styling.fill).toBe('#e3f2fd');
      expect(styling.stroke).toBe('#1976d2');
      expect(styling.strokeWidth).toBe(4);
      expect(styling.labelFill).toBe('#1976d2');
    });
  });

  describe('createNodeEventHandlers', () => {
    it('creates event handlers that call the provided functions', async () => {
      let clickedNode: D3Node | undefined;
      let doubleClickedNode: D3Node | undefined;
      let mouseEnteredNode: D3Node | undefined;
      let mouseLeftNode: D3Node | undefined;

      const handlers = {
        onNodeClick: (node: D3Node) => { clickedNode = node; },
        onNodeDoubleClick: (node: D3Node) => { doubleClickedNode = node; },
        onNodeMouseEnter: (node: D3Node) => { mouseEnteredNode = node; },
        onNodeMouseLeave: (node: D3Node) => { mouseLeftNode = node; },
      };

      const eventHandlers = createNodeEventHandlers(mockNode, handlers);
      
      // Test click handler (with timeout)
      eventHandlers.click(new Event('click'));
      
      // Wait for timeout to complete
      await new Promise(resolve => setTimeout(resolve, 250));
      expect(clickedNode).toEqual(mockNode);

      // Test double click handler
      eventHandlers.dblclick(new Event('dblclick'));
      expect(doubleClickedNode).toEqual(mockNode);

      // Test mouse enter handler
      eventHandlers.mouseenter(new Event('mouseenter'));
      expect(mouseEnteredNode).toEqual(mockNode);

      // Test mouse leave handler
      eventHandlers.mouseleave(new Event('mouseleave'));
      expect(mouseLeftNode).toEqual(mockNode);
    });

    it('handles missing event handlers gracefully', () => {
      const handlers = {};
      const eventHandlers = createNodeEventHandlers(mockNode, handlers);
      
      // Should not throw errors
      expect(() => {
        eventHandlers.click(new Event('click'));
        eventHandlers.dblclick(new Event('dblclick'));
        eventHandlers.mouseenter(new Event('mouseenter'));
        eventHandlers.mouseleave(new Event('mouseleave'));
      }).not.toThrow();
    });
  });


  describe('applyNodeStyling', () => {
    it('applies styling to a mock D3 selection', () => {
      // Mock D3 selection
      const mockSelection: any = {
        select: () => mockSelection,
        attr: () => mockSelection,
        style: () => mockSelection,
      };

      // Track calls
      const calls: any[] = [];

      mockSelection.select = (selector: string) => {
        calls.push({ method: 'select', args: [selector] });
        return mockSelection;
      };

      mockSelection.attr = (attr: string, value: any) => {
        calls.push({ method: 'attr', args: [attr, value] });
        return mockSelection;
      };

      mockSelection.style = (prop: string, value: any) => {
        calls.push({ method: 'style', args: [prop, value] });
        return mockSelection;
      };

      applyNodeStyling(mockSelection, true, 25);

      // Verify circle styling was applied
      expect(calls.some(call => call.method === 'select' && call.args[0] === 'circle')).toBe(true);
      expect(calls.some(call => call.method === 'attr' && call.args[0] === 'r' && call.args[1] === 25)).toBe(true);
      expect(calls.some(call => call.method === 'attr' && call.args[0] === 'fill' && call.args[1] === '#e3f2fd')).toBe(true);
      expect(calls.some(call => call.method === 'attr' && call.args[0] === 'stroke' && call.args[1] === '#1976d2')).toBe(true);
      expect(calls.some(call => call.method === 'attr' && call.args[0] === 'stroke-width' && call.args[1] === 4)).toBe(true);

      // Verify text styling was applied
      expect(calls.some(call => call.method === 'select' && call.args[0] === 'text')).toBe(true);
      expect(calls.some(call => call.method === 'attr' && call.args[0] === 'fill' && call.args[1] === '#1976d2')).toBe(true);
    });
  });
});
