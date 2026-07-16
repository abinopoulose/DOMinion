import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDB, closeDB } from '../db';
import { stat, readFile, writeFile, unlink, mkdir, rmdir, rename, readdir, createReadStream } from '../operations';

import type { VFSNode } from '../types';

describe('VFS Async Operations', () => {
  beforeEach(async () => {
    // Clean up DB before each test
    await closeDB();
    indexedDB.deleteDatabase('ubuntu-vfs');
    
    // Seed a root node manually since getDB() only creates stores, not initial data
    const db = await getDB();
    const rootNode: VFSNode = {
      id: 'root',
      name: '',
      type: 'directory',
      parentId: null,
      permissions: 0o755,
      ownerId: 'root',
      groupId: 'root',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      accessedAt: Date.now(),
      sizeBytes: 0,
      hasBinaryContent: false
    };
    await db.put('inodes', rootNode);
  });

  afterEach(async () => {
    await closeDB();
  });

  it('mkdir and stat directory', async () => {
    await mkdir('/home');
    const node = await stat('/home');
    expect(node).toBeDefined();
    expect(node.name).toBe('home');
    expect(node.type).toBe('directory');
  });

  it('writeFile and readFile', async () => {
    await mkdir('/home');
    await writeFile('/home/test.txt', 'hello world');
    
    const node = await stat('/home/test.txt');
    expect(node.type).toBe('file');
    expect(node.hasBinaryContent).toBe(true);
    
    const blob = await readFile('/home/test.txt');
    const text = await blob.text();
    expect(text).toBe('hello world');
  });

  it('writeFile append mode', async () => {
    await mkdir('/home');
    await writeFile('/home/append.txt', 'hello');
    await writeFile('/home/append.txt', ' world', { append: true });
    
    const blob = await readFile('/home/append.txt');
    const text = await blob.text();
    expect(text).toBe('hello world');
  });

  it('unlink deletes file', async () => {
    await mkdir('/home');
    await writeFile('/home/test.txt', 'hello');
    await unlink('/home/test.txt');
    
    await expect(stat('/home/test.txt')).rejects.toThrow(/ENOENT/);
  });

  it('readdir lists directory contents', async () => {
    await mkdir('/home');
    await writeFile('/home/file1.txt', '1');
    await writeFile('/home/file2.txt', '2');
    
    const contents = await readdir('/home');
    expect(contents.length).toBe(2);
    expect(contents.map(c => c.name).sort()).toEqual(['file1.txt', 'file2.txt']);
  });

  it('rename changes file name and path', async () => {
    await mkdir('/home');
    await mkdir('/documents');
    await writeFile('/home/old.txt', 'content');
    
    await rename('/home/old.txt', '/documents/new.txt');
    
    const newNode = await stat('/documents/new.txt');
    expect(newNode.name).toBe('new.txt');
    
    const blob = await readFile('/documents/new.txt');
    expect(await blob.text()).toBe('content');
    
    await expect(stat('/home/old.txt')).rejects.toThrow(/ENOENT/);
  });

  it('rmdir removes empty directory', async () => {
    await mkdir('/empty');
    await rmdir('/empty');
    await expect(stat('/empty')).rejects.toThrow(/ENOENT/);
  });

  it('rmdir recursive removes non-empty directory', async () => {
    await mkdir('/folder');
    await writeFile('/folder/file.txt', 'data');
    await mkdir('/folder/subfolder');
    await writeFile('/folder/subfolder/file2.txt', 'data2');
    
    // Non-recursive should fail
    await expect(rmdir('/folder')).rejects.toThrow(/ENOTEMPTY/);
    
    // Recursive should succeed
    await rmdir('/folder', { recursive: true });
    await expect(stat('/folder')).rejects.toThrow(/ENOENT/);
    await expect(stat('/folder/file.txt')).rejects.toThrow(/ENOENT/);
    await expect(stat('/folder/subfolder/file2.txt')).rejects.toThrow(/ENOENT/);
  });

  it('createReadStream works correctly', async () => {
    await mkdir('/stream');
    await writeFile('/stream/file.txt', 'streamdata');
    
    const stream = await createReadStream('/stream/file.txt');
    expect(stream).toBeInstanceOf(ReadableStream);
    
    const reader = stream.getReader();
    const { value, done } = await reader.read();
    
    expect(done).toBe(false);
    expect(new TextDecoder().decode(value)).toBe('streamdata');
  });
});
