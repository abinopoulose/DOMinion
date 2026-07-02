import { allocInode, freeInode, getDentries, setDentries } from './inode';
import type { Inode, InodeTable, Dentry, InodeType } from './inode';

export function resolvePath(table: InodeTable, rootIno: number, path: string): Inode | null {
  if (!path || path === '/') return table[rootIno] || null;
  
  const segments = path.split('/').filter(Boolean);
  let currentIno = rootIno;

  for (const segment of segments) {
    const inode = table[currentIno];
    if (!inode || inode.type !== 'directory') return null;

    const dentries = getDentries(inode);
    const dentry = dentries.find(d => d.name === segment);
    if (!dentry) return null;

    currentIno = dentry.ino;
  }

  return table[currentIno] || null;
}

export function createNode(
  table: InodeTable,
  nextIno: number,
  parentIno: number,
  name: string,
  type: InodeType,
  content: string = '',
  uid: number = 1000,
  gid: number = 1000,
  permissions?: number
): { newTable: InodeTable; nextIno: number; ino: number; error?: string } {
  const parent = table[parentIno];
  if (!parent || parent.type !== 'directory') return { newTable: table, nextIno, ino: -1, error: 'Parent is not a directory' };
  
  const dentries = getDentries(parent);
  if (dentries.some(d => d.name === name)) return { newTable: table, nextIno, ino: -1, error: 'File exists' };

  let newTable = { ...table };
  
  const finalPerms = permissions !== undefined ? permissions : (type === 'directory' ? 0o755 : 0o644);
  
  const result = allocInode(newTable, nextIno, type, finalPerms, uid, gid, content);
  newTable = { ...newTable, [result.ino]: result.inode };
  
  const newDentry: Dentry = { name, ino: result.ino };
  const newDentries = [...dentries, newDentry];
  
  const newParent = { ...parent };
  setDentries(newParent, newDentries);
  newTable[parentIno] = newParent;
  
  if (type === 'directory') {
    const dirDentries: Dentry[] = [
      { name: '.', ino: result.ino },
      { name: '..', ino: parentIno }
    ];
    const newDir = { ...result.inode };
    setDentries(newDir, dirDentries);
    newTable[result.ino] = newDir;
  }

  return { newTable, nextIno: result.nextIno, ino: result.ino };
}

export function deleteNode(
  table: InodeTable,
  parentIno: number,
  name: string
): { newTable: InodeTable; error?: string } {
  const parent = table[parentIno];
  if (!parent || parent.type !== 'directory') return { newTable: table, error: 'Parent not a directory' };

  const dentries = getDentries(parent);
  const index = dentries.findIndex(d => d.name === name);
  if (index === -1) return { newTable: table, error: 'No such file' };

  const targetIno = dentries[index].ino;
  const target = table[targetIno];
  
  if (target.type === 'directory') {
    const targetDentries = getDentries(target);
    if (targetDentries.length > 2) return { newTable: table, error: 'Directory not empty' };
  }

  const newDentries = [...dentries];
  newDentries.splice(index, 1);
  
  const newParent = { ...parent };
  setDentries(newParent, newDentries);
  
  const newTable = { ...table, [parentIno]: newParent };
  
  const newTarget = { ...target };
  newTarget.links--;
  if (newTarget.links <= 0) {
    freeInode(newTable, targetIno);
  } else {
    newTable[targetIno] = newTarget;
  }

  return { newTable };
}

export function renameNode(
  table: InodeTable,
  oldParentIno: number,
  oldName: string,
  newParentIno: number,
  newName: string
): { newTable: InodeTable; error?: string } {
  const oldParent = table[oldParentIno];
  const newParent = table[newParentIno];
  if (!oldParent || oldParent.type !== 'directory') return { newTable: table, error: 'Old parent not a directory' };
  if (!newParent || newParent.type !== 'directory') return { newTable: table, error: 'New parent not a directory' };

  const oldDentries = getDentries(oldParent);
  const oldIndex = oldDentries.findIndex(d => d.name === oldName);
  if (oldIndex === -1) return { newTable: table, error: 'No such file' };

  const newDentries = getDentries(newParent);
  if (newDentries.some(d => d.name === newName)) return { newTable: table, error: 'Destination exists' };

  const targetIno = oldDentries[oldIndex].ino;

  const newOldDentries = [...oldDentries];
  newOldDentries.splice(oldIndex, 1);

  const newNewDentries = oldParentIno === newParentIno ? newOldDentries : [...newDentries];
  newNewDentries.push({ name: newName, ino: targetIno });

  const newTable = { ...table };
  
  const nextOldParent = { ...oldParent };
  setDentries(nextOldParent, newOldDentries);
  newTable[oldParentIno] = nextOldParent;
  
  if (oldParentIno !== newParentIno) {
    const nextNewParent = { ...newParent };
    setDentries(nextNewParent, newNewDentries);
    newTable[newParentIno] = nextNewParent;
  }
  
  const target = table[targetIno];
  if (target.type === 'directory' && oldParentIno !== newParentIno) {
    const targetDentries = getDentries(target);
    const dotDotIndex = targetDentries.findIndex(d => d.name === '..');
    if (dotDotIndex !== -1) {
      targetDentries[dotDotIndex].ino = newParentIno;
      const nextTarget = { ...target };
      setDentries(nextTarget, targetDentries);
      newTable[targetIno] = nextTarget;
    }
  }

  return { newTable };
}

export function updateContent(table: InodeTable, ino: number, content: string): { newTable: InodeTable; error?: string } {
  const inode = table[ino];
  if (!inode) return { newTable: table, error: 'Inode not found' };
  if (inode.type === 'directory') return { newTable: table, error: 'Cannot write to directory' };

  const newTable = { ...table, [ino]: { ...inode, data: content, size: new Blob([content]).size, mtime: Date.now() } };
  return { newTable };
}

export function updatePermissions(table: InodeTable, ino: number, permissions: number): { newTable: InodeTable; error?: string } {
  const inode = table[ino];
  if (!inode) return { newTable: table, error: 'Inode not found' };

  const newTable = { ...table, [ino]: { ...inode, permissions, ctime: Date.now() } };
  return { newTable };
}

export function updateOwner(table: InodeTable, ino: number, uid: number, gid: number): { newTable: InodeTable; error?: string } {
  const inode = table[ino];
  if (!inode) return { newTable: table, error: 'Inode not found' };

  const newTable = { ...table, [ino]: { ...inode, uid, gid, ctime: Date.now() } };
  return { newTable };
}

export function linkInode(table: InodeTable, parentIno: number, name: string, targetIno: number): { newTable: InodeTable; error?: string } {
  const parent = table[parentIno];
  if (!parent || parent.type !== 'directory') return { newTable: table, error: 'Parent not a directory' };

  const dentries = getDentries(parent);
  if (dentries.some(d => d.name === name)) return { newTable: table, error: 'File exists' };

  const target = table[targetIno];
  if (!target) return { newTable: table, error: 'Target not found' };
  if (target.type === 'directory') return { newTable: table, error: 'Hard link not allowed for directory' };

  const newDentries = [...dentries, { name, ino: targetIno }];
  const newParent = { ...parent };
  setDentries(newParent, newDentries);

  const newTarget = { ...target };
  newTarget.links++;

  return { newTable: { ...table, [parentIno]: newParent, [targetIno]: newTarget } };
}

export function symlinkInode(
  table: InodeTable,
  nextIno: number,
  parentIno: number,
  name: string,
  targetPath: string,
  uid: number = 1000,
  gid: number = 1000
): { newTable: InodeTable; nextIno: number; ino: number; error?: string } {
  const parent = table[parentIno];
  if (!parent || parent.type !== 'directory') return { newTable: table, nextIno, ino: -1, error: 'Parent not a directory' };
  
  const dentries = getDentries(parent);
  if (dentries.some(d => d.name === name)) return { newTable: table, nextIno, ino: -1, error: 'File exists' };

  let newTable = { ...table };
  
  const result = allocInode(newTable, nextIno, 'symlink', 0o777, uid, gid, targetPath);
  newTable = { ...newTable, [result.ino]: result.inode };
  
  const newDentry: Dentry = { name, ino: result.ino };
  const newDentries = [...dentries, newDentry];
  
  const newParent = { ...parent };
  setDentries(newParent, newDentries);
  newTable[parentIno] = newParent;
  
  return { newTable, nextIno: result.nextIno, ino: result.ino };
}
