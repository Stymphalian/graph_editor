import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextAreaWithLineNumbers from './TextAreaWithLineNumbers';

// Mock functions for testing
const mockFn = () => {};
let mockChangeCallCount = 0;
let mockFocusCallCount = 0;
let mockBlurCallCount = 0;
let mockKeyDownCallCount = 0;

const mockChange = () => { mockChangeCallCount++; };
const mockFocus = () => { mockFocusCallCount++; };
const mockBlur = () => { mockBlurCallCount++; };
const mockKeyDown = () => { mockKeyDownCallCount++; };

describe('TextAreaWithLineNumbers', () => {
  beforeEach(() => {
    mockChangeCallCount = 0;
    mockFocusCallCount = 0;
    mockBlurCallCount = 0;
    mockKeyDownCallCount = 0;
  });

  it('renders without crashing', () => {
    render(<TextAreaWithLineNumbers value="test content" onChange={mockFn} />);
    expect(screen.getByDisplayValue('test content')).toBeInTheDocument();
  });

  it('displays line numbers correctly', () => {
    const multiLineText = 'line 1\nline 2\nline 3';
    render(<TextAreaWithLineNumbers value={multiLineText} onChange={mockFn} />);
    
    // Check that line numbers are present (they should be in the line numbers div)
    const lineNumbersDiv = document.querySelector('.text-panel-line-numbers');
    expect(lineNumbersDiv).toBeInTheDocument();
    
    // Check that spans are present (CSS will generate the numbers)
    const spans = lineNumbersDiv?.querySelectorAll('span');
    expect(spans).toHaveLength(3);
  });

  it('handles text changes', () => {
    render(<TextAreaWithLineNumbers value="initial" onChange={mockChange} />);
    
    const textarea = screen.getByDisplayValue('initial');
    fireEvent.change(textarea, { target: { value: 'modified' } });
    
    expect(mockChangeCallCount).toBe(1);
  });

  it('handles focus and blur events', () => {
    render(
      <TextAreaWithLineNumbers 
        value="test" 
        onChange={mockFn}
        onFocus={mockFocus} 
        onBlur={mockBlur} 
      />
    );
    
    const textarea = screen.getByDisplayValue('test');
    fireEvent.focus(textarea);
    fireEvent.blur(textarea);
    
    expect(mockFocusCallCount).toBe(1);
    expect(mockBlurCallCount).toBe(1);
  });

  it('handles key events', () => {
    render(<TextAreaWithLineNumbers value="test" onChange={mockFn} onKeyDown={mockKeyDown} />);
    
    const textarea = screen.getByDisplayValue('test');
    fireEvent.keyDown(textarea, { key: 'Enter' });
    
    expect(mockKeyDownCallCount).toBe(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <TextAreaWithLineNumbers value="test" onChange={mockFn} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies custom textarea className', () => {
    render(
      <TextAreaWithLineNumbers 
        value="test" 
        onChange={mockFn}
        textareaClassName="custom-textarea-class" 
      />
    );
    
    const textarea = screen.getByDisplayValue('test');
    expect(textarea).toHaveClass('custom-textarea-class');
  });

  it('handles readOnly prop', () => {
    render(<TextAreaWithLineNumbers value="test" onChange={mockFn} readOnly />);
    
    const textarea = screen.getByDisplayValue('test');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('handles placeholder prop', () => {
    render(<TextAreaWithLineNumbers value="" onChange={mockFn} placeholder="Enter text here" />);
    
    const textarea = screen.getByPlaceholderText('Enter text here');
    expect(textarea).toBeInTheDocument();
  });

  it('handles rows prop', () => {
    render(<TextAreaWithLineNumbers value="test" onChange={mockFn} rows={5} />);
    
    const textarea = screen.getByDisplayValue('test');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('handles spellCheck prop', () => {
    render(<TextAreaWithLineNumbers value="test" onChange={mockFn} spellCheck={false} />);
    
    const textarea = screen.getByDisplayValue('test');
    expect(textarea).toHaveAttribute('spellcheck', 'false');
  });


  it('handles scroll events', () => {
    render(<TextAreaWithLineNumbers value="line 1\nline 2\nline 3" onChange={mockFn} />);
    
    const textarea = screen.getByRole('textbox');
    const lineNumbersDiv = document.querySelector('.text-panel-line-numbers');
    
    // Simulate scroll event
    fireEvent.scroll(textarea);
    
    // Should not crash and elements should still be present
    expect(textarea).toBeInTheDocument();
    expect(lineNumbersDiv).toBeInTheDocument();
  });
});
