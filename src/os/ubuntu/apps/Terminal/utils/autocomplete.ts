import { commandRegistry } from '../commands';
import { getDB } from '../../../fs/db';
import { resolveRelativePathAsync } from '../../../fs/pathResolver';

export interface AutocompleteResult {
  completion?: string;
  suggestions?: string[];
}

function getLongestCommonPrefix(words: string[]): string {
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];
  let prefix = words[0];
  for (let i = 1; i < words.length; i++) {
    while (words[i].indexOf(prefix) !== 0) {
      prefix = prefix.substring(0, prefix.length - 1);
      if (prefix === '') return '';
    }
  }
  return prefix;
}

export function formatAsColumns(items: string[], terminalWidth = 100): string[] {
  if (items.length === 0) return [];
  const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
  const maxLen = Math.max(...items.map(s => stripAnsi(s).length));
  const colWidth = maxLen + 2; 
  const cols = Math.max(1, Math.floor(terminalWidth / colWidth));
  const rows = Math.ceil(items.length / cols);

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const index = c * rows + r;
      if (index < items.length) {
        const item = items[index];
        const visibleLen = stripAnsi(item).length;
        line += item + ' '.repeat(colWidth - visibleLen);
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

export async function handleAutocomplete(currentInput: string, cwdPath: string): Promise<AutocompleteResult> {
  if (!currentInput) return {};

  const words = currentInput.split(' ');
  const lastWord = words[words.length - 1];
  const isFirstWord = words.length === 1;

  if (isFirstWord) {
    const commands = Object.keys(commandRegistry);
    const matches = commands.filter(cmd => cmd.startsWith(lastWord));
    
    if (matches.length === 1) {
      return { completion: matches[0] + ' ' };
    } else if (matches.length > 1) {
      const prefix = getLongestCommonPrefix(matches);
      if (prefix.length > lastWord.length) {
        return { completion: prefix };
      } else {
        return { suggestions: formatAsColumns(matches.sort()) };
      }
    }
    return {};
  } else {
    const lastSlashIndex = lastWord.lastIndexOf('/');
    let dirPath = '';
    let partialName = lastWord;

    if (lastSlashIndex !== -1) {
      dirPath = lastWord.substring(0, lastSlashIndex + 1);
      partialName = lastWord.substring(lastSlashIndex + 1);
    }

    let targetDirId = 'root'; // fallback
    const db = await getDB();
    
    if (dirPath === '/') {
      targetDirId = 'root';
    } else if (dirPath === '') {
      const node = await resolveRelativePathAsync(cwdPath, '.');
      if (node) targetDirId = node.id;
    } else {
      const resolvePath = dirPath.endsWith('/') && dirPath.length > 1 ? dirPath.slice(0, -1) : dirPath;
      const node = await resolveRelativePathAsync(cwdPath, resolvePath);
      if (node && node.type === 'directory') {
        targetDirId = node.id;
      } else {
        return {};
      }
    }

    const children = await db.getAllFromIndex('inodes', 'by-parent', targetDirId);
    const matches = children
      .map(c => {
        const name = c.name + (c.type === 'directory' ? '/' : '');
        return { raw: name, display: c.type === 'directory' ? `\x1b[1;34m${name}\x1b[0m` : name };
      })
      .filter(m => m.raw.startsWith(partialName));

    if (matches.length === 1) {
      const match = matches[0].raw;
      const newLastWord = dirPath + match;
      const suffix = match.endsWith('/') ? '' : ' ';
      words[words.length - 1] = newLastWord + suffix;
      return { completion: words.join(' ') };
    } else if (matches.length > 1) {
      const rawMatches = matches.map(m => m.raw);
      const prefix = getLongestCommonPrefix(rawMatches);
      if (prefix.length > partialName.length) {
        words[words.length - 1] = dirPath + prefix;
        return { completion: words.join(' ') };
      } else {
        const displayMatches = matches.map(m => m.display).sort((a, b) => {
          const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
          return strip(a).toLowerCase().localeCompare(strip(b).toLowerCase());
        });
        return { suggestions: formatAsColumns(displayMatches) };
      }
    }

    return {};
  }
}
