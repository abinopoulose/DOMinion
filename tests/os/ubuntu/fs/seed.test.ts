import { describe, it, expect } from 'vitest';
import { seedNodeMap, getHomeId } from '../../../../src/os/ubuntu/fs/seed';

describe('VFS Seeding', () => {
  it('seeds initial filesystem structure', () => {
    const map = seedNodeMap();
    expect(map['root']).toBeDefined();
    expect(map['root'].type).toBe('directory');
    
    // Check standard directories exist
    expect(Object.values(map).find(n => n.name === 'dev' && n.parentId === 'root')).toBeDefined();
    expect(Object.values(map).find(n => n.name === 'bin' && n.parentId === 'root')).toBeDefined();
    expect(Object.values(map).find(n => n.name === 'etc' && n.parentId === 'root')).toBeDefined();
  });

  it('returns home ID for users', () => {
    expect(getHomeId('root')).toBe('home-root');
    expect(getHomeId('abino')).toBe('home-abino');
  });
});
