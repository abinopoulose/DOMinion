import { resolveRelativePathAsync, getAbsolutePathAsync } from './pathResolver';
import { writeFile, readFile as fsReadFile } from './operations';
// virtualDevices removed

export interface OpenFileDescription {
  id: string; // VFS Node ID
  mode: 'r' | 'w' | 'a';
  offset: number;
  content: string; // buffered content
}

export interface ProcessState {
  pid: number;
  fds: Record<number, OpenFileDescription>;
  
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

export const globalOpenFiles: Record<number, OpenFileDescription> = {};
let nextFd = 3;

export async function openFile(path: string, mode: 'r' | 'w' | 'a', cwdId: string, _euid: number, _egid: number): Promise<number> {
  const cwdPath = await getAbsolutePathAsync(cwdId);
  let node = await resolveRelativePathAsync(cwdPath, path);
  
  if (!node && (mode === 'w' || mode === 'a')) {
    const parentPathSegments = path.split('/');
    const fileName = parentPathSegments.pop();
    const parentPath = parentPathSegments.join('/') || '.';
    
    const parentNode = await resolveRelativePathAsync(cwdPath, parentPath);
    if (!parentNode || parentNode.type !== 'directory') throw new Error('No such file or directory');
    
    const parentAbsPath = await getAbsolutePathAsync(parentNode.id);
    const newFilePath = parentAbsPath === '/' ? '/' + fileName : parentAbsPath + '/' + fileName;
    
    await writeFile(newFilePath, new Blob([]));
    node = await resolveRelativePathAsync(cwdPath, path);
  }
  
  if (!node) throw new Error('No such file or directory');
  if (node.type === 'directory') throw new Error('Is a directory');
  
  const fd = nextFd++;
  
  let currentContent = '';
  if (mode === 'r' || mode === 'a') {
    const absPath = await getAbsolutePathAsync(node.id);
    const blob = await fsReadFile(absPath);
    currentContent = await blob.text();
  }
  
  globalOpenFiles[fd] = {
    id: node.id,
    mode,
    offset: mode === 'a' ? currentContent.length : 0,
    content: currentContent
  };
  
  return fd;
}

export function writeToFile(fd: number, data: string) {
  const openFile = globalOpenFiles[fd];
  if (!openFile) throw new Error('Bad file descriptor');
  if (openFile.mode === 'r') throw new Error('File not open for writing');
  
  const currentContent = openFile.content;
  let newContent = '';
  if (openFile.offset === currentContent.length) {
    newContent = currentContent + data;
  } else {
    newContent = currentContent.substring(0, openFile.offset) + data + currentContent.substring(openFile.offset + data.length);
  }
  
  openFile.content = newContent;
  openFile.offset += data.length;
}

export async function closeFile(fd: number) {
  const openFile = globalOpenFiles[fd];
  if (openFile && (openFile.mode === 'w' || openFile.mode === 'a')) {
    const absPath = await getAbsolutePathAsync(openFile.id);
    await writeFile(absPath, new Blob([openFile.content]));
  }
  delete globalOpenFiles[fd];
}

export function readFile(fd: number): string {
  const openFile = globalOpenFiles[fd];
  if (!openFile) throw new Error('Bad file descriptor');
  if (openFile.mode !== 'r') throw new Error('File not open for reading');
  
  const result = openFile.content.substring(openFile.offset);
  openFile.offset = openFile.content.length;
  return result;
}
