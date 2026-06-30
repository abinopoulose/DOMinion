import { useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react';

interface DragState {
  offsetX: number;
  offsetY: number;
}

interface UseWindowDragOptions {
  position: { x: number; y: number };
  isMaximized: boolean;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onFocus: () => void;
  onMaximize?: () => void;
  onTile?: (side: 'left' | 'right') => void;
}

/**
 * Custom hook for pointer-based window dragging.
 * Constrains the title bar to remain within viewport bounds.
 * Disabled when the window is maximized.
 */
export function useWindowDrag({ position, isMaximized, onPositionChange, onFocus, onMaximize, onTile }: UseWindowDragOptions) {
  const dragRef = useRef<DragState | null>(null);
  const posRef = useRef(position);
  posRef.current = position;

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (isMaximized) return;

    // Don't drag if clicking a button inside the title bar
    if ((e.target as HTMLElement).closest('.titlebar__controls')) return;

    onFocus();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const windowEl = e.currentTarget.closest('.window');
    if (windowEl) windowEl.classList.add('window--dragging');

    dragRef.current = {
      offsetX: e.clientX - posRef.current.x,
      offsetY: e.clientY - posRef.current.y,
    };
  }, [isMaximized, onFocus]);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;

    const topbarHeight = 28;
    const newX = e.clientX - dragRef.current.offsetX;
    const newY = e.clientY - dragRef.current.offsetY;

    // Constrain: title bar can't leave the viewport
    const clampedX = Math.max(-200, Math.min(window.innerWidth - 200, newX));
    const clampedY = Math.max(topbarHeight, Math.min(window.innerHeight - 40, newY));

    onPositionChange({ x: clampedX, y: clampedY });
  }, [onPositionChange]);

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    
    // Snap to maximize if dropped at the top edge of the screen (over the TopBar)
    if (e.clientY <= 30 && onMaximize) {
      onMaximize();
    } else if (e.clientX <= 20 && onTile) {
      onTile('left');
    } else if (e.clientX >= window.innerWidth - 20 && onTile) {
      onTile('right');
    }
    
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const windowEl = e.currentTarget.closest('.window');
    if (windowEl) windowEl.classList.remove('window--dragging');
  }, [onMaximize, onTile]);

  return {
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  };
}
