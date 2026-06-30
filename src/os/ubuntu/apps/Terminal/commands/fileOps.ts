import type { CommandHandler } from './types';
import { useVFSStore } from '../../../store';
import { parseArgs } from '../commandParser';
import { walkTree } from './utils';

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

  const { error: err } = store.createNode(cwdId, name, 'file', '');
  if (err) return { output: [`touch: ${err}`], isError: true };
  
  return { output: [] };
};

export const mkdir: CommandHandler = (args, cwdId) => {
  if (args.length === 0) return { output: ['mkdir: missing operand'], isError: true };
  
  const store = useVFSStore.getState();
  const name = args[0];
  
  if (name.includes('/')) return { output: ['mkdir: creating nested directories is not yet supported'], isError: true };

  const { error: err } = store.createNode(cwdId, name, 'directory');
  if (err) return { output: [`mkdir: cannot create directory '${name}': ${err}`], isError: true };
  
  return { output: [] };
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
export const rm: CommandHandler = (args, cwdId) => {
  const { flags, positional } = parseArgs(args);
  const recursive = flags.r || flags.R;
  const force = flags.f;

  if (positional.length === 0) {
    if (force) return { output: [] }; // rm -f with no args is silent
    return { output: ['rm: missing operand'], isError: true };
  }

  const store = useVFSStore.getState();

  for (const target of positional) {
    const node = store.resolveRelativePath(cwdId, target);

    if (!node) {
      if (force) continue; // -f silences "not found"
      return { output: [`rm: cannot remove '${target}': No such file or directory`], isError: true };
    }

    if (node.type === 'directory' && !recursive) {
      return { output: [`rm: cannot remove '${target}': Is a directory`], isError: true };
    }

    const err = store.deleteNode(node.id);
    if (err) {
      return { output: [`rm: cannot remove '${target}': ${err}`], isError: true };
    }
  }

  return { output: [] };
};

export const chmod: CommandHandler = (args, cwdId) => {
  if (args.length < 2) return { output: ['chmod: missing operand'], isError: true };
  
  const permissions = args[0];
  const targetName = args[1];
  
  if (!/^[0-7]{3}$/.test(permissions)) {
    return { output: [`chmod: invalid mode: '${permissions}'`], isError: true };
  }

  const store = useVFSStore.getState();
  const node = store.resolveRelativePath(cwdId, targetName);
  
  if (!node) {
    return { output: [`chmod: cannot access '${targetName}': No such file or directory`], isError: true };
  }
  
  const err = store.updatePermissions(node.id, permissions);
  if (err) return { output: [`chmod: ${err}`], isError: true };
  
  return { output: [] };
};

export const chown: CommandHandler = (args, cwdId) => {
  if (args.length < 2) return { output: ['chown: missing operand'], isError: true };
  
  const ownerGroup = args[0];
  const targetName = args[1];
  
  const [owner, group] = ownerGroup.split(':');
  
  const store = useVFSStore.getState();
  const node = store.resolveRelativePath(cwdId, targetName);
  
  if (!node) {
    return { output: [`chown: cannot access '${targetName}': No such file or directory`], isError: true };
  }
  
  const err = store.updateOwner(node.id, owner || undefined, group || undefined);
  if (err) return { output: [`chown: ${err}`], isError: true };
  
  return { output: [] };
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
export const cp: CommandHandler = (args, cwdId) => {
  const { flags, positional } = parseArgs(args);
  const recursive = flags.r || flags.R;

  if (positional.length < 2) {
    return { output: ['cp: missing file operand'], isError: true };
  }

  const sourcePath = positional[0];
  const destPath = positional[1];
  const store = useVFSStore.getState();

  // Resolve source
  const sourceNode = store.resolveRelativePath(cwdId, sourcePath);
  if (!sourceNode) {
    return { output: [`cp: cannot stat '${sourcePath}': No such file or directory`], isError: true };
  }

  // Check if source is a directory without -r
  if (sourceNode.type === 'directory' && !recursive) {
    return { output: [`cp: -r not specified; omitting directory '${sourcePath}'`], isError: true };
  }

  // Resolve destination
  const destNode = store.resolveRelativePath(cwdId, destPath);

  if (destNode) {
    // Destination exists
    if (destNode.id === sourceNode.id) {
      return { output: [`cp: '${sourcePath}' and '${destPath}' are the same file`], isError: true };
    }

    if (destNode.type === 'directory') {
      // Copy into existing directory
      if (sourceNode.type === 'file') {
        // Check if file with same name already exists in dest
        const existing = store.getChildren(destNode.id).find(c => c.name === sourceNode.name);
        if (existing) {
          // Overwrite: update content
          store.updateContent(existing.id, sourceNode.content);
        } else {
          const { error } = store.createNode(destNode.id, sourceNode.name, 'file', sourceNode.content);
          if (error) return { output: [`cp: ${error}`], isError: true };
        }
      } else {
        // Directory → copy into dest directory
        const { error } = store.duplicateNode(sourceNode.id, destNode.id);
        if (error) return { output: [`cp: ${error}`], isError: true };
      }
    } else {
      // Destination is a file — overwrite its content (only if source is also a file)
      if (sourceNode.type === 'directory') {
        return { output: [`cp: cannot overwrite non-directory '${destPath}' with directory '${sourcePath}'`], isError: true };
      }
      store.updateContent(destNode.id, sourceNode.content);
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
      return { output: [`cp: cannot create '${destPath}': No such file or directory`], isError: true };
    }

    if (sourceNode.type === 'file') {
      const { error } = store.createNode(destParentNode.id, destName, 'file', sourceNode.content);
      if (error) return { output: [`cp: ${error}`], isError: true };
    } else {
      // For directory copy to a new name, use duplicateNode then rename
      const { error, newId } = store.duplicateNode(sourceNode.id, destParentNode.id);
      if (error) return { output: [`cp: ${error}`], isError: true };
      // Rename the copy to destName if different
      if (newId && destName !== sourceNode.name) {
        store.renameNode(newId, destName);
      }
    }
  }

  return { output: [] };
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
export const mv: CommandHandler = (args, cwdId) => {
  const { positional } = parseArgs(args);

  if (positional.length < 2) {
    return { output: ['mv: missing file operand'], isError: true };
  }

  const sourcePath = positional[0];
  const destPath = positional[1];
  const store = useVFSStore.getState();

  // Resolve source
  const sourceNode = store.resolveRelativePath(cwdId, sourcePath);
  if (!sourceNode) {
    return { output: [`mv: cannot stat '${sourcePath}': No such file or directory`], isError: true };
  }

  // Resolve destination
  const destNode = store.resolveRelativePath(cwdId, destPath);

  if (destNode) {
    if (destNode.id === sourceNode.id) {
      return { output: [`mv: '${sourcePath}' and '${destPath}' are the same file`], isError: true };
    }

    if (destNode.type === 'directory') {
      // Move into existing directory
      const err = store.moveNode(sourceNode.id, destNode.id);
      if (err) return { output: [`mv: ${err}`], isError: true };
    } else {
      // Destination is an existing file — in real mv this overwrites, but for simplicity:
      return { output: [`mv: cannot overwrite '${destPath}': File exists`], isError: true };
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
      return { output: [`mv: cannot move '${sourcePath}' to '${destPath}': No such file or directory`], isError: true };
    }

    // If source parent === dest parent, this is just a rename
    if (sourceNode.parentId === destParentNode.id) {
      const err = store.renameNode(sourceNode.id, destName);
      if (err) return { output: [`mv: ${err}`], isError: true };
    } else {
      // Move to new parent, then rename
      const moveErr = store.moveNode(sourceNode.id, destParentNode.id);
      if (moveErr) return { output: [`mv: ${moveErr}`], isError: true };

      if (destName !== sourceNode.name) {
        const renameErr = store.renameNode(sourceNode.id, destName);
        if (renameErr) return { output: [`mv: ${renameErr}`], isError: true };
      }
    }
  }

  return { output: [] };
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
export const rmdir: CommandHandler = (args, cwdId) => {
  const { positional } = parseArgs(args);

  if (positional.length === 0) {
    return { output: ['rmdir: missing operand'], isError: true };
  }

  const store = useVFSStore.getState();

  for (const target of positional) {
    const node = store.resolveRelativePath(cwdId, target);

    if (!node) {
      return { output: [`rmdir: failed to remove '${target}': No such file or directory`], isError: true };
    }
    if (node.type !== 'directory') {
      return { output: [`rmdir: failed to remove '${target}': Not a directory`], isError: true };
    }

    const children = store.getChildren(node.id);
    if (children.length > 0) {
      return { output: [`rmdir: failed to remove '${target}': Directory not empty`], isError: true };
    }

    const err = store.deleteNode(node.id);
    if (err) return { output: [`rmdir: failed to remove '${target}': ${err}`], isError: true };
  }

  return { output: [] };
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
export const find: CommandHandler = (args, cwdId) => {
  const { options, positional } = parseArgs(args, ['name', 'type']);
  const store = useVFSStore.getState();

  // Determine search root
  const searchPath = positional.length > 0 ? positional[0] : '.';
  let startNode;

  if (searchPath === '.') {
    startNode = store.getNode(cwdId);
  } else {
    startNode = store.resolveRelativePath(cwdId, searchPath);
  }

  if (!startNode) {
    return { output: [`find: '${searchPath}': No such file or directory`], isError: true };
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

  walkTree(startNode.id, searchPath, (node, path) => {
    // Apply filters
    if (typeFilter === 'f' && node.type !== 'file') return;
    if (typeFilter === 'd' && node.type !== 'directory') return;
    if (nameRegex && !nameRegex.test(node.name)) return;

    matches.push(path);
  });

  return { output: matches };
};
