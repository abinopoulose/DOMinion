

import { getDB } from './db';
import type { VFSNode } from './types';

// Simple in-memory cache for path -> ID resolution
const pathCache = new Map<string, string>();

export function clearPathCache() {
  pathCache.clear();
}

/** Pre-warm the cache with a known path → node ID mapping (e.g. from seed). */
export function primePathCache(absolutePath: string, nodeId: string) {
  pathCache.set(absolutePath, nodeId);
}

export async function resolvePathAsync(absolutePath: string, depth: number = 0): Promise<VFSNode | null> {
  if (depth > 40) {
    console.error(`[VFS Sync: pathResolver] ELOOP: Too many symlinks or infinite loop resolving '${absolutePath}'`);
    return null; // ELOOP
  }
  
  if (absolutePath === '/') {
    const db = await getDB();
    const node = await db.get('inodes', 'root');
    if (!node) console.error(`[VFS Sync: pathResolver] CRITICAL: 'root' node not found in database!`);
    return node || null;
  }

  // Check cache
  if (pathCache.has(absolutePath)) {
    const id = pathCache.get(absolutePath)!;
    const db = await getDB();
    const node = await db.get('inodes', id);
    if (node) {
      console.log(`[VFS Sync: pathResolver] Cache HIT for '${absolutePath}' -> ${id}`);
      return node;
    }
    console.warn(`[VFS Sync: pathResolver] Cache STALE for '${absolutePath}' (ID: ${id} not found in DB). Evicting.`);
    pathCache.delete(absolutePath);
  } else {
    console.log(`[VFS Sync: pathResolver] Cache MISS for '${absolutePath}'. Traversing from root...`);
  }

  const segments = absolutePath.split('/').filter(Boolean);
  const db = await getDB();
  let currentNode: VFSNode | undefined = await db.get('inodes', 'root');
  
  if (!currentNode) {
    console.error(`[VFS Sync: pathResolver] Traversing aborted: 'root' node missing from database.`);
  }

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!currentNode) {
      console.log(`[VFS Sync: pathResolver] Resolution failed at segment '${segment}': parent node is undefined.`);
      return null;
    }

    if (segment === '.') continue;
    if (segment === '..') {
      if (currentNode.parentId) {
        currentNode = await db.get('inodes', currentNode.parentId);
      }
      continue;
    }

    if (currentNode.type !== 'directory') {
      console.error(`[VFS Sync: pathResolver] ENOTDIR: Expected directory at '${currentNode.name}' while traversing to '${segment}'`);
      return null;
    }
    
    const children = await db.getAllFromIndex('inodes', 'by-parent', currentNode.id);
    const nextNode = children.find(child => child.name === segment);
    
    if (!nextNode) {
      // Return null quietly for ENOENT, it's expected behavior for stat checks
      return null;
    }

    if (nextNode.type === 'symlink') {
      const remainingPath = segments.slice(i + 1).join('/');
      const targetPath = nextNode.meta?.symlinkTarget || '';
      const isAbsolute = targetPath.startsWith('/');
      
      let newResolutionPath = targetPath;
      if (remainingPath) {
        newResolutionPath += '/' + remainingPath;
      }

      if (isAbsolute) {
        return resolvePathAsync(newResolutionPath, depth + 1);
      } else {
        const parentId = nextNode.parentId || 'root';
        const parentAbsPath = await getAbsolutePathAsync(parentId);
        return resolvePathAsync(parentAbsPath + '/' + newResolutionPath, depth + 1);
      }
    }

    currentNode = nextNode;
  }

  if (currentNode) {
    pathCache.set(absolutePath, currentNode.id);
  }

  return currentNode || null;
}

export async function getAbsolutePathAsync(nodeId: string): Promise<string> {
  if (nodeId === 'root') return '/';
  
  const db = await getDB();
  let current: VFSNode | undefined = await db.get('inodes', nodeId);
  
  if (!current || !current.parentId) return '/';

  const segments: string[] = [];

  while (current && current.parentId) {
    segments.unshift(current.name);
    current = await db.get('inodes', current.parentId);
  }

  return '/' + segments.join('/');
}

export async function resolveRelativePathAsync(cwdPath: string, path: string): Promise<VFSNode | null> {
  if (path.startsWith('/')) {
    return resolvePathAsync(path);
  }

  const combined = cwdPath === '/' ? '/' + path : cwdPath + '/' + path;
  return resolvePathAsync(combined);
}
