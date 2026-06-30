import type { ParsedCommand } from './types';

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const tokens: string[] = [];
  let match;

  while ((match = regex.exec(trimmed)) !== null) {
    if (match[1]) {
      // matched double quotes
      tokens.push(match[1]);
    } else if (match[2]) {
      // matched single quotes
      tokens.push(match[2]);
    } else {
      // matched unquoted
      tokens.push(match[0]);
    }
  }

  if (tokens.length === 0) return null;

  return {
    name: tokens[0],
    args: tokens.slice(1),
    raw: trimmed,
  };
}
