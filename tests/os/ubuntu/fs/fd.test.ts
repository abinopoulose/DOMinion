import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openFile, writeToFile, readFile, closeFile, globalOpenFiles } from '../../../../src/os/ubuntu/fs/fd';
import * as pathResolver from '../../../../src/os/ubuntu/fs/pathResolver';
import * as operations from '../../../../src/os/ubuntu/fs/operations';

vi.mock('../../../../src/os/ubuntu/fs/pathResolver');
vi.mock('../../../../src/os/ubuntu/fs/operations');

describe('File Descriptors', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Clear globalOpenFiles
    for (const key in globalOpenFiles) delete globalOpenFiles[key];
  });

  it('opens a file for reading', async () => {
    vi.mocked(pathResolver.getAbsolutePathAsync).mockResolvedValue('/home/test.txt');
    vi.mocked(pathResolver.resolveRelativePathAsync).mockResolvedValue({ id: '1', type: 'file' } as any);
    vi.mocked(operations.readFile).mockResolvedValue(new Blob(['hello']));

    const fd = await openFile('test.txt', 'r', 'home_id', 1000, 1000);
    expect(fd).toBeGreaterThan(2);
    expect(globalOpenFiles[fd]).toEqual({
      id: '1',
      mode: 'r',
      offset: 0,
      content: 'hello'
    });
  });

  it('opens a file for writing and creates if it does not exist', async () => {
    vi.mocked(pathResolver.getAbsolutePathAsync).mockImplementation(async (id) => id === 'home_id' ? '/home' : '/home/test.txt');
    // First call returns null (not exists), second returns parent, third returns new node
    vi.mocked(pathResolver.resolveRelativePathAsync)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'home_id', type: 'directory' } as any)
      .mockResolvedValueOnce({ id: 'new_id', type: 'file' } as any);
      
    vi.mocked(operations.writeFile).mockResolvedValue(undefined as any);

    const fd = await openFile('test.txt', 'w', 'home_id', 1000, 1000);
    expect(fd).toBeGreaterThan(2);
    expect(operations.writeFile).toHaveBeenCalledWith('/home/test.txt', expect.any(Blob));
    expect(globalOpenFiles[fd]).toEqual({
      id: 'new_id',
      mode: 'w',
      offset: 0,
      content: ''
    });
  });

  it('throws error when opening directory', async () => {
    vi.mocked(pathResolver.getAbsolutePathAsync).mockResolvedValue('/home');
    vi.mocked(pathResolver.resolveRelativePathAsync).mockResolvedValue({ id: 'home_id', type: 'directory' } as any);
    
    await expect(openFile('dir', 'r', 'root', 1000, 1000)).rejects.toThrow('Is a directory');
  });

  it('writes to file', () => {
    globalOpenFiles[3] = { id: '1', mode: 'w', offset: 0, content: '' };
    
    writeToFile(3, 'hello');
    expect(globalOpenFiles[3].content).toBe('hello');
    expect(globalOpenFiles[3].offset).toBe(5);
    
    globalOpenFiles[3].offset = 2;
    writeToFile(3, 'x');
    expect(globalOpenFiles[3].content).toBe('hexlo');
  });

  it('reads from file', () => {
    globalOpenFiles[3] = { id: '1', mode: 'r', offset: 0, content: 'hello' };
    
    const data = readFile(3);
    expect(data).toBe('hello');
    expect(globalOpenFiles[3].offset).toBe(5);
  });

  it('closes a file and writes content if mode is w or a', async () => {
    globalOpenFiles[3] = { id: '1', mode: 'w', offset: 5, content: 'hello' };
    vi.mocked(pathResolver.getAbsolutePathAsync).mockResolvedValue('/home/test.txt');
    vi.mocked(operations.writeFile).mockResolvedValue(undefined as any);
    
    await closeFile(3);
    expect(operations.writeFile).toHaveBeenCalledWith('/home/test.txt', expect.any(Blob));
    expect(globalOpenFiles[3]).toBeUndefined();
  });
});
