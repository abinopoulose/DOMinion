import { useState, useEffect } from 'react';
import { fsEvents } from '../fs/events';
import * as fs from '../fs/operations';
import type { VFSNode } from '../fs/types';

export function useFileSystem(path: string) {
  const [nodes, setNodes] = useState<VFSNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchDir = async () => {
      console.log(`[VFS Sync: useFileSystem] fetchDir triggered for path: ${path}`);
      try {
        setLoading(true);
        const children = await fs.readdir(path);
        console.log(`[VFS Sync: useFileSystem] Successfully read directory: ${path}. Children count: ${children.length}`);
        if (isMounted) {
          setNodes(children);
          setError(null);
        }
      } catch (err: any) {
        console.error(`[VFS Sync: useFileSystem] Error reading directory '${path}':`, err);
        if (isMounted) {
          setError(err);
          setNodes([]);
          import('../components/Notifications/useNotificationStore').then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
              title: 'Filesystem Error',
              message: err.message || 'Failed to read directory'
            });
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDir();

    const unsubscribe = fsEvents.subscribe(path, fetchDir);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [path]);

  const refresh = () => {
    fsEvents.emit(path, 'fs:changed');
  };

  return { nodes, loading, error, refresh };
}
