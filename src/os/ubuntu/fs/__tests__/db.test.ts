import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { getDB, closeDB } from '../db';
import { migrateVFS } from '../migration';
import { set, clear } from 'idb-keyval';
import type { LegacyVFSNode } from '../types';

describe('VFS Database & Migration', () => {
  afterEach(async () => {
    await closeDB();
    await clear();
    // Delete the database to reset between tests
    indexedDB.deleteDatabase('ubuntu-vfs');
  });

  it('initializes the database with correct stores and indices', async () => {
    const db = await getDB();
    
    expect(db.objectStoreNames.contains('inodes')).toBe(true);
    expect(db.objectStoreNames.contains('file_data')).toBe(true);
    expect(db.objectStoreNames.contains('symlinks')).toBe(true);

    const tx = db.transaction('inodes', 'readonly');
    const store = tx.objectStore('inodes');
    
    expect(store.indexNames.contains('by-parent')).toBe(true);
    expect(store.indexNames.contains('by-name')).toBe(true);
    expect(store.indexNames.contains('by-parent-and-name')).toBe(true);
  });

  it('migrates legacy flat data to the new schema correctly', async () => {
    // Setup legacy data in idb-keyval
    const legacyNode: LegacyVFSNode = {
      id: 'test-uuid-123',
      name: 'test.txt',
      type: 'file',
      parentId: 'root',
      children: [],
      content: 'hello world',
      createdAt: 1000,
      modifiedAt: 2000,
      owner: 'abino',
      group: 'users',
      permissions: '644',
      meta: { mimeType: 'text/plain' }
    };
    
    await set('vfs_node_test-uuid-123', legacyNode);
    
    // Run migration
    await migrateVFS();
    
    // Verify migration
    const db = await getDB();
    const inode = await db.get('inodes', 'test-uuid-123');
    
    expect(inode).toBeDefined();
    expect(inode?.name).toBe('test.txt');
    expect(inode?.type).toBe('file');
    expect(inode?.parentId).toBe('root');
    expect(inode?.permissions).toBe(0o644);
    expect(inode?.ownerId).toBe('abino');
    expect(inode?.groupId).toBe('users');
    expect(inode?.hasBinaryContent).toBe(true);
    expect(inode?.sizeBytes).toBeGreaterThan(0);
    
    const fileData = await db.get('file_data', 'test-uuid-123');
    expect(fileData).toBeInstanceOf(Blob);
    
    const text = await (fileData as Blob).text();
    expect(text).toBe('hello world');
  });
  
  it('handles edge case of missing content during migration', async () => {
    // Setup legacy dir (no content)
    const legacyDir: LegacyVFSNode = {
      id: 'test-uuid-dir',
      name: 'Documents',
      type: 'directory',
      parentId: 'root',
      children: [],
      content: '', // empty content for dir
      createdAt: 1000,
      modifiedAt: 2000,
      owner: 'abino',
      group: 'users',
      permissions: '755'
    };
    
    await set('vfs_node_test-uuid-dir', legacyDir);
    
    await migrateVFS();
    
    const db = await getDB();
    const inode = await db.get('inodes', 'test-uuid-dir');
    
    expect(inode).toBeDefined();
    expect(inode?.hasBinaryContent).toBe(false);
    expect(inode?.sizeBytes).toBe(0);
    expect(inode?.permissions).toBe(0o755);
    
    const fileData = await db.get('file_data', 'test-uuid-dir');
    expect(fileData).toBeUndefined();
  });
});
