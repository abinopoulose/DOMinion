import { describe, it, expect, vi } from 'vitest';
import { StandardStream } from '../../../../../../src/os/ubuntu/apps/Terminal/engine/Streams';

describe('StandardStream', () => {
  it('writes data and notifies listeners', () => {
    const stream = new StandardStream();
    const listener = vi.fn();
    const unsubscribe = stream.onData(listener);
    
    stream.write('hello');
    expect(listener).toHaveBeenCalledWith('hello');
    expect(stream.readAll()).toBe('hello');
    
    unsubscribe();
    stream.write(' world');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(stream.readAll()).toBe('hello world');
  });

  it('writes lines with correct line endings', () => {
    const streamTTY = new StandardStream(true);
    streamTTY.writeLine('hello');
    expect(streamTTY.readAll()).toBe('hello\r\n');
    
    const streamNonTTY = new StandardStream(false);
    streamNonTTY.writeLine('world');
    expect(streamNonTTY.readAll()).toBe('world\n');
  });

  it('reads lines', () => {
    const stream = new StandardStream();
    stream.write('line1\nline2\n');
    expect(stream.readLines()).toEqual(['line1', 'line2']);
  });

  it('clears listeners', () => {
    const stream = new StandardStream();
    const listener = vi.fn();
    stream.onData(listener);
    stream.clearListeners();
    stream.write('test');
    expect(listener).not.toHaveBeenCalled();
  });
});
