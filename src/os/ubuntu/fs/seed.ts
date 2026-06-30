import { v4 as uuidv4 } from 'uuid';
import type { NodeMap, VFSNode, VFSNodeType } from './types';

export const ROOT_ID = 'root';
export const HOME_ID = 'home-user';
export const DESKTOP_ID = 'home-desktop';
export const TRASH_ID = 'home-trash';

function createNode(
  id: string,
  name: string,
  type: VFSNodeType,
  parentId: string | null,
  content: string = '',
  owner: string = 'user',
  group: string = 'user',
  permissions?: string
): VFSNode {
  const now = Date.now();
  let extension = '';
  if (type === 'file' && name.includes('.')) {
    extension = name.split('.').pop() || '';
  }

  return {
    id,
    name,
    type,
    parentId,
    children: [],
    content,
    createdAt: now,
    modifiedAt: now,
    owner,
    group,
    permissions: permissions || (type === 'directory' ? '755' : '644'),
    meta: {
      extension
    }
  };
}

export function seedNodeMap(): NodeMap {
  const map: NodeMap = {};
  
  // Create /
  map[ROOT_ID] = createNode(ROOT_ID, '', 'directory', null, '', 'root', 'root');
  
  // Create /home
  const homeDirId = uuidv4();
  map[homeDirId] = createNode(homeDirId, 'home', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(homeDirId);
  
  // Create /home/user
  map[HOME_ID] = createNode(HOME_ID, 'user', 'directory', homeDirId, '', 'user', 'user');
  map[homeDirId].children.push(HOME_ID);
  
  // Create /home/user/Desktop
  map[DESKTOP_ID] = createNode(DESKTOP_ID, 'Desktop', 'directory', HOME_ID, '', 'user', 'user');
  map[HOME_ID].children.push(DESKTOP_ID);

  // Create /home/user/.Trash
  map[TRASH_ID] = createNode(TRASH_ID, '.Trash', 'directory', HOME_ID, '', 'user', 'user');
  map[HOME_ID].children.push(TRASH_ID);

  // Create /home/user/Documents
  const docsId = uuidv4();
  map[docsId] = createNode(docsId, 'Documents', 'directory', HOME_ID, '', 'user', 'user');
  map[HOME_ID].children.push(docsId);

  // Create /home/user/Documents/welcome.txt
  const welcomeId = uuidv4();
  map[welcomeId] = createNode(welcomeId, 'welcome.txt', 'file', docsId, 'Welcome to Ubuntu 24 Web Desktop!', 'user', 'user');
  map[docsId].children.push(welcomeId);

  // Create /home/user/Downloads
  const dlId = uuidv4();
  map[dlId] = createNode(dlId, 'Downloads', 'directory', HOME_ID, '', 'user', 'user');
  map[HOME_ID].children.push(dlId);

  // Create /home/user/Pictures
  const picsId = uuidv4();
  map[picsId] = createNode(picsId, 'Pictures', 'directory', HOME_ID, '', 'user', 'user');
  map[HOME_ID].children.push(picsId);

  // Create /home/user/.bashrc
  const bashrcId = uuidv4();
  map[bashrcId] = createNode(bashrcId, '.bashrc', 'file', HOME_ID, '# .bashrc\nalias ll="ls -alF"\n', 'user', 'user');
  map[HOME_ID].children.push(bashrcId);

  // Create /etc
  const etcId = uuidv4();
  map[etcId] = createNode(etcId, 'etc', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(etcId);

  // Create /etc/hostname
  const hostnameId = uuidv4();
  map[hostnameId] = createNode(hostnameId, 'hostname', 'file', etcId, 'ubuntu-web\n', 'root', 'root');
  map[etcId].children.push(hostnameId);

  return map;
}
