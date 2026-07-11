const defaultFileIcon = '/ubuntu/icons/text-x-generic.png';
const textIcon = '/ubuntu/icons/text-x-generic.png';
const folderIcon = '/ubuntu/icons/folder.png';
const homeIcon = '/ubuntu/icons/user-home.png';

export function getFolderIconUrl(): string {
  return folderIcon;
}

export function getSpecialFolderIconUrl(type: string): string {
  switch (type.toLowerCase()) {
    case 'home': return homeIcon;
    case 'desktop': return '/ubuntu/icons/user-desktop.png';
    case 'documents': return '/ubuntu/icons/folder-documents.png';
    case 'downloads': return '/ubuntu/icons/folder-download.png';
    case 'music': return '/ubuntu/icons/folder-music.png';
    case 'pictures': return '/ubuntu/icons/folder-pictures.png';
    case 'videos': return '/ubuntu/icons/folder-videos.png';
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
    // Images
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'svg': case 'webp': case 'ico':
      return '/ubuntu/icons/image-x-generic.png';
    
    // Videos
    case 'mp4': case 'webm': case 'mkv': case 'avi': case 'mov':
      return '/ubuntu/icons/video-x-generic.png';
      
    // Audio
    case 'mp3': case 'wav': case 'ogg': case 'flac':
      return '/ubuntu/icons/audio-x-generic.png';
      
    // Documents
    case 'doc': case 'docx': case 'rtf':
      return '/ubuntu/icons/x-office-document.png';
      
    // Spreadsheets
    case 'xls': case 'xlsx': case 'csv':
      return '/ubuntu/icons/x-office-spreadsheet.png';
      
    // Presentations
    case 'ppt': case 'pptx':
      return '/ubuntu/icons/x-office-presentation.png';
      
    // PDF
    case 'pdf':
      return '/ubuntu/icons/application-pdf.png';
      
    // eBooks
    case 'epub':
      return '/ubuntu/icons/application-epub+zip.png';
      
    // Archives
    case 'zip': case 'rar': case '7z': case 'tar':
      return '/ubuntu/icons/application-x-zip.png';
    case 'gz': case 'tgz':
      return '/ubuntu/icons/application-x-gzip.png';

    // Text & Code
    case 'txt': case 'log': case 'md': case 'js': case 'ts': case 'json': case 'css': case 'html':
      return textIcon;
      
    default:
      return defaultFileIcon;
  }
}
