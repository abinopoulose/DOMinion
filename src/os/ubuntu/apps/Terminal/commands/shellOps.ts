import type { CommandHandler } from './types';
import { parseArgs } from '../commandParser';

/**
 * history — Display or clear the command history.
 *
 * Usage:
 *   history       Show all past commands with line numbers
 *   history -c    Clear the command history
 *
 * Reads from appState.commandHistory (5th parameter).
 */
export const history: CommandHandler = (args, _cwdId, _updateCwd, clearHistory, appState) => {
  const { flags } = parseArgs(args);

  if (flags.c) {
    // Clear the history
    clearHistory();
    return { output: [] };
  }

  if (!appState?.commandHistory || appState.commandHistory.length === 0) {
    return { output: [] };
  }

  // Format each command with a right-aligned line number
  // Real bash format: "    1  ls -la"
  const lines = appState.commandHistory.map((cmd, index) => {
    const num = (index + 1).toString().padStart(5, ' ');
    return `${num}  ${cmd}`;
  });

  return { output: lines };
};
