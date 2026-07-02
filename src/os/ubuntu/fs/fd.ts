import { useVFSStore } from '../store/useUbuntuVFSStore';
import { resolvePath } from './inodeOperations';
import { R_OK, W_OK, checkAccess } from './permissions';
import { virtualDevices } from './virtualDevices';

export interface OpenFileDescription {
  ino: number;
  mode: 'r' | 'w' | 'a';
  offset: number;
}

export interface ProcessState {
  pid: number;
  fds: Record<number, OpenFileDescription>;
  
  // High-level Stream API
  stdout: {
    write: (data: string) => void;
    writeLine: (data: string) => void;
  };
  stderr: {
    write: (data: string) => void;
    writeLine: (data: string) => void;
  };
  stdin: {
    readAll: () => string;
  };
}

// In-memory global open file table (simplified for simulated OS)
export const globalOpenFiles: Record<number, OpenFileDescription> = {};
let nextFd = 3;

export function openFile(path: string, mode: 'r' | 'w' | 'a', cwdId: string, euid: number, egid: number): number {
  const store = useVFSStore.getState();
  const rootIno = store.rootIno;
  
  let targetPath = path;
  if (!path.startsWith('/')) {
    const cwdAbs = store.getAbsolutePath(cwdId);
    targetPath = cwdAbs === '/' ? '/' + path : cwdAbs + '/' + path;
  }
  
  let inode = resolvePath(store.inodeTable, rootIno, targetPath);
  
  if (!inode && (mode === 'w' || mode === 'a')) {
    // Attempt to create the file
    const parentPathSegments = targetPath.split('/');
    const fileName = parentPathSegments.pop();
    const parentPath = parentPathSegments.join('/') || '/';
    
    const parentInode = resolvePath(store.inodeTable, rootIno, parentPath);
    if (!parentInode || parentInode.type !== 'directory') throw new Error('No such file or directory');
    
    if (!checkAccess(parentInode, W_OK, euid, egid)) throw new Error('Permission denied');
    
    const { error, id } = store.createNode(store.inoToId[parentInode.ino], fileName!, 'file', '', euid === 0 ? 'root' : 'user');
    if (error || !id) throw new Error(error || 'Failed to create file');
    
    inode = store.inodeTable[store.idToIno[id]];
  }
  
  if (!inode) throw new Error('No such file or directory');
  if (inode.type === 'directory') throw new Error('Is a directory');
  
  if (mode === 'r' && !checkAccess(inode, R_OK, euid, egid)) throw new Error('Permission denied');
  if ((mode === 'w' || mode === 'a') && !checkAccess(inode, W_OK, euid, egid)) throw new Error('Permission denied');
  
  const fd = nextFd++;
  
  if (mode === 'w') {
    // Truncate
    store.updateContent(store.inoToId[inode.ino], '');
    inode.data = '';
  }
  
  globalOpenFiles[fd] = {
    ino: inode.ino,
    mode,
    offset: mode === 'a' ? (inode.data?.length || 0) : 0,
  };
  
  return fd;
}

export function writeToFile(fd: number, data: string) {
  const openFile = globalOpenFiles[fd];
  if (!openFile) throw new Error('Bad file descriptor');
  if (openFile.mode === 'r') throw new Error('File not open for writing');
  
  
  const store = useVFSStore.getState();
  const inode = store.inodeTable[openFile.ino];
  if (!inode) throw new Error('Inode missing');
  
  if (inode.type === 'proc_file' || inode.type === 'character_device') {
    const deviceName = inode.data;
    if (deviceName && virtualDevices[deviceName]) {
      virtualDevices[deviceName].write(data);
      return;
    }
  }

  let currentContent = inode.data || '';
  let newContent = '';
  
  if (openFile.offset === currentContent.length) {
    newContent = currentContent + data;
  } else {
    newContent = currentContent.substring(0, openFile.offset) + data + currentContent.substring(openFile.offset + data.length);
  }
  
  store.updateContent(store.inoToId[openFile.ino], newContent);
  openFile.offset += data.length;
}

export function closeFile(fd: number) {
  delete globalOpenFiles[fd];
}

export function readFile(fd: number): string {
  const openFile = globalOpenFiles[fd];
  if (!openFile) throw new Error('Bad file descriptor');
  if (openFile.mode !== 'r') throw new Error('File not open for reading');
  
  const store = useVFSStore.getState();
  const inode = store.inodeTable[openFile.ino];
  if (!inode) throw new Error('Inode missing');
  
  if (inode.type === 'proc_file' || inode.type === 'character_device') {
    const deviceName = inode.data;
    if (deviceName && virtualDevices[deviceName]) {
      return virtualDevices[deviceName].read(openFile.offset);
    }
  }

  const content = inode.data || '';
  const result = content.substring(openFile.offset);
  openFile.offset = content.length;
  return result;
}
