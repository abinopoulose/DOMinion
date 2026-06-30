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
    // Create the file
    const { error: err } = store.createNode(cwdId, targetName, 'file');
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
