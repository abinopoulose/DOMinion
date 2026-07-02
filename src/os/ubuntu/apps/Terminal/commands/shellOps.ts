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
export const history: CommandHandler = (args, _cwdId, _updateCwd, _clearHistory, appState, process) => {
  const { flags } = parseArgs(args);

  if (flags.c) {
    // Clear the history (Terminal.tsx handles clearing commandHistory)
    [].forEach((line: string) => process.stdout.writeLine(line)); return {};
  }

  if (!appState?.commandHistory || appState.commandHistory.length === 0) {
    [].forEach((line: string) => process.stdout.writeLine(line)); return {};
  }

  // Format each command with a right-aligned line number
  // Real bash format: "    1  ls -la"
  const lines = appState.commandHistory.map((cmd, index) => {
    const num = (index + 1).toString().padStart(5, ' ');
    return `${num}  ${cmd}`;
  });

  lines.forEach((line: string) => process.stdout.writeLine(line)); return {};
};
