import { commandRegistry } from '../commands';
import { readdir } from '../../../fs/operations';
import { resolveRelativePathAsync } from '../../../fs/pathResolver';
import { PACKAGE_DB, getInstalledPackages } from '../packageDb';

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
  // eslint-disable-next-line no-control-regex
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

function matchFromList(partial: string, items: { raw: string, display?: string }[], prefixToReconstruct: string, addSpaceOnMatch = true): AutocompleteResult {
  const matches = items.filter(m => m.raw.startsWith(partial));

  if (matches.length === 1) {
    const match = matches[0].raw;
    const suffix = (addSpaceOnMatch && !match.endsWith('/')) ? ' ' : '';
    return { completion: prefixToReconstruct + match + suffix };
  } else if (matches.length > 1) {
    const rawMatches = matches.map(m => m.raw);
    const prefix = getLongestCommonPrefix(rawMatches);
    if (prefix.length > partial.length) {
      return { completion: prefixToReconstruct + prefix };
    } else {
      const displayMatches = matches.map(m => m.display || m.raw).sort((a, b) => {
        // eslint-disable-next-line no-control-regex
        const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
        return strip(a).toLowerCase().localeCompare(strip(b).toLowerCase());
      });
      return { suggestions: formatAsColumns(displayMatches) };
    }
  }
  return {};
}

export async function handleAutocomplete(currentInput: string, cwdPath: string, effectiveUser?: string): Promise<AutocompleteResult> {
  if (!currentInput) return {};

  const words = currentInput.split(' ');
  const lastWord = words[words.length - 1];
  const prefixWords = words.slice(0, -1);
  const contextCmd = prefixWords.join(' ').trim();
  const isFirstWord = words.length === 1;

  // 1. Command Autocompletion
  if (isFirstWord || contextCmd === 'sudo') {
    const commands = Object.keys(commandRegistry).map(c => ({ raw: c }));
    const prefixToReconstruct = isFirstWord ? '' : currentInput.substring(0, currentInput.length - lastWord.length);
    return matchFromList(lastWord, commands, prefixToReconstruct, true);
  }

  // 2. APT Install Autocompletion
  if (contextCmd === 'apt install' || contextCmd === 'sudo apt install') {
    const packages = PACKAGE_DB.map(p => ({ raw: p.name }));
    const prefixToReconstruct = currentInput.substring(0, currentInput.length - lastWord.length);
    return matchFromList(lastWord, packages, prefixToReconstruct, true);
  }

  // 3. APT Remove Autocompletion
  if (contextCmd === 'apt remove' || contextCmd === 'sudo apt remove') {
    const packages = getInstalledPackages().map(p => ({ raw: p }));
    const prefixToReconstruct = currentInput.substring(0, currentInput.length - lastWord.length);
    return matchFromList(lastWord, packages, prefixToReconstruct, true);
  }

  // 4. Fallback: File System Autocompletion
  const lastSlashIndex = lastWord.lastIndexOf('/');
  let dirPath = '';
  let partialName = lastWord;

  if (lastSlashIndex !== -1) {
    dirPath = lastWord.substring(0, lastSlashIndex + 1);
    partialName = lastWord.substring(lastSlashIndex + 1);
  }

  let resolvePath = cwdPath;
  if (dirPath === '/') {
    resolvePath = '/';
  } else if (dirPath !== '') {
    const cleanDirPath = dirPath.endsWith('/') && dirPath.length > 1 ? dirPath.slice(0, -1) : dirPath;
    const node = await resolveRelativePathAsync(cwdPath, cleanDirPath, effectiveUser);
    if (!node || node.type !== 'directory') return {};
    const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
    resolvePath = await getAbsolutePathAsync(node.id);
  }

  let children;
  try {
    children = await readdir(resolvePath, { asUser: effectiveUser });
  } catch (e) {
    return {}; // Permission denied or does not exist
  }

  const items = children.map(c => {
    const name = c.name + (c.type === 'directory' ? '/' : '');
    return { 
      raw: name, 
      display: c.type === 'directory' ? `\x1b[1;34m${name}\x1b[0m` : name 
    };
  });

  const prefixToReconstruct = currentInput.substring(0, currentInput.length - lastWord.length) + dirPath;
  return matchFromList(partialName, items, prefixToReconstruct, true);
}
