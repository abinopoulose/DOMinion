import { describe, it, expect } from 'vitest';
import { parseArgs } from '../../../../../../src/os/ubuntu/apps/Terminal/commandParser/parseArgs';

describe('Parse Args', () => {
  it('parses short flags', () => {
    const result = parseArgs(['-a', '-l']);
    expect(result.flags.a).toBe(true);
    expect(result.flags.l).toBe(true);
  });

  it('parses combined short flags', () => {
    const result = parseArgs(['-al']);
    expect(result.flags.a).toBe(true);
    expect(result.flags.l).toBe(true);
  });

  it('parses long flags', () => {
    const result = parseArgs(['--all', '--long']); // Use long which maps to l
    expect(result.flags.a).toBe(true);
    expect(result.flags.l).toBe(true);
  });

  it('parses flags with values using =', () => {
    const result = parseArgs(['--name=test']);
    expect(result.options.name).toBe('test');
  });

  it('parses positional arguments', () => {
    const result = parseArgs(['-a', 'file1', 'file2']);
    expect(result.positional).toEqual(['file1', 'file2']);
    expect(result.flags.a).toBe(true);
  });

  it('stops parsing flags after --', () => {
    const result = parseArgs(['-a', '--', '-b']);
    expect(result.flags.a).toBe(true);
    expect(result.flags.b).toBeUndefined();
    expect(result.positional).toEqual(['-b']);
  });
});
