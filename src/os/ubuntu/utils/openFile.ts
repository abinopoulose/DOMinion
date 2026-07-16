import { useWindowStore } from '../store';

import { readFile } from '../fs/operations';
import { sniffMimeType } from '../fs/mimeSniffer';

export const openFileApp = async (id: string, isDirectory: boolean) => {
  const openWindow = useWindowStore.getState().openWindow;
  
  if (isDirectory) {
    openWindow('file-manager', { cwdId: id });
    return;
  }

  try {
    const { getAbsolutePathAsync } = await import('../fs/pathResolver');
    const path = await getAbsolutePathAsync(id);
    if (path === '/') throw new Error('Cannot open root as a file');
    
    const blob = await readFile(path);
    
    let appId: any = 'text-editor';
    
    if (blob instanceof Blob) {
      const mime = await sniffMimeType(blob);
      const ext = path.split('.').pop()?.toLowerCase() || '';
      
      if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        appId = 'image-viewer';
      }
      else if (mime.startsWith('video/') || mime.startsWith('audio/') || 
               ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v', 'mp3', 'wav', 'flac', 'aac', 'm4a'].includes(ext)) {
        appId = 'video-player';
      }
      else if (mime === 'application/pdf' || ext === 'pdf') {
        appId = 'document-viewer';
      }
    }
    
    openWindow(appId, { fileId: id });
  } catch (err) {
    console.error('Failed to open file:', err);
    // Fallback if read fails but we still want to try opening
    openWindow('text-editor', { fileId: id });
  }
};
