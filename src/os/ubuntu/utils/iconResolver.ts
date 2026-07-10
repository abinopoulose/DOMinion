const defaultFileIcon = '/ubuntu_icons/text-x-generic.png';
const textIcon = '/ubuntu_icons/text-x-generic.png';
const markdownIcon = '/ubuntu_icons/text-x-generic.png';
const folderIcon = '/ubuntu_icons/folder.png';
const homeIcon = '/ubuntu_icons/user-home.png';

export function getFolderIconUrl(): string {
  return folderIcon;
}

export function getSpecialFolderIconUrl(type: string): string {
  switch (type.toLowerCase()) {
    case 'home': return homeIcon;
    case 'desktop': return '/ubuntu_icons/user-desktop.png';
    case 'documents': return '/ubuntu_icons/folder-documents.png';
    case 'downloads': return '/ubuntu_icons/folder-download.png';
    case 'music': return '/ubuntu_icons/folder-music.png';
    case 'pictures': return '/ubuntu_icons/folder-pictures.png';
    case 'videos': return '/ubuntu_icons/folder-videos.png';
    default: return folderIcon;
  }
}

export function getIconForFile(filename: string, isDirectory: boolean): string {
  if (isDirectory) {
    const lName = filename.toLowerCase();
    if (['home', 'desktop', 'documents', 'downloads', 'music', 'pictures', 'videos'].includes(lName)) {
      return getSpecialFolderIconUrl(lName);
    }
    return getFolderIconUrl();
  }
  
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'txt':
    case 'log':
      return textIcon;
    case 'md':
      return markdownIcon;
    case 'js':
    case 'ts':
    case 'json':
    case 'css':
    case 'html':
      return textIcon; // Can map to code.svg if created
    default:
      return defaultFileIcon;
  }
}
