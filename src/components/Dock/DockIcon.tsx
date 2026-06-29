import './Dock.css';

interface DockIconProps {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function DockIcon({ label, icon, isActive = false, onClick }: DockIconProps) {
  return (
    <div className="dock-icon" onClick={onClick}>
      <span className="dock-icon__tooltip">{label}</span>
      <img className="dock-icon__img" src={icon} alt={label} draggable={false} />
      <div className={`dock-icon__indicator${isActive ? ' dock-icon__indicator--active' : ''}`} />
    </div>
  );
}
