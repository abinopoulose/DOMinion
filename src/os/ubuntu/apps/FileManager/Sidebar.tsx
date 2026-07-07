import { useVFSStore } from '../../store';
import { getHomeId, getTrashId } from '../../fs/seed';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';

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

  const docsId = getDirId(`/home/${username}/Documents`);
  const dlsId = getDirId(`/home/${username}/Downloads`);
  const picsId = getDirId(`/home/${username}/Pictures`);
  const vidsId = getDirId(`/home/${username}/Videos`);
  const musicId = getDirId(`/home/${username}/Music`);

  const getIcon = (type: string) => {
    const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, style: { opacity: 0.7 } };
    switch (type) {
      case 'recent': return <svg {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
      case 'starred': return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
      case 'home': return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
      case 'documents': return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
      case 'downloads': return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
      case 'music': return <svg {...props}><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
      case 'pictures': return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
      case 'videos': return <svg {...props}><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="7"></line></svg>;
      case 'trash': return <svg {...props}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
      case 'plus': return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
      default: return null;
    }
  };

  const topItems = [
    { id: 'recent', label: 'Recent', icon: getIcon('recent') },
    { id: 'starred', label: 'Starred', icon: getIcon('starred') },
    { id: HOME_ID, label: 'Home', icon: getIcon('home') },
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
              if (fav.id !== 'recent' && fav.id !== 'starred') onNavigate(fav.id);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
              {fav.icon}
            </div>
            <span>{fav.label}</span>
          </div>
        ))}
        <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 16px', opacity: 0.5 }}></div>
        <div className="fm-sidebar-item" onClick={() => {}}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
            {getIcon('plus')}
          </div>
          <span>Other Locations</span>
        </div>
      </div>
    </div>
  );
}
