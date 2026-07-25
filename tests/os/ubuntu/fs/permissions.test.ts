import { describe, it, expect } from 'vitest';
import { checkAccess, checkStickyBit, hasPermission, R_OK, W_OK, X_OK, S_ISVTX } from '../../../../src/os/ubuntu/fs/permissions';
import type { Inode } from '../../../../src/os/ubuntu/fs/inode';
import type { VFSNode } from '../../../../src/os/ubuntu/fs/types';

describe('Permissions', () => {
  const createInode = (uid: number, gid: number, permissions: number): Inode => ({
    ino: 1, type: 'file', permissions, uid, gid, size: 0,
    atime: 0, mtime: 0, ctime: 0, links: 1, data: null
  });

  describe('checkAccess', () => {
    it('always grants access to root (euid 0)', () => {
      const inode = createInode(1000, 1000, 0o000); // no permissions
      expect(checkAccess(inode, R_OK | W_OK | X_OK, 0, 0)).toBe(true);
    });

    it('checks owner permissions', () => {
      const inode = createInode(1000, 1000, 0o400); // user read only
      expect(checkAccess(inode, R_OK, 1000, 1000)).toBe(true);
      expect(checkAccess(inode, W_OK, 1000, 1000)).toBe(false);
      expect(checkAccess(inode, X_OK, 1000, 1000)).toBe(false);
    });

    it('checks group permissions', () => {
      const inode = createInode(1000, 1001, 0o020); // group write only
      expect(checkAccess(inode, W_OK, 1002, 1001)).toBe(true); // egid matches
      expect(checkAccess(inode, R_OK, 1002, 1001)).toBe(false);
      
      // matches euidGroups
      expect(checkAccess(inode, W_OK, 1002, 1003, [1001])).toBe(true);
    });

    it('checks other permissions', () => {
      const inode = createInode(1000, 1000, 0o001); // other execute only
      expect(checkAccess(inode, X_OK, 1001, 1001)).toBe(true);
      expect(checkAccess(inode, R_OK, 1001, 1001)).toBe(false);
    });
  });

  describe('checkStickyBit', () => {
    it('always grants access to root', () => {
      const parent = createInode(1000, 1000, 0o777 | S_ISVTX);
      const target = createInode(1001, 1001, 0o777);
      expect(checkStickyBit(parent, target, 0)).toBe(true);
    });

    it('grants access if parent does not have sticky bit', () => {
      const parent = createInode(1000, 1000, 0o777); // no sticky
      const target = createInode(1001, 1001, 0o777);
      expect(checkStickyBit(parent, target, 1002)).toBe(true);
    });

    it('grants access if user owns the file or directory', () => {
      const parent = createInode(1000, 1000, 0o777 | S_ISVTX);
      const target = createInode(1001, 1001, 0o777);
      
      expect(checkStickyBit(parent, target, 1000)).toBe(true); // user owns parent
      expect(checkStickyBit(parent, target, 1001)).toBe(true); // user owns target
    });

    it('denies access if user owns neither and sticky bit is set', () => {
      const parent = createInode(1000, 1000, 0o777 | S_ISVTX);
      const target = createInode(1001, 1001, 0o777);
      
      expect(checkStickyBit(parent, target, 1002)).toBe(false);
    });
  });

  describe('hasPermission (VFSNode string check compat)', () => {
    it('returns true for root executionUser', () => {
      expect(hasPermission({} as VFSNode, 'read', 'root')).toBe(true);
    });
    
    it('returns false if node is null', () => {
      expect(hasPermission(null as any, 'read', 'abino')).toBe(false);
    });

    it('checks string permissions properly', () => {
      const node = {
        type: 'file',
        permissions: '644', // octal string, meaning 0o644 actually parsed as octal
        ownerId: 'abino', // UID ~ 1001
        groupId: 'abino'
      } as unknown as VFSNode;
      
      // owner has read and write
      expect(hasPermission(node, 'read', 'abino')).toBe(true);
      expect(hasPermission(node, 'write', 'abino')).toBe(true);
      expect(hasPermission(node, 'execute', 'abino')).toBe(false);
      
      // other has read only
      expect(hasPermission(node, 'read', 'peasant')).toBe(true);
      expect(hasPermission(node, 'write', 'peasant')).toBe(false);
    });
  });
});
