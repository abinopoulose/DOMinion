import { useFileUrl } from '../../hooks/useFileUrl';
import { useWindowStore } from '../../store';
import { useVFSStore } from '../../store';

interface DocumentViewerProps {
  windowId: string;
}

export function DocumentViewer({ windowId }: DocumentViewerProps) {
  const win = useWindowStore((s: any) => s.windows.find((w: any) => w.id === windowId));
  const fileId = (win?.appState as any)?.fileId;
  const { url, loading, error } = useFileUrl(fileId);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#333', background: '#e0e0e0' }}>Loading PDF...</div>;
  if (error) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#cc0000', background: '#e0e0e0' }}>Failed to load PDF.</div>;
  if (!url) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666', background: '#e0e0e0' }}>No PDF selected</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#525659' }}>
      <iframe 
        src={url} 
        title="PDF Viewer" 
        style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} 
      />
    </div>
  );
}
