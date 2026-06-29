import { useState, useCallback, type ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { useWindowDrag } from '../../hooks/useWindowDrag';
import { useWindowResize } from '../../hooks/useWindowResize';
import { useWindowStore } from '../../store';
import './Window.css';

export interface WindowProps {
  id: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function Window({
  id,
  icon,
  children,
}: WindowProps) {
  const win = useWindowStore(useCallback((state) => state.windows.find((w) => w.id === id), [id]));
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const updatePosition = useWindowStore((s) => s.updatePosition);
  const updateSize = useWindowStore((s) => s.updateSize);

  const [isMinimizing, setIsMinimizing] = useState(false);
  const [isOpening, setIsOpening] = useState(true);

  // Remove opening animation after it plays
  const handleAnimationEnd = useCallback(() => {
    if (isOpening) setIsOpening(false);
    if (isMinimizing) {
      // Animation finished, now actually minimize
      setIsMinimizing(false);
    }
  }, [isOpening, isMinimizing]);

  const handleMinimize = useCallback(() => {
    setIsMinimizing(true);
    // After animation, call the actual minimize handler
    setTimeout(() => {
      minimizeWindow(id);
      setIsMinimizing(false);
    }, 200);
  }, [id, minimizeWindow]);

  const handleMaximize = useCallback(() => {
    toggleMaximize(id);
  }, [id, toggleMaximize]);

  const handleFocus = useCallback(() => {
    focusWindow(id);
  }, [id, focusWindow]);

  const handleClose = useCallback(() => {
    closeWindow(id);
  }, [id, closeWindow]);

  const onPositionChange = useCallback((pos: { x: number; y: number }) => {
    updatePosition(id, pos);
  }, [id, updatePosition]);

  const onSizeChange = useCallback((size: { width: number; height: number }) => {
    updateSize(id, size);
  }, [id, updateSize]);

  if (!win) return null;

  const { title, position, size, zIndex, isMinimized, isMaximized, isFocused } = win;

  const { dragHandlers } = useWindowDrag({
    position,
    isMaximized,
    onPositionChange,
    onFocus: handleFocus,
  });

  const { resizeHandles } = useWindowResize({
    position,
    size,
    isMaximized,
    onSizeChange,
    onPositionChange,
  });

  // Don't render if minimized (and not animating)
  if (isMinimized && !isMinimizing) return null;

  const classNames = [
    'window',
    isMaximized && 'window--maximized',
    !isFocused && 'window--unfocused',
    isMinimizing && 'window--minimizing',
    isOpening && 'window--opening',
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = isMaximized
    ? {
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex,
        transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    : {
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex,
      };

  return (
    <div
      className={classNames}
      style={style}
      onMouseDown={handleFocus}
      onAnimationEnd={handleAnimationEnd}
    >
      <TitleBar
        title={title}
        icon={icon}
        isFocused={isFocused}
        isMaximized={isMaximized}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
        onDoubleClick={handleMaximize}
        dragHandlers={dragHandlers}
      />
      <div className="window__content">
        {children}
      </div>
      {resizeHandles}
    </div>
  );
}
