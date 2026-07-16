import { v4 as uuidv4 } from 'uuid';
import type { NodeMap, LegacyVFSNode, LegacyVFSNodeType } from './types';

export function getNode(map: NodeMap, id: string): LegacyVFSNode | null {
  return map[id] || null;
}

export function getChildren(map: NodeMap, id: string): LegacyVFSNode[] {
  const node = getNode(map, id);
  if (!node || node.type !== 'directory') return [];
  return node.children.map(childId => map[childId]).filter(Boolean);
}

export function getParent(map: NodeMap, id: string): LegacyVFSNode | null {
  const node = getNode(map, id);
  if (!node || !node.parentId) return null;
  return getNode(map, node.parentId);
}

export function exists(map: NodeMap, parentId: string, name: string): boolean {
  const children = getChildren(map, parentId);
  return children.some(child => child.name === name);
}

export function createNode(
  map: NodeMap,
  parentId: string,
  name: string,
  type: LegacyVFSNodeType,
  content: string = '',
  owner?: string,
  group?: string
): { newMap: NodeMap; node: LegacyVFSNode; error?: string } {
  const parent = getNode(map, parentId);
  if (!parent) return { newMap: map, node: null as any, error: 'Parent directory does not exist' };
  if (parent.type !== 'directory') return { newMap: map, node: null as any, error: 'Parent is not a directory' };
  if (exists(map, parentId, name)) return { newMap: map, node: null as any, error: 'File or directory already exists' };

  const id = uuidv4();
  const now = Date.now();
  
  let extension = '';
  if (type === 'file' && name.includes('.')) {
    extension = name.split('.').pop() || '';
  }

  const node: LegacyVFSNode = {
    id,
    name,
    type,
    parentId,
    children: [],
    content,
    createdAt: now,
    modifiedAt: now,
    owner: owner || 'user',
    group: group || 'user',
    permissions: type === 'directory' ? '755' : '644',
    meta: {
      extension
    }
  };

  const newMap = {
    ...map,
    [id]: node,
    [parentId]: {
      ...parent,
      children: [...parent.children, id],
      modifiedAt: now
    }
  };

  return { newMap, node };
}

export function deleteNode(map: NodeMap, id: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  
  let newMap = { ...map };
  
  // Recursively delete children
  if (node.type === 'directory') {
    for (const childId of node.children) {
      newMap = deleteNode(newMap, childId).newMap;
    }
  }

  // Remove from parent
  if (node.parentId) {
    const parent = newMap[node.parentId];
    if (parent) {
      newMap[node.parentId] = {
        ...parent,
        children: parent.children.filter(childId => childId !== id),
        modifiedAt: Date.now()
      };
    }
  }

  delete newMap[id];
  return { newMap };
}

export function renameNode(map: NodeMap, id: string, newName: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  if (!node.parentId) return { newMap: map, error: 'Cannot rename root node' };
  
  if (exists(map, node.parentId, newName)) {
    return { newMap: map, error: 'A file or directory with this name already exists' };
  }

  return {
    newMap: {
      ...map,
      [id]: {
        ...node,
        name: newName,
        modifiedAt: Date.now()
      }
    }
  };
}

export function moveNode(map: NodeMap, id: string, newParentId: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  const newParent = getNode(map, newParentId);
  
  if (!node) return { newMap: map, error: 'Node does not exist' };
  if (!newParent) return { newMap: map, error: 'Target directory does not exist' };
  if (newParent.type !== 'directory') return { newMap: map, error: 'Target is not a directory' };
  if (!node.parentId) return { newMap: map, error: 'Cannot move root node' };
  if (node.parentId === newParentId) return { newMap: map };
  if (exists(map, newParentId, node.name)) return { newMap: map, error: 'A file or directory with this name already exists in the target' };

  // Prevent circular moves (moving a folder into its own child)
  let currentParentId: string | null = newParentId;
  while (currentParentId) {
    if (currentParentId === id) return { newMap: map, error: 'Cannot move a directory into itself or its children' };
    const p = getNode(map, currentParentId);
    currentParentId = p ? p.parentId : null;
  }

  const oldParent = getNode(map, node.parentId);
  if (!oldParent) return { newMap: map, error: 'Old parent does not exist' };

  const now = Date.now();

  return {
    newMap: {
      ...map,
      [node.parentId]: {
        ...oldParent,
        children: oldParent.children.filter(childId => childId !== id),
        modifiedAt: now
      },
      [newParentId]: {
        ...newParent,
        children: [...newParent.children, id],
        modifiedAt: now
      },
      [id]: {
        ...node,
        parentId: newParentId,
        modifiedAt: now
      }
    }
  };
}

export function updateContent(map: NodeMap, id: string, content: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  if (node.type !== 'file') return { newMap: map, error: 'Cannot update content of a directory' };

  return {
    newMap: {
      ...map,
      [id]: {
        ...node,
        content,
        modifiedAt: Date.now()
      }
    }
  };
}

export function updatePermissions(map: NodeMap, id: string, permissions: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  
  return {
    newMap: {
      ...map,
      [id]: {
        ...node,
        permissions,
        modifiedAt: Date.now()
      }
    }
  };
}

export function updateOwner(map: NodeMap, id: string, owner?: string, group?: string): { newMap: NodeMap; error?: string } {
  const node = getNode(map, id);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  
  return {
    newMap: {
      ...map,
      [id]: {
        ...node,
        owner: owner || node.owner,
        group: group || node.group,
        modifiedAt: Date.now()
      }
    }
  };
}

export function duplicateNode(map: NodeMap, id: string, newParentId: string): { newMap: NodeMap; newId?: string; error?: string } {
  const node = getNode(map, id);
  const newParent = getNode(map, newParentId);
  if (!node) return { newMap: map, error: 'Node does not exist' };
  if (!newParent) return { newMap: map, error: 'Target directory does not exist' };
  if (newParent.type !== 'directory') return { newMap: map, error: 'Target is not a directory' };
  
  // Prevent circular duplication (copying a folder into its own child)
  let currentParentId: string | null = newParentId;
  while (currentParentId) {
    if (currentParentId === id) return { newMap: map, error: 'Cannot copy a directory into itself or its children' };
    const p = getNode(map, currentParentId);
    currentParentId = p ? p.parentId : null;
  }

  // Generate unique name for the target directory
  let targetName = node.name;
  if (newParentId === node.parentId) {
    targetName = `${node.name} (copy)`;
    let i = 1;
    while (exists(map, newParentId, targetName)) {
      targetName = `${node.name} (copy ${i++})`;
    }
  } else {
    let i = 1;
    while (exists(map, newParentId, targetName)) {
      targetName = `${node.name} ${i++}`;
    }
  }

  let currentMap = { ...map };
  
  // Recursive function to deep copy a node
  function deepCopy(sourceId: string, destParentId: string, overriddenName?: string): string {
    const sourceNode = currentMap[sourceId];
    const newId = uuidv4();
    const now = Date.now();
    
    const copiedNode: LegacyVFSNode = {
      ...sourceNode,
      id: newId,
      name: overriddenName || sourceNode.name,
      parentId: destParentId,
      children: [], // will be populated
      createdAt: now,
      modifiedAt: now
    };
    
    currentMap[newId] = copiedNode;
    
    // add to parent
    const parent = currentMap[destParentId];
    currentMap[destParentId] = {
      ...parent,
      children: [...parent.children, newId],
      modifiedAt: now
    };
    
    if (sourceNode.type === 'directory') {
      for (const childId of sourceNode.children) {
        const copiedChildId = deepCopy(childId, newId);
        currentMap[newId].children.push(copiedChildId);
      }
    }
    
    return newId;
  }
  
  const newId = deepCopy(id, newParentId, targetName);
  return { newMap: currentMap, newId };
}

// ---- ASYNC IMPLEMENTATIONS FOR TASK 2 ----

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
