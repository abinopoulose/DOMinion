import { describe, it, expect } from 'vitest';
import { parseCommand } from '../../../../../../src/os/ubuntu/apps/Terminal/commandParser/parser';

describe('Command Parser', () => {
  it('parses simple command', () => {
    const ast = parseCommand('ls -la');
    expect(ast).toBeDefined();
    expect(ast![0].pipeline[0].name).toBe('ls');
    expect(ast![0].pipeline[0].args).toEqual(['-la']);
  });

  it('parses piped commands', () => {
    const ast = parseCommand('ls -la | grep "test"');
    expect(ast![0].pipeline.length).toBe(2);
    expect(ast![0].pipeline[0].name).toBe('ls');
    expect(ast![0].pipeline[1].name).toBe('grep');
  });

  it('parses chained commands with &&', () => {
    const ast = parseCommand('cd / && ls');
    expect(ast!.length).toBe(2);
    expect(ast![0].pipeline[0].name).toBe('cd');
    expect(ast![0].chainOp).toBe('&&');
    expect(ast![1].pipeline[0].name).toBe('ls');
  });

  it('parses redirections', () => {
    const ast = parseCommand('echo test > file.txt');
    expect(ast![0].pipeline[0].redirections).toBeDefined();
    expect(ast![0].pipeline[0].redirections![0]).toEqual({ type: '>', target: 'file.txt' });
  });
});
