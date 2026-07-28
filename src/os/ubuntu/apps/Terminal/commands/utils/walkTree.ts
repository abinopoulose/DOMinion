import { getAbsolutePathAsync } from '../../../../fs/pathResolver';
import { stat, readdir } from '../../../../fs/operations';
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
  let absPath: string;
  try {
    absPath = await getAbsolutePathAsync(nodeId);
  } catch {
    return;
  }

  let node: VFSNode;
  try {
    node = await stat(absPath, { asUser: username });
  } catch (err) {
    return;
  }

  // Visit the current node
  await visitor(node, currentPath);

  // If directory, recurse into children
  if (node.type === 'directory') {
    let children: VFSNode[];
    try {
      children = await readdir(absPath, { asUser: username });
    } catch (err) {
      return; // EACCES or other error
    }
    
    for (const child of children) {
      const childPath = currentPath === '.'
        ? `./${child.name}`
        : `${currentPath}/${child.name}`;
      await walkTree(child.id, childPath, username, visitor);
    }
  }
}
