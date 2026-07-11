

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

export function PromptText({ text }: { text: string }) {
  const match = text.match(/^([^@]+@[^:]+):(.*)([\$#]) $/);
  if (match) {
    return (
      <span className="terminal-prompt" style={{ whiteSpace: 'pre' }}>
        <span style={{ color: '#4e9a06', fontWeight: 'bold' }}>{match[1]}</span>
        <span style={{ color: '#ffffff' }}>:</span>
        <span style={{ color: '#3465a4', fontWeight: 'bold' }}>{match[2]}</span>
        <span style={{ color: '#ffffff' }}>{match[3]} </span>
      </span>
    );
  }
  return <span className="terminal-prompt" style={{ whiteSpace: 'pre' }}>{text}</span>;
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
            <PromptText text={entry.prompt} />
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
