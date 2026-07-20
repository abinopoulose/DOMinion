import type { CommandHandler } from './types';
// import removed: useVFSStore
import { getAuthContext } from '../../../store/useUbuntuVFSStore';

import { parseArgs } from '../commandParser';

export const cat: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) {
    const input = streams.stdin.readAll();
    if (input) {
      input.split('\n').forEach((line: string) => streams.stdout.writeLine(line));
    }
    return 0;
  }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readFile } = await import('../../../fs/operations');

  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  const targetNode = await resolveRelativePathAsync(cwdPath, args[0]);

  if (!targetNode) {
    streams.stderr.writeLine(`cat: ${args[0]}: No such file or directory`);
    return 1;
  }
  
  if (targetNode.type === 'directory') {
    streams.stderr.writeLine(`cat: ${args[0]}: Is a directory`);
    return 1;
  }
  
  const targetAbsPath = await getAbsolutePathAsync(targetNode.id);
  try {
    const blob = await readFile(targetAbsPath);
    const text = await blob.text();
    text.split('\n').forEach((line: string) => streams.stdout.writeLine(line));
  } catch (err: any) {
    streams.stderr.writeLine(`cat: ${args[0]}: ${err.message}`);
    return 1;
  }
  return 0;
};

export const touch: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) { ['touch: missing file operand'].forEach((line: string) => streams.stderr.writeLine(line)); return 1; }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { writeFile, readFile } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  const name = args[0];
  const node = await resolveRelativePathAsync(cwdPath, name);
  
  if (node) {
    try {
      const targetAbsPath = await getAbsolutePathAsync(node.id);
      const blob = await readFile(targetAbsPath);
      await writeFile(targetAbsPath, blob);
    } catch(e) {}
    return 0;
  }

  const destParts = name.split('/');
  const destName = destParts.pop()!;
  const destParentPath = destParts.length > 0 ? destParts.join('/') : '.';
  
  const parentNode = await resolveRelativePathAsync(cwdPath, destParentPath);
  if (!parentNode) {
    streams.stderr.writeLine(`touch: cannot touch '${name}': No such file or directory`); return 1;
  }
  
  const parentAbsPath = await getAbsolutePathAsync(parentNode.id);
  const newFilePath = parentAbsPath === '/' ? '/' + destName : parentAbsPath + '/' + destName;
  
  try {
    await writeFile(newFilePath, new Blob([]));
  } catch (err: any) {
    streams.stderr.writeLine(`touch: ${err.message}`);
    return 1;
  }
  return 0;
};

export const mkdir: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) { ['mkdir: missing operand'].forEach((line: string) => streams.stderr.writeLine(line)); return 1; }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { mkdir: mkdirOp } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  const name = args[0];
  
  const destParts = name.split('/');
  const destName = destParts.pop()!;
  const destParentPath = destParts.length > 0 ? destParts.join('/') : '.';
  
  const parentNode = await resolveRelativePathAsync(cwdPath, destParentPath);
  if (!parentNode) {
    streams.stderr.writeLine(`mkdir: cannot create directory '${name}': No such file or directory`); return 1;
  }
  
  const parentAbsPath = await getAbsolutePathAsync(parentNode.id);
  const newDirPath = parentAbsPath === '/' ? '/' + destName : parentAbsPath + '/' + destName;
  
  try {
    await mkdirOp(newDirPath);
  } catch (err: any) {
    streams.stderr.writeLine(`mkdir: cannot create directory '${name}': ${err.message}`);
    return 1;
  }
  return 0;
};

/**
 * rm — Remove files or directories.
 *
 * Usage:
 *   rm [flags] <file...>
 *
 * Flags:
 *   -r, -R, --recursive   Remove directories and their contents recursively
 *   -f, --force            Ignore nonexistent files (no error)
 *
 * Supports combined flags (-rf, -Rf) and multiple file operands.
 */
export const rm: CommandHandler = async (args, env, streams) => {
  const { flags, positional } = parseArgs(args);
  const recursive = flags.r || flags.R;
  const force = flags.f;

  if (positional.length === 0) {
    if (force) return 0;
    ['rm: missing operand'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { unlink, rmdir } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);

  for (const target of positional) {
    const node = await resolveRelativePathAsync(cwdPath, target);

    if (!node) {
      if (force) continue;
      streams.stderr.writeLine(`rm: cannot remove '${target}': No such file or directory`); return 1;
    }

    if (node.type === 'directory' && !recursive) {
      streams.stderr.writeLine(`rm: cannot remove '${target}': Is a directory`); return 1;
    }

    const absPath = await getAbsolutePathAsync(node.id);
    try {
      if (node.type === 'directory') {
        await rmdir(absPath, { recursive: true });
      } else {
        await unlink(absPath);
      }
    } catch (err: any) {
      streams.stderr.writeLine(`rm: cannot remove '${target}': ${err.message}`); return 1;
    }
  }

  return 0;
};

export const chmod: CommandHandler = async (args, env, streams) => {
  if (args.length < 2) { ['chmod: missing operand'].forEach((line: string) => streams.stderr.writeLine(line)); return 1; }
  
  const permissions = parseInt(args[0], 8);
  const targetName = args[1];
  
  if (isNaN(permissions) || args[0].length !== 3) {
    streams.stderr.writeLine(`chmod: invalid mode: '${args[0]}'`); return 1;
  }

  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { chmod: chmodOp } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  const node = await resolveRelativePathAsync(cwdPath, targetName);
  
  if (!node) {
    streams.stderr.writeLine(`chmod: cannot access '${targetName}': No such file or directory`); return 1;
  }
  
  const username = env?.effectiveUser || getAuthContext().username;

  if (username !== 'root' && username !== node.ownerId) {
    streams.stderr.writeLine(`chmod: changing permissions of '${targetName}': Operation not permitted`); return 1;
  }

  try {
    const absPath = await getAbsolutePathAsync(node.id);
    await chmodOp(absPath, permissions);
  } catch (err: any) {
    streams.stderr.writeLine(`chmod: ${err.message}`); return 1;
  }
  
  return 0;
};

export const chown: CommandHandler = async (args, env, streams) => {
  if (args.length < 2) { ['chown: missing operand'].forEach((line: string) => streams.stderr.writeLine(line)); return 1; }
  const username = env?.effectiveUser || getAuthContext().username;

  if (username !== 'root') {
    ['chown: changing ownership: Operation not permitted'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const ownerGroup = args[0];
  const targetName = args[1];
  const [owner, group] = ownerGroup.split(':');
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { chown: chownOp } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  const node = await resolveRelativePathAsync(cwdPath, targetName);
  
  if (!node) {
    streams.stderr.writeLine(`chown: cannot access '${targetName}': No such file or directory`); return 1;
  }
  
  try {
    const absPath = await getAbsolutePathAsync(node.id);
    await chownOp(absPath, owner || node.ownerId, group || node.groupId);
  } catch (err: any) {
    streams.stderr.writeLine(`chown: ${err.message}`); return 1;
  }
  
  return 0;
};

/**
 * cp — Copy files and directories.
 *
 * Usage:
 *   cp <source> <dest>          Copy file to dest (or into dest dir)
 *   cp -r <source> <dest>       Copy directory recursively
 *
 * Behaviours:
 *   - File → File: Create new file at dest with source's content
 *   - File → existing Dir: Copy file into that directory, keeping original name
 *   - Dir (no -r): Error
 *   - Dir (-r): Deep copy using VFS duplicateNode
 *   - source === dest: Error
 */
export const cp: CommandHandler = async (args, env, streams) => {
  const { flags, positional } = parseArgs(args);
  const recursive = flags.r || flags.R;

  if (positional.length < 2) {
    ['cp: missing file operand'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const sourcePath = positional[0];
  const destPath = positional[1];

  const { resolveRelativePathAsync, getAbsolutePathAsync } = await import('../../../fs/pathResolver');
  const { readFile, writeFile, stat, readdir, mkdir } = await import('../../../fs/operations');

  const cwdAbs = await getAbsolutePathAsync(env.cwdId);

  // Resolve source
  const sourceNode = await resolveRelativePathAsync(cwdAbs, sourcePath);
  if (!sourceNode) {
    [`cp: cannot stat '${sourcePath}': No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  // Check if source is a directory without -r
  if (sourceNode.type === 'directory' && !recursive) {
    [`cp: -r not specified; omitting directory '${sourcePath}'`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const destNode = await resolveRelativePathAsync(cwdAbs, destPath);
  const sourceAbsPath = await getAbsolutePathAsync(sourceNode.id);

  async function copyRecursive(srcAbs: string, destAbs: string) {
    const node = await stat(srcAbs);
    if (node.type === 'directory') {
      try { await mkdir(destAbs); } catch(e) {}
      const children = await readdir(srcAbs);
      for (const child of children) {
        await copyRecursive(srcAbs === '/' ? '/' + child.name : srcAbs + '/' + child.name, destAbs === '/' ? '/' + child.name : destAbs + '/' + child.name);
      }
    } else {
      const blob = await readFile(srcAbs);
      await writeFile(destAbs, blob);
    }
  }

  try {
    if (destNode) {
      if (destNode.id === sourceNode.id) {
        [`cp: '${sourcePath}' and '${destPath}' are the same file`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }
      
      const destAbsPath = await getAbsolutePathAsync(destNode.id);

      if (destNode.type === 'directory') {
        const finalDestPath = destAbsPath === '/' ? '/' + sourceNode.name : destAbsPath + '/' + sourceNode.name;
        await copyRecursive(sourceAbsPath, finalDestPath);
      } else {
        if (sourceNode.type === 'directory') {
          [`cp: cannot overwrite non-directory '${destPath}' with directory '${sourcePath}'`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
        }
        await copyRecursive(sourceAbsPath, destAbsPath);
      }
    } else {
      // Destination doesn't exist, resolve parent
      const destParts = destPath.split('/');
      const destName = destParts.pop()!;
      const destParentPath = destParts.length > 0 ? destParts.join('/') : '.';
      
      const destParentNode = await resolveRelativePathAsync(cwdAbs, destParentPath);
      if (!destParentNode || destParentNode.type !== 'directory') {
        [`cp: cannot create '${destPath}': No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }
      
      const destParentAbs = await getAbsolutePathAsync(destParentNode.id);
      const finalDestPath = destParentAbs === '/' ? '/' + destName : destParentAbs + '/' + destName;
      await copyRecursive(sourceAbsPath, finalDestPath);
    }
  } catch (err: any) {
    [`cp: ${err.message}`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  return 0;
};

/**
 * mv — Move (rename) files and directories.
 *
 * Usage:
 *   mv <source> <dest>
 *
 * Behaviours:
 *   - Dest doesn't exist, dest parent exists: Move + rename
 *   - Dest is an existing directory: Move source into that directory
 *   - Dest is an existing file: Error (overwrite not supported in this simulation)
 *   - Works for both files and directories (VFS moveNode handles trees)
 *   - Circular-move protection is built into fs/operations.ts
 */
export const mv: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);

  if (positional.length < 2) {
    ['mv: missing file operand'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const sourcePath = positional[0];
  const destPath = positional[1];
  
  const { resolveRelativePathAsync, getAbsolutePathAsync } = await import('../../../fs/pathResolver');
  const { rename } = await import('../../../fs/operations');

  const cwdAbs = await getAbsolutePathAsync(env.cwdId);

  // Resolve source
  const sourceNode = await resolveRelativePathAsync(cwdAbs, sourcePath);
  if (!sourceNode) {
    [`mv: cannot stat '${sourcePath}': No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const destNode = await resolveRelativePathAsync(cwdAbs, destPath);
  const sourceAbsPath = await getAbsolutePathAsync(sourceNode.id);

  try {
    if (destNode) {
      if (destNode.id === sourceNode.id) {
        [`mv: '${sourcePath}' and '${destPath}' are the same file`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }

      const destAbsPath = await getAbsolutePathAsync(destNode.id);

      if (destNode.type === 'directory') {
        const finalDestPath = destAbsPath === '/' ? '/' + sourceNode.name : destAbsPath + '/' + sourceNode.name;
        await rename(sourceAbsPath, finalDestPath);
      } else {
        if (sourceNode.type === 'directory') {
          [`mv: cannot overwrite non-directory '${destPath}' with directory '${sourcePath}'`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
        }
        await rename(sourceAbsPath, destAbsPath);
      }
    } else {
      // Destination doesn't exist, resolve parent
      const destParts = destPath.split('/');
      const destName = destParts.pop()!;
      const destParentPath = destParts.length > 0 ? destParts.join('/') : '.';
      
      const destParentNode = await resolveRelativePathAsync(cwdAbs, destParentPath);
      if (!destParentNode || destParentNode.type !== 'directory') {
        [`mv: cannot move '${sourcePath}' to '${destPath}': No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }
      
      const destParentAbs = await getAbsolutePathAsync(destParentNode.id);
      const finalDestPath = destParentAbs === '/' ? '/' + destName : destParentAbs + '/' + destName;
      await rename(sourceAbsPath, finalDestPath);
    }
  } catch (err: any) {
    [`mv: ${err.message}`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  return 0;
};

/**
 * rmdir — Remove empty directories.
 *
 * Usage:
 *   rmdir <directory...>
 *
 * Only removes directories that have no children.
 * For non-empty directories, use `rm -r` instead.
 */
export const rmdir: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);
  if (positional.length === 0) {
    ['rmdir: missing operand'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { rmdir: rmdirOp } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);

  for (const target of positional) {
    const node = await resolveRelativePathAsync(cwdPath, target);
    if (!node) {
      streams.stderr.writeLine(`rmdir: failed to remove '${target}': No such file or directory`); return 1;
    }
    if (node.type !== 'directory') {
      streams.stderr.writeLine(`rmdir: failed to remove '${target}': Not a directory`); return 1;
    }

    try {
      const absPath = await getAbsolutePathAsync(node.id);
      await rmdirOp(absPath, { recursive: false });
    } catch (err: any) {
      streams.stderr.writeLine(`rmdir: failed to remove '${target}': ${err.message}`); return 1;
    }
  }
  return 0;
};

export const find: CommandHandler = async (args, env, streams) => {
  const { options, positional } = parseArgs(args, ['name', 'type']);
  const searchPath = positional.length > 0 ? positional[0] : '.';

  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  const startNode = await resolveRelativePathAsync(cwdPath, searchPath);
  
  if (!startNode) {
    streams.stderr.writeLine(`find: '${searchPath}': No such file or directory`); return 1;
  }
  
  let nameRegex: RegExp | null = null;
  if (options.name) {
    const escaped = options.name
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    nameRegex = new RegExp(`^${escaped}$`);
  }

  const typeFilter = options.type; 
  const matches: string[] = [];
  const { stat, readdir } = await import('../../../fs/operations');

  async function walkAsync(nodeId: string, currentPath: string) {
    const absPath = await getAbsolutePathAsync(nodeId);
    const node = await stat(absPath);
    
    let match = true;
    if (typeFilter === 'f' && node.type !== 'file') match = false;
    if (typeFilter === 'd' && node.type !== 'directory') match = false;
    if (nameRegex && !nameRegex.test(node.name)) match = false;
    
    if (match) matches.push(currentPath);
    
    if (node.type === 'directory') {
      const children = await readdir(absPath);
      for (const child of children) {
        await walkAsync(child.id, currentPath === '/' || currentPath === '.' ? currentPath + '/' + child.name : currentPath + '/' + child.name);
      }
    }
  }

  await walkAsync(startNode.id, searchPath);
  matches.forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const ln: CommandHandler = async (args, env, streams) => {
  const { flags, positional } = parseArgs(args);
  const isSymlink = flags.s;
  if (positional.length < 2) { ['ln: missing operand'].forEach((line: string) => streams.stderr.writeLine(line)); return 1; }
  
  const targetPath = positional[0];
  const linkName = positional[1];
  
  const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
  const { symlink } = await import('../../../fs/operations');
  
  if (isSymlink) {
    try {
      const cwdPath = await getAbsolutePathAsync(env.cwdId);
      const linkAbsPath = cwdPath === '/' ? '/' + linkName : cwdPath + '/' + linkName;
      // Note: A true robust ln implementation resolves parents, but for now we simplify.
      await symlink(targetPath, linkAbsPath);
    } catch (err: any) {
      streams.stderr.writeLine(`ln: ${err.message}`);
    }
  } else {
    streams.stderr.writeLine(`ln: hard links not currently supported`);
    return 1;
  }
  return 0;
};


export const du: CommandHandler = async (args, env, streams) => {
  const { flags, positional } = parseArgs(args);
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { stat, readdir } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  const targets = positional.length === 0 ? ['.'] : positional;
  
  const formatSize = (bytes: number) => {
    if (!flags.h) return Math.ceil(bytes / 1024).toString(); // Default 1K blocks
    if (bytes < 1024) return bytes + 'B';
    const k = bytes / 1024;
    if (k < 1024) return k.toFixed(1) + 'K';
    const m = k / 1024;
    if (m < 1024) return m.toFixed(1) + 'M';
    const g = m / 1024;
    return g.toFixed(1) + 'G';
  };

  const calculateSize = async (absPath: string, name: string): Promise<number> => {
    try {
      const nodeStat = await stat(absPath);
      let totalSize = nodeStat.sizeBytes || 0;
      
      if (!flags.s) {
        streams.stdout.writeLine(`${formatSize(totalSize)}\t${name}`);
      }
      
      if (nodeStat.type === 'directory') {
        const children = await readdir(absPath);
        for (const child of children) {
          const childPath = absPath === '/' ? '/' + child : absPath + '/' + child;
          const childName = name === '.' ? './' + child : name + '/' + child;
          totalSize += await calculateSize(childPath, childName);
        }
      }
      
      return totalSize;
    } catch (err) {
      streams.stderr.writeLine(`du: cannot access '${name}': No such file or directory`);
      return 0;
    }
  };

  for (const target of targets) {
    const node = await resolveRelativePathAsync(cwdPath, target);
    if (!node) {
      streams.stderr.writeLine(`du: cannot access '${target}': No such file or directory`);
      continue;
    }
    const absPath = await getAbsolutePathAsync(node.id);
    
    if (flags.s) {
      // In summary mode we just calculate and print once at the root of the target
      let totalSize = 0;
      const getDirSize = async (p: string): Promise<number> => {
        const s = await stat(p);
        let size = s.sizeBytes || 0;
        if (s.type === 'directory') {
          const children = await readdir(p);
          for (const c of children) {
            size += await getDirSize(p === '/' ? '/' + c : p + '/' + c);
          }
        }
        return size;
      };
      totalSize = await getDirSize(absPath);
      streams.stdout.writeLine(`${formatSize(totalSize)}\t${target}`);
    } else {
      await calculateSize(absPath, target);
    }
  }
  
  return 0;
};

export const file: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);
  
  if (positional.length === 0) {
    streams.stderr.writeLine(`file: missing operand`);
    return 1;
  }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readFile, stat } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  for (const target of positional) {
    const node = await resolveRelativePathAsync(cwdPath, target);
    if (!node) {
      streams.stderr.writeLine(`${target}: cannot open \`${target}' (No such file or directory)`);
      continue;
    }
    
    if (node.type === 'directory') {
      streams.stdout.writeLine(`${target}: directory`);
      continue;
    }
    
    const absPath = await getAbsolutePathAsync(node.id);
    const nodeStat = await stat(absPath);
    
    if (nodeStat.type === 'symlink') {
      streams.stdout.writeLine(`${target}: symbolic link`);
      continue;
    }

    try {
      const blob = await readFile(absPath);
      const ext = target.split('.').pop()?.toLowerCase();
      
      let typeStr = 'data';
      if (['txt', 'md', 'js', 'ts', 'html', 'css', 'json', 'csv'].includes(ext || '')) {
        typeStr = 'ASCII text';
      } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
        typeStr = `${ext?.toUpperCase()} image data`;
      } else if (['mp4', 'webm', 'ogg', 'avi'].includes(ext || '')) {
        typeStr = `${ext?.toUpperCase()} video data`;
      } else if (blob.size === 0) {
        typeStr = 'empty';
      } else {
        // basic sniff
        const text = await blob.text();
        if (/^[\x20-\x7E\r\n\t]*$/.test(text.slice(0, 100))) {
          typeStr = 'ASCII text';
        }
      }
      
      streams.stdout.writeLine(`${target}: ${typeStr}`);
    } catch (err) {
      streams.stderr.writeLine(`${target}: cannot open \`${target}'`);
    }
  }
  
  return 0;
};

export const statCmd: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);
  
  if (positional.length === 0) {
    streams.stderr.writeLine(`stat: missing operand`);
    return 1;
  }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { stat } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  for (const target of positional) {
    const node = await resolveRelativePathAsync(cwdPath, target);
    if (!node) {
      streams.stderr.writeLine(`stat: cannot stat '${target}': No such file or directory`);
      continue;
    }
    
    const absPath = await getAbsolutePathAsync(node.id);
    const s = await stat(absPath);
    
    const typeStr = s.type === 'directory' ? 'directory' : s.type === 'symlink' ? 'symbolic link' : 'regular file';
    const blocks = Math.ceil((s.sizeBytes || 0) / 512);
    const ioBlock = 4096;
    
    // Convert permissions to octal
    // This is a naive translation assuming standard unix bits, but VFS just stores uid/gid and basic perms in reality
    // For now we mock the octal
    const octal = s.type === 'directory' ? '0755' : '0644';
    const rwx = s.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--';
    
    const formatTime = (ts: number) => {
      const d = new Date(ts);
      return d.toISOString().replace('T', ' ').replace('Z', ' +0000');
    };
    
    const timeStr = formatTime(s.modifiedAt || 0);
    
    streams.stdout.writeLine(`  File: ${target}`);
    streams.stdout.writeLine(`  Size: ${(s.sizeBytes || 0).toString().padEnd(10, ' ')} Blocks: ${blocks.toString().padEnd(10, ' ')} IO Block: ${ioBlock}   ${typeStr}`);
    streams.stdout.writeLine(`Access: (${octal}/${rwx})  Uid: (${s.ownerId || 1000}/ubuntu)   Gid: (${s.ownerId || 1000}/ubuntu)`);
    streams.stdout.writeLine(`Access: ${timeStr}`);
    streams.stdout.writeLine(`Modify: ${timeStr}`);
    streams.stdout.writeLine(`Change: ${timeStr}`);
  }
  
  return 0;
};

export const readlink: CommandHandler = async (args, env, streams) => {
  const { flags, positional } = parseArgs(args);
  
  if (positional.length === 0) {
    streams.stderr.writeLine(`readlink: missing operand`);
    return 1;
  }
  
  const target = positional[0];
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readlink: vfsReadlink } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  const node = await resolveRelativePathAsync(cwdPath, target);
  if (!node) {
    return 1; // no output
  }
  
  if (node.type !== 'symlink' && !flags.f) {
    return 1;
  }
  
  const absPath = await getAbsolutePathAsync(node.id);
  
  if (flags.f) {
    // Canonicalize
    // Actually our getAbsolutePathAsync already handles following symlinks if it resolves to it, wait, node.id is the resolved file
    // The VFS architecture for symlinks isn't fully posix, but we can just output absPath.
    streams.stdout.writeLine(absPath);
    return 0;
  }
  
  try {
    const linkTarget = await vfsReadlink(absPath);
    streams.stdout.writeLine(linkTarget);
    return 0;
  } catch (err) {
    return 1;
  }
};

export const basename: CommandHandler = async (args, _env, streams) => {
  const { positional } = parseArgs(args);
  
  if (positional.length === 0) {
    streams.stderr.writeLine(`basename: missing operand`);
    return 1;
  }
  
  let path = positional[0];
  if (path.endsWith('/') && path.length > 1) {
    path = path.slice(0, -1);
  }
  
  const parts = path.split('/');
  let base = parts.pop() || '';
  if (base === '' && parts.length === 0) base = '/'; // It was just '/'
  
  const suffix = positional[1];
  if (suffix && base.endsWith(suffix) && base !== suffix) {
    base = base.slice(0, -suffix.length);
  }
  
  streams.stdout.writeLine(base);
  return 0;
};

export const dirname: CommandHandler = async (args, _env, streams) => {
  const { positional } = parseArgs(args);
  
  if (positional.length === 0) {
    streams.stderr.writeLine(`dirname: missing operand`);
    return 1;
  }
  
  let path = positional[0];
  if (path.endsWith('/') && path.length > 1) {
    path = path.replace(/\/+$/, '');
  }
  
  const idx = path.lastIndexOf('/');
  if (idx === -1) {
    streams.stdout.writeLine('.');
  } else if (idx === 0) {
    streams.stdout.writeLine('/');
  } else {
    streams.stdout.writeLine(path.slice(0, idx));
  }
  
  return 0;
};

export const realpath: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);
  
  if (positional.length === 0) {
    streams.stderr.writeLine(`realpath: missing operand`);
    return 1;
  }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  for (const target of positional) {
    const node = await resolveRelativePathAsync(cwdPath, target);
    if (!node) {
      streams.stderr.writeLine(`realpath: ${target}: No such file or directory`);
      return 1;
    }
    const absPath = await getAbsolutePathAsync(node.id);
    streams.stdout.writeLine(absPath);
  }
  
  return 0;
};
