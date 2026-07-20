import { getDB } from '../../../../fs/db';
import type { VFSNode } from '../../../../fs/types';

/**
 * Recursively walk the VFS tree starting from `nodeId`, calling `visitor`
 * for every node encountered (depth-first, pre-order).
 */
export async function walkTree(
  nodeId: string,
  currentPath: string,
  username: string,
  visitor: (node: VFSNode, path: string) => void | Promise<void>
): Promise<void> {
  const db = await getDB();
  const node = await db.get('inodes', nodeId);
  if (!node) return;

  // Visit the current node
  await visitor(node, currentPath);

  // If directory, recurse into children
  if (node.type === 'directory') {
    const children = await db.getAllFromIndex('inodes', 'by-parent', nodeId);
    for (const child of children) {
      const childPath = currentPath === '.'
        ? `./${child.name}`
        : `${currentPath}/${child.name}`;
      await walkTree(child.id, childPath, username, visitor);
    }
  }
}
