import type { NodeMap } from './types';
import type { Inode } from './inode';

export const R_OK = 4;
export const W_OK = 2;
export const X_OK = 1;

export const S_ISUID = 0o4000;
export const S_ISGID = 0o2000;
export const S_ISVTX = 0o1000;

export function checkAccess(inode: Inode, requestedAccess: number, euid: number, egid: number, euidGroups: number[] = []): boolean {
  // Root always has access
  if (euid === 0) return true;

  const mode = inode.permissions;

  if (inode.uid === euid) {
    const userBits = (mode >> 6) & 7;
    return (userBits & requestedAccess) === requestedAccess;
  }

  if (inode.gid === egid || euidGroups.includes(inode.gid)) {
    const groupBits = (mode >> 3) & 7;
    return (groupBits & requestedAccess) === requestedAccess;
  }

  const otherBits = mode & 7;
  return (otherBits & requestedAccess) === requestedAccess;
}

export function checkStickyBit(parentInode: Inode, targetInode: Inode, euid: number): boolean {
  if (euid === 0) return true; // root bypasses
  const hasSticky = (parentInode.permissions & S_ISVTX) === S_ISVTX;
  if (!hasSticky) return true;

  return parentInode.uid === euid || targetInode.uid === euid;
}

import { UBUNTU_ACCOUNTS } from '../../../config/accounts';

function getUidForUser(username: string): number {
  if (username === 'root') return 0;
  const index = UBUNTU_ACCOUNTS.findIndex(a => a.username === username);
  if (index >= 0) return 1000 + index;
  return 9999;
}

// Backwards compatibility layer for string-based checks
export function hasPermission(
  map: NodeMap,
  nodeId: string,
  operationType: 'read' | 'write' | 'execute',
  executionUser: string,
  _role?: string,
  nodeOverride?: any
): boolean {
  if (executionUser === 'root') return true;
  
  const node = nodeOverride || map[nodeId];
  if (!node) return false;

  const euid = getUidForUser(executionUser);
  const egid = euid;
  
  let mode: number;
  if (typeof node.permissions === 'number') {
    mode = node.permissions;
  } else if (typeof node.permissions === 'string') {
    mode = parseInt(node.permissions, 8);
  } else {
    mode = node.type === 'directory' ? 0o755 : 0o644;
  }
  const ownerName = (node as any).ownerId || node.owner || 'user';
  const groupName = (node as any).groupId || node.group || 'user';
  const uid = getUidForUser(ownerName);
  const gid = getUidForUser(groupName);

  // Fake an inode for the check
  const fakeInode: Inode = {
    ino: 0,
    type: node.type === 'directory' ? 'directory' : 'file',
    permissions: mode,
    uid,
    gid,
    size: 0,
    atime: 0,
    mtime: 0,
    ctime: 0,
    links: 1,
    data: null
  };

  let requestedAccess = 0;
  if (operationType === 'read') requestedAccess = R_OK;
  if (operationType === 'write') requestedAccess = W_OK;
  if (operationType === 'execute') requestedAccess = X_OK;

  return checkAccess(fakeInode, requestedAccess, euid, egid);
}
