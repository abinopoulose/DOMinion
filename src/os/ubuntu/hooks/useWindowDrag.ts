import { useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react';

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
 * Custom hook for pointer-based window dragging.
 * Constrains the title bar to remain within viewport bounds.
 * When maximized, dragging the title bar down > RESTORE_THRESHOLD px
 * calls onRestore() to exit fullscreen, then continues as a normal drag.
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
  // How many pixels downward the user must drag before we restore the window
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
        dragRef.current = {
          offsetX: e.clientX - posRef.current.x,
          offsetY: e.clientY - posRef.current.y,
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
          const windowEl = dragStart.current.target.closest('.window');
          if (windowEl) windowEl.classList.add('window--dragging');
        } else {
          return;
        }
      }

      if (dragRef.current.isTearingOff) {
        const deltaY =
          maxDragStartY.current !== null ? e.clientY - maxDragStartY.current : 0;

        if (deltaY > RESTORE_THRESHOLD) {
          // Kill transitions instantly before React removes .window--maximized
          const windowEl = e.currentTarget.closest('.window');
          if (windowEl) windowEl.classList.add('window--unmaximizing');
          // Exit fullscreen
          if (onRestore) onRestore();
          dragRef.current.isTearingOff = false;
          // Re-anchor offsetX so the window's centre tracks the pointer
          dragRef.current.offsetX = size.width / 2;
          // keep the vertical offset from the titlebar top so it feels natural
        } else {
          // Threshold not met yet — don't move the window
          return;
        }
      }

      const topbarHeight = 28;
      const newX = e.clientX - dragRef.current.offsetX;
      const newY = e.clientY - dragRef.current.offsetY;

      // Constrain so the title bar stays inside the viewport
      const clampedX = Math.max(-200, Math.min(window.innerWidth - 200, newX));
      const clampedY = Math.max(topbarHeight, Math.min(window.innerHeight - 40, newY));

      onPositionChange({ x: clampedX, y: clampedY });
    },
    [onPositionChange, onRestore, size.width]
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!dragRef.current) return;

      if (hasStartedDragging.current) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        const windowEl = e.currentTarget.closest('.window');
        if (windowEl) {
          windowEl.classList.remove('window--dragging');
          windowEl.classList.remove('window--unmaximizing');
        }
      }

      if (dragRef.current.isTearingOff && hasStartedDragging.current) {
        dragRef.current = null;
        maxDragStartY.current = null;
        dragStart.current = null;
        hasStartedDragging.current = false;
        return;
      }

      if (hasStartedDragging.current) {
        if (e.clientY <= 30 && onMaximize) {
          onMaximize();
        } else if (e.clientX <= 20 && onTile) {
          onTile('left');
        } else if (e.clientX >= window.innerWidth - 20 && onTile) {
          onTile('right');
        }
      }

      dragRef.current = null;
      maxDragStartY.current = null;
      dragStart.current = null;
      hasStartedDragging.current = false;
    },
    [onMaximize, onTile]
  );

  return {
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  };
}
