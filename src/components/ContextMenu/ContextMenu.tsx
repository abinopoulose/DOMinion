import './ContextMenu.css';

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  separator?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function ContextMenu({ x, y, items }: ContextMenuProps) {
  return (
    <div className="context-menu" style={{ left: x, top: y }}>
      {items.map((item) =>
        item.separator ? (
          <div key={item.id} className="context-menu__separator" />
        ) : (
          <div
            key={item.id}
            className="context-menu__item"
            onClick={(e) => {
              e.stopPropagation();
              item.onClick?.();
            }}
          >
            {item.icon && <span className="context-menu__item-icon">{item.icon}</span>}
            {item.label}
          </div>
        )
      )}
    </div>
  );
}
