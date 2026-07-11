import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { PromptText } from './TerminalOutput';

interface TerminalInputProps {
  prompt: string;
  onCommand: (command: string) => void;
  commandHistory: string[];
  isPassword?: boolean;
  onTab?: (currentInput: string, setInput: (v: string) => void) => void;
}

export interface TerminalInputRef {
  focus: () => void;
}

export const TerminalInput = forwardRef<TerminalInputRef, TerminalInputProps>(({ prompt, onCommand, commandHistory, isPassword, onTab }, ref) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateCursor = () => {
    if (inputRef.current) {
      setCursorPos(inputRef.current.selectionStart || 0);
    }
  };

  // Sync cursor pos occasionally just in case
  React.useEffect(() => {
    updateCursor();
  }, [input]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'c' && e.ctrlKey) {
      if (isPassword) {
        e.preventDefault();
        onCommand('__CTRL_C__');
        return;
      }
    }
    
    if (e.key === 'Enter') {

      onCommand(input); // pass exact input
      setInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIndex);
      setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (onTab && !isPassword) {
        onTab(input, (v) => {
          setInput(v);
          setCursorPos(v.length);
        });
      }
    }
    
    // Ensure cursor updates on navigation keys
    setTimeout(updateCursor, 0);
  };

  const beforeCursor = isPassword ? '' : input.substring(0, cursorPos);
  const atCursor = isPassword ? ' ' : (input.substring(cursorPos, cursorPos + 1) || ' ');
  const afterCursor = isPassword ? '' : input.substring(cursorPos + 1);

  return (
    <div className="terminal-input-container" style={{ position: 'relative' }}>
      <PromptText text={prompt} />
      <span className="terminal-command-text" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {beforeCursor}
        <span 
          className="terminal-cursor" 
          style={{ 
            display: 'inline-block',
            backgroundColor: '#ffffff', 
            color: '#300a24', 
            minWidth: '8px'
          }}
        >
          {atCursor}
        </span>
        {afterCursor}
      </span>
      <input
        ref={inputRef}
        type={isPassword ? 'password' : 'text'}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setCursorPos(e.target.selectionStart || 0);
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={updateCursor}
        onClick={updateCursor}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        style={{ 
          position: 'absolute', 
          opacity: 0, 
          left: '-9999px',
          width: '1px',
          height: '1px'
        }}
      />
    </div>
  );
});
