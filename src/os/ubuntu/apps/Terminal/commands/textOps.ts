import type { CommandHandler } from './types';
import { parseArgs } from '../commandParser';

export const grep: CommandHandler = async (args, env, streams) => {
  const { flags, positional } = parseArgs(args);

  if (positional.length < 1) {
    ['grep: missing pattern'].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const pattern = positional[0];
  const targets = positional.slice(1);
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags.i ? 'i' : '');
  } catch {
    [`grep: invalid pattern: '${pattern}'`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  interface FileEntry { name: string; content: string; }
  const files: FileEntry[] = [];
  
  if (!flags.r && targets.length === 0) {
    files.push({ name: '(standard input)', content: streams.stdin.readAll() });
  } else {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { stat, readdir, readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);

    if (flags.r) {
      const startPath = targets.length > 0 ? targets[0] : '.';
      const startNode = await resolveRelativePathAsync(cwdPath, startPath);
      if (!startNode) {
        [`grep: ${startPath}: No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }

      const startAbsPath = await getAbsolutePathAsync(startNode.id);
      if (startNode.type === 'file') {
        const text = await (await readFile(startAbsPath)).text();
        files.push({ name: startPath, content: text });
      } else {
        async function walkTreeAsync(currentId: string, currentPath: string) {
          const absPath = await getAbsolutePathAsync(currentId);
          const node = await stat(absPath);
          if (node.type === 'file') {
            const text = await (await readFile(absPath)).text();
            files.push({ name: currentPath, content: text });
          } else if (node.type === 'directory') {
            const children = await readdir(absPath);
            for (const child of children) {
              await walkTreeAsync(child.id, currentPath === '.' ? child.name : currentPath + '/' + child.name);
            }
          }
        }
        await walkTreeAsync(startNode.id, startPath);
      }
    } else {
      for (const target of targets) {
        const node = await resolveRelativePathAsync(cwdPath, target);
        if (!node) {
          [`grep: ${target}: No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
        }
        if (node.type === 'directory') {
          [`grep: ${target}: Is a directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
        }
        const absPath = await getAbsolutePathAsync(node.id);
        const text = await (await readFile(absPath)).text();
        files.push({ name: target, content: text });
      }
    }
  }

  if (files.length === 0) {
    return 0;
  }

  const multiFile = files.length > 1;
  const outputLines: string[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');
    let count = 0;
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const matches = regex.test(line);
      const show = flags.v ? !matches : matches;
      if (show) {
        count++;
        if (!flags.c) {
          let result = '';
          if (multiFile && file.name !== '(standard input)') result += `${file.name}:`;
          if (flags.n) result += `${lineIdx + 1}:`;
          result += line;
          outputLines.push(result);
        }
      }
    }
    if (flags.c) {
      if (multiFile && file.name !== '(standard input)') outputLines.push(`${file.name}:${count}`);
      else outputLines.push(`${count}`);
    }
  }

  outputLines.forEach((line: string) => streams.stdout.writeLine(line));
  return outputLines.length > 0 ? 0 : 1;
};

export const head: CommandHandler = async (args, env, streams) => {
  const { options, positional } = parseArgs(args, ['n']);

  const n = parseInt(options.n || '10', 10);
  if (isNaN(n) || n < 0) {
    [`head: invalid number of lines: '${options.n}'`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const results: string[] = [];
  
  if (positional.length === 0) {
    const text = streams.stdin.readAll();
    const lines = text.split('\n').slice(0, n);
    results.push(...lines);
  } else {
    const multiFile = positional.length > 1;

    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);

    for (let i = 0; i < positional.length; i++) {
      const target = positional[i];
      const node = await resolveRelativePathAsync(cwdPath, target);

      if (!node) {
        [`head: ${target}: No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }
      if (node.type === 'directory') {
        [`head: ${target}: Is a directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }

      if (multiFile) {
        if (i > 0) results.push(''); 
        results.push(`==> ${target} <==`);
      }

      const absPath = await getAbsolutePathAsync(node.id);
      const text = await (await readFile(absPath)).text();
      const lines = text.split('\n').slice(0, n);
      results.push(...lines);
    }
  }

  results.forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const tail: CommandHandler = async (args, env, streams) => {
  const { options, positional } = parseArgs(args, ['n']);

  const n = parseInt(options.n || '10', 10);
  if (isNaN(n) || n < 0) {
    [`tail: invalid number of lines: '${options.n}'`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
  }

  const results: string[] = [];
  
  if (positional.length === 0) {
    const text = streams.stdin.readAll();
    const allLines = text.split('\n');
    const lines = allLines.slice(-n);
    results.push(...lines);
  } else {
    const multiFile = positional.length > 1;
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);

    for (let i = 0; i < positional.length; i++) {
      const target = positional[i];
      const node = await resolveRelativePathAsync(cwdPath, target);

      if (!node) {
        [`tail: ${target}: No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }
      if (node.type === 'directory') {
        [`tail: ${target}: Is a directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }

      if (multiFile) {
        if (i > 0) results.push('');
        results.push(`==> ${target} <==`);
      }

      const absPath = await getAbsolutePathAsync(node.id);
      const text = await (await readFile(absPath)).text();
      const allLines = text.split('\n');
      const lines = allLines.slice(-n);
      results.push(...lines);
    }
  }

  results.forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};

export const wc: CommandHandler = async (args, env, streams) => {
  const { flags, positional } = parseArgs(args);

  const showAll = !flags.l && !flags.w && !flags.c;
  const results: string[] = [];
  let totalLines = 0;
  let totalWords = 0;
  let totalChars = 0;

  if (positional.length === 0) {
    const content = streams.stdin.readAll();
    const lines = content.split('\n').length;
    const words = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
    const chars = content.length;

    const parts: string[] = [];
    if (showAll || flags.l) parts.push(lines.toString().padStart(7, ' '));
    if (showAll || flags.w) parts.push(words.toString().padStart(7, ' '));
    if (showAll || flags.c) parts.push(chars.toString().padStart(7, ' '));
    results.push(parts.join(''));
  } else {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);

    for (const target of positional) {
      const node = await resolveRelativePathAsync(cwdPath, target);

      if (!node) {
        [`wc: ${target}: No such file or directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }
      if (node.type === 'directory') {
        [`wc: ${target}: Is a directory`].forEach((line: string) => streams.stderr.writeLine(line)); return 1;
      }

      const absPath = await getAbsolutePathAsync(node.id);
      const content = await (await readFile(absPath)).text();
      const lines = content.split('\n').length;
      const words = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
      const chars = content.length;

      totalLines += lines;
      totalWords += words;
      totalChars += chars;

      const parts: string[] = [];
      if (showAll || flags.l) parts.push(lines.toString().padStart(7, ' '));
      if (showAll || flags.w) parts.push(words.toString().padStart(7, ' '));
      if (showAll || flags.c) parts.push(chars.toString().padStart(7, ' '));
      parts.push(` ${target}`);

      results.push(parts.join(''));
    }

    if (positional.length > 1) {
      const parts: string[] = [];
      if (showAll || flags.l) parts.push(totalLines.toString().padStart(7, ' '));
      if (showAll || flags.w) parts.push(totalWords.toString().padStart(7, ' '));
      if (showAll || flags.c) parts.push(totalChars.toString().padStart(7, ' '));
      parts.push(' total');
      results.push(parts.join(''));
    }
  }

  results.forEach((line: string) => streams.stdout.writeLine(line)); return 0;
};


export const sort: CommandHandler = async (args, env, streams) => {
  const { flags, options, positional } = parseArgs(args, ['k']);
  
  let allLines: string[] = [];
  
  if (positional.length === 0) {
    const content = streams.stdin.readAll();
    allLines = content.split('\n');
    if (allLines.length > 0 && allLines[allLines.length - 1] === '') {
      allLines.pop();
    }
  } else {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    
    for (const target of positional) {
      const node = await resolveRelativePathAsync(cwdPath, target);
      if (!node) {
        streams.stderr.writeLine(`sort: cannot read: ${target}: No such file or directory`);
        return 1;
      }
      const absPath = await getAbsolutePathAsync(node.id);
      const content = await (await readFile(absPath)).text();
      const lines = content.split('\n');
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      allLines.push(...lines);
    }
  }

  const k = parseInt(options.k || '1', 10) - 1;
  const numeric = !!flags.n;
  const reverse = !!flags.r;
  const unique = !!flags.u;

  allLines.sort((a, b) => {
    let valA = a;
    let valB = b;
    if (k >= 0) {
      valA = a.split(/\s+/)[k] || '';
      valB = b.split(/\s+/)[k] || '';
    }
    
    let cmp = 0;
    if (numeric) {
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        cmp = numA - numB;
      } else {
        cmp = valA.localeCompare(valB);
      }
    } else {
      cmp = valA.localeCompare(valB);
    }
    
    return reverse ? -cmp : cmp;
  });

  if (unique) {
    allLines = allLines.filter((line, i) => i === 0 || line !== allLines[i - 1]);
  }

  allLines.forEach(l => streams.stdout.writeLine(l));
  return 0;
};

export const uniq: CommandHandler = async (args, env, streams) => {
  const { flags, positional } = parseArgs(args);
  
  let lines: string[] = [];
  if (positional.length === 0) {
    const content = streams.stdin.readAll();
    lines = content.split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  } else {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    
    const node = await resolveRelativePathAsync(cwdPath, positional[0]);
    if (!node) {
      streams.stderr.writeLine(`uniq: ${positional[0]}: No such file or directory`);
      return 1;
    }
    const absPath = await getAbsolutePathAsync(node.id);
    const content = await (await readFile(absPath)).text();
    lines = content.split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  }

  let count = 0;
  let prevLine: string | null = null;
  
  const flush = () => {
    if (prevLine !== null) {
      if (flags.d && count === 1) return;
      if (flags.c) {
        streams.stdout.writeLine(`${count.toString().padStart(7, ' ')} ${prevLine}`);
      } else {
        streams.stdout.writeLine(prevLine);
      }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (prevLine === null) {
      prevLine = line;
      count = 1;
    } else if (line === prevLine) {
      count++;
    } else {
      flush();
      prevLine = line;
      count = 1;
    }
  }
  flush();
  
  return 0;
};

export const cut: CommandHandler = async (args, env, streams) => {
  const { options, positional } = parseArgs(args, ['d', 'f']);
  
  if (!options.f) {
    streams.stderr.writeLine(`cut: you must specify a list of bytes, characters, or fields`);
    return 1;
  }
  
  const delimiter = options.d || '\t';
  const fields = options.f.split(',').flatMap(part => {
    if (part.includes('-')) {
      const [start, end] = part.split('-');
      const s = parseInt(start, 10);
      const e = parseInt(end, 10);
      if (!isNaN(s) && !isNaN(e)) {
        return Array.from({ length: e - s + 1 }, (_, i) => s + i);
      }
    }
    const val = parseInt(part, 10);
    return isNaN(val) ? [] : [val];
  }).map(n => n - 1);
  
  let lines: string[] = [];
  if (positional.length === 0) {
    const content = streams.stdin.readAll();
    lines = content.split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  } else {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    
    for (const target of positional) {
      const node = await resolveRelativePathAsync(cwdPath, target);
      if (!node) continue;
      const absPath = await getAbsolutePathAsync(node.id);
      const content = await (await readFile(absPath)).text();
      const fileLines = content.split('\n');
      if (fileLines.length > 0 && fileLines[fileLines.length - 1] === '') fileLines.pop();
      lines.push(...fileLines);
    }
  }

  for (const line of lines) {
    const parts = line.split(delimiter);
    const selected = fields.map(f => parts[f]).filter(p => p !== undefined);
    streams.stdout.writeLine(selected.join(delimiter));
  }
  
  return 0;
};

export const tr: CommandHandler = async (args, _env, streams) => {
  const { flags, positional } = parseArgs(args);
  
  if (positional.length < 1 && !flags.d && !flags.s) {
    streams.stderr.writeLine(`tr: missing operand`);
    return 1;
  }
  
  const set1 = positional[0] || '';
  const set2 = positional[1] || '';
  
  const content = streams.stdin.readAll();
  let result = content;

  // Simple range expansion (e.g. a-z)
  const expandSet = (s: string) => {
    let expanded = '';
    for (let i = 0; i < s.length; i++) {
      if (s[i + 1] === '-' && i + 2 < s.length) {
        const start = s.charCodeAt(i);
        const end = s.charCodeAt(i + 2);
        for (let j = start; j <= end; j++) expanded += String.fromCharCode(j);
        i += 2;
      } else {
        expanded += s[i];
      }
    }
    return expanded;
  };

  const exp1 = expandSet(set1);
  const exp2 = expandSet(set2);

  if (flags.d) {
    for (const char of exp1) {
      result = result.split(char).join('');
    }
  } else if (flags.s) {
    // Squeeze
    for (const char of exp1) {
      const regex = new RegExp(`[${char}]+`, 'g');
      result = result.replace(regex, char);
    }
  } else {
    // Translate
    let newStr = '';
    for (const char of result) {
      const idx = exp1.indexOf(char);
      if (idx !== -1) {
        newStr += exp2[Math.min(idx, exp2.length - 1)];
      } else {
        newStr += char;
      }
    }
    result = newStr;
  }

  streams.stdout.writeLine(result.replace(/\n$/, '')); // Avoid double newline if stream handles it
  return 0;
};

export const tee: CommandHandler = async (args, env, streams) => {
  const { flags, positional } = parseArgs(args);
  
  const content = streams.stdin.readAll();
  streams.stdout.writeLine(content.replace(/\n$/, ''));
  
  if (positional.length > 0) {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { writeFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    
    for (const target of positional) {
      let targetPath = '';
      const node = await resolveRelativePathAsync(cwdPath, target);
      if (node) {
        targetPath = await getAbsolutePathAsync(node.id);
      } else {
        const parts = target.split('/');
        const destName = parts.pop()!;
        const parentPath = parts.join('/') || '.';
        const parentNode = await resolveRelativePathAsync(cwdPath, parentPath);
        if (!parentNode) {
          streams.stderr.writeLine(`tee: ${target}: No such file or directory`);
          continue;
        }
        const parentAbs = await getAbsolutePathAsync(parentNode.id);
        targetPath = parentAbs === '/' ? '/' + destName : parentAbs + '/' + destName;
      }
      
      try {
        await writeFile(targetPath, content, { append: !!flags.a });
      } catch (err: any) {
        streams.stderr.writeLine(`tee: ${target}: Permission denied`);
      }
    }
  }
  
  return 0;
};

export const sed: CommandHandler = async (args, env, streams) => {
  const { flags, options, positional } = parseArgs(args, ['e']);
  
  let expression = options.e || positional.shift();
  if (!expression) {
    streams.stderr.writeLine(`sed: missing command`);
    return 1;
  }
  
  let regex: RegExp;
  let replacement = '';
  let global = false;
  
  if (expression.startsWith('s/')) {
    const delim = expression[1];
    const parts = expression.split(delim);
    if (parts.length >= 4) {
      let pattern = parts[1];
      replacement = parts[2];
      global = parts[3].includes('g');
      try {
        regex = new RegExp(pattern, global ? 'g' : '');
      } catch (e) {
        streams.stderr.writeLine(`sed: -e expression #1, char 0: invalid reference`);
        return 1;
      }
    } else {
      streams.stderr.writeLine(`sed: -e expression #1, char 0: unterminated 's' command`);
      return 1;
    }
  } else {
    streams.stderr.writeLine(`sed: only 's///' commands are supported for now`);
    return 1;
  }
  
  if (positional.length === 0) {
    const content = streams.stdin.readAll();
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let l = lines[i];
      if (i === lines.length - 1 && l === '') break;
      streams.stdout.writeLine(l.replace(regex, replacement));
    }
  } else {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile, writeFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    
    for (const target of positional) {
      const node = await resolveRelativePathAsync(cwdPath, target);
      if (!node) {
        streams.stderr.writeLine(`sed: can't read ${target}: No such file or directory`);
        continue;
      }
      const absPath = await getAbsolutePathAsync(node.id);
      const content = await (await readFile(absPath)).text();
      const lines = content.split('\n');
      
      let newContent = '';
      for (let i = 0; i < lines.length; i++) {
        let l = lines[i];
        if (i === lines.length - 1 && l === '') break;
        newContent += l.replace(regex, replacement) + '\n';
      }
      
      if (flags.i) {
        await writeFile(absPath, newContent);
      } else {
        streams.stdout.writeLine(newContent.replace(/\n$/, ''));
      }
    }
  }
  
  return 0;
};

export const awk: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);
  
  const program = positional.shift();
  if (!program) {
    streams.stderr.writeLine(`awk: missing program`);
    return 1;
  }
  
  const printMatch = program.match(/\{\s*print\s+(.*?)\s*\}/);
  if (!printMatch) {
    streams.stderr.writeLine(`awk: only {print ...} supported`);
    return 1;
  }
  
  const fields = printMatch[1].split(',').map(s => s.trim());
  
  let lines: string[] = [];
  if (positional.length === 0) {
    const content = streams.stdin.readAll();
    lines = content.split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  } else {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { readFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    
    for (const target of positional) {
      const node = await resolveRelativePathAsync(cwdPath, target);
      if (!node) continue;
      const absPath = await getAbsolutePathAsync(node.id);
      const content = await (await readFile(absPath)).text();
      const fileLines = content.split('\n');
      if (fileLines.length > 0 && fileLines[fileLines.length - 1] === '') fileLines.pop();
      lines.push(...fileLines);
    }
  }

  let nr = 0;
  for (const line of lines) {
    nr++;
    const parts = line.split(/\s+/).filter(Boolean);
    const nf = parts.length;
    
    const output = fields.map(f => {
      if (f === 'NR') return nr;
      if (f === 'NF') return nf;
      if (f === '$0') return line;
      if (f.startsWith('$')) {
        const idx = parseInt(f.slice(1), 10) - 1;
        return parts[idx] || '';
      }
      return f.replace(/^["']|["']$/g, '');
    }).join(' ');
    
    streams.stdout.writeLine(output);
  }
  
  return 0;
};
