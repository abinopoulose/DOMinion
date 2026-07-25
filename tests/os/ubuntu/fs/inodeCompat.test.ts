import { describe, it, expect } from 'vitest';
import { buildCompatNodeMap, nodeMapToInodeTable } from '../../../../src/os/ubuntu/fs/inodeCompat';
import type { NodeMap } from '../../../../src/os/ubuntu/fs/types';

describe('Inode Compat', () => {
  it('converts NodeMap to InodeTable and back', () => {
    const map: NodeMap = {
      'root': {
        id: 'root',
        name: '',
        type: 'directory',
        parentId: null,
        children: ['file1'],
        content: '',
        permissions: '755',
        owner: 'root',
        group: 'root'
      },
      'file1': {
        id: 'file1',
        name: 'test.txt',
        type: 'file',
        parentId: 'root',
        children: [],
        content: 'hello',
        permissions: '644',
        owner: 'abino',
        group: 'users'
      }
    };

    const { table, rootIno, inoToId } = nodeMapToInodeTable(map, 'root');
    
    expect(rootIno).toBeDefined();
    expect(Object.keys(table).length).toBe(2);
    
    // Find the file inode
    const fileInoStr = Object.keys(table).find(ino => table[Number(ino)].type === 'file');
    expect(fileInoStr).toBeDefined();
    const fileInode = table[Number(fileInoStr!)];
    expect(fileInode.size).toBe(5); // 'hello'.length
    
    // Convert back
    const newMap = buildCompatNodeMap(table, rootIno, inoToId);
    expect(Object.keys(newMap).length).toBe(2);
    expect(newMap['root'].children).toContain('file1');
    expect(newMap['file1'].name).toBe('test.txt');
    expect(newMap['file1'].content).toBe('hello');
  });
});
