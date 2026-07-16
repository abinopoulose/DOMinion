import { useEffect, useState } from 'react';
import { useVFSStore } from '../../store';

export function DiskUsageAnalyzer(_props: { windowId: string }) {
  const [usage, setUsage] = useState<number>(0);
  const [quota, setQuota] = useState<number>(0);
  const [vfsSize, setVfsSize] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    async function measure() {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        if (mounted) {
          setUsage(est.usage || 0);
          setQuota(est.quota || 0);
        }
      }

      try {
        const { getDB } = await import('../../fs/db');
        const db = await getDB();
        const inodes = await db.getAll('inodes');
        let size = 0;
        for (const node of inodes) {
          size += node.sizeBytes || 0;
        }
        if (mounted) setVfsSize(size);
      } catch (e) {
        console.error('Failed to read IDB size', e);
      }
    }
    
    measure();
    const interval = setInterval(measure, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;
  
  return (
    <div style={{ padding: '24px', color: 'var(--color-text-primary)', background: 'var(--color-bg-window)', height: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ margin: '0 0 24px 0', fontWeight: 300, fontSize: '24px' }}>Disk Usage Analyzer</h2>
      
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Browser Storage Quota</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <span>{formatSize(usage)} used</span>
          <span>{formatSize(quota)} total</span>
        </div>
        <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${usagePercent}%`, height: '100%', background: usagePercent > 90 ? '#e95420' : '#77216F' }} />
        </div>
      </div>
      
      <div>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>VFS Metadata Size</h3>
        <p style={{ fontSize: '14px', margin: 0 }}>
          The total calculated size of all files tracked in the Virtual File System is: <strong>{formatSize(vfsSize)}</strong>
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
          *Note: This does not include IndexedDB overhead, symlinks, or cached thumbnails.
        </p>
      </div>
    </div>
  );
}
