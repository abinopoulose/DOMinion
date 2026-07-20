import { Statement } from './ScriptParser';
import { ShellEnvironment } from './ShellEnvironment';
import { StandardStreams } from './Streams';
import { PTY } from './PTY';
import { expandAll } from '../commandParser/expand';

export class ScriptRunner {
  private env: ShellEnvironment;
  private pty: PTY;
  
  constructor(env: ShellEnvironment, streams: StandardStreams) {
    this.env = env;
    this.pty = new PTY((data) => streams.stdout.write(data), env);
  }

  public async execute(ast: Statement[]): Promise<number> {
    for (const stmt of ast) {
      if (this.env.abortSignal?.aborted) return 130;
      await this.executeStatement(stmt);
    }
    return this.env.lastExitCode;
  }

  private async executeStatement(stmt: Statement): Promise<void> {
    switch (stmt.type) {
      case 'command':
        await this.pty.executeCommand(stmt.line);
        break;
        
      case 'if':
        await this.pty.executeCommand(stmt.condition);
        let executed = false;
        
        if (this.env.lastExitCode === 0) {
          await this.execute(stmt.thenBlock);
          executed = true;
        } else if (stmt.elifBlocks) {
          for (const elif of stmt.elifBlocks) {
            await this.pty.executeCommand(elif.condition);
            if (this.env.lastExitCode === 0) {
              await this.execute(elif.thenBlock);
              executed = true;
              break;
            }
          }
        }
        
        if (!executed && stmt.elseBlock) {
          await this.execute(stmt.elseBlock);
        }
        break;
        
      case 'for':
        // expand list
        const expandedList = await expandAll(stmt.list, this.env);
        // split by whitespace if it's a single string
        const items = expandedList.flatMap(item => item.split(/\s+/).filter(Boolean));
        
        for (const item of items) {
          if (this.env.abortSignal?.aborted) break;
          this.env.updateEnv(stmt.variable, item);
          await this.execute(stmt.body);
        }
        break;
        
      case 'while':
        while (true) {
          if (this.env.abortSignal?.aborted) break;
          await this.pty.executeCommand(stmt.condition);
          if (this.env.lastExitCode !== 0) break;
          await this.execute(stmt.body);
        }
        break;
        
      case 'case':
        // Expand the variable to match
        const expandedVar = await expandAll([stmt.variable], this.env);
        const matchVal = expandedVar.join(' ');
        
        for (const patternObj of stmt.patterns) {
          // In a real shell, patterns can have wildcards, for now just exact match or *
          const pat = patternObj.pattern;
          if (pat === '*' || pat === matchVal) {
            await this.execute(patternObj.body);
            break;
          }
        }
        break;
        
      case 'function':
        if (!this.env.functions) {
          this.env.functions = {};
        }
        this.env.functions[stmt.name] = stmt.body;
        break;
    }
  }
}
