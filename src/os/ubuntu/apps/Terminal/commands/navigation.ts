import type { CommandHandler } from './types';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';
import { getHomeId } from '../../../fs/seed';
import { hasPermission } from '../../../fs/permissions';

export const pwd: CommandHandler = async (_args, env, streams) => {
  const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
  const path = await getAbsolutePathAsync(env.cwdId);
  [path].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const cd: CommandHandler = async (args, env, streams) => {
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const username = env.effectiveUser || getAuthContext().username;
  const HOME_ID = getHomeId(username);
  
  if (args.length === 0) {
    env.cwdId = HOME_ID;
    env.cwdPath = await getAbsolutePathAsync(HOME_ID);
    return 0;
  }

  let path = args[0];
  
  if (path === '~') {
    env.cwdId = HOME_ID;
    env.cwdPath = await getAbsolutePathAsync(HOME_ID);
    return 0;
  }
  
  if (path.startsWith('~/')) {
    const homePath = await getAbsolutePathAsync(HOME_ID);
    path = path.replace('~', homePath);
  }

  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  const node = await resolveRelativePathAsync(cwdPath, path);
  
  if (!node) {
    [`cd: ${args[0]}: No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }
  
  if (node.type !== 'directory') {
    [`cd: ${args[0]}: Not a directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }
  
  if (!hasPermission(node, 'execute', username)) {
    [`cd: ${args[0]}: Permission denied`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  env.cwdId = node.id;
  env.cwdPath = await getAbsolutePathAsync(node.id);
  return 0;
};

export const ls: CommandHandler = async (args, env, streams) => {
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

  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  const targetNode = await resolveRelativePathAsync(cwdPath, targetPath);
  
  if (!targetNode) {
    streams.stderr.writeLine(`ls: cannot access '${targetPath}': No such file or directory`); 
    return 1;
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
      
      const isExecutable = c.type !== 'directory' && (c.permissions ? (c.permissions & 1) || (c.permissions & 8) || (c.permissions & 64) : false);
      let nameStr = c.name;
      if (c.type === 'directory') nameStr = `\x1b[1;34m${c.name}\x1b[0m`;
      else if (c.type === 'symlink') nameStr = `\x1b[1;36m${c.name}\x1b[0m`;
      else if (isExecutable) nameStr = `\x1b[1;32m${c.name}\x1b[0m`;
      
      return `${permString} ${links} ${owner} ${group} ${size.toString().padStart(5, ' ')} ${dateStr} ${nameStr}`;
    });
    
    outputLines.forEach((line: string) => streams.stdout.writeLine(line)); return 0;
  }

  const items = children.map(c => {
    const isExecutable = c.type !== 'directory' && (c.permissions ? (c.permissions & 1) || (c.permissions & 8) || (c.permissions & 64) : false);
    if (c.type === 'directory') return `\x1b[1;34m${c.name}/\x1b[0m`;
    if (c.type === 'symlink') return `\x1b[1;36m${c.name}\x1b[0m`;
    if (isExecutable) return `\x1b[1;32m${c.name}\x1b[0m`;
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
      streams.stdout.writeLine(line.trimEnd());
    }
  }

  return 0;
};
