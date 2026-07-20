export async function expandGlob(token: string, cwdId: string): Promise<string[]> {
  // Simple check for unquoted glob characters
  let hasGlob = false;
  let inSingle = false;
  let inDouble = false;
  
  for (let i = 0; i < token.length; i++) {
    const char = token[i];
    if (char === "'" && !inDouble) inSingle = !inSingle;
    else if (char === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble && (char === '*' || char === '?' || char === '[')) {
      hasGlob = true;
      break;
    }
  }
  
  if (!hasGlob) return [token];
  
  try {
    const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
    const { readdir, stat } = await import('../../../fs/operations');
    
    // We only support simple single-directory globs for this mock (e.g., *.txt, /etc/*.conf)
    // Full globbing like **/*.ts is complex. Let's do basic directory-level globbing.
    
    // First, strip quotes just for the purpose of finding the directory path, 
    // or assume glob pattern is mostly unquoted for path separators.
    
    // Let's find the last unquoted slash to separate dir from pattern
    let lastUnquotedSlash = -1;
    inSingle = false;
    inDouble = false;
    for (let i = 0; i < token.length; i++) {
      const char = token[i];
      if (char === "'" && !inDouble) inSingle = !inSingle;
      else if (char === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble && char === '/') {
        lastUnquotedSlash = i;
      }
    }
    
    let dirPattern = '';
    let filePattern = token;
    if (lastUnquotedSlash !== -1) {
      dirPattern = token.slice(0, lastUnquotedSlash);
      filePattern = token.slice(lastUnquotedSlash + 1);
    }
    
    // Evaluate dirPath (remove quotes from dirPattern)
    let dirPath = '';
    if (dirPattern) {
      dirPath = dirPattern.replace(/['"]/g, ''); // Simple quote removal for dir
    }
    
    const cwdPath = await getAbsolutePathAsync(cwdId);
    let targetDirPath = cwdPath;
    
    if (dirPath) {
       const { resolveRelativePathAsync } = await import('../../../fs/pathResolver');
       const targetNode = await resolveRelativePathAsync(cwdPath, dirPath);
       if (!targetNode) return [token];
       targetDirPath = await getAbsolutePathAsync(targetNode.id);
    }
    
    const targetStat = await stat(targetDirPath);
    if (targetStat.type !== 'directory') return [token];
    
    const children = await readdir(targetDirPath);
    
    // Convert filePattern to Regex
    let regexStr = '^';
    inSingle = false;
    inDouble = false;
    for (let i = 0; i < filePattern.length; i++) {
      const char = filePattern[i];
      if (char === "'" && !inDouble) {
        inSingle = !inSingle;
      } else if (char === '"' && !inSingle) {
        inDouble = !inDouble;
      } else if (inSingle || inDouble) {
        // Escape regex special chars if they are quoted literal characters
        regexStr += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      } else {
        if (char === '*') regexStr += '.*';
        else if (char === '?') regexStr += '.';
        else if (char === '[') regexStr += '[';
        else if (char === ']') regexStr += ']';
        else regexStr += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
    }
    regexStr += '$';
    
    const regex = new RegExp(regexStr);
    const matches: string[] = [];
    
    for (const child of children) {
      if (regex.test(child.name)) {
        if (dirPattern) {
           matches.push(`${dirPattern}/${child.name}`);
        } else {
           matches.push(child.name);
        }
      }
    }
    
    // Bash sorts matches alphabetically
    matches.sort();
    
    if (matches.length === 0) return [token];
    return matches;
    
  } catch {
    return [token];
  }
}
