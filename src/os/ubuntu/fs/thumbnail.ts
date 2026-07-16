import { getDB } from './db';
import { readFile } from './operations';

export async function generateThumbnail(fileId: string, path: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    const existing = await db.get('thumbnails', fileId) as Blob | undefined;
    if (existing) return existing;

    const blob = await readFile(path) as Blob;
    if (!(blob instanceof Blob)) return null;

    if (!blob.type.startsWith('image/') && !path.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      return null;
    }

    // Generate thumbnail
    const img = new Image();
    const url = URL.createObjectURL(blob);
    const loadSuccess = await new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });

    if (!loadSuccess) {
      URL.revokeObjectURL(url);
      return null;
    }

    const canvas = document.createElement('canvas');
    const MAX_SIZE = 128;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    const thumbnailBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    
    if (thumbnailBlob) {
      await db.put('thumbnails', thumbnailBlob, fileId);
    }
    
    return thumbnailBlob;
  } catch (err) {
    console.error('Failed to generate thumbnail', err);
    return null;
  }
}
