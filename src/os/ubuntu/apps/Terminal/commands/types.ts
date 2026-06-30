import type { CommandResult } from '../commandParser/types';

/**
 * Terminal application state shape.
 * Defined here to avoid circular imports with Terminal.tsx.
 */
export interface TerminalAppState {
  cwdId: string;
  history: Array<{ id: string; prompt: string; command: string; output: string[]; isError?: boolean }>;
  commandHistory: string[];
  interactiveApp?: 'nano';
  nanoFileId?: string;
  nanoBuffer?: string;
  nanoModified?: boolean;
  nanoCursorLine?: number;
}

/**
 * Signature for all terminal command handlers.
 *
 * The optional 5th parameter `appState` gives commands like `history`
 * read access to the terminal's internal state. This is backward-compatible —
 * existing handlers simply ignore the extra parameter.
 */
export type CommandHandler = (
  args: string[],
  cwdId: string,
  updateCwd: (newCwdId: string) => void,
  clearHistory: () => void,
  appState?: TerminalAppState
) => CommandResult;
