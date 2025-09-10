import React, { useRef, JSX } from 'react';

interface TextAreaWithLineNumbersProps {
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  className?: string;
  lineNumbersClassName?: string;
  textareaClassName?: string;
  spellCheck?: boolean;
}

const TextAreaWithLineNumbers: React.FC<TextAreaWithLineNumbersProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  placeholder,
  rows = 10,
  readOnly = false,
  className = '',
  lineNumbersClassName = '',
  textareaClassName = '',
  spellCheck = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Generate spans for line numbers using CSS counter
  const generateLineNumberSpans = (text: string): JSX.Element[] => {
    const lines = text.split('\n');
    return lines.map((_, index) => <span key={index}></span>);
  };

  // Handle scroll synchronization between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      // Sync vertical scroll
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Handle line numbers scroll (in case user scrolls line numbers directly)
  const handleLineNumbersScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      textareaRef.current.scrollTop = lineNumbersRef.current.scrollTop;
    }
  };

  return (
    <div
      className={`text-panel-editor ${className}`}
      style={{ height: '100%', overflow: 'hidden', display: 'flex' }}
    >
      <div
        ref={lineNumbersRef}
        className={`text-panel-line-numbers ${lineNumbersClassName}`}
        onScroll={handleLineNumbersScroll}
        key={value.split('\n').length}
        style={{
          height: '100%',
          overflowY: 'hidden',
          overflowX: 'hidden',
        }}
      >
        {generateLineNumberSpans(value)}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        placeholder={placeholder}
        rows={rows}
        readOnly={readOnly}
        spellCheck={spellCheck}
        className={`graph-editor-textarea text-panel-textarea ${textareaClassName}`}
        wrap="off"
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'auto',
          resize: 'none',
        }}
      />
    </div>
  );
};

export default TextAreaWithLineNumbers;
