import { describe, it, expect } from 'vitest';
import { allocInode, freeInode, getDentries, setDentries, InodeTable } from '../../../../src/os/ubuntu/fs/inode';

describe('Inode Operations', () => {
  it('allocates a new inode', () => {
    const table: InodeTable = {};
    const result = allocInode(table, 1, 'file', 0o755, 1000, 1000, 'test data');
    
    expect(result.ino).toBe(1);
    expect(result.nextIno).toBe(2);
    expect(table[1]).toBeDefined();
    expect(table[1].type).toBe('file');
    expect(table[1].permissions).toBe(0o755);
    expect(table[1].uid).toBe(1000);
    expect(table[1].gid).toBe(1000);
    expect(table[1].size).toBeGreaterThan(0);
    expect(table[1].data).toBe('test data');
  });

  it('frees an inode', () => {
    const table: InodeTable = {};
    allocInode(table, 1, 'file', 0o755, 1000, 1000);
    expect(table[1]).toBeDefined();
    
    freeInode(table, 1);
    expect(table[1]).toBeUndefined();
  });

  it('gets dentries from a directory inode', () => {
    const table: InodeTable = {};
    const { inode } = allocInode(table, 1, 'directory', 0o755, 1000, 1000);
    
    expect(getDentries(inode)).toEqual([]);
    
    const dentries = [{ name: 'test.txt', ino: 2 }];
    setDentries(inode, dentries);
    
    expect(getDentries(inode)).toEqual(dentries);
    expect(inode.data).toEqual(JSON.stringify(dentries));
    expect(inode.size).toBeGreaterThan(0);
  });

  it('returns empty array if trying to get dentries from non-directory', () => {
    const table: InodeTable = {};
    const { inode } = allocInode(table, 1, 'file', 0o755, 1000, 1000, 'file data');
    
    expect(getDentries(inode)).toEqual([]);
  });
  
  it('does nothing if trying to set dentries on non-directory', () => {
    const table: InodeTable = {};
    const { inode } = allocInode(table, 1, 'file', 0o755, 1000, 1000, 'file data');
    
    setDentries(inode, [{ name: 'test', ino: 2 }]);
    expect(inode.data).toBe('file data'); // unchanged
  });
});
