import './Dock.css';

interface DockIconProps {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
  isFocused?: boolean;
  size?: number;
  onClick?: () => void;
  onAuxClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function DockIcon({ 
  label, icon, isActive = false, isFocused = false, size = 48, 
  onClick, onAuxClick, onContextMenu, draggable, onDragStart, onDragOver, onDrop 
}: DockIconProps) {
  return (
    <div 
      className={`dock-icon ${isFocused ? 'dock-icon--focused' : ''}`} 
      style={{ width: size, height: size }} 
      onClick={onClick}
      onAuxClick={onAuxClick}
      onContextMenu={onContextMenu}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span className="dock-icon__tooltip">{label}</span>
      <img className="dock-icon__img" src={icon} alt={label} draggable={false} style={{ width: size - 12, height: size - 12 }} />
      <div className={`dock-icon__indicator${isActive ? ' dock-icon__indicator--active' : ''}`} />
    </div>
  );
}
