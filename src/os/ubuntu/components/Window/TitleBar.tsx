import type { ReactNode } from 'react';

interface TitleBarProps {
  title: string;
  icon?: ReactNode;
  isFocused: boolean;
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onDoubleClick: () => void;
  dragHandlers: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  };
  headerControls?: ReactNode;
}

export function TitleBar({
  title,
  icon,
  onMinimize,
  onMaximize,
  onClose,
  onDoubleClick,
  dragHandlers,
  headerControls,
}: TitleBarProps) {
  return (
    <div
      className="titlebar"
      onDoubleClick={onDoubleClick}
      onPointerDown={dragHandlers.onPointerDown}
      onPointerMove={dragHandlers.onPointerMove}
      onPointerUp={dragHandlers.onPointerUp}
    >
      <div className="titlebar__left" style={{ zIndex: 2 }}>
        {icon && <span className="titlebar__icon">{icon}</span>}
      </div>

      <span className="titlebar__title">{title}</span>

      <div className="titlebar__controls">
        {headerControls && (
          <div className="titlebar__custom-controls" style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
            {headerControls}
          </div>
        )}
        {/* Minimize */}
        <button
          className="titlebar__btn titlebar__btn--minimize"
          onClick={(e) => { e.stopPropagation(); onMinimize(); }}
          aria-label="Minimize"
        >
          <svg className="titlebar__btn-icon" viewBox="0 0 10 10">
            <line x1="2" y1="5" x2="8" y2="5" />
          </svg>
        </button>

        {/* Maximize */}
        <button
          className="titlebar__btn titlebar__btn--maximize"
          onClick={(e) => { e.stopPropagation(); onMaximize(); }}
          aria-label="Maximize"
        >
          <svg className="titlebar__btn-icon" viewBox="0 0 10 10">
            <rect x="2" y="2" width="6" height="6" rx="1" />
          </svg>
        </button>

        {/* Close */}
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Close"
        >
          <svg className="titlebar__btn-icon" viewBox="0 0 10 10">
            <line x1="2" y1="2" x2="8" y2="8" />
            <line x1="8" y1="2" x2="2" y2="8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
