import { describe, it, expect } from 'vitest';
import { ScriptParser } from '../../../../../../src/os/ubuntu/apps/Terminal/engine/ScriptParser';

describe('Script Parser', () => {
  it('parses simple commands', () => {
    const parser = new ScriptParser('echo "hello"');
    const ast = parser.parse();
    expect(ast.length).toBe(1);
    expect(ast[0]).toEqual({ type: 'command', line: 'echo "hello"' });
  });

  it('parses if statements', () => {
    const parser = new ScriptParser(`if true; then\n  echo "yes"\nfi`);
    const ast = parser.parse();
    expect(ast[0].type).toBe('if');
    expect((ast[0] as any).condition).toBe('true');
    expect((ast[0] as any).thenBlock[0].line).toBe('echo "yes"');
  });

  it('parses for loops', () => {
    const parser = new ScriptParser(`for i in 1 2 3; do\n  echo $i\ndone`);
    const ast = parser.parse();
    expect(ast[0].type).toBe('for');
    expect((ast[0] as any).variable).toBe('i');
    expect((ast[0] as any).list).toEqual(['1 2 3']);
    expect((ast[0] as any).body[0].line).toBe('echo $i');
  });

  it('parses while loops', () => {
    const parser = new ScriptParser(`while true; do\n  echo "loop"\ndone`);
    const ast = parser.parse();
    expect(ast[0].type).toBe('while');
    expect((ast[0] as any).condition).toBe('true');
    expect((ast[0] as any).body[0].line).toBe('echo "loop"');
  });

  it('parses functions', () => {
    const parser = new ScriptParser(`function test() {\n  echo "func"\n}`);
    const ast = parser.parse();
    expect(ast[0].type).toBe('function');
    expect((ast[0] as any).name).toBe('test');
    expect((ast[0] as any).body[0].line).toBe('echo "func"');
  });
});
