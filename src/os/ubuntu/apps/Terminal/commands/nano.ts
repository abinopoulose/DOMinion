import { useVFSStore } from '../../../store';

/**
 * Result of attempting to open nano/vi on a file.
 * If successful, returns the fileId to pass to NanoEditor.
 * If failed, returns an error CommandResult for display.
 */
export interface NanoOpenResult {
  fileId?: string;
  error?: {
    output: string[];
    isError: boolean;
  };
}

/**
 * Handle the nano/vi command: validate args, resolve or create the file,
 * and return the fileId for the NanoEditor to open.
 *
 * This is a special-case handler — NOT registered in commandRegistry
 * because it triggers an interactive mode, not a simple CommandResult.
 *
 * @param commandName - 'nano' or 'vi' (for error messages)
 * @param args - Command arguments (expected: exactly one filename)
 * @param cwdId - Current working directory ID
 */
export function handleNano(commandName: string, args: string[], cwdId: string): NanoOpenResult {
  if (args.length === 0) {
    return {
      error: { output: [`${commandName}: missing filename`], isError: true },
    };
  }

  const targetName = args[0];
  const store = useVFSStore.getState();
  let node = store.resolveRelativePath(cwdId, targetName);

  if (!node) {
    let parentId = cwdId;
    let fileName = targetName;
    if (targetName.includes('/')) {
      const parts = targetName.split('/');
      fileName = parts.pop()!;
      const parentPath = parts.join('/') || (targetName.startsWith('/') ? '/' : '.');
      const parentNode = store.resolveRelativePath(cwdId, parentPath);
      if (!parentNode) {
        return { error: { output: [`${commandName}: cannot create '${targetName}': No such file or directory`], isError: true } };
      }
      if (parentNode.type !== 'directory') {
        return { error: { output: [`${commandName}: cannot create '${targetName}': Not a directory`], isError: true } };
      }
      parentId = parentNode.id;
    }

    // Create the file
    const { error: err } = store.createNode(parentId, fileName, 'file');
    if (err) {
      return {
        error: { output: [`${commandName}: ${err}`], isError: true },
      };
    }
    node = store.resolveRelativePath(cwdId, targetName);
  }

  if (!node) {
    return {
      error: { output: [`${commandName}: failed to create file`], isError: true },
    };
  }

  if (node.type === 'directory') {
    return {
      error: { output: [`${commandName}: ${targetName} is a directory`], isError: true },
    };
  }

  return { fileId: node.id };
}
