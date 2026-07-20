import { useState, useEffect } from 'react';
import { getHomeId, getTrashId } from '../../../fs/seed';
import { useUbuntuAuthStore } from '../../../store/useUbuntuAuthStore';
import { getSpecialFolderIconUrl } from '../../../utils/iconResolver';
import { useFileSystem } from '../../../hooks/useFileSystem';

interface SidebarProps {
  currentCwdId: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ currentCwdId, onNavigate }: SidebarProps) {
  const username = useUbuntuAuthStore((s) => s.currentUser) || 'user';
  const HOME_ID = getHomeId(username);
  const TRASH_ID = getTrashId(username);

  const [folderIds, setFolderIds] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const { resolvePathAsync } = await import('../../../fs/pathResolver');
      const folders = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Videos', 'Music'];
      const newIds: Record<string, string> = {};
      
      for (const folder of folders) {
        try {
          const node = await resolvePathAsync(`/home/${username}/${folder}`);
          if (node) newIds[folder] = node.id;
        } catch (e) {
          // ignore
        }
      }
      
      if (active) setFolderIds(newIds);
    })();
    return () => { active = false; };
  }, [username]);

  const desktopId = folderIds['Desktop'];
  const docsId = folderIds['Documents'];
  const dlsId = folderIds['Downloads'];
  const picsId = folderIds['Pictures'];
  const vidsId = folderIds['Videos'];
  const musicId = folderIds['Music'];

  const trashPath = `/home/${username}/.Trash`;
  const { nodes: trashNodes } = useFileSystem(trashPath);
  const isTrashFull = trashNodes.length > 0;
  const currentTrashIcon = isTrashFull ? '/ubuntu/icons/user-trash-full.png' : '/ubuntu/icons/user-trash.png';

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

  const section1 = [
    { id: 'starred', label: 'Starred', icon: getIcon('starred') },
    { id: HOME_ID, label: 'Home', icon: getIcon('home') },
    { id: TRASH_ID, label: 'Trash', icon: getIcon('trash') },
  ];

  const section2 = [
    ...(desktopId ? [{ id: desktopId, label: 'Desktop', icon: getIcon('desktop') }] : []),
    ...(docsId ? [{ id: docsId, label: 'Documents', icon: getIcon('documents') }] : []),
    ...(dlsId ? [{ id: dlsId, label: 'Downloads', icon: getIcon('downloads') }] : []),
    ...(musicId ? [{ id: musicId, label: 'Music', icon: getIcon('music') }] : []),
    ...(picsId ? [{ id: picsId, label: 'Pictures', icon: getIcon('pictures') }] : []),
    ...(vidsId ? [{ id: vidsId, label: 'Videos', icon: getIcon('videos') }] : []),
  ];
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (id !== 'starred' && id !== 'other-locations') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    if (targetId === 'starred' || targetId === 'other-locations') return;
    e.preventDefault();
    e.stopPropagation();
    
    const multi = e.dataTransfer.getData('application/x-vfs-nodes');
    const single = e.dataTransfer.getData('application/x-vfs-node');
    
    const handleDropMove = async (ids: string[]) => {
      const { rename } = await import('../../../fs/operations');
      const { getAbsolutePathAsync } = await import('../../../fs/pathResolver');
      const targetPath = await getAbsolutePathAsync(targetId);
      for (const id of ids) {
        if (id === targetId) continue;
        try {
          const oldPath = await getAbsolutePathAsync(id);
          const name = oldPath.split('/').pop();
          if (name) await rename(oldPath, `${targetPath}/${name}`);
        } catch (err) {
          console.error(err);
        }
      }
    };

    if (multi) handleDropMove(JSON.parse(multi));
    else if (single && single !== targetId) handleDropMove([single]);
  };

  return (
    <div className="fm-sidebar">
      <div className="fm-sidebar-group" style={{ flex: 1, overflowY: 'auto' }}>
        {section1.map((fav) => (
          <div
            key={fav.id}
            className={`fm-sidebar-item ${currentCwdId === fav.id ? 'active' : ''}`}
            onClick={() => {
              onNavigate(fav.id);
            }}
            onDragOver={(e) => handleDragOver(e, fav.id)}
            onDrop={(e) => handleDrop(e, fav.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
              {fav.icon}
            </div>
            <span>{fav.label}</span>
          </div>
        ))}
        {section2.length > 0 && <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 16px', opacity: 0.5 }}></div>}
        {section2.map((fav) => (
          <div
            key={fav.id}
            className={`fm-sidebar-item ${currentCwdId === fav.id ? 'active' : ''}`}
            onClick={() => {
              onNavigate(fav.id);
            }}
            onDragOver={(e) => handleDragOver(e, fav.id)}
            onDrop={(e) => handleDrop(e, fav.id)}
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
