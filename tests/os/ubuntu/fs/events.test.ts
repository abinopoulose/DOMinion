import { describe, it, expect, vi } from 'vitest';
import { fsEvents } from '../../../../src/os/ubuntu/fs/events';

describe('FS Events', () => {
  it('subscribes and emits to exact path', () => {
    const handler = vi.fn();
    const unsubscribe = fsEvents.subscribe('/home/user/file.txt', handler);
    
    fsEvents.emit('/home/user/file.txt', 'fs:created');
    expect(handler).toHaveBeenCalledWith('/home/user/file.txt', 'fs:created');
    
    unsubscribe();
    fsEvents.emit('/home/user/file.txt', 'fs:deleted');
    expect(handler).toHaveBeenCalledTimes(1); // not called again
  });

  it('emits to parent directory', () => {
    const parentHandler = vi.fn();
    fsEvents.subscribe('/home/user', parentHandler);
    
    fsEvents.emit('/home/user/file.txt', 'fs:modified');
    expect(parentHandler).toHaveBeenCalledWith('/home/user/file.txt', 'fs:modified');
  });

  it('emits to global listeners', () => {
    const globalHandler = vi.fn();
    const unsubscribe = fsEvents.subscribeGlobal(globalHandler);
    
    fsEvents.emit('/any/path', 'fs:changed');
    expect(globalHandler).toHaveBeenCalledWith('/any/path', 'fs:changed');
    
    unsubscribe();
    fsEvents.emit('/another/path', 'fs:changed');
    expect(globalHandler).toHaveBeenCalledTimes(1);
  });
});
