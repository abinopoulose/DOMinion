import { useVFSStore } from '../../store';
import { getHomeId, getTrashId } from '../../fs/seed';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { getSpecialFolderIconUrl } from '../../utils/iconResolver';

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

  const username = useUbuntuAuthStore((s) => s.currentUser) || 'user';
  const HOME_ID = getHomeId(username);
  const TRASH_ID = getTrashId(username);

  const desktopId = getDirId(`/home/${username}/Desktop`);
  const docsId = getDirId(`/home/${username}/Documents`);
  const dlsId = getDirId(`/home/${username}/Downloads`);
  const picsId = getDirId(`/home/${username}/Pictures`);
  const vidsId = getDirId(`/home/${username}/Videos`);
  const musicId = getDirId(`/home/${username}/Music`);

  const isTrashFull = vfsStore.getChildren(TRASH_ID).length > 0;
  const currentTrashIcon = isTrashFull ? '/ubuntu_icons/user-trash-full.png' : '/ubuntu_icons/user-trash.png';

  const getIcon = (type: string) => {
    if (['home', 'desktop', 'documents', 'downloads', 'music', 'pictures', 'videos'].includes(type)) {
      return <img src={getSpecialFolderIconUrl(type)} style={{ width: 16, height: 16 }} alt={type} />;
    }
    
    if (type === 'trash') {
      return <img src={currentTrashIcon} style={{ width: 16, height: 16 }} alt="Trash" />;
    }
    
    const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, style: { opacity: 0.7 } };
    switch (type) {
      case 'recent': return <svg {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
      case 'starred': return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
      case 'plus': return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
      default: return null;
    }
  };

  const topItems = [
    { id: 'starred', label: 'Starred', icon: getIcon('starred') },
    { id: HOME_ID, label: 'Home', icon: getIcon('home') },
    ...(desktopId ? [{ id: desktopId, label: 'Desktop', icon: getIcon('desktop') }] : []),
    ...(docsId ? [{ id: docsId, label: 'Documents', icon: getIcon('documents') }] : []),
    ...(dlsId ? [{ id: dlsId, label: 'Downloads', icon: getIcon('downloads') }] : []),
    ...(musicId ? [{ id: musicId, label: 'Music', icon: getIcon('music') }] : []),
    ...(picsId ? [{ id: picsId, label: 'Pictures', icon: getIcon('pictures') }] : []),
    ...(vidsId ? [{ id: vidsId, label: 'Videos', icon: getIcon('videos') }] : []),
    { id: TRASH_ID, label: 'Trash', icon: getIcon('trash') },
  ];

  return (
    <div className="fm-sidebar">
      <div className="fm-sidebar-group" style={{ flex: 1, overflowY: 'auto' }}>
        {topItems.map((fav) => (
          <div
            key={fav.id}
            className={`fm-sidebar-item ${currentCwdId === fav.id ? 'active' : ''}`}
            onClick={() => {
              onNavigate(fav.id);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
              {fav.icon}
            </div>
            <span>{fav.label}</span>
          </div>
        ))}
        <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 16px', opacity: 0.5 }}></div>
        <div 
          className={`fm-sidebar-item ${currentCwdId === 'other-locations' ? 'active' : ''}`} 
          onClick={() => onNavigate('other-locations')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
            {getIcon('plus')}
          </div>
          <span>Other Locations</span>
        </div>
      </div>
    </div>
  );
}
