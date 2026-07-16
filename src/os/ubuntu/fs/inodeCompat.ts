import { type InodeTable, getDentries } from './inode';
import { type NodeMap, type LegacyVFSNode } from './types';
import { UBUNTU_ACCOUNTS } from '../../../config/accounts';

function getUsernameForUid(uid: number): string {
  if (uid === 0) return 'root';
  const index = uid - 1000;
  if (index >= 0 && index < UBUNTU_ACCOUNTS.length) {
    return UBUNTU_ACCOUNTS[index].username;
  }
  return 'user';
}

export function buildCompatNodeMap(table: InodeTable, rootIno: number, inoToId: Record<number, string>): NodeMap {
  const map: NodeMap = {};
  
  function traverse(ino: number, parentId: string | null, name: string) {
    const inode = table[ino];
    if (!inode) return;

    const id = inoToId[ino] || ino.toString();
    const isDir = inode.type === 'directory';

    let children: string[] = [];
    if (isDir) {
      const dentries = getDentries(inode);
      children = dentries
        .filter(d => d.name !== '.' && d.name !== '..')
        .map(d => inoToId[d.ino] || d.ino.toString());
    }

    const node: LegacyVFSNode = {
      id,
      name,
      type: inode.type === 'directory' ? 'directory' : 'file',
      parentId,
      children,
      content: inode.data || '',
      createdAt: inode.ctime,
      modifiedAt: inode.mtime,
      owner: getUsernameForUid(inode.uid),
      group: getUsernameForUid(inode.gid),
      permissions: inode.permissions.toString(8),
    };

    map[id] = node;

    if (isDir) {
      const dentries = getDentries(inode);
      for (const d of dentries) {
        if (d.name !== '.' && d.name !== '..') {
          traverse(d.ino, id, d.name);
        }
      }
    }
  }

  traverse(rootIno, null, '');
  return map;
}

export function nodeMapToInodeTable(map: NodeMap, rootId: string): { table: InodeTable; rootIno: number; nextIno: number; idToIno: Record<string, number>; inoToId: Record<number, string> } {
  const table: InodeTable = {};
  let nextIno = 2;
  const idToIno: Record<string, number> = {};
  const inoToId: Record<number, string> = {};

  for (const id of Object.keys(map)) {
    const ino = nextIno++;
    idToIno[id] = ino;
    inoToId[ino] = id;
  }
  
  // Ensure root gets a consistent ino if we want, but dynamic is fine
  const rootIno = idToIno[rootId];

  // Second pass: build inodes
  for (const [id, node] of Object.entries(map)) {
    const ino = idToIno[id];
    let data: string | null = null;
    
    if (node.type === 'directory') {
      const dentries: { name: string; ino: number }[] = [
        { name: '.', ino },
        { name: '..', ino: node.parentId ? idToIno[node.parentId] : ino }
      ];
      
      for (const childId of node.children) {
        const childNode = map[childId];
        if (childNode) {
          dentries.push({ name: childNode.name, ino: idToIno[childId] });
        }
      }
      data = JSON.stringify(dentries);
    } else {
      data = node.content;
    }

    const inode: import('./inode').Inode = {
      ino,
      type: node.type === 'directory' ? 'directory' : 'file',
      permissions: parseInt(node.permissions || (node.type === 'directory' ? '755' : '644'), 8),
      uid: node.owner === 'root' ? 0 : (UBUNTU_ACCOUNTS.findIndex((a: any) => a.username === node.owner) >= 0 ? 1000 + UBUNTU_ACCOUNTS.findIndex((a: any) => a.username === node.owner) : 1000),
      gid: node.group === 'root' ? 0 : (UBUNTU_ACCOUNTS.findIndex((a: any) => a.username === node.group) >= 0 ? 1000 + UBUNTU_ACCOUNTS.findIndex((a: any) => a.username === node.group) : 1000),
      size: data ? new Blob([data]).size : 0,
      atime: node.createdAt || Date.now(),
      mtime: node.modifiedAt || Date.now(),
      ctime: node.createdAt || Date.now(),
      links: node.type === 'directory' ? 2 + node.children.length : 1,
      data
    };
    
    table[ino] = inode;
  }

  return { table, rootIno, nextIno, idToIno, inoToId };
}
