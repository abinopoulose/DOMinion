import type { CommandHandler } from './types';
import { getAbsolutePathAsync, resolveRelativePathAsync } from '../../../fs/pathResolver';
import { stat } from '../../../fs/operations';

export const testCmd: CommandHandler = async (args, env, streams) => {
  // If invoked as [, the last argument must be ]
  if (args.length > 0 && args[args.length - 1] === ']') {
    args = args.slice(0, -1);
  }
  
  if (args.length === 0) return 1;

  // Simple recursive evaluator for logical operators -a and -o and !
  const evaluate = async (tokens: string[]): Promise<boolean> => {
    if (tokens.length === 0) return false;
    
    // NOT operator
    if (tokens[0] === '!') {
      return !(await evaluate(tokens.slice(1)));
    }
    
    // Find highest precedence operator: -o (OR), then -a (AND)
    // Actually, -a has higher precedence than -o in POSIX test
    let orIdx = tokens.indexOf('-o');
    if (orIdx !== -1) {
      const left = await evaluate(tokens.slice(0, orIdx));
      if (left) return true;
      return await evaluate(tokens.slice(orIdx + 1));
    }
    
    let andIdx = tokens.indexOf('-a');
    if (andIdx !== -1) {
      const left = await evaluate(tokens.slice(0, andIdx));
      if (!left) return false;
      return await evaluate(tokens.slice(andIdx + 1));
    }

    // Unary operators
    if (tokens.length === 2) {
      const op = tokens[0];
      const val = tokens[1];
      
      if (op === '-z') return val === '';
      if (op === '-n') return val !== '';
      
      // File tests
      if (['-e', '-f', '-d', '-r', '-w', '-x', '-s'].includes(op)) {
        try {
          const cwdAbs = await getAbsolutePathAsync(env.cwdId);
          const node = await resolveRelativePathAsync(cwdAbs, val);
          if (!node) return false;
          
          if (op === '-e') return true;
          if (op === '-d') return node.type === 'directory';
          if (op === '-f') return node.type === 'file';
          
          // Basic mock permissions
          if (op === '-r' || op === '-w' || op === '-x') return true; 
          
          if (op === '-s') {
            if (node.type !== 'file') return false;
            const absPath = await getAbsolutePathAsync(node.id);
            const st = await stat(absPath);
            return st.size > 0;
          }
        } catch {
          return false;
        }
      }
      return false;
    }

    // Binary operators
    if (tokens.length === 3) {
      const left = tokens[0];
      const op = tokens[1];
      const right = tokens[2];
      
      if (op === '=') return left === right;
      if (op === '!=') return left !== right;
      
      const lInt = parseInt(left, 10);
      const rInt = parseInt(right, 10);
      
      if (op === '-eq') return lInt === rInt;
      if (op === '-ne') return lInt !== rInt;
      if (op === '-lt') return lInt < rInt;
      if (op === '-gt') return lInt > rInt;
      if (op === '-le') return lInt <= rInt;
      if (op === '-ge') return lInt >= rInt;
      
      return false;
    }

    // Single token evaluates to true if non-empty
    if (tokens.length === 1) {
      return tokens[0] !== '';
    }

    return false;
  };

  const result = await evaluate(args);
  return result ? 0 : 1;
};
