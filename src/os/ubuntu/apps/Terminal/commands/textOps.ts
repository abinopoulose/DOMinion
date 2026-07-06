import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';
import { parseArgs } from '../commandParser';
import { walkTree } from './utils';

/**
 * grep — Search for patterns in file content.
 *
 * Usage:
 *   grep [flags] <pattern> <file...>
 *   grep -r [flags] <pattern> [directory]
 *
 * Flags:
 *   -i    Case-insensitive search
 *   -n    Show line numbers
 *   -c    Count matching lines only
 *   -r    Recursive directory search
 *   -v    Invert match (show non-matching lines)
 *
 * Output format:
 *   Single file:  lineContent  (or  lineNum:lineContent with -n)
 *   Multi-file:   filename:lineContent  (or  filename:lineNum:lineContent with -n)
 *   With -c:      filename:count  (or just count for single file)
 */
export const grep: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { flags, positional } = parseArgs(args);

  if (positional.length < 1) {
    ['grep: missing pattern'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const pattern = positional[0];
  const targets = positional.slice(1);
  const store = useVFSStore.getState();

  // Build regex from pattern
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags.i ? 'i' : '');
  } catch {
    [`grep: invalid pattern: '${pattern}'`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  // Collect files to search
  interface FileEntry { name: string; content: string; }
  const files: FileEntry[] = [];

  if (flags.r) {
    // Recursive mode: search directory tree
    const startPath = targets.length > 0 ? targets[0] : '.';
    let startNode;

    if (startPath === '.') {
      startNode = store.getNode(cwdId);
    } else {
      startNode = store.resolveRelativePath(cwdId, startPath);
    }

    if (!startNode) {
      [`grep: ${startPath}: No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    if (startNode.type === 'file') {
      files.push({ name: startPath, content: startNode.content });
    } else {
      const username = _appState?.effectiveUser || getAuthContext().username;
      walkTree(startNode.id, startPath === '.' ? '.' : startPath, username, (node, path) => {
        if (node.type === 'file') {
          files.push({ name: path, content: node.content });
        }
      });
    }
  } else {
    // Non-recursive: explicit file targets
    if (targets.length === 0) {
      ['grep: missing file operand'].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    for (const target of targets) {
      const node = store.resolveRelativePath(cwdId, target);
      if (!node) {
        [`grep: ${target}: No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
      }
      if (node.type === 'directory') {
        [`grep: ${target}: Is a directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
      }
      files.push({ name: target, content: node.content });
    }
  }

  if (files.length === 0) {
    [].forEach((line: string) => process.stdout.writeLine(line)); return {};
  }

  const multiFile = files.length > 1;
  const outputLines: string[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');
    let count = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const matches = regex.test(line);
      const show = flags.v ? !matches : matches;

      if (show) {
        count++;
        if (!flags.c) {
          let result = '';
          if (multiFile) result += `${file.name}:`;
          if (flags.n) result += `${lineIdx + 1}:`;
          result += line;
          outputLines.push(result);
        }
      }
    }

    if (flags.c) {
      if (multiFile) {
        outputLines.push(`${file.name}:${count}`);
      } else {
        outputLines.push(`${count}`);
      }
    }
  }

  outputLines.forEach((line: string) => process.stdout.writeLine(line)); return {};
};

/**
 * head — Output the first part of files.
 *
 * Usage:
 *   head [-n <count>] <file>
 *
 * Defaults to 10 lines if -n is not specified.
 */
export const head: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { options, positional } = parseArgs(args, ['n']);

  if (positional.length === 0) {
    ['head: missing file operand'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const store = useVFSStore.getState();
  const n = parseInt(options.n || '10', 10);

  if (isNaN(n) || n < 0) {
    [`head: invalid number of lines: '${options.n}'`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const results: string[] = [];
  const multiFile = positional.length > 1;

  for (let i = 0; i < positional.length; i++) {
    const target = positional[i];
    const node = store.resolveRelativePath(cwdId, target);

    if (!node) {
      [`head: ${target}: No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
    if (node.type === 'directory') {
      [`head: ${target}: Is a directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    if (multiFile) {
      if (i > 0) results.push(''); // blank line between files
      results.push(`==> ${target} <==`);
    }

    const lines = node.content.split('\n').slice(0, n);
    results.push(...lines);
  }

  results.forEach((line: string) => process.stdout.writeLine(line)); return {};
};

/**
 * tail — Output the last part of files.
 *
 * Usage:
 *   tail [-n <count>] <file>
 *
 * Defaults to 10 lines if -n is not specified.
 */
export const tail: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { options, positional } = parseArgs(args, ['n']);

  if (positional.length === 0) {
    ['tail: missing file operand'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const store = useVFSStore.getState();
  const n = parseInt(options.n || '10', 10);

  if (isNaN(n) || n < 0) {
    [`tail: invalid number of lines: '${options.n}'`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const results: string[] = [];
  const multiFile = positional.length > 1;

  for (let i = 0; i < positional.length; i++) {
    const target = positional[i];
    const node = store.resolveRelativePath(cwdId, target);

    if (!node) {
      [`tail: ${target}: No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
    if (node.type === 'directory') {
      [`tail: ${target}: Is a directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    if (multiFile) {
      if (i > 0) results.push('');
      results.push(`==> ${target} <==`);
    }

    const allLines = node.content.split('\n');
    const lines = allLines.slice(-n);
    results.push(...lines);
  }

  results.forEach((line: string) => process.stdout.writeLine(line)); return {};
};

/**
 * wc — Print newline, word, and byte counts for each file.
 *
 * Usage:
 *   wc [-l] [-w] [-c] <file...>
 *
 * Flags:
 *   -l    Print line count only
 *   -w    Print word count only
 *   -c    Print character/byte count only
 *
 * If no flags: prints all three (lines, words, chars).
 * Multiple files → totals row at the end.
 */
export const wc: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { flags, positional } = parseArgs(args);

  if (positional.length === 0) {
    ['wc: missing file operand'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const store = useVFSStore.getState();
  const showAll = !flags.l && !flags.w && !flags.c;
  const results: string[] = [];

  let totalLines = 0;
  let totalWords = 0;
  let totalChars = 0;

  for (const target of positional) {
    const node = store.resolveRelativePath(cwdId, target);

    if (!node) {
      [`wc: ${target}: No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
    if (node.type === 'directory') {
      [`wc: ${target}: Is a directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    const content = node.content;
    const lines = content.split('\n').length;
    const words = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
    const chars = content.length;

    totalLines += lines;
    totalWords += words;
    totalChars += chars;

    const parts: string[] = [];
    if (showAll || flags.l) parts.push(lines.toString().padStart(7, ' '));
    if (showAll || flags.w) parts.push(words.toString().padStart(7, ' '));
    if (showAll || flags.c) parts.push(chars.toString().padStart(7, ' '));
    parts.push(` ${target}`);

    results.push(parts.join(''));
  }

  // Total row for multiple files
  if (positional.length > 1) {
    const parts: string[] = [];
    if (showAll || flags.l) parts.push(totalLines.toString().padStart(7, ' '));
    if (showAll || flags.w) parts.push(totalWords.toString().padStart(7, ' '));
    if (showAll || flags.c) parts.push(totalChars.toString().padStart(7, ' '));
    parts.push(' total');
    results.push(parts.join(''));
  }

  results.forEach((line: string) => process.stdout.writeLine(line)); return {};
};
