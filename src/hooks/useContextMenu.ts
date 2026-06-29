import { useState, useEffect, useCallback } from 'react';

interface ContextMenuState {
  isVisible: boolean;
  x: number;
  y: number;
}

/**
 * Custom hook for managing a right-click context menu.
 * Returns position, visibility, and handlers.
 */
export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    isVisible: false,
    x: 0,
    y: 0,
  });

  const show = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clamp position so menu doesn't overflow viewport
    const menuWidth = 220;
    const menuHeight = 180;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight);

    setMenu({ isVisible: true, x, y });
  }, []);

  const hide = useCallback(() => {
    setMenu((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // Close on Escape or any click
  useEffect(() => {
    if (!menu.isVisible) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    const handleClick = () => hide();

    document.addEventListener('keydown', handleKey);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('click', handleClick, true);
    };
  }, [menu.isVisible, hide]);

  return { menu, show, hide };
}
