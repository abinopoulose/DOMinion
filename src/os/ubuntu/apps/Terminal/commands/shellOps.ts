import type { CommandHandler } from './types';
import { parseArgs } from '../commandParser';

/**
 * history — Display or clear the command history.
 *
 * Usage:
 *   history       Show all past commands with line numbers
 *   history -c    Clear the command history
 *
 * Reads from env.commandHistory (5th parameter).
 */
export const history: CommandHandler = (args, env, streams) => {
  const { flags } = parseArgs(args);

  if (flags.c) {
    [].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
  }

  if (!env?.commandHistory || env.commandHistory.length === 0) {
    [].forEach((line: string) => streams.stdout.writeLine(line)); return 0;
  }

  const lines = env.commandHistory.map((cmd, index) => {
    const num = (index + 1).toString().padStart(5, ' ');
    return `${num}  ${cmd}`;
  });

  lines.forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const bash: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine('bash: no script file specified');
    return 1;
  }
  
  const scriptPath = args[0];
  const scriptArgs = args.slice(1);
  
  try {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    
    const cwdAbs = await getAbsolutePathAsync(env.cwdId);
    const node = await resolveRelativePathAsync(cwdAbs, scriptPath);
    if (!node) {
      streams.stderr.writeLine(`bash: ${scriptPath}: No such file or directory`);
      return 127;
    }
    
    const absPath = await getAbsolutePathAsync(node.id);
    const blob = await readFile(absPath);
    const content = await blob.text();
    
    // Create new env for child script (inherit vars, but not aliases unless configured, for now just copy)
    // Wait, let's just use the same env but backup/restore positionalArgs
    const oldArgs = [...env.positionalArgs];
    env.positionalArgs = [scriptPath, ...scriptArgs];
    
    const { ScriptParser } = await import('../engine/ScriptParser');
    const { ScriptRunner } = await import('../engine/ScriptRunner');
    
    const parser = new ScriptParser(content);
    const ast = parser.parse();
    
    const runner = new ScriptRunner(env, streams);
    const exitCode = await runner.execute(ast);
    
    env.positionalArgs = oldArgs;
    return exitCode;
  } catch (e: any) {
    streams.stderr.writeLine(`bash: ${e.message}`);
    return 1;
  }
};

export const source: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine('source: filename argument required');
    return 2;
  }
  
  const scriptPath = args[0];
  const scriptArgs = args.slice(1);
  
  try {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    
    const cwdAbs = await getAbsolutePathAsync(env.cwdId);
    const node = await resolveRelativePathAsync(cwdAbs, scriptPath);
    if (!node) {
      streams.stderr.writeLine(`bash: ${scriptPath}: No such file or directory`);
      return 127;
    }
    
    const absPath = await getAbsolutePathAsync(node.id);
    const blob = await readFile(absPath);
    const content = await blob.text();
    
    const oldArgs = [...env.positionalArgs];
    if (scriptArgs.length > 0) {
      env.positionalArgs = [scriptPath, ...scriptArgs];
    }
    
    const { ScriptParser } = await import('../engine/ScriptParser');
    const { ScriptRunner } = await import('../engine/ScriptRunner');
    
    const parser = new ScriptParser(content);
    const ast = parser.parse();
    
    const runner = new ScriptRunner(env, streams);
    const exitCode = await runner.execute(ast);
    
    env.positionalArgs = oldArgs;
    return exitCode;
  } catch (e: any) {
    streams.stderr.writeLine(`bash: ${e.message}`);
    return 1;
  }
};

export const read: CommandHandler = async (args, env, streams) => {
  const { flags, options, positional } = parseArgs(args, ['p', 'n']);
  const prompt = options.p || '';
  const isSilent = flags.s;
  // Options -n is not fully supported in this interactiveRead mock yet
  
  if (env.interactiveRead) {
    const input = await env.interactiveRead(prompt, isSilent);
    if (env.abortSignal?.aborted) return 130;
    
    if (positional.length > 0) {
      env.updateEnv(positional[0], input);
    } else {
      env.updateEnv('REPLY', input);
    }
    return 0;
  } else {
    // Fallback if not interactive
    const input = streams.stdin.readAll().trim();
    if (positional.length > 0) {
      env.updateEnv(positional[0], input);
    } else {
      env.updateEnv('REPLY', input);
    }
    return 0;
  }
};
