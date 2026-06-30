import defaultFileIcon from '../assets/icons/file.svg';
import textIcon from '../assets/icons/text.svg';
import markdownIcon from '../assets/icons/markdown.svg';
import folderIcon from '../assets/icons/file-manager.svg'; // Or another folder icon

export function getIconForFile(filename: string, isDirectory: boolean): string {
  if (isDirectory) return folderIcon;
  
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
