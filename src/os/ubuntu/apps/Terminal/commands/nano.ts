import type { CommandHandler } from './types';

/**
 * Handle the nano/vi command: validate args, resolve or create the file,
 * and trigger the interactive NanoEditor.
 */
export const nano: CommandHandler = async (args, env, streams) => {
  const commandName = env.positionalArgs[0] || 'nano';

  if (args.length === 0) {
    streams.stderr.writeLine(`${commandName}: missing filename`);
    return 1;
  }

  const targetName = args[0];
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { writeFile } = await import('../../../fs/operations');
  
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
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
      streams.stderr.writeLine(`${commandName}: cannot create '${targetName}': No such file or directory`);
      return 1;
    }
    if (parentNode.type !== 'directory') {
      streams.stderr.writeLine(`${commandName}: cannot create '${targetName}': Not a directory`);
      return 1;
    }

    const parentAbsPath = await getAbsolutePathAsync(parentNode.id);
    const newFilePath = parentAbsPath === '/' ? '/' + destName : parentAbsPath + '/' + destName;

    try {
      await writeFile(newFilePath, new Blob([]));
      node = await resolveRelativePathAsync(cwdPath, targetName);
    } catch (err: any) {
      streams.stderr.writeLine(`${commandName}: ${err.message}`);
      return 1;
    }
  }

  if (!node) {
    streams.stderr.writeLine(`${commandName}: failed to create file`);
    return 1;
  }

  if (node.type === 'directory') {
    streams.stderr.writeLine(`${commandName}: ${targetName} is a directory`);
    return 1;
  }

  // Set the environment to trigger the interactive editor mode in TerminalSession
  env.interactiveApp = 'nano';
  env.nanoFileId = node.id;
  return 0;
};
