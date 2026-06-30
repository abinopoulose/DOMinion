import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';
import { getHomeId } from '../../../fs/seed';
import { hasPermission } from '../../../fs/permissions';

export const pwd: CommandHandler = (_args, cwdId) => {
  const store = useVFSStore.getState();
  const path = store.getAbsolutePath(cwdId);
  return { output: [path] };
};

export const cd: CommandHandler = (args, cwdId, updateCwd) => {
  const store = useVFSStore.getState();
  const username = getAuthContext().username;
  const HOME_ID = getHomeId(username);
  
  if (args.length === 0) {
    updateCwd(HOME_ID);
    return { output: [] };
  }

  let path = args[0];
  
  if (path === '~') {
    updateCwd(HOME_ID);
    return { output: [] };
  }
  
  if (path.startsWith('~/')) {
    path = path.replace('~', store.getAbsolutePath(HOME_ID));
  }

  const node = store.resolveRelativePath(cwdId, path);
  
  if (!node) {
    return { output: [`cd: ${args[0]}: No such file or directory`], isError: true };
  }
  
  if (node.type !== 'directory') {
    return { output: [`cd: ${args[0]}: Not a directory`], isError: true };
  }
  
  if (!hasPermission(store.map, node.id, 'execute', username)) {
    return { output: [`cd: ${args[0]}: Permission denied`], isError: true };
  }

  updateCwd(node.id);
  return { output: [] };
};

export const ls: CommandHandler = (args, cwdId) => {
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
      return { output: [`ls: cannot access '${targetPath}': No such file or directory`], isError: true };
    }
    targetId = node.id;
  }
  
  const username = getAuthContext().username;
  if (!hasPermission(store.map, targetId, 'read', username)) {
    return { output: [`ls: cannot open directory '${targetPath}': Permission denied`], isError: true };
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
      const size = c.type === 'directory' ? 4096 : new Blob([c.content]).size;
      
      const dateObj = new Date(c.modifiedAt);
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' ' + 
                      dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const nameStr = c.type === 'directory' ? `<span style="color: #62a0ea; font-weight: bold;">${c.name}</span>` : c.name;
      
      return `${permString} ${links} ${owner} ${group} ${size.toString().padStart(5, ' ')} ${dateStr} ${nameStr}`;
    });
    
    // In terminal output, we can join with \n to make them separate lines, 
    // or just return the array and TerminalOutput will render each line.
    return { output: outputLines };
  }

  const outputStr = children.map(c => {
    if (c.type === 'directory') {
      return `<span style="color: #62a0ea; font-weight: bold;">${c.name}/</span>`;
    }
    return c.name;
  }).join('  ');

  return { output: outputStr ? [outputStr] : [] };
};
