
import homeIcon from '../../assets/icons/home.svg';
import trashIcon from '../../assets/icons/trash.svg';
import folderIcon from '../../assets/icons/file-manager.svg';
import { useVFSStore } from '../../store';
import { HOME_ID, DESKTOP_ID, TRASH_ID } from '../../fs/seed';

interface SidebarProps {
  currentCwdId: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ currentCwdId, onNavigate }: SidebarProps) {
  const vfsStore = useVFSStore();

  const getDirId = (path: string) => {
    const node = vfsStore.resolvePath(path);
    return node ? node.id : null;
  };

  const docsId = getDirId('/home/user/Documents');
  const dlsId = getDirId('/home/user/Downloads');
  const picsId = getDirId('/home/user/Pictures');

  const favorites = [
    { id: HOME_ID, label: 'Home', icon: homeIcon },
    { id: DESKTOP_ID, label: 'Desktop', icon: folderIcon },
    ...(docsId ? [{ id: docsId, label: 'Documents', icon: folderIcon }] : []),
    ...(dlsId ? [{ id: dlsId, label: 'Downloads', icon: folderIcon }] : []),
    ...(picsId ? [{ id: picsId, label: 'Pictures', icon: folderIcon }] : []),
    { id: TRASH_ID, label: 'Trash', icon: trashIcon },
  ];

  return (
    <div className="fm-sidebar">
      <div className="fm-sidebar-group">
        <div className="fm-sidebar-label">Places</div>
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className={`fm-sidebar-item ${currentCwdId === fav.id ? 'active' : ''}`}
            onClick={() => {
              onNavigate(fav.id);
            }}
          >
            <img src={fav.icon} alt={fav.label} className="fm-sidebar-icon" />
            <span>{fav.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
