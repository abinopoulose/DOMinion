import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolvePathAsync, getAbsolutePathAsync, resolveRelativePathAsync, clearPathCache, primePathCache } from '../../../../src/os/ubuntu/fs/pathResolver';
import * as dbModule from '../../../../src/os/ubuntu/fs/db';

vi.mock('../../../../src/os/ubuntu/fs/db');

describe('Path Resolver', () => {
  let mockDb: any;
  const nodes = {
    'root': { id: 'root', name: '', type: 'directory', parentId: null },
    'home': { id: 'home', name: 'home', type: 'directory', parentId: 'root' },
    'user': { id: 'user', name: 'user', type: 'directory', parentId: 'home' },
    'file1': { id: 'file1', name: 'file1.txt', type: 'file', parentId: 'user' },
    'sym1': { id: 'sym1', name: 'sym1', type: 'symlink', parentId: 'user', meta: { symlinkTarget: '/home/user/file1.txt' } }
  };

  beforeEach(() => {
    clearPathCache();
    mockDb = {
      get: vi.fn(async (_store, id) => (nodes as any)[id]),
      getAllFromIndex: vi.fn(async (_store, _index, id) => {
        return Object.values(nodes).filter(n => n.parentId === id);
      })
    };
    vi.mocked(dbModule.getDB).mockResolvedValue(mockDb);
  });

  it('resolves absolute path', async () => {
    const node = await resolvePathAsync('/home/user/file1.txt');
    expect(node?.id).toBe('file1');
  });

  it('resolves root', async () => {
    const node = await resolvePathAsync('/');
    expect(node?.id).toBe('root');
  });

  it('returns null for non-existent path', async () => {
    const node = await resolvePathAsync('/home/user/nonexistent.txt');
    expect(node).toBeNull();
  });

  it('handles .. and .', async () => {
    const node = await resolvePathAsync('/home/user/../user/./file1.txt');
    expect(node?.id).toBe('file1');
  });

  it('resolves absolute symlink', async () => {
    const node = await resolvePathAsync('/home/user/sym1');
    expect(node?.id).toBe('file1');
  });

  it('gets absolute path from node ID', async () => {
    expect(await getAbsolutePathAsync('file1')).toBe('/home/user/file1.txt');
    expect(await getAbsolutePathAsync('root')).toBe('/');
  });

  it('resolves relative path', async () => {
    const node = await resolveRelativePathAsync('/home', 'user/file1.txt');
    expect(node?.id).toBe('file1');
  });

  it('uses cache', async () => {
    primePathCache('/home/user', 'user');
    const node = await resolvePathAsync('/home/user');
    expect(node?.id).toBe('user');
    expect(mockDb.getAllFromIndex).not.toHaveBeenCalled(); // didn't traverse
  });
});
