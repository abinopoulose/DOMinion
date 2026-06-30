import { useRef, useCallback, useEffect } from 'react';

type ResizeEdge = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

interface ResizeState {
  edge: ResizeEdge;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startPosX: number;
  startPosY: number;
}

interface UseWindowResizeOptions {
  position: { x: number; y: number };
  size: { width: number; height: number };
  minSize?: { width: number; height: number };
  isMaximized: boolean;
  onSizeChange: (size: { width: number; height: number }) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
}

const MIN_DEFAULT = { width: 400, height: 300 };

/**
 * Custom hook for pointer-based window resizing.
 * Supports 8 edge/corner handles. Disabled when maximized.
 */
export function useWindowResize({
  position,
  size,
  minSize = MIN_DEFAULT,
  isMaximized,
  onSizeChange,
  onPositionChange,
}: UseWindowResizeOptions) {
  const resizeRef = useRef<ResizeState | null>(null);
  const posRef = useRef(position);
  const sizeRef = useRef(size);
  posRef.current = position;
  sizeRef.current = size;

  const handleResizeStart = useCallback((edge: ResizeEdge, e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const windowEl = e.currentTarget.closest('.window');
    if (windowEl) windowEl.classList.add('window--resizing');

    resizeRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: sizeRef.current.width,
      startHeight: sizeRef.current.height,
      startPosX: posRef.current.x,
      startPosY: posRef.current.y,
    };
  }, [isMaximized]);

  const handleResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const r = resizeRef.current;
    if (!r) return;

    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;
    const maxW = window.innerWidth;
    const maxH = window.innerHeight - 28; // minus topbar
    let newW = r.startWidth;
    let newH = r.startHeight;
    let newX = r.startPosX;
    let newY = r.startPosY;

    // East (right edge)
    if (r.edge.includes('e')) {
      newW = Math.max(minSize.width, Math.min(maxW, r.startWidth + dx));
    }
    // West (left edge) — moves position
    if (r.edge.includes('w')) {
      const proposedW = r.startWidth - dx;
      if (proposedW >= minSize.width) {
        newW = proposedW;
        newX = r.startPosX + dx;
      }
    }
    // South (bottom edge)
    if (r.edge === 's' || r.edge === 'se' || r.edge === 'sw') {
      newH = Math.max(minSize.height, Math.min(maxH, r.startHeight + dy));
    }
    // North (top edge) — moves position
    if (r.edge === 'n' || r.edge === 'ne' || r.edge === 'nw') {
      const proposedH = r.startHeight - dy;
      if (proposedH >= minSize.height) {
        newH = proposedH;
        newY = Math.max(28, r.startPosY + dy);
      }
    }

    onSizeChange({ width: newW, height: newH });
    onPositionChange({ x: newX, y: newY });
  }, [minSize, onSizeChange, onPositionChange]);

  const handleResizeEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const windowEl = e.currentTarget.closest('.window');
    if (windowEl) windowEl.classList.remove('window--resizing');
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      resizeRef.current = null;
    };
  }, []);

  const edges: ResizeEdge[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

  const resizeHandles = isMaximized
    ? null
    : edges.map((edge) => (
        <div
          key={edge}
          className={`window__resize-handle window__resize-handle--${edge}`}
          onPointerDown={(e) => handleResizeStart(edge, e)}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
        />
      ));

  return { resizeHandles };
}
