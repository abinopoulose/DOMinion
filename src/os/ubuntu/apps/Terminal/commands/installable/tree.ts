import { CommandHandler } from '../types';
import { getAbsolutePathAsync, resolveRelativePathAsync } from '../../../../fs/pathResolver';
import { readDir } from '../../../../fs/operations';

export const tree: CommandHandler = async (args, env, streams) => {
  const targetDir = args[0] || '.';
  
  try {
    const cwdAbs = await getAbsolutePathAsync(env.cwdId);
    const node = await resolveRelativePathAsync(cwdAbs, targetDir);
    
    if (!node) {
      streams.stderr.writeLine(\`tree: \${targetDir}: No such file or directory\`);
      return 1;
    }
    
    if (node.type !== 'directory') {
      streams.stderr.writeLine(\`\${targetDir} [error opening dir]\`);
      return 1;
    }

    streams.stdout.writeLine(targetDir === '.' ? node.name || '.' : targetDir);
    
    let dirCount = 0;
    let fileCount = 0;

    const traverse = async (dirId: string, prefix: string = '') => {
      const children = await readDir(dirId);
      children.sort((a, b) => a.name.localeCompare(b.name));
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const isLast = i === children.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        
        const color = child.type === 'directory' ? '\\x1b[34m' : '';
        const reset = child.type === 'directory' ? '\\x1b[0m' : '';
        
        streams.stdout.writeLine(\`\${prefix}\${branch}\${color}\${child.name}\${reset}\`);
        
        if (child.type === 'directory') {
          dirCount++;
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          await traverse(child.id, nextPrefix);
        } else {
          fileCount++;
        }
      }
    };
    
    await traverse(node.id);
    
    streams.stdout.writeLine('');
    streams.stdout.writeLine(\`\${dirCount} directories, \${fileCount} files\`);
    return 0;
  } catch (e: any) {
    streams.stderr.writeLine(\`tree: \${e.message}\`);
    return 1;
  }
};
