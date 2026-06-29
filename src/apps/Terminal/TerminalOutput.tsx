import React from 'react';

export interface HistoryEntry {
  id: string;
  prompt: string;
  command: string;
  output: string[];
  isError?: boolean;
}

interface TerminalOutputProps {
  history: HistoryEntry[];
}

export function TerminalOutput({ history }: TerminalOutputProps) {
  return (
    <>
      <div className="terminal-welcome">
        Welcome to Ubuntu Web Terminal{'\n'}
        Type 'help' for a list of available commands.
      </div>
      {history.map((entry) => (
        <div key={entry.id} className="terminal-entry">
          <div className="terminal-prompt-line">
            <span className="terminal-prompt">{entry.prompt}</span>
            <span className="terminal-command-text">{entry.command}</span>
          </div>
          {entry.output.length > 0 && (
            <div className={`terminal-output ${entry.isError ? 'terminal-output--error' : ''}`} dangerouslySetInnerHTML={{ __html: entry.output.join('\n') }}></div>
          )}
        </div>
      ))}
    </>
  );
}
