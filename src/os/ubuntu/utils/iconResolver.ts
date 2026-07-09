const defaultFileIcon = '/ubuntu/icons/file.svg';
const textIcon = '/ubuntu/icons/text.svg';
const markdownIcon = '/ubuntu/icons/markdown.svg';

function adjustHex(hex: string, amount: number): string {
  let color = hex.replace('#', '');
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  const num = parseInt(color, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
}

const folderIconCache = new Map<string, string>();

export function getFolderIconUrl(accentColor: string): string {
  if (folderIconCache.has(accentColor)) {
    return folderIconCache.get(accentColor)!;
  }
  
  const base = accentColor || '#E95420';
  const dark = adjustHex(base, -30);
  const light1 = adjustHex(base, 40);
  const light2 = adjustHex(base, 60);
  const flap = adjustHex(base, 50);

  const svg = `<svg height="128px" viewBox="0 0 128 128" width="128px" xmlns="http://www.w3.org/2000/svg">
    <linearGradient id="a" gradientTransform="matrix(0.45451 0 0 0.455522 -1210.292114 616.172607)" gradientUnits="userSpaceOnUse" x1="2689.25" x2="2918.06" y1="-1106.8" y2="-1106.8">
        <stop offset="0" stop-color="${base}"/>
        <stop offset="0.057" stop-color="${light1}"/>
        <stop offset="0.122" stop-color="${base}"/>
        <stop offset="0.873" stop-color="${base}"/>
        <stop offset="0.955" stop-color="${light2}"/>
        <stop offset="1" stop-color="${base}"/>
    </linearGradient>
    <path d="m 21.976 12 c -5.527 0 -9.976 4.46 -9.976 10 v 86.03 c 0 5.54 4.449 10 9.976 10 h 84.043 c 5.531 0 9.98 -4.457 9.98 -10 v -72.086 c 0 -6.629 -5.359 -12 -11.973 -12 h -46.027 c -2.453 0 -4.695 -1.387 -5.797 -3.582 l -1.504 -2.992 c -1.656 -3.293 -5.019 -5.371 -8.699 -5.371 z" fill="${dark}"/>
    <path d="m 65.976 36 c -2.746 0 -5.226 1.101 -7.027 2.89 c -2.273 2.254 -5.383 5.11 -8.633 5.11 h -28.34 c -5.527 0 -9.976 4.461 -9.976 10 v 54.03 c 0 5.543 4.449 10 9.976 10 h 84.043 c 5.531 0 9.98 -4.457 9.98 -10 v -62.03 c 0 -5.54 -4.449 -10 -9.98 -10 z" fill="url(#a)"/>
    <path d="m 65.976 32 c -2.746 0 -5.226 1.101 -7.027 2.89 c -2.273 2.254 -5.383 5.11 -8.633 5.11 h -28.34 c -5.527 0 -9.976 4.461 -9.976 10 v 55.976 c 0 5.54 4.449 10 9.976 10 h 84.043 c 5.531 0 9.98 -4.46 9.98 -10 v -63.976 c 0 -5.54 -4.449 -10 -9.98 -10 z" fill="${flap}"/>
</svg>`;
  
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  folderIconCache.set(accentColor, url);
  return url;
}

const homeIconCache = new Map<string, string>();

export function getHomeIconUrl(accentColor: string): string {
  if (homeIconCache.has(accentColor)) {
    return homeIconCache.get(accentColor)!;
  }
  
  const base = accentColor || '#E95420';
  const dark = adjustHex(base, -30);
  const light1 = adjustHex(base, 40);
  const light2 = adjustHex(base, 60);
  const flap = adjustHex(base, 50);

  const svg = `<svg height="128px" viewBox="0 0 128 128" width="128px" xmlns="http://www.w3.org/2000/svg">
    <linearGradient id="a" gradientTransform="matrix(0.45451 0 0 0.455522 -1210.292114 616.172607)" gradientUnits="userSpaceOnUse" x1="2689.25" x2="2918.06" y1="-1106.8" y2="-1106.8">
        <stop offset="0" stop-color="${base}"/>
        <stop offset="0.057" stop-color="${light1}"/>
        <stop offset="0.122" stop-color="${base}"/>
        <stop offset="0.873" stop-color="${base}"/>
        <stop offset="0.955" stop-color="${light2}"/>
        <stop offset="1" stop-color="${base}"/>
    </linearGradient>
    <path d="m 21.976 12 c -5.527 0 -9.976 4.46 -9.976 10 v 86.03 c 0 5.54 4.449 10 9.976 10 h 84.043 c 5.531 0 9.98 -4.457 9.98 -10 v -72.086 c 0 -6.629 -5.359 -12 -11.973 -12 h -46.027 c -2.453 0 -4.695 -1.387 -5.797 -3.582 l -1.504 -2.992 c -1.656 -3.293 -5.019 -5.371 -8.699 -5.371 z" fill="${dark}"/>
    <path d="m 65.976 36 c -2.746 0 -5.226 1.101 -7.027 2.89 c -2.273 2.254 -5.383 5.11 -8.633 5.11 h -28.34 c -5.527 0 -9.976 4.461 -9.976 10 v 54.03 c 0 5.543 4.449 10 9.976 10 h 84.043 c 5.531 0 9.98 -4.457 9.98 -10 v -62.03 c 0 -5.54 -4.449 -10 -9.98 -10 z" fill="url(#a)"/>
    <path d="m 65.976 32 c -2.746 0 -5.226 1.101 -7.027 2.89 c -2.273 2.254 -5.383 5.11 -8.633 5.11 h -28.34 c -5.527 0 -9.976 4.461 -9.976 10 v 55.976 c 0 5.54 4.449 10 9.976 10 h 84.043 c 5.531 0 9.98 -4.46 9.98 -10 v -63.976 c 0 -5.54 -4.449 -10 -9.98 -10 z" fill="${flap}"/>
    <path d="m 64.875 64 c -0.414 0 -0.82 0.133 -1.164 0.367 l -14.879 10 c -0.898 0.648 -1.109 1.89 -0.469 2.789 c 0.383 0.531 0.984 0.844 1.633 0.836 v 8.008 c 0 3.289 2.711 6 6 6 h 18.004 c 3.289 0 6 -2.641 6 -6 v -8.008 c 0.648 0.008 1.25 -0.305 1.633 -0.836 c 0.64 -0.898 0.43 -2.14 -0.469 -2.789 l -15.125 -10 c -0.344 -0.234 -0.75 -0.367 -1.164 -0.367 z m 0 4.453 l 11.125 7.141 v 10.406 c 0 1.125 -0.875 2 -2 2 h -8.004 v -8 c 0 -1.109 -0.891 -2 -2 -2 h -2 c -1.109 0 -2 0.891 -2 2 v 8 h -4 c -1.125 0 -2 -0.875 -2 -2 v -10.406 z m 0 0" fill="${dark}"/>
</svg>`;
  
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  homeIconCache.set(accentColor, url);
  return url;
}

export function getIconForFile(filename: string, isDirectory: boolean, accentColor: string = '#E95420'): string {
  if (isDirectory) return getFolderIconUrl(accentColor);
  
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
