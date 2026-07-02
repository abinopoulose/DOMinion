import type { ParsedCommand } from './types';

export function parseCommand(input: string): ParsedCommand[] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const tokens: string[] = [];
  let match;

  while ((match = regex.exec(trimmed)) !== null) {
    if (match[1]) {
      tokens.push(match[1]);
    } else if (match[2]) {
      tokens.push(match[2]);
    } else {
      tokens.push(match[0]);
    }
  }

  if (tokens.length === 0) return null;

  const pipelines: string[][] = [[]];
  for (const token of tokens) {
    if (token === '|') {
      pipelines.push([]);
    } else {
      pipelines[pipelines.length - 1].push(token);
    }
  }

  const parsedCommands: ParsedCommand[] = [];

  for (const pipeTokens of pipelines) {
    const finalArgs: string[] = [];
    const redirections: { type: '>' | '>>' | '<'; target: string }[] = [];

    for (let i = 0; i < pipeTokens.length; i++) {
      const token = pipeTokens[i];
      if (token === '>' || token === '>>' || token === '<') {
        if (i + 1 < pipeTokens.length) {
          redirections.push({ type: token, target: pipeTokens[i + 1] });
          i++;
        }
      } else if (token.startsWith('>') || token.startsWith('<')) {
        if (token.startsWith('>>')) {
          redirections.push({ type: '>>', target: token.slice(2) });
        } else {
          redirections.push({ type: token[0] as '>' | '<', target: token.slice(1) });
        }
      } else {
        finalArgs.push(token);
      }
    }

    if (finalArgs.length > 0) {
      parsedCommands.push({
        name: finalArgs[0],
        args: finalArgs.slice(1),
        raw: pipeTokens.join(' '), // Approximate raw for each piped segment
        redirections,
      });
    }
  }

  return parsedCommands.length > 0 ? parsedCommands : null;
}
