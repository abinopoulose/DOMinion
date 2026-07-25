import { describe, it, expect } from 'vitest';
import { virtualDevices } from '../../../../src/os/ubuntu/fs/virtualDevices';

describe('Virtual Devices', () => {
  it('uptime reads correctly and throws on write', () => {
    const output = virtualDevices.uptime.read(0);
    expect(output).toMatch(/^\d+\.\d+ \d+\.\d+\n$/);
    expect(() => virtualDevices.uptime.write('test')).toThrow('Permission denied');
  });

  it('meminfo reads correctly and throws on write', () => {
    const output = virtualDevices.meminfo.read(0);
    expect(output).toContain('MemTotal:');
    expect(() => virtualDevices.meminfo.write('test')).toThrow('Permission denied');
  });

  it('cpuinfo reads correctly and throws on write', () => {
    const output = virtualDevices.cpuinfo.read(0);
    expect(output).toContain('processor\t: 0');
    expect(() => virtualDevices.cpuinfo.write('test')).toThrow('Permission denied');
  });

  it('null reads empty and discards write', () => {
    expect(virtualDevices.null.read(0)).toBe('');
    expect(() => virtualDevices.null.write('test')).not.toThrow();
  });

  it('zero reads null bytes and discards write', () => {
    expect(virtualDevices.zero.read(0)).toBe('\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0');
    expect(() => virtualDevices.zero.write('test')).not.toThrow();
  });

  it('random reads random bytes and discards write', () => {
    const r1 = virtualDevices.random.read(0);
    const r2 = virtualDevices.random.read(0);
    expect(r1.length).toBe(16);
    expect(r2.length).toBe(16);
    // Almost certainly different
    expect(r1).not.toBe(r2);
    expect(() => virtualDevices.random.write('test')).not.toThrow();
  });
});
