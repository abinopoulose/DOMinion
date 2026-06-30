import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface TerminalInputProps {
  prompt: string;
  onCommand: (command: string) => void;
  commandHistory: string[];
  isPassword?: boolean;
}

export interface TerminalInputRef {
  focus: () => void;
}

export const TerminalInput = forwardRef<TerminalInputRef, TerminalInputProps>(({ prompt, onCommand, commandHistory, isPassword }, ref) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    }
  };

  return (
    <div className="terminal-input-container">
      <span className="terminal-prompt">{prompt}</span>
      <input
        ref={inputRef}
        type={isPassword ? 'password' : 'text'}
        className="terminal-input-field"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
});
