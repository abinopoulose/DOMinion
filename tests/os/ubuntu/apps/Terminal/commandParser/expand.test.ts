import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expandAll } from '../../../../../../src/os/ubuntu/apps/Terminal/commandParser/expand';
import { ShellEnvironment } from '../../../../../../src/os/ubuntu/apps/Terminal/engine/ShellEnvironment';

vi.mock('../../../../../../src/os/ubuntu/apps/Terminal/commandParser/glob', () => ({
  expandGlob: vi.fn(async (pattern) => [pattern])
}));
vi.mock('../../../../../../src/os/ubuntu/store/useUbuntuAuthStore', () => ({
  getCurrentUserOrFallback: vi.fn(() => 'abino')
}));
vi.mock('../../../../../../src/os/ubuntu/fs/seed', () => ({
  getHomeId: vi.fn(() => 'home-abino')
}));

describe('Expand Args', () => {
  let env: ShellEnvironment;
  
  beforeEach(() => {
    env = new ShellEnvironment();
    env.updateEnv('USER', 'abino');
    env.updateEnv('HOME', '/home/abino');
  });

  it('expands tilde to HOME', async () => {
    const expanded = await expandAll(['~', '~/dir'], env);
    expect(expanded).toEqual(['/home/abino', '/home/abino/dir']);
  });

  it('expands variables', async () => {
    const expanded = await expandAll(['$USER', '${HOME}/dir'], env);
    expect(expanded).toEqual(['abino', '/home/abino/dir']);
  });

  it('handles quotes appropriately', async () => {
    const expanded1 = await expandAll(["'$USER'"], env);
    expect(expanded1).toEqual(['$USER']);

    const expanded2 = await expandAll(['"$USER"'], env);
    expect(expanded2).toEqual(['abino']);
  });

  it('expands brace ranges', async () => {
    const expanded = await expandAll(['{1..3}'], env);
    expect(expanded).toEqual(['1', '2', '3']);
  });

  it('expands brace lists', async () => {
    const expanded = await expandAll(['{a,b,c}'], env);
    expect(expanded).toEqual(['a', 'b', 'c']);
  });
});
