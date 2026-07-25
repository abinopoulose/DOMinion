import { describe, it, expect } from 'vitest';
import { createNode, deleteNode, updatePermissions } from '../../../../src/os/ubuntu/fs/inodeOperations';
import type { InodeTable } from '../../../../src/os/ubuntu/fs/inode';

describe('Inode Operations', () => {
  const getMockTable = (): InodeTable => ({
    1: { ino: 1, type: 'directory', permissions: 0o755, uid: 0, gid: 0, size: 0, atime: 0, mtime: 0, ctime: 0, links: 2, data: JSON.stringify([{name: '.', ino: 1}, {name: '..', ino: 1}]) }
  });

  it('creates an inode', () => {
    let table = getMockTable();
    const result = createNode(table, 2, 1, 'test.txt', 'file', 'hello', 1000, 1000, 0o644);
    expect(result.error).toBeUndefined();
    expect(result.ino).toBe(2);
    expect(result.newTable[2].data).toBe('hello');
  });

  it('updates permissions', () => {
    let table = getMockTable();
    const { newTable, ino } = createNode(table, 2, 1, 'test.txt', 'file');
    const updateResult = updatePermissions(newTable, ino, 0o777);
    expect(updateResult.error).toBeUndefined();
    expect(updateResult.newTable[ino].permissions).toBe(0o777);
  });

  it('deletes an inode', () => {
    let table = getMockTable();
    const { newTable, ino } = createNode(table, 2, 1, 'test.txt', 'file');
    const deleteResult = deleteNode(newTable, 1, 'test.txt');
    expect(deleteResult.error).toBeUndefined();
    expect(deleteResult.newTable[ino]).toBeUndefined();
  });
});
