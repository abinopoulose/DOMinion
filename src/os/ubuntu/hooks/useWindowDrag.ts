import { useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { getEdgeSnap, getTopEdgeSnap } from '../engine/WindowManagerEngine';

interface DragState {
  offsetX: number;
  offsetY: number;
  isTearingOff?: boolean;
}

interface UseWindowDragOptions {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMaximized: boolean;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onFocus: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  onTile?: (side: 'left' | 'right') => void;
}

/**
 * Custom hook for pointer-based window dragging using direct DOM manipulation.
 * Eliminates React state updates during drag for 60FPS performance.
 */
export function useWindowDrag({
  position,
  size,
  isMaximized,
  onPositionChange,
  onFocus,
  onMaximize,
  onRestore,
  onTile,
}: UseWindowDragOptions) {
  const dragRef = useRef<DragState | null>(null);
  const posRef = useRef(position);
  posRef.current = position;

  // Track the initial clientY when starting a drag on a maximized window
  const maxDragStartY = useRef<number | null>(null);
  // Track initial pointer down to distinguish clicks from drags
  const dragStart = useRef<{ x: number, y: number, pointerId: number, target: HTMLElement } | null>(null);
  const hasStartedDragging = useRef(false);
  
  // To track the current style transform and commit it at the end
  const currentPos = useRef<{ x: number, y: number }>({ ...position });

  const RESTORE_THRESHOLD = 40;
  const DRAG_THRESHOLD = 3;

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest('.titlebar__controls')) return;
      
      onFocus();
      
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        pointerId: e.pointerId,
        target: e.currentTarget,
      };
      hasStartedDragging.current = false;
      
      if (isMaximized) {
        maxDragStartY.current = e.clientY;
        dragRef.current = {
          offsetX: e.clientX,
          offsetY: e.clientY - e.currentTarget.getBoundingClientRect().top,
          isTearingOff: true,
        };
      } else {
        maxDragStartY.current = null;
        // Calculate offset based on current DOM position to avoid jumps if posRef is stale
        const windowEl = dragStart.current.target.closest('.window') as HTMLElement;
        const rect = windowEl ? windowEl.getBoundingClientRect() : posRef.current;
        const currentX = rect.x !== undefined ? rect.x : posRef.current.x;
        const currentY = rect.y !== undefined ? rect.y : posRef.current.y;
        
        dragRef.current = {
          offsetX: e.clientX - currentX,
          offsetY: e.clientY - currentY,
          isTearingOff: false,
        };
      }
    },
    [isMaximized, onFocus]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!dragRef.current || !dragStart.current) return;

      if (!hasStartedDragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          hasStartedDragging.current = true;
          dragStart.current.target.setPointerCapture(dragStart.current.pointerId);
          const windowEl = dragStart.current.target.closest('.window') as HTMLElement;
          if (windowEl) {
            windowEl.classList.add('window--dragging');
            // Remove CSS transitions during drag
            windowEl.style.transition = 'none';
          }
        } else {
          return;
        }
      }

      const windowEl = e.currentTarget.closest('.window') as HTMLElement;
      
      if (dragRef.current.isTearingOff) {
        const deltaY = maxDragStartY.current !== null ? e.clientY - maxDragStartY.current : 0;

        if (deltaY > RESTORE_THRESHOLD) {
          if (windowEl) windowEl.classList.add('window--unmaximizing');
          if (onRestore) onRestore();
          dragRef.current.isTearingOff = false;
          dragRef.current.offsetX = size.width / 2;
        } else {
          return;
        }
      }

      const topbarHeight = 28;
      const newX = e.clientX - dragRef.current.offsetX;
      const newY = e.clientY - dragRef.current.offsetY;

      // Constrain inside viewport
      const clampedX = Math.max(-200, Math.min(window.innerWidth - 200, newX));
      const clampedY = Math.max(topbarHeight, Math.min(window.innerHeight - 40, newY));

      currentPos.current = { x: clampedX, y: clampedY };

      // Apply direct DOM mutation
      if (windowEl) {
        // We assume left/top are initially set, we update left/top.
        // If we want to use transform, we'd need to set left/top to 0 and use translate3d.
        // For simplicity and avoiding conflicts with resize logic which relies on left/top:
        windowEl.style.left = `${clampedX}px`;
        windowEl.style.top = `${clampedY}px`;
      }
    },
    [onRestore, size.width]
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!dragRef.current) return;

      if (hasStartedDragging.current) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        const windowEl = e.currentTarget.closest('.window') as HTMLElement;
        if (windowEl) {
          windowEl.classList.remove('window--dragging');
          windowEl.classList.remove('window--unmaximizing');
          windowEl.style.transition = ''; // Restore transitions
        }
        
        // Commit final position to store
        onPositionChange(currentPos.current);
      }

      if (dragRef.current.isTearingOff && hasStartedDragging.current) {
        dragRef.current = null;
        maxDragStartY.current = null;
        dragStart.current = null;
        hasStartedDragging.current = false;
        return;
      }

      if (hasStartedDragging.current) {
        if (getTopEdgeSnap(e.clientY) && onMaximize) {
          onMaximize();
        } else {
          const side = getEdgeSnap(e.clientX, window.innerWidth);
          if (side && onTile) {
            onTile(side);
          }
        }
      }

      dragRef.current = null;
      maxDragStartY.current = null;
      dragStart.current = null;
      hasStartedDragging.current = false;
    },
    [onMaximize, onTile, onPositionChange]
  );

  return {
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  };
}
