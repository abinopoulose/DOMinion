import { describe, it, expect, vi } from 'vitest';
import { ShellEnvironment } from '../../../../../../src/os/ubuntu/apps/Terminal/engine/ShellEnvironment';

vi.mock('../../../../../../src/os/ubuntu/store/useUbuntuAuthStore', () => ({
  getCurrentUserOrFallback: vi.fn(() => 'abino')
}));
vi.mock('../../../../../../src/os/ubuntu/fs/seed', () => ({
  getHomeId: vi.fn(() => 'home_id')
}));

describe('Shell Environment', () => {
  it('initializes with correct defaults', () => {
    const env = new ShellEnvironment();
    expect(env.effectiveUser).toBe('abino');
    expect(env.cwdPath).toBe('/home/abino');
    expect(env.getEnv('USER')).toBe('abino');
    expect(env.getEnv('HOME')).toBe('/home/abino');
    expect(env.aliases['ll']).toBe('ls -la');
  });

  it('can update environment variables', () => {
    const env = new ShellEnvironment();
    env.updateEnv('TEST', 'value');
    expect(env.getEnv('TEST')).toBe('value');
  });

  it('can manage aliases', () => {
    const env = new ShellEnvironment();
    env.setAlias('foo', 'bar');
    expect(env.aliases['foo']).toBe('bar');
    env.removeAlias('foo');
    expect(env.aliases['foo']).toBeUndefined();
  });

  it('pushes and pops user stack', () => {
    const env = new ShellEnvironment();
    env.pushUser('root');
    expect(env.effectiveUser).toBe('root');
    expect(env.getEnv('USER')).toBe('root');
    expect(env.getEnv('HOME')).toBe('/root');
    
    expect(env.popUser()).toBe(true);
    expect(env.effectiveUser).toBe('abino');
    expect(env.getEnv('USER')).toBe('abino');
    expect(env.getEnv('HOME')).toBe('/home/abino');
    
    expect(env.popUser()).toBe(false); // empty stack
  });
});
