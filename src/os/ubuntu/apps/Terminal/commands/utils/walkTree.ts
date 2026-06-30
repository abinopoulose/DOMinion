import { useVFSStore } from '../../../../store';
import type { VFSNode } from '../../../../fs/types';

/**
 * Recursively walk the VFS tree starting from `nodeId`, calling `visitor`
 * for every node encountered (depth-first, pre-order).
 *
 * @param nodeId      - Starting node ID in the VFS.
 * @param currentPath - The display path for this node (e.g. "." or "./Documents").
 * @param visitor     - Callback invoked for each node with its VFSNode and display path.
 *
 * @example
 * // Collect all file paths under current directory
 * const paths: string[] = [];
 * walkTree(cwdId, '.', (node, path) => {
 *   if (node.type === 'file') paths.push(path);
 * });
 */
export function walkTree(
  nodeId: string,
  currentPath: string,
  visitor: (node: VFSNode, path: string) => void
): void {
  const store = useVFSStore.getState();
  const node = store.getNode(nodeId);
  if (!node) return;

  // Visit the current node
  visitor(node, currentPath);

  // If directory, recurse into children
  if (node.type === 'directory') {
    const children = store.getChildren(nodeId);
    for (const child of children) {
      const childPath = currentPath === '.'
        ? `./${child.name}`
        : `${currentPath}/${child.name}`;
      walkTree(child.id, childPath, visitor);
    }
  }
}
