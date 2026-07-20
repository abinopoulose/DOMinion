import { useState, useEffect } from 'react';
import { fsEvents } from '../fs/events';
import * as fs from '../fs/operations';
import type { VFSNode } from '../fs/types';

// Global cache for fast UI reads without hitting IDB every time
const vfsCache = new Map<string, VFSNode[]>();

export function useFileSystem(path: string) {
  const [nodes, setNodes] = useState<VFSNode[]>(vfsCache.get(path) || []);
  const [loading, setLoading] = useState(!vfsCache.has(path));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    let fetchTimeout: any;

    const fetchDir = async () => {
      try {
        if (!vfsCache.has(path)) setLoading(true);
        const children = await fs.readdir(path);
        vfsCache.set(path, children);
        
        if (isMounted) {
          setNodes(children);
          setError(null);
        }
      } catch (err: any) {
        if (!err.message?.includes('ENOENT')) {
          console.error(`[VFS Sync: useFileSystem] Error reading directory '${path}':`, err);
        }
        if (isMounted) {
          setError(err);
          setNodes([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDir();

    const handleEvent = () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        vfsCache.delete(path);
        fetchDir();
      }, 50);
    };

    // Subscribe both to specific path and globally to ensure all deep nested changes trigger UI updates reliably
    const unsubscribe1 = fsEvents.subscribe(path, handleEvent);
    const unsubscribe2 = fsEvents.subscribeGlobal(handleEvent);

    return () => {
      isMounted = false;
      if (fetchTimeout) clearTimeout(fetchTimeout);
      unsubscribe1();
      unsubscribe2();
    };
  }, [path]);

  const refresh = () => {
    fsEvents.emit(path, 'fs:changed');
  };

  return { nodes, loading, error, refresh };
}
