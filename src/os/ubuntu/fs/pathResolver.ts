import type { NodeMap, VFSNode } from './types';
import { getNode, getChildren, getParent } from './operations';

export function resolvePath(map: NodeMap, rootId: string, absolutePath: string, depth: number = 0): VFSNode | null {
  if (depth > 40) return null; // ELOOP
  
  if (absolutePath === '/') return getNode(map, rootId);

  const segments = absolutePath.split('/').filter(Boolean);
  let currentNode: VFSNode | null = getNode(map, rootId);

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!currentNode) return null;

    if (segment === '.') continue;
    if (segment === '..') {
      if (currentNode.parentId) {
        currentNode = getNode(map, currentNode.parentId);
      }
      continue;
    }

    if (currentNode.type !== 'directory') return null;
    
    const children = getChildren(map, currentNode.id);
    const nextNode = children.find(child => child.name === segment);
    
    if (!nextNode) return null;

    if (nextNode.type === 'symlink') {
      const remainingPath = segments.slice(i + 1).join('/');
      const targetPath = nextNode.content || '';
      const isAbsolute = targetPath.startsWith('/');
      
      let newResolutionPath = targetPath;
      if (remainingPath) {
        newResolutionPath += '/' + remainingPath;
      }

      if (isAbsolute) {
        return resolvePath(map, rootId, newResolutionPath, depth + 1);
      } else {
        const parentId = nextNode.parentId || rootId;
        const parentAbsPath = getAbsolutePath(map, parentId);
        return resolvePath(map, rootId, parentAbsPath + '/' + newResolutionPath, depth + 1);
      }
    }

    currentNode = nextNode;
  }

  return currentNode;
}

export function getAbsolutePath(map: NodeMap, nodeId: string): string {
  const node = getNode(map, nodeId);
  if (!node) return '/';
  if (!node.parentId) return '/';

  let current: VFSNode | null = node;
  const segments: string[] = [];

  while (current && current.parentId) {
    segments.unshift(current.name);
    current = getParent(map, current.id);
  }

  return '/' + segments.join('/');
}

export function resolveRelativePath(map: NodeMap, cwdId: string, path: string, rootId: string): VFSNode | null {
  if (path.startsWith('/')) {
    return resolvePath(map, rootId, path);
  }

  const cwdAbs = getAbsolutePath(map, cwdId);
  const combined = cwdAbs === '/' ? '/' + path : cwdAbs + '/' + path;
  return resolvePath(map, rootId, combined);
}
