import { useState, useRef, useEffect, useCallback } from 'react';

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Options {
  /** The container element that holds the selectable items. */
  containerRef: React.RefObject<HTMLElement>;
  /** CSS selector used to find selectable item elements, e.g. '[data-sel-id]' */
  itemSelector: string;
  /** Called with the list of selected IDs on every pointer-move update. */
  onSelect: (ids: string[]) => void;
  /** Return true if a pointerdown on the given target should NOT start selection. */
  shouldSkip?: (target: HTMLElement) => boolean;
  /** If true, clicking on items still starts the lasso. Default true. */
  allowStartOnItems?: boolean;
}

const DEAD_ZONE = 5;

/**
 * Rubber-band drag-to-select hook — rewritten from scratch.
 *
 * Uses pointer events on `window` so the drag is reliably tracked even if the
 * pointer leaves the container. AABB intersection means even a partial
 * overlap with any item selects it.
 *
 * Returns:
 *  - `selectionRect` – lasso rect in container-local coords (null when idle)
 *  - `handlePointerDown` – attach to the container's onPointerDown prop
 */
export function useSelectionBox({
  containerRef,
  itemSelector,
  onSelect,
  shouldSkip,
  allowStartOnItems = true,
}: Options) {
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  // Mutable ref so move/up closures always see latest drag state
  const dragRef = useRef<{
    originX: number;   // container-local start X
    originY: number;   // container-local start Y
    active: boolean;   // has the dead-zone been crossed?
    startedOnItem: boolean; // was the origin on a selectable item?
  } | null>(null);

  // Keep latest callbacks in a ref to avoid re-registering listeners
  const cbRef = useRef({ onSelect, shouldSkip });
  cbRef.current = { onSelect, shouldSkip };

  /** Convert a client-space point to container-local coords (scroll-aware) */
  const toLocal = useCallback(
    (clientX: number, clientY: number): { lx: number; ly: number } | null => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        lx: clientX - rect.left + el.scrollLeft,
        ly: clientY - rect.top + el.scrollTop,
      };
    },
    [containerRef],
  );

  /** Compute which items intersect with the given lasso rect */
  const hitTest = useCallback(
    (lasso: SelectionRect): string[] => {
      const container = containerRef.current;
      if (!container) return [];

      const cr = container.getBoundingClientRect();
      const items = container.querySelectorAll<HTMLElement>(itemSelector);
      const hits: string[] = [];

      const lx1 = lasso.x;
      const ly1 = lasso.y;
      const lx2 = lasso.x + lasso.width;
      const ly2 = lasso.y + lasso.height;

      items.forEach((el) => {
        const id = el.dataset.selId;
        if (!id) return;

        const er = el.getBoundingClientRect();

        // Convert item rect to container-local coords
        const ix1 = er.left - cr.left + container.scrollLeft;
        const iy1 = er.top - cr.top + container.scrollTop;
        const ix2 = ix1 + er.width;
        const iy2 = iy1 + er.height;

        // Standard AABB overlap: any fraction of overlap counts
        if (lx1 < ix2 && lx2 > ix1 && ly1 < iy2 && ly2 > iy1) {
          hits.push(id);
        }
      });

      return hits;
    },
    [containerRef, itemSelector],
  );

  // Track whether a lasso was actively drawn so we can suppress clicks after
  const suppressClickRef = useRef(false);

  // --- Pointer move & up are registered on `window` so we never miss events ---
  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;

      const local = toLocal(e.clientX, e.clientY);
      if (!local) return;

      const dx = local.lx - drag.originX;
      const dy = local.ly - drag.originY;

      // Dead-zone: don't start drawing until the pointer has moved enough
      if (!drag.active && Math.hypot(dx, dy) < DEAD_ZONE) return;
      drag.active = true;

      const rect: SelectionRect = {
        x: Math.min(drag.originX, local.lx),
        y: Math.min(drag.originY, local.ly),
        width: Math.abs(dx),
        height: Math.abs(dy),
      };

      setSelectionRect(rect);
      cbRef.current.onSelect(hitTest(rect));
    }

    function onPointerUp() {
      if (!dragRef.current) return;
      // If we had an active lasso, suppress the next click so it doesn't
      // override the lasso selection (browser fires synthetic click after pointerup).
      if (dragRef.current.active) {
        suppressClickRef.current = true;
      }
      dragRef.current = null;
      setSelectionRect(null);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [toLocal, hitTest]);

  // Suppress the click that follows an active lasso drag (capture phase).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (suppressClickRef.current) {
        e.stopPropagation();
        e.preventDefault();
        suppressClickRef.current = false;
      }
    }
    window.addEventListener('click', onClick, { capture: true });
    return () => window.removeEventListener('click', onClick, { capture: true });
  }, []);

  // Block native drag once a lasso is active so the rubber-band doesn't
  // fight with HTML5 draggable icons/items.
  useEffect(() => {
    function onDragStart(e: DragEvent) {
      if (dragRef.current?.active) {
        e.preventDefault();
      }
    }
    window.addEventListener('dragstart', onDragStart, { capture: true });
    return () => window.removeEventListener('dragstart', onDragStart, { capture: true });
  }, []);

  /** Attach this to the container's onPointerDown */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only primary button
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;

      // Skip if caller says so (e.g. context menu, input fields)
      if (cbRef.current.shouldSkip?.(target)) return;

      // Skip interactive elements
      if (target.closest('input, textarea, button, [contenteditable]')) return;

      const onItem = !!target.closest(itemSelector);

      // If not allowStartOnItems, skip when pointer is on a selectable item
      if (!allowStartOnItems && onItem) return;

      const local = toLocal(e.clientX, e.clientY);
      if (!local) return;

      dragRef.current = {
        originX: local.lx,
        originY: local.ly,
        active: false,
        startedOnItem: onItem,
      };

      // NOTE: We intentionally do NOT call e.preventDefault() here.
      // That would kill click events and native drag on desktop icons.
      // Text selection is prevented via CSS user-select: none on the container.
    },
    [toLocal, itemSelector, allowStartOnItems],
  );

  return { selectionRect, handlePointerDown };
}
