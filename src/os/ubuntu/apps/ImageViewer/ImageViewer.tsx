import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWindowStore } from '../../store';
import { useFileUrl } from '../../hooks/useFileUrl';
import './ImageViewer.css';

interface ImageViewerProps {
  windowId: string;
}

export function ImageViewer({ windowId }: ImageViewerProps) {
  const win = useWindowStore(useCallback((s) => s.windows.find((w) => w.id === windowId), [windowId]));
  const fileId = (win?.appState as any)?.fileId;
  const { url, loading, error } = useFileUrl(fileId);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [hasInitialized, setHasInitialized] = useState(false);

  const fitToWindow = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const img = imageRef.current;
    
    const isRotated = rotation % 180 !== 0;
    const imgWidth = isRotated ? img.naturalHeight : img.naturalWidth;
    const imgHeight = isRotated ? img.naturalWidth : img.naturalHeight;

    if (!imgWidth || !imgHeight) return;

    const scaleX = container.width / imgWidth;
    const scaleY = container.height / imgHeight;
    const minScale = Math.min(scaleX, scaleY);
    
    // Default to fit, but don't zoom past 100%
    const targetScale = Math.min(1, minScale * 0.95);

    setScale(targetScale);
    setPan({ x: 0, y: 0 });
  }, [rotation]);

  const handleImageLoad = () => {
    if (!hasInitialized) {
      fitToWindow();
      setHasInitialized(true);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      // Re-fit only if we haven't manually zoomed, for simplicity we just let user zoom
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.1, prev + delta));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      handleZoom(0.1);
    } else {
      handleZoom(-0.1);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    if (containerRef.current && imageRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const isRotated = rotation % 180 !== 0;
      const iw = (isRotated ? imageRef.current.naturalHeight : imageRef.current.naturalWidth) * scale;
      const ih = (isRotated ? imageRef.current.naturalWidth : imageRef.current.naturalHeight) * scale;
      
      const maxX = Math.max(0, (iw - cw) / 2);
      const maxY = Math.max(0, (ih - ch) / 2);
      
      newX = Math.max(-maxX, Math.min(maxX, newX));
      newY = Math.max(-maxY, Math.min(maxY, newY));
    }
    
    setPan({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const resetOriginal = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const rotate = () => {
    setRotation(r => r + 90);
    setPan({ x: 0, y: 0 });
  };

  if (error) {
    return (
      <div className="loupe-viewer">
        <div className="loupe-loading" style={{color: '#ff5555'}}>Failed to load image</div>
      </div>
    );
  }

  return (
    <div className="loupe-viewer">
      <div 
        className={`loupe-canvas ${isDragging ? 'grabbing' : 'grab'}`}
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {url && (
          <img 
            ref={imageRef}
            src={url} 
            alt="View" 
            className="loupe-image"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale}) rotate(${rotation}deg)` 
            }} 
            onLoad={handleImageLoad}
          />
        )}
      </div>

      {loading && <div className="loupe-loading">Loading image...</div>}

      <div className="loupe-toolbar-container">
        <div className="loupe-toolbar">
          <button className="loupe-btn" onClick={() => handleZoom(0.25)} title="Zoom In">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button className="loupe-btn" onClick={() => handleZoom(-0.25)} title="Zoom Out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button className="loupe-btn" onClick={resetOriginal} title="Original Size (1:1)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18M9 21V9"/></svg>
          </button>
          <button className="loupe-btn" onClick={fitToWindow} title="Fit to Window">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v6h6M20 10V4h-6M10 20H4M20 4v6M14 4h6M4 10V4h6"/></svg>
          </button>
          <button className="loupe-btn" onClick={rotate} title="Rotate">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
