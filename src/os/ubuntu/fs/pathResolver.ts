import type { NodeMap, VFSNode } from './types';
import { getNode, getChildren, getParent } from './operations';

export function resolvePath(map: NodeMap, rootId: string, absolutePath: string): VFSNode | null {
  if (absolutePath === '/') return getNode(map, rootId);

  const segments = absolutePath.split('/').filter(Boolean);
  let currentNode: VFSNode | null = getNode(map, rootId);

  for (const segment of segments) {
    if (!currentNode || currentNode.type !== 'directory') return null;
    
    const children = getChildren(map, currentNode.id);
    const nextNode = children.find(child => child.name === segment);
    
    if (!nextNode) return null;
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

  const segments = path.split('/').filter(Boolean);
  let currentNode: VFSNode | null = getNode(map, cwdId);

  for (const segment of segments) {
    if (!currentNode) return null;

    if (segment === '.') {
      continue;
    } else if (segment === '..') {
      if (currentNode.parentId) {
        currentNode = getNode(map, currentNode.parentId);
      }
    } else {
      if (currentNode.type !== 'directory') return null;
      const children = getChildren(map, currentNode.id);
      const nextNode = children.find(child => child.name === segment);
      if (!nextNode) return null;
      currentNode = nextNode;
    }
  }

  return currentNode;
}
