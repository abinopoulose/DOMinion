import React, { useState, useEffect } from 'react';
import { getIconForFile } from '../../utils/iconResolver';
import { generateThumbnail } from '../../fs/thumbnail';


interface FileIconProps {
  fileId: string;
  fileName: string;
  isDirectory: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function FileIcon({ fileId, fileName, isDirectory, className, style }: FileIconProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isDirectory) return;

    // Check if it's potentially an image by extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      let isMounted = true;
      let objectUrl: string | null = null;

      const loadThumbnail = async () => {
        try {
          const { getAbsolutePathAsync } = await import('../../fs/pathResolver');
          const path = await getAbsolutePathAsync(fileId);
          if (path === '/') return; // Don't try to read root as image

          const blob = await generateThumbnail(fileId, path);
          if (blob && isMounted) {
            objectUrl = URL.createObjectURL(blob);
            setThumbnailUrl(objectUrl);
          }
        } catch (e) {
          console.error('[FileIcon] Thumbnail failed:', e);
        }
      };

      loadThumbnail();

      return () => {
        isMounted = false;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }
  }, [fileId, fileName, isDirectory]);

  return (
    <img
      src={thumbnailUrl || getIconForFile(fileName, isDirectory)}
      alt={fileName}
      className={className}
      draggable={false}
      style={{
        ...style,
        ...(thumbnailUrl ? { objectFit: 'cover', borderRadius: '4px' } : {})
      }}
    />
  );
}
