import { createPortal } from 'react-dom';
import './ContextMenu.css';

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  separator?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

const LOCK_ICON = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ opacity: 0.5 }}>
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>
);

function renderIcon(icon: React.ReactNode) {
  if (icon === 'lock') return LOCK_ICON;
  return icon;
}

export function ContextMenu({ x, y, items }: ContextMenuProps) {
  return createPortal(
    <div className="context-menu" style={{ left: x, top: y }}>
      {items.map((item) =>
        item.separator ? (
          <div key={item.id} className="context-menu__separator" />
        ) : (
          <div
            key={item.id}
            className={`context-menu__item${item.disabled ? ' context-menu__item--disabled' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.onClick?.();
              }
            }}
          >
            {item.icon && <span className="context-menu__item-icon">{renderIcon(item.icon)}</span>}
            {item.label}
          </div>
        )
      )}
    </div>,
    document.body
  );
}
