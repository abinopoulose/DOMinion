// import removed: useVFSStore

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
 * @param env.cwdId - Current working directory ID
 */
export async function handleNano(commandName: string, args: string[], cwdId: string): Promise<NanoOpenResult> {
  if (args.length === 0) {
    return {
      error: { output: [`${commandName}: missing filename`], isError: true },
    };
  }

  const targetName = args[0];
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { writeFile } = await import('../../../fs/operations');
  
  const cwdPath = await getAbsolutePathAsync(cwdId);
  let node = await resolveRelativePathAsync(cwdPath, targetName);

  if (!node) {
    let destName = targetName;
    let destParentPath = '.';
    if (targetName.includes('/')) {
      const parts = targetName.split('/');
      destName = parts.pop()!;
      destParentPath = parts.join('/') || (targetName.startsWith('/') ? '/' : '.');
    }

    const parentNode = await resolveRelativePathAsync(cwdPath, destParentPath);
    if (!parentNode) {
      return { error: { output: [`${commandName}: cannot create '${targetName}': No such file or directory`], isError: true } };
    }
    if (parentNode.type !== 'directory') {
      return { error: { output: [`${commandName}: cannot create '${targetName}': Not a directory`], isError: true } };
    }

    const parentAbsPath = await getAbsolutePathAsync(parentNode.id);
    const newFilePath = parentAbsPath === '/' ? '/' + destName : parentAbsPath + '/' + destName;

    try {
      await writeFile(newFilePath, new Blob([]));
      node = await resolveRelativePathAsync(cwdPath, targetName);
    } catch (err: any) {
      return {
        error: { output: [`${commandName}: ${err.message}`], isError: true },
      };
    }
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
