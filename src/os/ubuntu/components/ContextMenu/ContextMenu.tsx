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
            {item.icon && <span className="context-menu__item-icon">{item.icon}</span>}
            {item.label}
          </div>
        )
      )}
    </div>,
    document.body
  );
}
