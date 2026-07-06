import { useState, useCallback, useRef, useLayoutEffect, type ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { useWindowDrag } from '../../hooks/useWindowDrag';
import { useWindowResize } from '../../hooks/useWindowResize';
import { useWindowStore } from '../../store';
import { useSettingsStore } from '../../apps/Settings/store/useSettingsStore';
import './Window.css';

export interface WindowProps {
  id: string;
  icon?: ReactNode;
  headerControls?: ReactNode;
  fullHeaderControls?: boolean;
  children: ReactNode;
}

export function Window({
  id,
  icon,
  headerControls,
  fullHeaderControls,
  children,
}: WindowProps) {
  const win = useWindowStore(useCallback((state) => state.windows.find((w) => w.id === id), [id]));
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const tileWindow = useWindowStore((s) => s.tileWindow);
  const updatePosition = useWindowStore((s) => s.updatePosition);
  const updateSize = useWindowStore((s) => s.updateSize);
  const previewFocusWindowId = useWindowStore((s) => s.previewFocusWindowId);

  const windowRef = useRef<HTMLDivElement>(null);
  const [animState, setAnimState] = useState<'normal' | 'minimizing' | 'restoring' | 'opening'>('opening');
  const [dockTransform, setDockTransform] = useState('');

  const calculateDockTransform = useCallback(() => {
    if (!win) return 'scale(0.15)';
    const el = document.getElementById(`dock-icon-wrapper-${win.appId}`);
    if (!el || !windowRef.current) return 'scale(0.15)';
    
    const rect = el.getBoundingClientRect();
    const winRect = windowRef.current.getBoundingClientRect();
    
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const winCx = winRect.left + winRect.width / 2;
    const winCy = winRect.top + winRect.height / 2;
    
    const tx = cx - winCx;
    const ty = cy - winCy;
    
    return `translate(${tx}px, ${ty}px) scale(0.15)`;
  }, [win]);

  const handleMinimize = useCallback(() => {
    setDockTransform(calculateDockTransform());
    setAnimState('minimizing');
    setTimeout(() => {
      minimizeWindow(id);
      setAnimState('normal');
    }, 350);
  }, [id, minimizeWindow, calculateDockTransform]);

  const prevMinimized = useRef(win?.isMinimized);
  useLayoutEffect(() => {
    if (prevMinimized.current && !win?.isMinimized && windowRef.current) {
      setDockTransform(calculateDockTransform());
      setAnimState('restoring');
      
      // Force layout recalculation to snap to the dock instantly
      windowRef.current.getBoundingClientRect();
      
      requestAnimationFrame(() => {
        setAnimState('normal');
      });
    }
    prevMinimized.current = win?.isMinimized;
  }, [win?.isMinimized, calculateDockTransform]);

  useLayoutEffect(() => {
    if (animState === 'opening') {
      requestAnimationFrame(() => {
        setAnimState('normal');
      });
    }
  }, [animState]);

  const handleMaximize = useCallback(() => {
    toggleMaximize(id);
  }, [id, toggleMaximize]);

  const handleUntile = useCallback(() => {
    tileWindow(id, null);
  }, [id, tileWindow]);

  const handleTile = useCallback((side: 'left' | 'right') => {
    tileWindow(id, side);
  }, [id, tileWindow]);

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

  const fallbackPosition = { x: 0, y: 0 };
  const fallbackSize = { width: 0, height: 0 };
  const position = win?.position || fallbackPosition;
  const size = win?.size || fallbackSize;
  const isMaximized = win?.isMaximized || false;
  const tileState = win?.tileState || null;
  
  const isEffectivelyMaximized = isMaximized || !!tileState;

  const { dragHandlers } = useWindowDrag({
    position,
    size,
    isMaximized: isEffectivelyMaximized,
    onPositionChange,
    onFocus: handleFocus,
    onMaximize: handleMaximize,
    onRestore: tileState ? handleUntile : handleMaximize,
    onTile: handleTile,
  });

  const { resizeHandles } = useWindowResize({
    position,
    size,
    isMaximized,
    onSizeChange,
    onPositionChange,
  });

  const { dockPosition, dockIconSize, dockAutoHide } = useSettingsStore();

  if (!win) return null;

  let { title, zIndex, isMinimized, isFocused } = win;

  const isPreviewed = previewFocusWindowId === id;
  if (isPreviewed) {
    zIndex = 99999;
    isMinimized = false;
  }

  // Don't render if minimized (and not animating out)
  if (isMinimized && animState !== 'minimizing') return null;
  
  // Calculate workspace boundaries dynamically
  const dockSize = dockAutoHide ? 0 : dockIconSize + 12;
  const topbarHeight = 28;

  let maxTop = topbarHeight;
  let maxBottom = 0;
  let maxLeft = 0;
  let maxRight = 0;

  if (dockPosition === 'left') maxLeft = dockSize;
  if (dockPosition === 'right') maxRight = dockSize;
  if (dockPosition === 'bottom') maxBottom = dockSize;

  let tileStyle: React.CSSProperties | null = null;
  if (tileState) {
    const halfWidth = `calc(50vw - ${(maxLeft + maxRight) / 2}px)`;
    tileStyle = {
      top: maxTop,
      bottom: maxBottom,
      width: halfWidth,
      height: 'auto',
      zIndex,
      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    };
    if (tileState === 'left') {
      tileStyle.left = maxLeft;
      tileStyle.right = 'auto';
    } else {
      tileStyle.right = maxRight;
      tileStyle.left = 'auto';
    }
  }

  const classNames = [
    'window',
    isEffectivelyMaximized && 'window--maximized',
    !isFocused && 'window--unfocused',
    animState === 'minimizing' && 'window--minimizing',
    animState === 'restoring' && 'window--restoring',
    animState === 'opening' && 'window--opening',
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = isMaximized
    ? {
        top: maxTop,
        bottom: maxBottom,
        left: maxLeft,
        right: maxRight,
        width: 'auto',
        height: 'auto',
        zIndex,
      }
    : tileState && tileStyle
      ? tileStyle
      : {
          top: position.y,
          left: position.x,
          width: size.width,
          height: size.height,
          zIndex,
        };

  if (animState === 'minimizing' || animState === 'restoring') {
    style.transform = dockTransform;
    style.opacity = 0;
  }

  return (
    <div
      ref={windowRef}
      className={classNames}
      style={style}
      data-window-id={id}
      data-app-id={win.appId}
      onMouseDown={handleFocus}
    >
      <TitleBar
        title={title}
        icon={icon}
        isFocused={isFocused}
        isMaximized={isEffectivelyMaximized}
        onMinimize={handleMinimize}
        onMaximize={tileState ? handleUntile : handleMaximize}
        onClose={handleClose}
        onDoubleClick={tileState ? handleUntile : handleMaximize}
        dragHandlers={dragHandlers}
        headerControls={headerControls}
        fullHeaderControls={fullHeaderControls}
      />
      <div className="window__content">
        {children}
      </div>
      {resizeHandles}
    </div>
  );
}
