import { ShellEnvironment } from '../engine/ShellEnvironment';
import { expandGlob } from './glob';

/**
 * Expands brace patterns like {a,b,c} or {1..5}
 */
function braceExpand(input: string): string[] {
  // Very simplified brace expansion for mock environment.
  // Real brace expansion is recursive and complex.
  const regex = /\{([^}]+)\}/;
  const match = input.match(regex);
  
  if (!match) return [input];
  
  const inner = match[1];
  const prefix = input.slice(0, match.index);
  const suffix = input.slice(match.index! + match[0].length);
  
  let options: string[] = [];
  
  // Check for range {1..5} or {a..z}
  const rangeMatch = inner.match(/^([a-zA-Z0-9])\.\.([a-zA-Z0-9])$/);
  if (rangeMatch) {
    const start = rangeMatch[1];
    const end = rangeMatch[2];
    
    if (/[0-9]/.test(start) && /[0-9]/.test(end)) {
      const s = parseInt(start, 10);
      const e = parseInt(end, 10);
      if (!isNaN(s) && !isNaN(e)) {
        const step = s <= e ? 1 : -1;
        for (let i = s; i !== e + step; i += step) {
          options.push(i.toString());
        }
      }
    } else {
      const s = start.charCodeAt(0);
      const e = end.charCodeAt(0);
      const step = s <= e ? 1 : -1;
      for (let i = s; i !== e + step; i += step) {
        options.push(String.fromCharCode(i));
      }
    }
  } else {
    // Check for comma separated {a,b,c}
    options = inner.split(',');
  }
  
  if (options.length === 0) return [input];
  
  const results: string[] = [];
  for (const opt of options) {
    const expanded = prefix + opt + suffix;
    // Recursively expand if there are more braces
    results.push(...braceExpand(expanded));
  }
  
  return results;
}

/**
 * Parses a string into segments of quoted and unquoted parts.
 */
interface Segment {
  type: 'unquoted' | 'single' | 'double';
  value: string;
}

function parseSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  let current = '';
  let state: 'unquoted' | 'single' | 'double' = 'unquoted';
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    if (state === 'unquoted') {
      if (char === "'") {
        if (current) segments.push({ type: 'unquoted', value: current });
        current = '';
        state = 'single';
      } else if (char === '"') {
        if (current) segments.push({ type: 'unquoted', value: current });
        current = '';
        state = 'double';
      } else {
        current += char;
      }
    } else if (state === 'single') {
      if (char === "'") {
        segments.push({ type: 'single', value: current });
        current = '';
        state = 'unquoted';
      } else {
        current += char;
      }
    } else if (state === 'double') {
      if (char === '"') {
        segments.push({ type: 'double', value: current });
        current = '';
        state = 'unquoted';
      } else {
        current += char;
      }
    }
  }
  
  if (current) {
    segments.push({ type: state, value: current });
  }
  
  return segments;
}

/**
 * Evaluates basic arithmetic $(( ... ))
 */
function expandArithmetic(text: string): string {
  const regex = /\$\(\(([^)]+)\)\)/g;
  return text.replace(regex, (match, expr) => {
    try {
      // Remove any non-math characters for basic safety
      const safeExpr = expr.replace(/[^0-9+\-*/%(). ]/g, '');
      const result = new Function(`return ${safeExpr}`)();
      return result.toString();
    } catch {
      return match;
    }
  });
}

/**
 * Expands variables $VAR, ${VAR}, $?, $$, $0
 */
function expandVariablesStr(text: string, env: ShellEnvironment): string {
  const regex = /\$\{([A-Za-z_][A-Za-z_0-9]*)\}|\$([A-Za-z_][A-Za-z_0-9]*|\?|\$|0|#|@|\*|[1-9][0-9]*)/g;
  return text.replace(regex, (_match, p1, p2) => {
    const varName = p1 || p2;
    if (varName === '?') return env.lastExitCode.toString();
    if (varName === '$') return '3072'; // mock PID
    if (varName === '0') return env.positionalArgs[0] || 'bash';
    if (varName === '#') return (Math.max(0, env.positionalArgs.length - 1)).toString();
    if (varName === '@' || varName === '*') return env.positionalArgs.slice(1).join(' ');
    
    if (/^[1-9][0-9]*$/.test(varName)) {
      const idx = parseInt(varName, 10);
      return env.positionalArgs[idx] || '';
    }
    
    return env.envVars[varName] !== undefined ? env.envVars[varName] : '';
  });
}

/**
 * Removes surrounding quotes from a segment, returns raw string.
 * This is the final step.
 */
function quoteRemoval(input: string): string {
  const segments = parseSegments(input);
  return segments.map(s => s.value).join('');
}

export async function expandAll(args: string[], env: ShellEnvironment): Promise<string[]> {
  const finalArgs: string[] = [];
  
  for (const arg of args) {
    // 1. Brace Expansion
    const bracedArgs = braceExpand(arg);
    
    for (const bArg of bracedArgs) {
      // 2. Parse segments to respect quotes during expansion
      const segments = parseSegments(bArg);
      
      let expandedSegmentsStr = '';
      
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        let val = seg.value;
        
        if (seg.type === 'unquoted') {
          // Tilde expansion (only if unquoted and at the very beginning of the token)
          if (i === 0 && val.startsWith('~')) {
            const tildeMatch = val.match(/^~([a-zA-Z0-9_-]*)/);
            if (tildeMatch) {
              const username = tildeMatch[1];
              const homeDir = username ? `/home/${username}` : env.getEnv('HOME') || `/home/${env.effectiveUser}`;
              val = homeDir + val.slice(tildeMatch[0].length);
            }
          }
          
          // Arithmetic & Variable expansion
          val = expandArithmetic(val);
          val = expandVariablesStr(val, env);
          
          expandedSegmentsStr += val;
        } else if (seg.type === 'double') {
          // Arithmetic & Variable expansion (no tilde)
          val = expandArithmetic(val);
          val = expandVariablesStr(val, env);
          
          expandedSegmentsStr += `"${val}"`;
        } else if (seg.type === 'single') {
          // No expansion
          expandedSegmentsStr += `'${val}'`;
        }
      }
      
      // 3. Pathname Expansion (Globbing)
      const globbedArgs = await expandGlob(expandedSegmentsStr, env.cwdId);
      
      // 4. Quote Removal
      for (const gArg of globbedArgs) {
         finalArgs.push(quoteRemoval(gArg));
      }
    }
  }
  
  return finalArgs;
}
