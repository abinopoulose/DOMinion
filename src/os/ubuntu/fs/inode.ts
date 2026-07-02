export type InodeType = 'file' | 'directory' | 'symlink' | 'block' | 'character' | 'pipe' | 'proc_file' | 'character_device';

export interface Inode {
  ino: number;               // Unique Inode Number
  type: InodeType;
  permissions: number;       // e.g., 0o755 (stored as octal/number)
  uid: number;               // User ID of owner
  gid: number;               // Group ID of owner
  size: number;              // Size in bytes
  atime: number;             // Access time
  mtime: number;             // Modification time
  ctime: number;             // Status change time
  links: number;             // Hard link count
  data: string | null;       // The actual file content, symlink target, or JSON serialized Dentries
}

export interface Dentry {
  name: string;              // The name in the folder (e.g., "hosts")
  ino: number;               // Pointer to the Inode
}

export interface InodeTable {
  [ino: number]: Inode;
}

export function allocInode(
  table: InodeTable,
  nextIno: number,
  type: InodeType,
  permissions: number,
  uid: number,
  gid: number,
  data: string | null = null
): { ino: number; inode: Inode; nextIno: number } {
  const ino = nextIno;
  const now = Date.now();
  const inode: Inode = {
    ino,
    type,
    permissions,
    uid,
    gid,
    size: data ? new Blob([data]).size : 0,
    atime: now,
    mtime: now,
    ctime: now,
    links: 1, // At least 1 link upon allocation, usually the dentry pointing to it
    data
  };

  table[ino] = inode;
  return { ino, inode, nextIno: nextIno + 1 };
}

export function freeInode(table: InodeTable, ino: number): void {
  delete table[ino];
}

export function getDentries(inode: Inode): Dentry[] {
  if (inode.type !== 'directory') return [];
  if (!inode.data) return [];
  try {
    return JSON.parse(inode.data);
  } catch (e) {
    return [];
  }
}

export function setDentries(inode: Inode, dentries: Dentry[]): void {
  if (inode.type !== 'directory') return;
  inode.data = JSON.stringify(dentries);
  inode.size = new Blob([inode.data]).size;
  inode.mtime = Date.now();
}
