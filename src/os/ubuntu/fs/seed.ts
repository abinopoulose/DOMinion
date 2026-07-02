import { v4 as uuidv4 } from 'uuid';
import type { NodeMap, VFSNode, VFSNodeType } from './types';

import { UBUNTU_ACCOUNTS } from '../../../config/accounts';
import {
  generatePasswdContent,
  generateShadowContent,
  generateSudoersContent,
  generateGroupContent,
} from './authSeed';

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
  owner: string = 'peasant',
  group: string = 'peasant',
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

  // Create /etc/passwd
  const passwdId = uuidv4();
  map[passwdId] = createNode(passwdId, 'passwd', 'file', etcId, generatePasswdContent(), 'root', 'root', '644');
  map[etcId].children.push(passwdId);

  // Create /etc/shadow (restricted read — root only)
  const shadowId = uuidv4();
  map[shadowId] = createNode(shadowId, 'shadow', 'file', etcId, generateShadowContent(), 'root', 'shadow', '640');
  map[etcId].children.push(shadowId);

  // Create /etc/sudoers (root read-only, no write by anyone except root)
  const sudoersId = uuidv4();
  map[sudoersId] = createNode(sudoersId, 'sudoers', 'file', etcId, generateSudoersContent(), 'root', 'root', '440');
  map[etcId].children.push(sudoersId);

  // Create /etc/group
  const groupFileId = uuidv4();
  map[groupFileId] = createNode(groupFileId, 'group', 'file', etcId, generateGroupContent(), 'root', 'root', '644');
  map[etcId].children.push(groupFileId);

  // Create /bin
  const binId = uuidv4();
  map[binId] = createNode(binId, 'bin', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(binId);

  // Create /usr
  const usrId = uuidv4();
  map[usrId] = createNode(usrId, 'usr', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(usrId);

  // Create /usr/bin
  const usrBinId = uuidv4();
  map[usrBinId] = createNode(usrBinId, 'bin', 'directory', usrId, '', 'root', 'root');
  map[usrId].children.push(usrBinId);

  // Add SUID binaries to /usr/bin
  const sudoBinId = uuidv4();
  map[sudoBinId] = createNode(sudoBinId, 'sudo', 'file', usrBinId, 'sudo binary', 'root', 'root', '4755');
  map[usrBinId].children.push(sudoBinId);

  const suBinId = uuidv4();
  map[suBinId] = createNode(suBinId, 'su', 'file', usrBinId, 'su binary', 'root', 'root', '4755');
  map[usrBinId].children.push(suBinId);

  const passwdBinId = uuidv4();
  map[passwdBinId] = createNode(passwdBinId, 'passwd', 'file', usrBinId, 'passwd binary', 'root', 'root', '4755');
  map[usrBinId].children.push(passwdBinId);

  // Create /proc
  const procId = uuidv4();
  map[procId] = createNode(procId, 'proc', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(procId);

  const meminfoId = uuidv4();
  map[meminfoId] = createNode(meminfoId, 'meminfo', 'proc_file', procId, 'meminfo', 'root', 'root', '444');
  map[procId].children.push(meminfoId);

  const cpuinfoId = uuidv4();
  map[cpuinfoId] = createNode(cpuinfoId, 'cpuinfo', 'proc_file', procId, 'cpuinfo', 'root', 'root', '444');
  map[procId].children.push(cpuinfoId);

  const uptimeId = uuidv4();
  map[uptimeId] = createNode(uptimeId, 'uptime', 'proc_file', procId, 'uptime', 'root', 'root', '444');
  map[procId].children.push(uptimeId);

  // Create /dev
  const devId = uuidv4();
  map[devId] = createNode(devId, 'dev', 'directory', ROOT_ID, '', 'root', 'root');
  map[ROOT_ID].children.push(devId);

  const nullId = uuidv4();
  map[nullId] = createNode(nullId, 'null', 'character_device', devId, 'null', 'root', 'root', '666');
  map[devId].children.push(nullId);

  const zeroId = uuidv4();
  map[zeroId] = createNode(zeroId, 'zero', 'character_device', devId, 'zero', 'root', 'root', '666');
  map[devId].children.push(zeroId);

  const randomId = uuidv4();
  map[randomId] = createNode(randomId, 'random', 'character_device', devId, 'random', 'root', 'root', '444');
  map[devId].children.push(randomId);

  return map;
}

export function seedUserHome(map: NodeMap, username: string, homeParentId: string = ROOT_HOME_ID) {
  const homeId = getHomeId(username);
  const desktopId = getDesktopId(username);
  const trashId = getTrashId(username);

  // If already exists, just ensure it's linked to homeParentId (used for migration)
  if (map[homeId]) {
    if (map[homeParentId] && !map[homeParentId].children.includes(homeId)) {
      map[homeParentId].children.push(homeId);
    }
    if (map[homeId].parentId !== homeParentId) {
      map[homeId].parentId = homeParentId;
    }
    return;
  }

  // Create /home/<username>
  map[homeId] = createNode(homeId, username, 'directory', homeParentId, '', username, username, '750');
  if (map[homeParentId] && !map[homeParentId].children.includes(homeId)) {
    map[homeParentId].children.push(homeId);
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
