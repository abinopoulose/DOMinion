import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';
import { HOME_ID } from '../../../core/vfs/seed';

export const pwd: CommandHandler = (args, cwdId) => {
  const store = useVFSStore.getState();
  const path = store.getAbsolutePath(cwdId);
  return { output: [path] };
};

export const cd: CommandHandler = (args, cwdId, updateCwd) => {
  const store = useVFSStore.getState();
  
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

  updateCwd(node.id);
  return { output: [] };
};

export const ls: CommandHandler = (args, cwdId) => {
  const store = useVFSStore.getState();
  let showHidden = false;
  let targetPath = '.';

  // Parse args (very basic)
  for (const arg of args) {
    if (arg === '-a' || arg === '-al' || arg === '-la') {
      showHidden = true;
    } else if (!arg.startsWith('-')) {
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

  let children = store.getChildren(targetId);
  
  if (!showHidden) {
    children = children.filter(c => !c.name.startsWith('.'));
  }

  const outputStr = children.map(c => {
    if (c.type === 'directory') {
      return `<span style="color: #62a0ea; font-weight: bold;">${c.name}/</span>`;
    }
    return c.name;
  }).join('  ');

  return { output: outputStr ? [outputStr] : [] };
};
