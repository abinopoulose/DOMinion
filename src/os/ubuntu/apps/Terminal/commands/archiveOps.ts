import type { CommandHandler } from './types';
import { parseArgs } from '../commandParser';

// Simulated archive format (JSON)
interface MockArchive {
  type: 'tar' | 'zip';
  files: {
    path: string;
    content: string;
    isDirectory: boolean;
  }[];
}

export const tar: CommandHandler = async (args, env, streams) => {
  const { flags, options, positional } = parseArgs(args, ['f']);
  
  if (!flags.c && !flags.x) {
    streams.stderr.writeLine('tar: must specify one of -c, -r, -t, -u, -x');
    return 1;
  }
  
  const isCreate = flags.c;
  const isExtract = flags.x;
  const isVerbose = flags.v;
  const archiveFile = options.f;
  
  if (!archiveFile) {
    streams.stderr.writeLine('tar: Refusing to read archive contents from terminal (missing -f option?)');
    return 1;
  }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readFile, writeFile, stat, readdir, mkdir } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  if (isCreate) {
    const filesToArchive = positional;
    if (filesToArchive.length === 0) {
      streams.stderr.writeLine('tar: Cowardly refusing to create an empty archive');
      return 1;
    }
    
    const archiveData: MockArchive = { type: 'tar', files: [] };
    
    const addNodeToArchive = async (currentPath: string, archivePath: string) => {
      const node = await resolveRelativePathAsync(cwdPath, currentPath);
      if (!node) {
        streams.stderr.writeLine(`tar: ${currentPath}: Cannot stat: No such file or directory`);
        return;
      }
      
      const absPath = await getAbsolutePathAsync(node.id);
      const nodeStat = await stat(absPath);
      
      if (nodeStat.type === 'file') {
        const text = await (await readFile(absPath)).text();
        archiveData.files.push({ path: archivePath, content: text, isDirectory: false });
        if (isVerbose) streams.stdout.writeLine(archivePath);
      } else if (nodeStat.type === 'directory') {
        archiveData.files.push({ path: archivePath + '/', content: '', isDirectory: true });
        if (isVerbose) streams.stdout.writeLine(archivePath + '/');
        
        const children = await readdir(absPath);
        for (const child of children) {
          await addNodeToArchive(currentPath + '/' + child.name, archivePath + '/' + child.name);
        }
      }
    };
    
    for (const target of filesToArchive) {
      await addNodeToArchive(target, target);
    }
    
    // Save to VFS
    const parts = archiveFile.split('/');
    const destName = parts.pop()!;
    const parentPath = parts.join('/') || '.';
    const parentNode = await resolveRelativePathAsync(cwdPath, parentPath);
    if (!parentNode) {
      streams.stderr.writeLine(`tar: ${archiveFile}: Cannot open: No such file or directory`);
      return 1;
    }
    
    const parentAbs = await getAbsolutePathAsync(parentNode.id);
    const targetPath = parentAbs === '/' ? '/' + destName : parentAbs + '/' + destName;
    
    await writeFile(targetPath, JSON.stringify(archiveData));
    return 0;
  }
  
  if (isExtract) {
    const node = await resolveRelativePathAsync(cwdPath, archiveFile);
    if (!node) {
      streams.stderr.writeLine(`tar: ${archiveFile}: Cannot open: No such file or directory`);
      streams.stderr.writeLine('tar: Error is not recoverable: exiting now');
      return 2;
    }
    
    const absPath = await getAbsolutePathAsync(node.id);
    const blob = await readFile(absPath);
    const text = await blob.text();
    
    let archiveData: MockArchive;
    try {
      archiveData = JSON.parse(text);
      if (archiveData.type !== 'tar' && archiveData.type !== 'zip') throw new Error();
    } catch {
      streams.stderr.writeLine(`tar: This does not look like a tar archive`);
      streams.stderr.writeLine('tar: Error is not recoverable: exiting now');
      return 2;
    }
    
    for (const file of archiveData.files) {
      const fullExtractPath = cwdPath === '/' ? '/' + file.path : cwdPath + '/' + file.path;
      if (file.isDirectory) {
        try {
          await mkdir(fullExtractPath);
        } catch (e: any) {
          if (!e.message?.includes('exists')) {
            streams.stderr.writeLine(`tar: ${file.path}: Cannot mkdir: ${e.message}`);
          }
        }
        if (isVerbose) streams.stdout.writeLine(file.path);
      } else {
        // Ensure parent exists
        const parts = fullExtractPath.split('/');
        parts.pop();
        const dirPath = parts.join('/');
        try {
          if (dirPath !== '' && dirPath !== '/') {
             // Basic attempt to create missing parents sequentially
             const dirParts = dirPath.split('/').filter(Boolean);
             let curr = '';
             for (const dp of dirParts) {
               curr += '/' + dp;
               try { await mkdir(curr); } catch {}
             }
          }
          await writeFile(fullExtractPath, file.content);
          if (isVerbose) streams.stdout.writeLine(file.path);
        } catch (e: any) {
          streams.stderr.writeLine(`tar: ${file.path}: Cannot write: ${e.message}`);
        }
      }
    }
    return 0;
  }
  
  return 1;
};

export const zip: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);
  
  if (positional.length < 2) {
    streams.stderr.writeLine('zip error: Nothing to do!');
    return 1;
  }
  
  const archiveFile = positional[0];
  const filesToArchive = positional.slice(1);
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readFile, writeFile, stat, readdir } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  const archiveData: MockArchive = { type: 'zip', files: [] };
  
  const addNodeToArchive = async (currentPath: string, archivePath: string) => {
    const node = await resolveRelativePathAsync(cwdPath, currentPath);
    if (!node) {
      streams.stderr.writeLine(`zip warning: name not matched: ${currentPath}`);
      return;
    }
    
    const absPath = await getAbsolutePathAsync(node.id);
    const nodeStat = await stat(absPath);
    
    if (nodeStat.type === 'file') {
      const text = await (await readFile(absPath)).text();
      archiveData.files.push({ path: archivePath, content: text, isDirectory: false });
      streams.stdout.writeLine(`  adding: ${archivePath} (mock deflated 0%)`);
    } else if (nodeStat.type === 'directory') {
      archiveData.files.push({ path: archivePath + '/', content: '', isDirectory: true });
      streams.stdout.writeLine(`  adding: ${archivePath}/ (stored 0%)`);
      
      // zip normally doesn't recurse unless -r is given, but we will simplify and always recurse or assume user used -r.
      // Wait, let's only recurse if it was requested, or just do it for simplicity.
      // We will do it for simplicity since we don't fully parse -r here.
      const children = await readdir(absPath);
      for (const child of children) {
        await addNodeToArchive(currentPath + '/' + child.name, archivePath + '/' + child.name);
      }
    }
  };
  
  for (const target of filesToArchive) {
    await addNodeToArchive(target, target);
  }
  
  // Save to VFS
  const parts = archiveFile.split('/');
  const destName = parts.pop()!;
  const parentPath = parts.join('/') || '.';
  const parentNode = await resolveRelativePathAsync(cwdPath, parentPath);
  if (!parentNode) {
    streams.stderr.writeLine(`zip I/O error: No such file or directory`);
    return 1;
  }
  
  const parentAbs = await getAbsolutePathAsync(parentNode.id);
  const targetPath = parentAbs === '/' ? '/' + destName : parentAbs + '/' + destName;
  
  await writeFile(targetPath, JSON.stringify(archiveData));
  return 0;
};

export const unzip: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);
  
  if (positional.length === 0) {
    streams.stderr.writeLine('UnZip 6.00 of 20 April 2009, by Debian. Original by Info-ZIP.');
    return 1;
  }
  
  const archiveFile = positional[0];
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readFile, writeFile, mkdir } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  const node = await resolveRelativePathAsync(cwdPath, archiveFile);
  if (!node) {
    streams.stderr.writeLine(`unzip:  cannot find or open ${archiveFile}, ${archiveFile}.zip or ${archiveFile}.ZIP.`);
    return 9;
  }
  
  const absPath = await getAbsolutePathAsync(node.id);
  const blob = await readFile(absPath);
  const text = await blob.text();
  
  let archiveData: MockArchive;
  try {
    archiveData = JSON.parse(text);
    if (archiveData.type !== 'tar' && archiveData.type !== 'zip') throw new Error();
  } catch {
    streams.stderr.writeLine(`Archive:  ${archiveFile}`);
    streams.stderr.writeLine(`  End-of-central-directory signature not found.`);
    return 9;
  }
  
  streams.stdout.writeLine(`Archive:  ${archiveFile}`);
  
  for (const file of archiveData.files) {
    const fullExtractPath = cwdPath === '/' ? '/' + file.path : cwdPath + '/' + file.path;
    if (file.isDirectory) {
      try {
        await mkdir(fullExtractPath);
      } catch (e: any) {
        if (!e.message?.includes('exists')) {
          streams.stderr.writeLine(`   error:  cannot create ${file.path}`);
        }
      }
      streams.stdout.writeLine(`   creating: ${file.path}`);
    } else {
      // Ensure parent exists
      const parts = fullExtractPath.split('/');
      parts.pop();
      const dirPath = parts.join('/');
      try {
        if (dirPath !== '' && dirPath !== '/') {
           const dirParts = dirPath.split('/').filter(Boolean);
           let curr = '';
           for (const dp of dirParts) {
             curr += '/' + dp;
             try { await mkdir(curr); } catch {}
           }
        }
        await writeFile(fullExtractPath, file.content);
        streams.stdout.writeLine(`  inflating: ${file.path}`);
      } catch (e: any) {
        streams.stderr.writeLine(`error:  cannot create ${file.path}`);
      }
    }
  }
  
  return 0;
};

export const gzip: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);
  
  if (positional.length === 0) {
    streams.stderr.writeLine('gzip: compressed data not written to a terminal.');
    return 1;
  }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readFile, writeFile, unlink } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  for (const target of positional) {
    const node = await resolveRelativePathAsync(cwdPath, target);
    if (!node) {
      streams.stderr.writeLine(`gzip: ${target}: No such file or directory`);
      continue;
    }
    
    if (node.type === 'directory') {
      streams.stderr.writeLine(`gzip: ${target} is a directory -- ignored`);
      continue;
    }
    
    const absPath = await getAbsolutePathAsync(node.id);
    const blob = await readFile(absPath);
    
    // Write new file .gz
    await writeFile(`${absPath}.gz`, await blob.text()); // Simulated compression, just rename/copy
    
    // Remove old file
    await unlink(absPath);
  }
  
  return 0;
};

export const gunzip: CommandHandler = async (args, env, streams) => {
  const { positional } = parseArgs(args);
  
  if (positional.length === 0) {
    streams.stderr.writeLine('gunzip: compressed data not read from a terminal.');
    return 1;
  }
  
  const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
  const { readFile, writeFile, unlink } = await import('../../../fs/operations');
  const cwdPath = await getAbsolutePathAsync(env.cwdId);
  
  for (const target of positional) {
    const node = await resolveRelativePathAsync(cwdPath, target);
    if (!node) {
      streams.stderr.writeLine(`gunzip: ${target}: No such file or directory`);
      continue;
    }
    
    if (node.type === 'directory') {
      streams.stderr.writeLine(`gunzip: ${target} is a directory -- ignored`);
      continue;
    }
    
    if (!target.endsWith('.gz')) {
      streams.stderr.writeLine(`gunzip: ${target}: unknown suffix -- ignored`);
      continue;
    }
    
    const absPath = await getAbsolutePathAsync(node.id);
    const blob = await readFile(absPath);
    
    // Write new file removing .gz
    const uncompressedPath = absPath.slice(0, -3);
    await writeFile(uncompressedPath, await blob.text()); 
    
    // Remove old file
    await unlink(absPath);
  }
  
  return 0;
};
