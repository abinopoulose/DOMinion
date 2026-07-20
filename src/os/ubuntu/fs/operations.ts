import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db';
import type { VFSNode } from './types';
import { resolvePathAsync, clearPathCache } from './pathResolver';
import { fsEvents } from './events';
import { getAuthContext } from '../store/authContext';

export async function stat(path: string): Promise<VFSNode> {
  const node = await resolvePathAsync(path);
  if (!node) throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
  return node;
}

export async function readdir(path: string): Promise<VFSNode[]> {
  const node = await resolvePathAsync(path);
  if (!node) throw new Error(`ENOENT: no such file or directory, scandir '${path}'`);
  if (node.type !== 'directory') throw new Error(`ENOTDIR: not a directory, scandir '${path}'`);
  
  const db = await getDB();
  return await db.getAllFromIndex('inodes', 'by-parent', node.id);
}

export async function readFile(path: string): Promise<Blob> {
  const node = await stat(path);
  if (node.type === 'directory') throw new Error(`EISDIR: illegal operation on a directory, read '${path}'`);
  
  const db = await getDB();
  const fileData = await db.get('file_data', node.id);
  if (!fileData) {
    return new Blob([], { type: node.meta?.mimeType || 'application/octet-stream' });
  }
  
  return fileData as Blob;
}

export async function writeFile(path: string, data: Blob | string | Uint8Array, options?: { append?: boolean }): Promise<VFSNode> {
  console.log(`[VFS Sync: operations] writeFile initiated for path: ${path}`);
  const segments = path.split('/').filter(Boolean);
  const fileName = segments.pop();
  if (!fileName) {
    console.error(`[VFS Sync: operations] EISDIR: illegal operation on a directory, write '${path}'`);
    throw new Error(`EISDIR: illegal operation on a directory, write '${path}'`);
  }

  const parentPath = '/' + segments.join('/');
  console.log(`[VFS Sync: operations] Resolving parent path: ${parentPath}`);
  const parentNode = await resolvePathAsync(parentPath);
  if (!parentNode) {
    console.error(`[VFS Sync: operations] ENOENT: parent directory not found for open '${path}'`);
    throw new Error(`ENOENT: no such file or directory, open '${path}'`);
  }
  if (parentNode.type !== 'directory') {
    console.error(`[VFS Sync: operations] ENOTDIR: parent path is not a directory '${parentPath}'`);
    throw new Error(`ENOTDIR: not a directory, open '${parentPath}'`);
  }

  let node = await resolvePathAsync(path);
  if (node && node.type === 'directory') {
    console.error(`[VFS Sync: operations] EISDIR: target path is a directory '${path}'`);
    throw new Error(`EISDIR: illegal operation on a directory, write '${path}'`);
  }

  let blobData: Blob;
  if (data instanceof Blob) blobData = data;
  else if (data instanceof Uint8Array) blobData = new Blob([data as any]);
  else blobData = new Blob([data], { type: 'text/plain' });

  const db = await getDB();
  console.log(`[VFS Sync: operations] Acquired IDB connection for write transaction`);
  const tx = db.transaction(['inodes', 'file_data'], 'readwrite');
  const inodeStore = tx.objectStore('inodes');
  const dataStore = tx.objectStore('file_data');

  if (node && options?.append) {
    console.log(`[VFS Sync: operations] Append option specified, fetching existing data`);
    const existingData = await dataStore.get(node.id) as Blob;
    if (existingData) {
      blobData = new Blob([existingData, blobData]);
    }
  }

  let isNew = false;
  if (!node) {
    isNew = true;
    // Create new node
    const id = uuidv4();
    const now = Date.now();
    let extension = '';
    if (fileName.includes('.')) {
      extension = fileName.split('.').pop() || '';
    }

    const currentUser = getAuthContext().username;
    node = {
      id,
      name: fileName,
      type: 'file',
      parentId: parentNode.id,
      permissions: 0o644,
      ownerId: currentUser,
      groupId: currentUser,
      createdAt: now,
      modifiedAt: now,
      accessedAt: now,
      sizeBytes: blobData.size,
      hasBinaryContent: blobData.size > 0,
      meta: { extension }
    };
  } else {
    // Update existing node
    console.log(`[VFS Sync: operations] Updating existing node: ${node.id}`);
    node.modifiedAt = Date.now();
    node.sizeBytes = blobData.size;
    node.hasBinaryContent = blobData.size > 0;
  }

  try {
    await inodeStore.put(node);
    if (blobData.size > 0) {
      await dataStore.put(blobData, node.id);
    } else {
      await dataStore.delete(node.id); // clean up if empty
    }

    await tx.done;
    console.log(`[VFS Sync: operations] Transaction successfully committed for '${path}'`);
  } catch (err) {
    console.error(`[VFS Sync: operations] Transaction failed for '${path}'`, err);
    throw err;
  }
  
  clearPathCache();
  fsEvents.emit(path, isNew ? 'fs:created' : 'fs:changed');
  return node;
}

export async function unlink(path: string): Promise<void> {
  const node = await resolvePathAsync(path);
  if (!node) throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
  if (node.type === 'directory') throw new Error(`EISDIR: illegal operation on a directory, unlink '${path}'`);

  const db = await getDB();
  const tx = db.transaction(['inodes', 'file_data'], 'readwrite');
  await tx.objectStore('inodes').delete(node.id);
  await tx.objectStore('file_data').delete(node.id);
  await tx.done;
  clearPathCache();
  fsEvents.emit(path, 'fs:deleted');
}

export async function mkdir(path: string): Promise<VFSNode> {
  const segments = path.split('/').filter(Boolean);
  const dirName = segments.pop();
  if (!dirName) throw new Error(`EEXIST: file already exists, mkdir '${path}'`);

  const parentPath = '/' + segments.join('/');
  const parentNode = await resolvePathAsync(parentPath);
  if (!parentNode) throw new Error(`ENOENT: no such file or directory, mkdir '${path}'`);
  if (parentNode.type !== 'directory') throw new Error(`ENOTDIR: not a directory, mkdir '${parentPath}'`);
  
  const existingNode = await resolvePathAsync(path);
  if (existingNode) throw new Error(`EEXIST: file already exists, mkdir '${path}'`);

  const id = uuidv4();
  const now = Date.now();

  const currentUser = getAuthContext().username;
  const node: VFSNode = {
    id,
    name: dirName,
    type: 'directory',
    parentId: parentNode.id,
    permissions: 0o755,
    ownerId: currentUser,
    groupId: currentUser,
    createdAt: now,
    modifiedAt: now,
    accessedAt: now,
    sizeBytes: 0,
    hasBinaryContent: false
  };

  const db = await getDB();
  await db.put('inodes', node);
  clearPathCache();
  fsEvents.emit(path, 'fs:created');
  return node;
}

export async function rmdir(path: string, options?: { recursive?: boolean }): Promise<void> {
  const node = await resolvePathAsync(path);
  if (!node) throw new Error(`ENOENT: no such file or directory, rmdir '${path}'`);
  if (node.type !== 'directory') throw new Error(`ENOTDIR: not a directory, rmdir '${path}'`);

  const db = await getDB();
  const children = await db.getAllFromIndex('inodes', 'by-parent', node.id);
  
  if (children.length > 0 && !options?.recursive) {
    throw new Error(`ENOTEMPTY: directory not empty, rmdir '${path}'`);
  }

  const tx = db.transaction(['inodes', 'file_data'], 'readwrite');
  const inodeStore = tx.objectStore('inodes');
  const dataStore = tx.objectStore('file_data');

  async function deleteRecursive(targetNode: VFSNode) {
    if (targetNode.type === 'directory') {
      const childNodes = await inodeStore.index('by-parent').getAll(targetNode.id);
      for (const child of childNodes) {
        await deleteRecursive(child);
      }
    }
    await inodeStore.delete(targetNode.id);
    await dataStore.delete(targetNode.id);
  }

  await deleteRecursive(node);
  await tx.done;
  clearPathCache();
  fsEvents.emit(path, 'fs:deleted');
}

export async function rename(oldPath: string, newPath: string): Promise<void> {
  const node = await resolvePathAsync(oldPath);
  if (!node) throw new Error(`ENOENT: no such file or directory, rename '${oldPath}'`);

  const newSegments = newPath.split('/').filter(Boolean);
  const newName = newSegments.pop();
  if (!newName) throw new Error(`EBUSY: resource busy or locked, rename '${oldPath}' -> '${newPath}'`);

  const newParentPath = '/' + newSegments.join('/');
  const newParentNode = await resolvePathAsync(newParentPath);
  if (!newParentNode) throw new Error(`ENOENT: no such file or directory, rename '${oldPath}' -> '${newPath}'`);
  if (newParentNode.type !== 'directory') throw new Error(`ENOTDIR: not a directory, rename '${oldPath}' -> '${newPath}'`);

  const existingNode = await resolvePathAsync(newPath);
  if (existingNode) {
    if (existingNode.type === 'directory') throw new Error(`EISDIR: illegal operation on a directory, rename '${oldPath}' -> '${newPath}'`);
    await unlink(newPath);
  }

  node.parentId = newParentNode.id;
  node.name = newName;
  node.modifiedAt = Date.now();

  const db = await getDB();
  await db.put('inodes', node);
  clearPathCache();
  fsEvents.emit(oldPath, 'fs:deleted');
  fsEvents.emit(newPath, 'fs:created');
}

export async function createReadStream(path: string): Promise<ReadableStream> {
  const blob = await readFile(path);
  return blob.stream();
}

export async function chmod(path: string, mode: number): Promise<void> {
  const node = await resolvePathAsync(path);
  if (!node) throw new Error(`ENOENT: no such file or directory, chmod '${path}'`);
  
  node.permissions = mode;
  node.modifiedAt = Date.now();
  
  const db = await getDB();
  await db.put('inodes', node);
  clearPathCache();
  fsEvents.emit(path, 'fs:changed');
}

export async function chown(path: string, uid: string, gid: string): Promise<void> {
  const node = await resolvePathAsync(path);
  if (!node) throw new Error(`ENOENT: no such file or directory, chown '${path}'`);
  
  node.ownerId = uid;
  node.groupId = gid;
  node.modifiedAt = Date.now();
  
  const db = await getDB();
  await db.put('inodes', node);
  clearPathCache();
  fsEvents.emit(path, 'fs:changed');
}

export async function symlink(target: string, path: string): Promise<VFSNode> {
  const segments = path.split('/').filter(Boolean);
  const linkName = segments.pop();
  if (!linkName) throw new Error(`EEXIST: file already exists, symlink '${path}'`);

  const parentPath = '/' + segments.join('/');
  const parentNode = await resolvePathAsync(parentPath);
  if (!parentNode) throw new Error(`ENOENT: no such file or directory, symlink '${path}'`);
  if (parentNode.type !== 'directory') throw new Error(`ENOTDIR: not a directory, symlink '${parentPath}'`);
  
  const existingNode = await resolvePathAsync(path);
  if (existingNode) throw new Error(`EEXIST: file already exists, symlink '${path}'`);

  const id = uuidv4();
  const now = Date.now();
  const currentUser = getAuthContext().username;

  const node: VFSNode = {
    id,
    name: linkName,
    type: 'symlink',
    parentId: parentNode.id,
    permissions: 0o777,
    ownerId: currentUser,
    groupId: currentUser,
    createdAt: now,
    modifiedAt: now,
    accessedAt: now,
    sizeBytes: target.length,
    hasBinaryContent: false,
    meta: { symlinkTarget: target }
  };

  const db = await getDB();
  await db.put('inodes', node);
  clearPathCache();
  fsEvents.emit(path, 'fs:created');
  return node;
}

export async function readlink(path: string): Promise<string> {
  const node = await resolvePathAsync(path);
  if (!node) throw new Error(`ENOENT: no such file or directory, readlink '${path}'`);
  if (node.type !== 'symlink') throw new Error(`EINVAL: invalid argument, readlink '${path}'`);
  
  return node.meta?.symlinkTarget || '';
}

/**
 * Move a node (by ID) to a new parent directory (by ID).
 */
export async function moveNode(nodeId: string, newParentId: string): Promise<void> {
  const db = await getDB();
  const node = await db.get('inodes', nodeId);
  if (!node) throw new Error(`ENOENT: node '${nodeId}' not found`);
  const newParent = await db.get('inodes', newParentId);
  if (!newParent || newParent.type !== 'directory') throw new Error(`ENOTDIR: target is not a directory`);

  node.parentId = newParentId;
  node.modifiedAt = Date.now();
  await db.put('inodes', node);
  clearPathCache();
  fsEvents.emit('/', 'fs:modified');
}

/**
 * Recursively duplicate a node (by ID) into a target parent directory (by ID).
 */
export async function duplicateNode(nodeId: string, targetParentId: string): Promise<VFSNode> {
  const db = await getDB();
  const src = await db.get('inodes', nodeId);
  if (!src) throw new Error(`ENOENT: node '${nodeId}' not found`);

  const newId = uuidv4();
  const now = Date.now();
  const clone: VFSNode = { ...src, id: newId, parentId: targetParentId, createdAt: now, modifiedAt: now };

  // Deduplicate name in target
  const siblings = await db.getAllFromIndex('inodes', 'by-parent', targetParentId);
  let name = src.name;
  if (siblings.some(s => s.name === name)) {
    let i = 1;
    const ext = name.includes('.') ? '.' + name.split('.').pop()! : '';
    const base = ext ? name.slice(0, -ext.length) : name;
    while (siblings.some(s => s.name === `${base} (copy${i > 1 ? ' ' + i : ''})${ext}`)) i++;
    name = `${base} (copy${i > 1 ? ' ' + i : ''})${ext}`;
  }
  clone.name = name;

  await db.put('inodes', clone);

  // Copy file data if file
  if (src.type === 'file') {
    const data = await db.get('file_data', nodeId);
    if (data) await db.put('file_data', data, newId);
  }

  // Recurse for directory children
  if (src.type === 'directory') {
    const children = await db.getAllFromIndex('inodes', 'by-parent', nodeId);
    for (const child of children) {
      await duplicateNode(child.id, newId);
    }
  }

  clearPathCache();
  fsEvents.emit('/', 'fs:created');
  return clone;
}

/**
 * Remove a node (by ID), moving it to trash or deleting recursively.
 */
export async function removeNode(nodeId: string): Promise<void> {
  const db = await getDB();
  const node = await db.get('inodes', nodeId);
  if (!node) return;

  // Remove children recursively for directories
  if (node.type === 'directory') {
    const children = await db.getAllFromIndex('inodes', 'by-parent', nodeId);
    for (const child of children) {
      await removeNode(child.id);
    }
  }

  // Remove file data
  await db.delete('file_data', nodeId);
  // Remove inode
  await db.delete('inodes', nodeId);

  clearPathCache();
  fsEvents.emit('/', 'fs:deleted');
}
