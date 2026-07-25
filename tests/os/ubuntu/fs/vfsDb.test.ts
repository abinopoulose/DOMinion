import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { getDB, closeDB } from '../../../../src/os/ubuntu/fs/db';

describe('VFS Database', () => {
  beforeEach(async () => {
    await closeDB();
    indexedDB.deleteDatabase('ubuntu-vfs');
  });

  afterEach(async () => {
    await closeDB();
  });

  it('initializes and returns IDB database', async () => {
    const db = await getDB();
    expect(db).toBeDefined();
    expect(db.objectStoreNames.contains('inodes')).toBe(true);
    expect(db.objectStoreNames.contains('file_data')).toBe(true);
  });
});
