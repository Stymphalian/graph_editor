import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Node from './Node';
import { D3Node } from '@/utils/d3Config';

// Mock jest functions
const mockFn = () => {
  const fn = (...args: any[]) => {
    fn.calls.push(args);
    return fn;
  };
  fn.calls = [] as any[][];
  fn.mockReturnValue = (value: any) => {
    fn.returnValue = value;
    return fn;
  };
  return fn;
};

// Mock jest
(global as any).jest = {
  fn: mockFn,
};

// Mock D3Node for testing
const mockNode: D3Node = {
  label: 'A',
  x: 100,
  y: 100,
};

describe('Node Component', () => {
  it('renders node with correct label', () => {
    render(<Node node={mockNode} />);
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByTestId('node-A')).toBeInTheDocument();
  });

  it('renders node circle with default styling', () => {
    render(<Node node={mockNode} />);
    
    const circle = screen.getByTestId('node-A').querySelector('circle');
    expect(circle).toHaveAttribute('r', '20');
    expect(circle).toHaveAttribute('fill', 'white');
    expect(circle).toHaveAttribute('stroke', '#000000');
    expect(circle).toHaveAttribute('stroke-width', '2');
  });

  it('renders selected node with different styling', () => {
    render(<Node node={mockNode} isSelected={true} />);
    
    const circle = screen.getByTestId('node-A').querySelector('circle');
    const text = screen.getByTestId('node-A').querySelector('text');
    
    expect(circle).toHaveAttribute('fill', '#e3f2fd');
    expect(circle).toHaveAttribute('stroke', '#1976d2');
    expect(circle).toHaveAttribute('stroke-width', '3');
    expect(text).toHaveAttribute('fill', '#1976d2');
  });

  it('renders with custom radius', () => {
    render(<Node node={mockNode} radius={30} />);
    
    const circle = screen.getByTestId('node-A').querySelector('circle');
    expect(circle).toHaveAttribute('r', '30');
  });

  it('calls onNodeClick when clicked', () => {
    const handleClick = mockFn();
    render(<Node node={mockNode} onNodeClick={handleClick} />);
    
    fireEvent.click(screen.getByTestId('node-A'));
    expect(handleClick.calls.length).toBe(1);
    expect(handleClick.calls[0][0]).toEqual(mockNode);
  });

  it('calls onNodeDoubleClick when double-clicked', () => {
    const handleDoubleClick = mockFn();
    render(<Node node={mockNode} onNodeDoubleClick={handleDoubleClick} />);
    
    fireEvent.doubleClick(screen.getByTestId('node-A'));
    expect(handleDoubleClick.calls.length).toBe(1);
    expect(handleDoubleClick.calls[0][0]).toEqual(mockNode);
  });

  it('calls onNodeMouseEnter when mouse enters', () => {
    const handleMouseEnter = mockFn();
    render(<Node node={mockNode} onNodeMouseEnter={handleMouseEnter} />);
    
    fireEvent.mouseEnter(screen.getByTestId('node-A'));
    expect(handleMouseEnter.calls.length).toBe(1);
    expect(handleMouseEnter.calls[0][0]).toEqual(mockNode);
  });

  it('calls onNodeMouseLeave when mouse leaves', () => {
    const handleMouseLeave = mockFn();
    render(<Node node={mockNode} onNodeMouseLeave={handleMouseLeave} />);
    
    fireEvent.mouseLeave(screen.getByTestId('node-A'));
    expect(handleMouseLeave.calls.length).toBe(1);
    expect(handleMouseLeave.calls[0][0]).toEqual(mockNode);
  });

  it('stops event propagation on click', () => {
    const handleClick = mockFn();
    const parentClick = mockFn();
    
    render(
      <div onClick={parentClick}>
        <Node node={mockNode} onNodeClick={handleClick} />
      </div>
    );
    
    fireEvent.click(screen.getByTestId('node-A'));
    expect(handleClick.calls.length).toBe(1);
    expect(parentClick.calls.length).toBe(0);
  });

  it('applies custom className', () => {
    render(<Node node={mockNode} className="custom-node" />);
    
    const nodeElement = screen.getByTestId('node-A');
    expect(nodeElement).toHaveClass('node', 'custom-node');
  });

  it('applies custom style', () => {
    const customStyle = { opacity: 0.5 };
    render(<Node node={mockNode} style={customStyle} />);
    
    const nodeElement = screen.getByTestId('node-A');
    expect(nodeElement).toHaveStyle('opacity: 0.5');
  });

  it('renders with different node labels', () => {
    const nodeB: D3Node = { label: 'B', x: 200, y: 200 };
    render(<Node node={nodeB} />);
    
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByTestId('node-B')).toBeInTheDocument();
  });
});
