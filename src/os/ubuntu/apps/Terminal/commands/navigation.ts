import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';
import { getHomeId } from '../../../fs/seed';
import { hasPermission } from '../../../fs/permissions';

export const pwd: CommandHandler = (_args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const store = useVFSStore.getState();
  const path = store.getAbsolutePath(cwdId);
  [path].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const cd: CommandHandler = (args, cwdId, updateCwd, _clearHistory, _appState, process) => {
  const store = useVFSStore.getState();
  const username = _appState?.effectiveUser || getAuthContext().username;
  const HOME_ID = getHomeId(username);
  
  if (args.length === 0) {
    updateCwd(HOME_ID);
    [].forEach((line: string) => process.stdout.writeLine(line)); return {};
  }

  let path = args[0];
  
  if (path === '~') {
    updateCwd(HOME_ID);
    [].forEach((line: string) => process.stdout.writeLine(line)); return {};
  }
  
  if (path.startsWith('~/')) {
    path = path.replace('~', store.getAbsolutePath(HOME_ID));
  }

  const node = store.resolveRelativePath(cwdId, path);
  
  if (!node) {
    [`cd: ${args[0]}: No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }
  
  if (node.type !== 'directory') {
    [`cd: ${args[0]}: Not a directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }
  
  if (!hasPermission(store.map, node.id, 'execute', username)) {
    [`cd: ${args[0]}: Permission denied`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  updateCwd(node.id);
  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const ls: CommandHandler = async (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readdir } = await import('../../../fs/operations');

  let showHidden = false;
  let longFormat = false;
  let targetPath = '.';

  for (const arg of args) {
    if (arg.startsWith('-')) {
      if (arg.includes('a')) showHidden = true;
      if (arg.includes('l')) longFormat = true;
    } else {
      targetPath = arg;
    }
  }

  const cwdPath = await getAbsolutePathAsync(cwdId);
  const targetNode = await resolveRelativePathAsync(cwdPath, targetPath);
  
  if (!targetNode) {
    process.stderr.writeLine(`ls: cannot access '${targetPath}': No such file or directory`); 
    return {};
  }
  
  let children: any[] = [];
  if (targetNode.type === 'directory') {
    const targetAbsPath = await getAbsolutePathAsync(targetNode.id);
    children = await readdir(targetAbsPath);
  } else {
    children = [targetNode];
  }
  
  if (!showHidden && targetNode.type === 'directory') {
    children = children.filter(c => !c.name.startsWith('.'));
  }

  if (longFormat) {
    const outputLines = children.map(c => {
      const typeChar = c.type === 'directory' ? 'd' : '-';
      let perms = c.permissions ? c.permissions.toString(8) : (c.type === 'directory' ? '755' : '644');
      if (perms.length < 3) perms = perms.padStart(3, '0');
      
      const rwx = perms.split('').slice(-3).map((digit: string) => {
        const val = parseInt(digit, 8);
        return (val & 4 ? 'r' : '-') + (val & 2 ? 'w' : '-') + (val & 1 ? 'x' : '-');
      }).join('');
      
      const permString = `${typeChar}${rwx}`;
      const links = 1;
      const owner = c.ownerId || 'user';
      const group = c.groupId || 'user';
      const size = c.sizeBytes || 0;
      
      const dateObj = new Date(c.modifiedAt);
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' ' + 
                      dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const nameStr = c.type === 'directory' ? `\x1b[1;34m${c.name}\x1b[0m` : c.name;
      
      return `${permString} ${links} ${owner} ${group} ${size.toString().padStart(5, ' ')} ${dateStr} ${nameStr}`;
    });
    
    outputLines.forEach((line: string) => process.stdout.writeLine(line)); return {};
  }

  const items = children.map(c => {
    if (c.type === 'directory') return `\x1b[1;34m${c.name}/\x1b[0m`;
    return c.name;
  });

  if (items.length > 0) {
    const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
    items.sort((a, b) => stripAnsi(a).toLowerCase().localeCompare(stripAnsi(b).toLowerCase()));

    const terminalWidth = 100;
    const maxLen = Math.max(...items.map(s => stripAnsi(s).length));
    const colWidth = maxLen + 2; 
    const cols = Math.max(1, Math.floor(terminalWidth / colWidth));
    const rows = Math.ceil(items.length / cols);

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
      process.stdout.writeLine(line.trimEnd());
    }
  }

  return {};
};
