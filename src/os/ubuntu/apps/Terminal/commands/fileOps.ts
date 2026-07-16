import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';
import { getAuthContext } from '../../../store/useUbuntuVFSStore';

import { parseArgs } from '../commandParser';
import { walkTree } from './utils';

export const cat: CommandHandler = async (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  if (args.length === 0) {
    const input = process.stdin.readAll();
    input.split('\n').forEach((line: string) => process.stdout.writeLine(line));
    return {};
  }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readFile } = await import('../../../fs/operations');

  const cwdPath = await getAbsolutePathAsync(cwdId);
  const targetNode = await resolveRelativePathAsync(cwdPath, args[0]);

  if (!targetNode) {
    process.stderr.writeLine(`cat: ${args[0]}: No such file or directory`);
    return {};
  }
  
  if (targetNode.type === 'directory') {
    process.stderr.writeLine(`cat: ${args[0]}: Is a directory`);
    return {};
  }
  
  const targetAbsPath = await getAbsolutePathAsync(targetNode.id);
  try {
    const blob = await readFile(targetAbsPath);
    const text = await blob.text();
    text.split('\n').forEach((line: string) => process.stdout.writeLine(line));
  } catch (err: any) {
    process.stderr.writeLine(`cat: ${args[0]}: ${err.message}`);
  }
  return {};
};

export const touch: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  if (args.length === 0) { ['touch: missing file operand'].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  const store = useVFSStore.getState();
  const name = args[0];
  const username = _appState?.effectiveUser || getAuthContext().username;
  
  let parentId = cwdId;
  let fileName = name;
  if (name.includes('/')) {
    const parts = name.split('/');
    fileName = parts.pop()!;
    const parentPath = parts.join('/') || (name.startsWith('/') ? '/' : '.');
    const parentNode = store.resolveRelativePath(cwdId, parentPath);
    if (!parentNode) {
      [`touch: cannot touch '${name}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
    if (parentNode.type !== 'directory') {
      [`touch: cannot touch '${name}': Not a directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
    parentId = parentNode.id;
  }

  const node = store.resolveRelativePath(cwdId, name);
  if (node) {
    // If it exists, Unix touch updates timestamp. Since we don't display it yet, this is a no-op conceptually, 
    // but we can just update content with its own content to trigger a modifiedAt update
    store.updateContent(node!.id, node!.content ?? '', username);
    [].forEach((line: string) => process.stdout.writeLine(line)); return {};
  }

  const { error: err } = store.createNode(parentId, fileName, 'file', '', username);
  if (err) { [`touch: ${err}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const mkdir: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  if (args.length === 0) { ['mkdir: missing operand'].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  const store = useVFSStore.getState();
  const name = args[0];
  
  let parentId = cwdId;
  let dirName = name;
  if (name.includes('/')) {
    const parts = name.split('/');
    dirName = parts.pop()!;
    const parentPath = parts.join('/') || (name.startsWith('/') ? '/' : '.');
    const parentNode = store.resolveRelativePath(cwdId, parentPath);
    if (!parentNode) {
      [`mkdir: cannot create directory '${name}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
    if (parentNode.type !== 'directory') {
      [`mkdir: cannot create directory '${name}': Not a directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
    parentId = parentNode.id;
  }

  const username = _appState?.effectiveUser || getAuthContext().username;
  const { error: err } = store.createNode(parentId, dirName, 'directory', undefined, username);
  if (err) { [`mkdir: cannot create directory '${name}': ${err}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
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
export const rm: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { flags, positional } = parseArgs(args);
  const recursive = flags.r || flags.R;
  const force = flags.f;

  if (positional.length === 0) {
    if (force) { [].forEach((line: string) => process.stdout.writeLine(line)); return {}; } // rm -f with no args is silent
    ['rm: missing operand'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const store = useVFSStore.getState();
  const username = _appState?.effectiveUser || getAuthContext().username;

  for (const target of positional) {
    const node = store.resolveRelativePath(cwdId, target);

    if (!node) {
      if (force) continue; // -f silences "not found"
      [`rm: cannot remove '${target}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    if (node.type === 'directory' && !recursive) {
      [`rm: cannot remove '${target}': Is a directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    const err = store.deleteNode(node.id, username);
    if (err) {
      [`rm: cannot remove '${target}': ${err}`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
  }

  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const chmod: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  if (args.length < 2) { ['chmod: missing operand'].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  const permissions = args[0];
  const targetName = args[1];
  
  if (!/^[0-7]{3}$/.test(permissions)) {
    [`chmod: invalid mode: '${permissions}'`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const store = useVFSStore.getState();
  const node = store.resolveRelativePath(cwdId, targetName);
  
  if (!node) {
    [`chmod: cannot access '${targetName}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }
  
  const username = _appState?.effectiveUser || getAuthContext().username;

  // Only owner or root can chmod
  if (username !== 'root' && username !== node!.owner) {
    [`chmod: changing permissions of '${targetName}': Operation not permitted`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const err = store.updatePermissions(node!.id, permissions, username);
  if (err) { [`chmod: ${err}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const chown: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  if (args.length < 2) { ['chown: missing operand'].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  const username = _appState?.effectiveUser || getAuthContext().username;

  // chown requires root in real Linux (unless changing to own group only)
  if (username !== 'root') {
    ['chown: changing ownership: Operation not permitted'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const ownerGroup = args[0];
  const targetName = args[1];
  
  const [owner, group] = ownerGroup.split(':');
  
  const store = useVFSStore.getState();
  const node = store.resolveRelativePath(cwdId, targetName);
  
  if (!node) {
    [`chown: cannot access '${targetName}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }
  
  const err = store.updateOwner(node!.id, owner || undefined, group || undefined, username);
  if (err) { [`chown: ${err}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
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
export const cp: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { flags, positional } = parseArgs(args);
  const recursive = flags.r || flags.R;

  if (positional.length < 2) {
    ['cp: missing file operand'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const sourcePath = positional[0];
  const destPath = positional[1];
  const store = useVFSStore.getState();
  const username = _appState?.effectiveUser || getAuthContext().username;

  // Resolve source
  const sourceNode = store.resolveRelativePath(cwdId, sourcePath);
  if (!sourceNode) {
    [`cp: cannot stat '${sourcePath}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  // Check if source is a directory without -r
  if (sourceNode.type === 'directory' && !recursive) {
    [`cp: -r not specified; omitting directory '${sourcePath}'`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  // Resolve destination
  const destNode = store.resolveRelativePath(cwdId, destPath);

  if (destNode) {
    // Destination exists
    if (destNode.id === sourceNode.id) {
      [`cp: '${sourcePath}' and '${destPath}' are the same file`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    if (destNode.type === 'directory') {
      // Copy into existing directory
      if (sourceNode.type === 'file') {
        // Check if file with same name already exists in dest
        const existing = store.getChildren(destNode.id).find(c => c.name === sourceNode.name);
        if (existing) {
          // Overwrite: update content
          store.updateContent(existing.id, sourceNode.content, username);
        } else {
          const { error } = store.createNode(destNode.id, sourceNode.name, 'file', sourceNode.content, username);
          if (error) { [`cp: ${error}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
        }
      } else {
        // Directory → copy into dest directory
        const { error } = store.duplicateNode(sourceNode.id, destNode.id, username);
        if (error) { [`cp: ${error}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
      }
    } else {
      // Destination is a file — overwrite its content (only if source is also a file)
      if (sourceNode.type === 'directory') {
        [`cp: cannot overwrite non-directory '${destPath}' with directory '${sourcePath}'`].forEach((line: string) => process.stderr.writeLine(line)); return {};
      }
      store.updateContent(destNode.id, sourceNode.content, username);
    }
  } else {
    // Destination does not exist — resolve parent
    const destParts = destPath.split('/');
    const destName = destParts.pop()!;
    const destParentPath = destParts.length > 0 ? destParts.join('/') : '.';

    let destParentNode;
    if (destParentPath === '.') {
      destParentNode = store.getNode(cwdId);
    } else {
      destParentNode = store.resolveRelativePath(cwdId, destParentPath);
    }

    if (!destParentNode || destParentNode.type !== 'directory') {
      [`cp: cannot create '${destPath}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    if (sourceNode.type === 'file') {
      const { error } = store.createNode(destParentNode.id, destName, 'file', sourceNode.content, username);
      if (error) { [`cp: ${error}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
    } else {
      // For directory copy to a new name, use duplicateNode then rename
      const { error, id: newId } = store.duplicateNode(sourceNode.id, destParentNode.id, username);
      if (error) { [`cp: ${error}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
      // Rename the copy to destName if different
      if (newId && destName !== sourceNode!.name) {
        store.renameNode(newId, destName, username);
      }
    }
  }

  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
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
export const mv: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { positional } = parseArgs(args);

  if (positional.length < 2) {
    ['mv: missing file operand'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const sourcePath = positional[0];
  const destPath = positional[1];
  const store = useVFSStore.getState();
  const username = _appState?.effectiveUser || getAuthContext().username;

  // Resolve source
  const sourceNode = store.resolveRelativePath(cwdId, sourcePath);
  if (!sourceNode) {
    [`mv: cannot stat '${sourcePath}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  // Resolve destination
  const destNode = store.resolveRelativePath(cwdId, destPath);

  if (destNode) {
    if (destNode.id === sourceNode.id) {
      [`mv: '${sourcePath}' and '${destPath}' are the same file`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    if (destNode.type === 'directory') {
      // Move into existing directory
      const err = store.moveNode(sourceNode.id, destNode.id, username);
      if (err) { [`mv: ${err}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
    } else {
      if (sourceNode.type === 'directory') {
        [`mv: cannot overwrite non-directory '${destPath}' with directory '${sourcePath}'`].forEach((line: string) => process.stderr.writeLine(line)); return {};
      }
      store.deleteNode(destNode.id, username);
      if (sourceNode.parentId === destNode.parentId) {
        store.renameNode(sourceNode.id, destNode.name, username);
      } else {
        store.moveNode(sourceNode.id, destNode.parentId!, username);
        store.renameNode(sourceNode.id, destNode.name, username);
      }
    }
  } else {
    // Destination does not exist — resolve parent for move + rename
    const destParts = destPath.split('/');
    const destName = destParts.pop()!;
    const destParentPath = destParts.length > 0 ? destParts.join('/') : '.';

    let destParentNode;
    if (destParentPath === '.') {
      destParentNode = store.getNode(cwdId);
    } else {
      destParentNode = store.resolveRelativePath(cwdId, destParentPath);
    }

    if (!destParentNode || destParentNode.type !== 'directory') {
      [`mv: cannot move '${sourcePath}' to '${destPath}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    // If source parent === dest parent, this is just a rename
    if (sourceNode!.parentId === destParentNode!.id) {
      const err = store.renameNode(sourceNode!.id, destName, username);
      if (err) { [`mv: ${err}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
    } else {
      // Move to new parent, then rename
      const moveErr = store.moveNode(sourceNode.id, destParentNode.id, username);
      if (moveErr) { [`mv: ${moveErr}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }

      if (destName !== sourceNode.name) {
        const renameErr = store.renameNode(sourceNode.id, destName, username);
        if (renameErr) { [`mv: ${renameErr}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
      }
    }
  }

  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
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
export const rmdir: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { positional } = parseArgs(args);

  if (positional.length === 0) {
    ['rmdir: missing operand'].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  const store = useVFSStore.getState();
  const username = _appState?.effectiveUser || getAuthContext().username;

  for (const target of positional) {
    const node = store.resolveRelativePath(cwdId, target);

    if (!node) {
      [`rmdir: failed to remove '${target}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }
    if (node.type !== 'directory') {
      [`rmdir: failed to remove '${target}': Not a directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    const children = store.getChildren(node.id, username);
    if (children.length > 0) {
      [`rmdir: failed to remove '${target}': Directory not empty`].forEach((line: string) => process.stderr.writeLine(line)); return {};
    }

    const err = store.deleteNode(node.id, username);
    if (err) { [`rmdir: failed to remove '${target}': ${err}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  }

  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
};

/**
 * find — Search for files in a directory hierarchy.
 *
 * Usage:
 *   find [path] [-name <pattern>] [-type f|d]
 *
 * Options:
 *   -name <pattern>   Filter by filename (supports * glob → regex)
 *   -type f|d         Filter by type: 'f' for files, 'd' for directories
 *
 * Default path is '.' (current directory).
 * Outputs one matched path per line.
 */
export const find: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { options, positional } = parseArgs(args, ['name', 'type']);
  const store = useVFSStore.getState();
  const username = _appState?.effectiveUser || getAuthContext().username;

  // Determine search root
  const searchPath = positional.length > 0 ? positional[0] : '.';
  let startNode;

  if (searchPath === '.') {
    startNode = store.getNode(cwdId);
  } else {
    startNode = store.resolveRelativePath(cwdId, searchPath);
  }

  if (!startNode) {
    [`find: '${searchPath}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }

  // Build name pattern (glob → regex)
  let nameRegex: RegExp | null = null;
  if (options.name) {
    // Convert glob pattern: * → .*, ? → ., escape rest
    const escaped = options.name
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // escape regex special chars (except * and ?)
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    nameRegex = new RegExp(`^${escaped}$`);
  }

  // Type filter
  const typeFilter = options.type; // 'f' or 'd' or undefined

  // Collect matches
  const matches: string[] = [];

  walkTree(startNode.id, searchPath, username || 'user', (node, path) => {
    // Apply filters
    if (typeFilter === 'f' && node.type !== 'file') return;
    if (typeFilter === 'd' && node.type !== 'directory') return;
    if (nameRegex && !nameRegex.test(node.name)) return;

    matches.push(path);
  });

  matches.forEach((line: string) => process.stdout.writeLine(line)); return {};
};

export const ln: CommandHandler = (args, cwdId, _updateCwd, _clearHistory, _appState, process) => {
  const { flags, positional } = parseArgs(args);
  const isSymlink = flags.s;
  
  if (positional.length < 2) { ['ln: missing operand'].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  const targetPath = positional[0];
  const linkName = positional[1];
  
  const store = useVFSStore.getState();
  const username = _appState?.effectiveUser || getAuthContext().username;
  
  const linkSegments = linkName.split('/').filter(Boolean);
  const name = linkSegments.pop();
  if (!name) { ['ln: invalid link name'].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  
  const parentPath = linkSegments.length > 0 ? (linkName.startsWith('/') ? '/' + linkSegments.join('/') : linkSegments.join('/')) : '.';
  const parentNode = store.resolveRelativePath(cwdId, parentPath);
  
  if (!parentNode || parentNode!.type !== 'directory') {
    [`ln: cannot create link '${linkName}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {};
  }
  
  if (isSymlink) {
    const { error } = store.createSymlink(parentNode!.id, name ?? '', targetPath, username);
    if (error) { [`ln: ${error}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  } else {
    const targetNode = store.resolveRelativePath(cwdId, targetPath);
    if (!targetNode) { [`ln: failed to access '${targetPath}': No such file or directory`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
    if (targetNode!.type === 'directory') { [`ln: ${targetPath}: hard link not allowed for directory`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
    
    const { error } = store.createLink(parentNode!.id, name ?? '', targetNode!.id, username);
    if (error) { [`ln: ${error}`].forEach((line: string) => process.stderr.writeLine(line)); return {}; }
  }
  
  [].forEach((line: string) => process.stdout.writeLine(line)); return {};
};
