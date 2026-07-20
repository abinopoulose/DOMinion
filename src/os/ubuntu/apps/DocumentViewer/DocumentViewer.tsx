import { useState } from 'react';
import { useFileUrl } from '../../hooks/useFileUrl';
import { useWindowAPI } from '../../hooks/useWindowAPI';


interface DocumentViewerProps {
  windowId: string;
}

export function DocumentViewer({ windowId }: DocumentViewerProps) {
  const { getState, updateState } = useWindowAPI(windowId);
  const win = { appState: getState<any>() };
  const fileId = (win?.appState as any)?.fileId;
  const { url, loading, error } = useFileUrl(fileId);
  const [unsupported, setUnsupported] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUnsupported(false);
    const draggedId = e.dataTransfer.getData('application/x-vfs-node');
    if (draggedId) {
      if (draggedId.toLowerCase().endsWith('.pdf')) {
        updateState({ fileId: draggedId });
      } else {
        setUnsupported(true);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderContent = () => {
    if (unsupported) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#cc0000', background: '#e0e0e0', fontWeight: 'bold' }}>Unsupported file format. Please drop a PDF document.</div>;
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#333', background: '#e0e0e0' }}>Loading PDF...</div>;
    if (error) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#cc0000', background: '#e0e0e0' }}>Failed to load PDF.</div>;
    if (!url) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666', background: '#e0e0e0' }}>Drop a PDF document here to view</div>;

    return (
      <iframe 
        src={url} 
        title="PDF Viewer" 
        style={{ flex: 1, border: 'none', width: '100%', height: '100%', pointerEvents: 'auto' }} 
      />
    );
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#525659' }}
    >
      {renderContent()}
    </div>
  );
}
