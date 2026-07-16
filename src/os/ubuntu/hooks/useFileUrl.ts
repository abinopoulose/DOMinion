import { useState, useEffect } from 'react';
import { readFile } from '../fs/operations';

export function useFileUrl(fileId: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setUrl(null);
      setMimeType(null);
      return;
    }

    let objectUrl: string | null = null;
    let isMounted = true;
    
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const { getAbsolutePathAsync } = await import('../fs/pathResolver');
        const resolvedPath = await getAbsolutePathAsync(fileId);
        if (resolvedPath === '/') throw new Error('Cannot load root directory as file');
        
        const blob = await readFile(resolvedPath) as Blob;
        if (!isMounted) return;
        
        if (blob instanceof Blob) {
          const { sniffMimeType } = await import('../fs/mimeSniffer');
          const type = await sniffMimeType(blob);
          
          if (!isMounted) return;
          
          // Recreate blob with correct mime type if needed
          const finalBlob = type !== blob.type ? new Blob([blob], { type }) : blob;
          
          objectUrl = URL.createObjectURL(finalBlob);
          setUrl(objectUrl);
          setMimeType(type);
        } else {
          // Fallback if not a blob
          const textBlob = new Blob([blob as any], { type: 'text/plain' });
          objectUrl = URL.createObjectURL(textBlob);
          setUrl(objectUrl);
          setMimeType('text/plain');
        }
      } catch (err: any) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  return { url, loading, error, mimeType };
}
