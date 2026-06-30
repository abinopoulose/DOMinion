import type { ParsedArgs } from './types';

/**
 * Flag alias map: maps long-form flag names to their single-char equivalents.
 * Used to normalise `--recursive` → `r`, `--force` → `f`, etc.
 */
const FLAG_ALIASES: Record<string, string> = {
  recursive: 'r',
  force: 'f',
  all: 'a',
  long: 'l',
  human: 'h',
  'human-readable': 'h',
};

/**
 * Parse an array of argument tokens (everything after the command name)
 * into structured flags, options, and positional arguments.
 *
 * @param tokens - The args array from ParsedCommand (NOT including the command name).
 * @param valueFlagKeys - Optional set of single-char flag keys that consume the
 *                        next token as a value (e.g. `['n']` for `head -n 10`).
 *                        Also supports long-form keys (e.g. `['name', 'type']` for `find`).
 * @returns ParsedArgs
 *
 * @example
 * parseArgs(['-rf', 'mydir'])
 * // → { flags: { r: true, f: true }, options: {}, positional: ['mydir'] }
 *
 * @example
 * parseArgs(['-n', '10', 'file.txt'], ['n'])
 * // → { flags: {}, options: { n: '10' }, positional: ['file.txt'] }
 *
 * @example
 * parseArgs(['--recursive', '-i', 'pattern', 'file.txt'])
 * // → { flags: { r: true, i: true }, options: {}, positional: ['pattern', 'file.txt'] }
 */
export function parseArgs(tokens: string[], valueFlagKeys: string[] = []): ParsedArgs {
  const flags: Record<string, boolean> = {};
  const options: Record<string, string> = {};
  const positional: string[] = [];
  const valueSet = new Set(valueFlagKeys);

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '--') {
      // Everything after `--` is positional
      positional.push(...tokens.slice(i + 1));
      break;
    }

    if (token.startsWith('--')) {
      // Long flag: --recursive, --force, --name=pattern
      const body = token.slice(2);
      const eqIndex = body.indexOf('=');

      if (eqIndex !== -1) {
        // --name=pattern
        const key = body.slice(0, eqIndex);
        const val = body.slice(eqIndex + 1);
        const aliased = FLAG_ALIASES[key] || key;
        options[aliased] = val;
      } else {
        const aliased = FLAG_ALIASES[body] || body;
        if (valueSet.has(body) || valueSet.has(aliased)) {
          // Consume next token as value
          if (i + 1 < tokens.length) {
            options[aliased] = tokens[++i];
          }
        } else {
          flags[aliased] = true;
        }
      }
    } else if (token.startsWith('-') && token.length > 1) {
      // Short flags: -rf, -n 10, -i
      const chars = token.slice(1);
      for (let j = 0; j < chars.length; j++) {
        const ch = chars[j];
        if (valueSet.has(ch)) {
          // Value flag — remainder of this token (if any) or next token is the value
          const remainder = chars.slice(j + 1);
          if (remainder.length > 0) {
            options[ch] = remainder;
          } else if (i + 1 < tokens.length) {
            options[ch] = tokens[++i];
          }
          break; // remainder consumed, done with this token
        } else {
          flags[ch] = true;
        }
      }
    } else {
      positional.push(token);
    }

    i++;
  }

  return { flags, options, positional };
}
