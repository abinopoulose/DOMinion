import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';

export const cat: CommandHandler = (args, cwdId) => {
  if (args.length === 0) return { output: ['cat: missing operand'], isError: true };
  
  const store = useVFSStore.getState();
  const node = store.resolveRelativePath(cwdId, args[0]);

  if (!node) return { output: [`cat: ${args[0]}: No such file or directory`], isError: true };
  if (node.type === 'directory') return { output: [`cat: ${args[0]}: Is a directory`], isError: true };
  
  return { output: node.content.split('\n') };
};

export const touch: CommandHandler = (args, cwdId) => {
  if (args.length === 0) return { output: ['touch: missing file operand'], isError: true };
  
  const store = useVFSStore.getState();
  const name = args[0];
  
  if (name.includes('/')) return { output: ['touch: creating files in subdirectories is not yet supported'], isError: true };

  const node = store.resolveRelativePath(cwdId, name);
  if (node) {
    // If it exists, Unix touch updates timestamp. Since we don't display it yet, this is a no-op conceptually, 
    // but we can just update content with its own content to trigger a modifiedAt update
    store.updateContent(node.id, node.content);
    return { output: [] };
  }

  const err = store.createNode(cwdId, name, 'file', '');
  if (err) return { output: [`touch: ${err}`], isError: true };
  
  return { output: [] };
};

export const mkdir: CommandHandler = (args, cwdId) => {
  if (args.length === 0) return { output: ['mkdir: missing operand'], isError: true };
  
  const store = useVFSStore.getState();
  const name = args[0];
  
  if (name.includes('/')) return { output: ['mkdir: creating nested directories is not yet supported'], isError: true };

  const err = store.createNode(cwdId, name, 'directory');
  if (err) return { output: [`mkdir: cannot create directory '${name}': ${err}`], isError: true };
  
  return { output: [] };
};

export const rm: CommandHandler = (args, cwdId) => {
  if (args.length === 0) return { output: ['rm: missing operand'], isError: true };
  
  const store = useVFSStore.getState();
  let recursive = false;
  let targetName = '';

  for (const arg of args) {
    if (arg === '-r' || arg === '-rf') recursive = true;
    else targetName = arg;
  }

  if (!targetName) return { output: ['rm: missing operand'], isError: true };
  
  const node = store.resolveRelativePath(cwdId, targetName);
  if (!node) return { output: [`rm: cannot remove '${targetName}': No such file or directory`], isError: true };

  if (node.type === 'directory' && !recursive) {
    return { output: [`rm: cannot remove '${targetName}': Is a directory`], isError: true };
  }

  const err = store.deleteNode(node.id);
  if (err) return { output: [`rm: cannot remove '${targetName}': ${err}`], isError: true };
  
  return { output: [] };
};
