import { getDB } from './db';
import type { VFSNode, SecurityContext } from './types';
import { hasPermission } from './permissions';

export class AuthorizedVFS {
  static async validatePut(node: VFSNode, context: SecurityContext, existingNodeInfo?: VFSNode, parentNodeInfo?: VFSNode): Promise<void> {
    if (context.capabilities.includes('IGNORE_PERMISSIONS') || context.uid === 'root') return;

    let existingNode = existingNodeInfo;
    let parentNode = parentNodeInfo;

    if (existingNode === undefined) {
      const db = await getDB();
      existingNode = await db.get('inodes', node.id);
    }

    if (existingNode) {
      if (!hasPermission(existingNode, 'write', context)) {
        throw new Error(`EACCES: permission denied, write '${node.name}'`);
      }
    }

    if (node.parentId) {
      if (parentNode === undefined) {
        const db = await getDB();
        parentNode = await db.get('inodes', node.parentId);
      }
      if (parentNode && !hasPermission(parentNode, 'write', context)) {
        throw new Error(`EACCES: permission denied, write to parent of '${node.name}'`);
      }
    }
  }



  static async validateDelete(nodeId: string, context: SecurityContext, nodeInfo?: VFSNode, parentNodeInfo?: VFSNode): Promise<void> {
    if (nodeId === 'root') {
      throw new Error("EBUSY: device or resource busy");
    }

    if (context.capabilities.includes('IGNORE_PERMISSIONS') || context.uid === 'root') return;

    let node = nodeInfo;
    let parentNode = parentNodeInfo;

    if (node === undefined) {
      const db = await getDB();
      node = await db.get('inodes', nodeId);
    }
    if (!node) return; // already gone

    if ((node as any).meta?.systemImmutable) {
      throw new Error(`EPERM: Operation not permitted (system immutable)`);
    }

    if (node.parentId) {
      if (parentNode === undefined) {
        const db = await getDB();
        parentNode = await db.get('inodes', node.parentId);
      }
      if (parentNode && !hasPermission(parentNode, 'write', context)) {
        throw new Error(`EACCES: permission denied, remove '${node.name}'`);
      }
    } else {
      throw new Error(`EBUSY: device or resource busy`);
    }
  }

  static async putNode(node: VFSNode, context: SecurityContext): Promise<void> {
    await this.validatePut(node, context);
    const db = await getDB();
    await db.put('inodes', node);
  }

  static async deleteNode(nodeId: string, context: SecurityContext): Promise<void> {
    await this.validateDelete(nodeId, context);
    const db = await getDB();
    await db.delete('inodes', nodeId);
    await db.delete('file_data', nodeId);
  }
}
