import React from 'react';
import { zipSync } from 'fflate';
import { readFile, mkdir, writeFile } from '../fs/operations';
import { getAbsolutePathAsync } from '../fs/pathResolver';
import { getDB } from '../fs/db';

export async function downloadFile(id: string) {
  const db = await getDB();
  const node = await db.get('inodes', id);
  if (!node || node.type === 'directory') return;

  try {
    const path = await getAbsolutePathAsync(id);
    const blob = await readFile(path);
    if (blob instanceof Blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = node.name;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Create blob from string
      const textBlob = new Blob([blob as any], { type: 'text/plain' });
      const url = URL.createObjectURL(textBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = node.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('Failed to download file', err);
  }
}

async function collectFilesForZip(nodeId: string, currentPath: string, zipData: Record<string, Uint8Array>) {
  const db = await getDB();
  const node = await db.get('inodes', nodeId);
  if (!node) return;

  if (node.type === 'directory') {
    const children = await db.getAllFromIndex('inodes', 'by-parent', nodeId);
    for (const child of children) {
      await collectFilesForZip(child.id, currentPath ? `${currentPath}/${node.name}` : node.name, zipData);
    }
  } else {
    try {
      const path = await getAbsolutePathAsync(nodeId);
      const blob = await readFile(path);
      let uint8array: Uint8Array;
      if (blob instanceof Blob) {
        uint8array = new Uint8Array(await blob.arrayBuffer());
      } else {
        uint8array = new TextEncoder().encode(blob as string);
      }
      zipData[`${currentPath ? `${currentPath}/` : ''}${node.name}`] = uint8array;
    } catch (err) {
      console.warn('Failed to read file for zip', err);
    }
  }
}

export async function downloadFilesAsZip(ids: string[], zipName: string = 'archive.zip') {
  const db = await getDB();
  const zipData: Record<string, Uint8Array> = {};

  for (const id of ids) {
    const node = await db.get('inodes', id);
    if (node) {
      if (node.type === 'directory') {
        await collectFilesForZip(id, '', zipData);
      } else {
        try {
          const path = await getAbsolutePathAsync(id);
          const blob = await readFile(path);
          let uint8array: Uint8Array;
          if (blob instanceof Blob) {
            uint8array = new Uint8Array(await blob.arrayBuffer());
          } else {
            uint8array = new TextEncoder().encode(blob as string);
          }
          zipData[node.name] = uint8array;
        } catch (err) {
          console.warn('Failed to read file for zip', err);
        }
      }
    }
  }

  const zipped = zipSync(zipData);
  const blob = new Blob([zipped], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}

// DRAG AND DROP UPLOAD
export async function handleHostDrop(e: React.DragEvent, targetDirId: string, onProgress?: (msg: string, current: number, total: number) => void) {
  e.preventDefault();
  const items = e.dataTransfer.items;
  console.log(`[VFS Sync: hostInterop] handleHostDrop initiated for targetDirId: ${targetDirId}`);
  
  if (!items) {
    console.warn('[VFS Sync: hostInterop] e.dataTransfer.items is null or empty, aborting drag and drop.');
    return;
  }

  const queue: { entry: any, path: string }[] = [];

  for (let i = 0; i < items?.length || 0; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
      if (entry) {
        console.log(`[VFS Sync: hostInterop] Parsed webkitGetAsEntry: ${entry.name} (isFile: ${entry.isFile}, isDirectory: ${entry.isDirectory})`);
        queue.push({ entry, path: '' });
      } else {
        console.warn(`[VFS Sync: hostInterop] webkitGetAsEntry failed or not supported for item index ${i}`);
      }
    }
  }

  const fallbackFiles: File[] = [];
  if (queue.length === 0 && e.dataTransfer.files?.length > 0) {
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      fallbackFiles.push(e.dataTransfer.files[i]);
    }
  }

  const targetPath = await getAbsolutePathAsync(targetDirId);
  console.log(`[VFS Sync: hostInterop] Resolved absolute target path: ${targetPath}`);

  // Process fallback flat files if webkitGetAsEntry failed
  if (fallbackFiles.length > 0) {
    console.log(`[VFS Sync: hostInterop] Proceeding with fallback path. ${fallbackFiles.length} files detected in e.dataTransfer.files.`);
    for (let i = 0; i < fallbackFiles.length; i++) {
      const file = fallbackFiles[i];
      const absolutePath = targetPath + '/' + file.name;

      
      console.log(`[VFS Sync: hostInterop] Fallback processing file: ${absolutePath}`);
      onProgress?.(`Uploading ${file.name}...`, i, fallbackFiles.length);
      
      try {
        console.log(`[VFS Sync: hostInterop] Executing backend writeFile for: ${absolutePath}`);
        
        const totalSize = file.size;
        
        // Simulate upload progress for UI smoothness (since local writes are near-instant)
        const duration = Math.min(1500, Math.max(300, totalSize / 2000));
        const steps = 15;
        const stepDuration = duration / steps;
        
        for (let p = 1; p <= steps; p++) {
          await new Promise(resolve => setTimeout(resolve, stepDuration));
          const fractionalProgress = p / steps;
          onProgress?.(`Uploading ${file.name}...`, i + (fractionalProgress * 0.95), fallbackFiles.length);
        }
        
        await writeFile(absolutePath, file);
        console.log(`[VFS Sync: hostInterop] Successfully wrote fallback file: ${absolutePath}`);
      } catch (err) {
        console.error(`[VFS Sync: hostInterop] writeFile failed for fallback file: ${absolutePath}`, err);
        throw err;
      }
      onProgress?.(`Uploading ${file.name}...`, i + 1, fallbackFiles.length);
    }
    return;
  }

  console.log(`[VFS Sync: hostInterop] Processing standard entry queue. Size: ${queue.length}`);
  let currentIndex = 0;
  for (const { entry, path } of queue) {
    const absolutePath = targetPath + '/' + (path ? path + '/' : '') + entry.name;

    
    if (entry.isFile) {
      console.log(`[VFS Sync: hostInterop] Processing file entry: ${absolutePath}`);
      onProgress?.(`Uploading ${entry.name}...`, currentIndex, queue.length);
      await new Promise<void>((resolve, reject) => {
        entry.file(async (file: File) => {
          try {
            console.log(`[VFS Sync: hostInterop] Executing backend writeFile for entry: ${absolutePath}`);
            
            const totalSize = file.size;
            
            // Simulate upload progress for UI smoothness (since local writes are near-instant)
            const duration = Math.min(1500, Math.max(300, totalSize / 2000));
            const steps = 15;
            const stepDuration = duration / steps;
            
            for (let p = 1; p <= steps; p++) {
              await new Promise(resolve => setTimeout(resolve, stepDuration));
              const fractionalProgress = p / steps;
              onProgress?.(`Uploading ${entry.name}...`, currentIndex + (fractionalProgress * 0.95), queue.length);
            }
            
            await writeFile(absolutePath, file);
            console.log(`[VFS Sync: hostInterop] Successfully wrote entry file: ${absolutePath}`);
            resolve();
          } catch (err) {
            console.error(`[VFS Sync: hostInterop] Failed to process entry file: ${absolutePath}`, err);
            reject(err);
          }
        }, reject);
      });
      currentIndex++;
      onProgress?.(`Uploading ${entry.name}...`, currentIndex, queue.length);
    } else if (entry.isDirectory) {
      onProgress?.(`Creating folder ${entry.name}...`, currentIndex, queue.length);
      try {
        await mkdir(absolutePath);
      } catch (e: any) {
        if (!e.message?.includes('already exists')) console.warn(e);
      }
      
      const dirReader = entry.createReader();
      const readEntries = async () => {
        return new Promise<any[]>((resolve, reject) => {
          dirReader.readEntries(resolve, reject);
        });
      };
      
      let entries = await readEntries();
      while (entries.length > 0) {
        for (const child of entries) {
          queue.push({ entry: child, path: (path ? path + '/' : '') + entry.name });
        }
        entries = await readEntries();
      }
      currentIndex++;
    }
  }
}
