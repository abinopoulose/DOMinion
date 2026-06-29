import { useState, useCallback, type ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { useWindowDrag } from '../../hooks/useWindowDrag';
import { useWindowResize } from '../../hooks/useWindowResize';
import './Window.css';

export interface WindowProps {
  id: string;
  title: string;
  icon?: ReactNode;
  initialPosition: { x: number; y: number };
  initialSize: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isFocused: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  children: ReactNode;
}

export function Window({
  title,
  icon,
  initialPosition,
  initialSize,
  zIndex,
  isMinimized,
  isFocused,
  onFocus,
  onClose,
  onMinimize,
  children,
}: WindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaxRect, setPreMaxRect] = useState<{
    pos: { x: number; y: number };
    size: { width: number; height: number };
  } | null>(null);
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

  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      // Restore
      if (preMaxRect) {
        setPosition(preMaxRect.pos);
        setSize(preMaxRect.size);
      }
      setIsMaximized(false);
    } else {
      // Store current rect then maximize
      setPreMaxRect({ pos: position, size });
      const topbarHeight = 28;
      const dockSpace = 90; // dock height + margin
      setPosition({ x: 0, y: topbarHeight });
      setSize({
        width: window.innerWidth,
        height: window.innerHeight - topbarHeight - dockSpace,
      });
      setIsMaximized(true);
    }
  }, [isMaximized, position, size, preMaxRect]);

  const handleMinimize = useCallback(() => {
    setIsMinimizing(true);
    // After animation, call the actual minimize handler
    setTimeout(() => {
      onMinimize();
      setIsMinimizing(false);
    }, 200);
  }, [onMinimize]);

  const { dragHandlers } = useWindowDrag({
    position,
    isMaximized,
    onPositionChange: setPosition,
    onFocus,
  });

  const { resizeHandles } = useWindowResize({
    position,
    size,
    isMaximized,
    onSizeChange: setSize,
    onPositionChange: setPosition,
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
      onMouseDown={onFocus}
      onAnimationEnd={handleAnimationEnd}
    >
      <TitleBar
        title={title}
        icon={icon}
        isFocused={isFocused}
        isMaximized={isMaximized}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={onClose}
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
