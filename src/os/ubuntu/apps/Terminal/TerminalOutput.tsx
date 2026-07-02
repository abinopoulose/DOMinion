

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

function parseAnsi(text: string): string {
  // Escape HTML first
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Replace basic ANSI codes (used by ls)
  html = html.replace(/\x1b\[1;34m/g, '<span style="color: #62a0ea; font-weight: bold;">');
  html = html.replace(/\x1b\[0m/g, '</span>');
  
  return html;
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
            <div className={`terminal-output ${entry.isError ? 'terminal-output--error' : ''}`} dangerouslySetInnerHTML={{ __html: parseAnsi(entry.output.join('\n')) }}></div>
          )}
        </div>
      ))}
    </>
  );
}
