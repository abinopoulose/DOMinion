import { v4 as uuidv4 } from 'uuid';
import type { NodeMap, VFSNode, VFSNodeType } from './types';

import { UBUNTU_ACCOUNTS } from '../../../config/accounts';

export const ROOT_ID = 'root';
export const ROOT_HOME_ID = 'root-home';

export const getHomeId = (username: string) => `home-${username}`;
export const getDesktopId = (username: string) => `home-${username}-desktop`;
export const getTrashId = (username: string) => `home-${username}-trash`;

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
  map[ROOT_HOME_ID] = createNode(ROOT_HOME_ID, 'home', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(ROOT_HOME_ID);

  // Seed user directories
  UBUNTU_ACCOUNTS.forEach((account) => {
    seedUserHome(map, account.username);
  });

  // Create /etc
  const etcId = uuidv4();
  map[etcId] = createNode(etcId, 'etc', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(etcId);

  // Create /etc/hostname
  const hostnameId = uuidv4();
  map[hostnameId] = createNode(hostnameId, 'hostname', 'file', etcId, 'ubuntu-web\n', 'root', 'root');
  map[etcId].children.push(hostnameId);

  // Create /bin
  const binId = uuidv4();
  map[binId] = createNode(binId, 'bin', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(binId);

  // Create /usr
  const usrId = uuidv4();
  map[usrId] = createNode(usrId, 'usr', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(usrId);

  return map;
}

export function seedUserHome(map: NodeMap, username: string) {
  const homeId = getHomeId(username);
  const desktopId = getDesktopId(username);
  const trashId = getTrashId(username);

  // If already exists, just ensure it's linked to root-home (used for migration)
  if (map[homeId]) {
    if (map[ROOT_HOME_ID] && !map[ROOT_HOME_ID].children.includes(homeId)) {
      map[ROOT_HOME_ID].children.push(homeId);
    }
    return;
  }

  // Create /home/<username>
  map[homeId] = createNode(homeId, username, 'directory', ROOT_HOME_ID, '', username, username, '750');
  if (map[ROOT_HOME_ID] && !map[ROOT_HOME_ID].children.includes(homeId)) {
    map[ROOT_HOME_ID].children.push(homeId);
  }
  
  // Create /home/<username>/Desktop
  map[desktopId] = createNode(desktopId, 'Desktop', 'directory', homeId, '', username, username);
  map[homeId].children.push(desktopId);

  // Create /home/<username>/.Trash
  map[trashId] = createNode(trashId, '.Trash', 'directory', homeId, '', username, username);
  map[homeId].children.push(trashId);

  // Create /home/<username>/Documents
  const docsId = uuidv4();
  map[docsId] = createNode(docsId, 'Documents', 'directory', homeId, '', username, username);
  map[homeId].children.push(docsId);

  // Create /home/<username>/Documents/welcome.txt
  const welcomeId = uuidv4();
  map[welcomeId] = createNode(welcomeId, 'welcome.txt', 'file', docsId, `Welcome to Ubuntu 24 Web Desktop, ${username}!`, username, username);
  map[docsId].children.push(welcomeId);

  // Create /home/<username>/Downloads
  const dlId = uuidv4();
  map[dlId] = createNode(dlId, 'Downloads', 'directory', homeId, '', username, username);
  map[homeId].children.push(dlId);

  // Create /home/<username>/Pictures
  const picsId = uuidv4();
  map[picsId] = createNode(picsId, 'Pictures', 'directory', homeId, '', username, username);
  map[homeId].children.push(picsId);

  // Create /home/<username>/.bashrc
  const bashrcId = uuidv4();
  map[bashrcId] = createNode(bashrcId, '.bashrc', 'file', homeId, '# .bashrc\nalias ll="ls -alF"\n', username, username);
  map[homeId].children.push(bashrcId);
}
