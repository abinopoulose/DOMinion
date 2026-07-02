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

export const ls: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const store = useVFSStore.getState();
  let showHidden = false;
  let longFormat = false;
  let targetPath = '.';

  // Parse args (very basic)
  for (const arg of args) {
    if (arg.startsWith('-')) {
      if (arg.includes('a')) showHidden = true;
      if (arg.includes('l')) longFormat = true;
    } else {
      targetPath = arg;
    }
  }

  let targetId = cwdId;
  
  if (targetPath !== '.') {
    const node = store.resolveRelativePath(cwdId, targetPath);
    if (!node) {
      [`ls: cannot access '${targetPath}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
    targetId = node.id;
  }
  
  const username = _appState?.effectiveUser || getAuthContext().username;
  if (!hasPermission(store.map, targetId, 'read', username)) {
    [`ls: cannot open directory '${targetPath}': Permission denied`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  let children = store.getChildren(targetId);
  
  if (!showHidden) {
    children = children.filter(c => !c.name.startsWith('.'));
  }

  if (longFormat) {
    const outputLines = children.map(c => {
      // Convert octal string like "755" to rwx string
      const typeChar = c.type === 'directory' ? 'd' : '-';
      const perms = c.permissions || (c.type === 'directory' ? '755' : '644');
      const rwx = perms.split('').map(digit => {
        const val = parseInt(digit, 8);
        return (val & 4 ? 'r' : '-') + (val & 2 ? 'w' : '-') + (val & 1 ? 'x' : '-');
      }).join('');
      
      const permString = `${typeChar}${rwx}`;
      const links = c.type === 'directory' ? c.children.length + 2 : 1;
      const owner = c.owner || 'user';
      const group = c.group || 'user';
      let size = 0;
      if (c.type === 'directory') size = 4096;
      else if (c.type !== 'proc_file' && c.type !== 'character_device') {
        size = new Blob([c.content]).size;
      }
      
      const dateObj = new Date(c.modifiedAt);
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' ' + 
                      dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const nameStr = c.type === 'directory' ? `\x1b[1;34m${c.name}\x1b[0m` : c.name;
      
      return `${permString} ${links} ${owner} ${group} ${size.toString().padStart(5, ' ')} ${dateStr} ${nameStr}`;
    });
    
    // In terminal output, we can join with \n to make them separate lines, 
    // or just return the array and TerminalOutput will render each line.
    outputLines.forEach((line: string) => process.stdout.writeLine(line)); return {};
  }

  const outputStr = children.map(c => {
    if (c.type === 'directory') {
      return `\x1b[1;34m${c.name}/\x1b[0m`;
    }
    return c.name;
  }).join('  ');

  if (outputStr) {
    [outputStr].forEach((line: string) => process.stdout.writeLine(line));
  }
  return {};
};
