export type Statement =
  | { type: 'command'; line: string }
  | { type: 'if'; condition: string; thenBlock: Statement[]; elifBlocks?: { condition: string; thenBlock: Statement[] }[]; elseBlock?: Statement[] }
  | { type: 'for'; variable: string; list: string[]; body: Statement[] }
  | { type: 'while'; condition: string; body: Statement[] }
  | { type: 'case'; variable: string; patterns: { pattern: string; body: Statement[] }[] }
  | { type: 'function'; name: string; body: Statement[] };

export class ScriptParser {
  private lines: string[];
  private current: number = 0;

  constructor(script: string) {
    // Basic split by newline, ignoring comments (unless inside quotes - very naive comment stripping)
    this.lines = script.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
  }

  public parse(): Statement[] {
    const statements: Statement[] = [];
    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    return statements;
  }

  private isAtEnd(): boolean {
    return this.current >= this.lines.length;
  }

  private peek(): string {
    return this.lines[this.current];
  }

  private advance(): string {
    return this.lines[this.current++];
  }

  private parseStatement(): Statement | null {
    if (this.isAtEnd()) return null;
    
    let line = this.peek();
    
    // Simple inline `;` separation handling is complex for block statements.
    // For this mock, we assume block keywords start a line.
    
    if (line.startsWith('if ')) {
      return this.parseIf();
    } else if (line.startsWith('for ')) {
      return this.parseFor();
    } else if (line.startsWith('while ')) {
      return this.parseWhile();
    } else if (line.startsWith('case ')) {
      return this.parseCase();
    } else if (line.match(/^(?:function\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*\)\s*\{/)) {
      return this.parseFunction();
    } else {
      this.advance();
      return { type: 'command', line };
    }
  }

  private parseIf(): Statement {
    let line = this.advance();
    let condition = line.slice(3).trim();
    if (condition.endsWith('; then')) {
       condition = condition.slice(0, -6).trim();
    } else if (this.peek() === 'then') {
       this.advance();
    }

    const thenBlock: Statement[] = [];
    while (!this.isAtEnd() && !this.peek().startsWith('elif ') && this.peek() !== 'else' && this.peek() !== 'fi') {
      const stmt = this.parseStatement();
      if (stmt) thenBlock.push(stmt);
    }

    const elifBlocks: { condition: string; thenBlock: Statement[] }[] = [];
    while (!this.isAtEnd() && this.peek().startsWith('elif ')) {
      line = this.advance();
      let elifCond = line.slice(5).trim();
      if (elifCond.endsWith('; then')) {
        elifCond = elifCond.slice(0, -6).trim();
      } else if (this.peek() === 'then') {
        this.advance();
      }
      
      const elifThenBlock: Statement[] = [];
      while (!this.isAtEnd() && !this.peek().startsWith('elif ') && this.peek() !== 'else' && this.peek() !== 'fi') {
        const stmt = this.parseStatement();
        if (stmt) elifThenBlock.push(stmt);
      }
      elifBlocks.push({ condition: elifCond, thenBlock: elifThenBlock });
    }

    let elseBlock: Statement[] | undefined = undefined;
    if (!this.isAtEnd() && this.peek() === 'else') {
      this.advance();
      elseBlock = [];
      while (!this.isAtEnd() && this.peek() !== 'fi') {
        const stmt = this.parseStatement();
        if (stmt) elseBlock.push(stmt);
      }
    }

    if (!this.isAtEnd() && this.peek() === 'fi') {
      this.advance();
    }

    return { type: 'if', condition, thenBlock, elifBlocks, elseBlock };
  }

  private parseFor(): Statement {
    let line = this.advance();
    // e.g. "for var in 1 2 3; do"
    const match = line.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.*?)(?:;\s*do)?$/);
    const variable = match ? match[1] : 'i';
    let listStr = match ? match[2] : '';
    
    if (this.peek() === 'do') {
      this.advance();
    } else if (!match && line.endsWith('; do')) {
       // fallback parsing
    }

    // Naive split, but should ideally expand list at runtime.
    // We'll store it as one string and let the runner split it after expansion.
    const list = [listStr];

    const body: Statement[] = [];
    while (!this.isAtEnd() && this.peek() !== 'done') {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }

    if (!this.isAtEnd() && this.peek() === 'done') {
      this.advance();
    }

    return { type: 'for', variable, list, body };
  }

  private parseWhile(): Statement {
    let line = this.advance();
    let condition = line.slice(6).trim();
    if (condition.endsWith('; do')) {
      condition = condition.slice(0, -4).trim();
    } else if (this.peek() === 'do') {
      this.advance();
    }

    const body: Statement[] = [];
    while (!this.isAtEnd() && this.peek() !== 'done') {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }

    if (!this.isAtEnd() && this.peek() === 'done') {
      this.advance();
    }

    return { type: 'while', condition, body };
  }

  private parseCase(): Statement {
    let line = this.advance();
    const match = line.match(/^case\s+(.*?)\s+in$/);
    const variable = match ? match[1] : '';
    
    const patterns: { pattern: string; body: Statement[] }[] = [];
    
    while (!this.isAtEnd() && this.peek() !== 'esac') {
      let patLine = this.advance();
      // Remove trailing `)`
      let pattern = patLine.trim();
      if (pattern.endsWith(')')) {
        pattern = pattern.slice(0, -1).trim();
      }
      
      const body: Statement[] = [];
      while (!this.isAtEnd() && !this.peek().endsWith(';;')) {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
      }
      
      if (!this.isAtEnd() && this.peek().endsWith(';;')) {
        const endLine = this.advance();
        if (endLine !== ';;') {
           // It might be `echo foo ;;`
           const cmd = endLine.slice(0, -2).trim();
           if (cmd) body.push({ type: 'command', line: cmd });
        }
      }
      
      patterns.push({ pattern, body });
    }
    
    if (!this.isAtEnd() && this.peek() === 'esac') {
      this.advance();
    }
    
    return { type: 'case', variable, patterns };
  }

  private parseFunction(): Statement {
    let line = this.advance();
    const match = line.match(/^(?:function\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*\)\s*\{/);
    const name = match ? match[1] : 'unknown_func';
    
    const body: Statement[] = [];
    while (!this.isAtEnd() && this.peek() !== '}') {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    
    if (!this.isAtEnd() && this.peek() === '}') {
      this.advance();
    }
    
    return { type: 'function', name, body };
  }
}
