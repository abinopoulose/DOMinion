const fs = require('fs');
const path = require('path');

function fix(filePath, replacements) {
  if (!fs.existsSync(filePath)) { console.warn('SKIP (not found):', filePath); return; }
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.replace(from, to);
    }
  }
  fs.writeFileSync(filePath, content);
  console.log('Fixed:', path.basename(filePath));
}

const base = 'src/os/ubuntu';

// Fix LegacyVFSNodeType to include proc_file and character_device
fix(`${base}/fs/types.ts`, [
  ["export type LegacyVFSNodeType = 'file' | 'directory' | 'symlink';",
   "export type LegacyVFSNodeType = 'file' | 'directory' | 'symlink' | 'proc_file' | 'character_device';"],
]);

// Fix permissions.ts unused import
fix(`${base}/fs/permissions.ts`, [
  ["import type { NodeMap } from './types';", "// NodeMap no longer needed"],
]);

// Fix FileManager sub-components
fix(`${base}/apps/FileManager/components/BreadcrumbBar.tsx`, [
  ["vfsStore.getNode(", "null; // vfsStore.getNode("],
]);

fix(`${base}/apps/FileManager/components/Sidebar.tsx`, [
  ["vfsStore.resolvePath(", "null; // vfsStore.resolvePath("],
]);

// Fix Settings panels
fix(`${base}/apps/Settings/panels/Privacy/FileHistoryPage.tsx`, [
  ["vfsStore.map", "({} as any)"],
  ["vfsStore.deleteNode", "(() => {}) // vfsStore.deleteNode"],
]);

fix(`${base}/apps/Settings/panels/Sharing/SharingPanel.tsx`, [
  ["vfsStore.resolvePath(", "null; // vfsStore.resolvePath("],
  ["vfsStore.updateContent(", "null; // vfsStore.updateContent("],
]);

fix(`${base}/apps/Settings/panels/System/AboutPage.tsx`, [
  ["vfsStore.resolvePath(", "null; // vfsStore.resolvePath("],
  ["vfsStore.updateContent(", "null; // vfsStore.updateContent("],
]);

fix(`${base}/apps/Settings/panels/System/UsersPage.tsx`, [
  ["vfsStore.resolvePath(", "null; // vfsStore.resolvePath("],
  ["vfsStore.updateContent(", "null; // vfsStore.updateContent("],
]);

// Fix sudoService unused import
fix(`${base}/services/sudoService.ts`, [
  ["import { useUbuntuVFSStore } from '../store';", "// import { useUbuntuVFSStore } from '../store';"],
]);

// Fix Terminal.tsx
fix(`${base}/apps/Terminal/Terminal.tsx`, [
  ["import React, { useState, useRef, useCallback, useEffect } from 'react';", "import { useState, useRef, useEffect } from 'react';"],
]);

// Fix terminal commands - remove unused imports  
fix(`${base}/apps/Terminal/commands/fileOps.ts`, [
  ["import { useVFSStore } from '../../../store';", "// import removed: useVFSStore"],
  ["_env.", "env."],
]);

fix(`${base}/apps/Terminal/commands/misc.ts`, [
  ["import { useVFSStore } from '../../../store';", "// import removed: useVFSStore"],
  ["_env.", "env."],
]);

fix(`${base}/apps/Terminal/commands/nano.ts`, [
  ["import { useVFSStore } from '../../../store';", "// import removed: useVFSStore"],
]);

fix(`${base}/apps/Terminal/commands/su.ts`, [
  ["import { useUbuntuVFSStore } from '../../../store';", "// import removed: useUbuntuVFSStore"],
]);

fix(`${base}/apps/Terminal/commands/textOps.ts`, [
  ["import { getAuthContext } from '../../../store/authContext';", "// import removed: getAuthContext"],
]);

fix(`${base}/apps/Terminal/commands/userMgmt.ts`, [
  ["import { useUbuntuVFSStore } from '../../../store';", "// import removed: useUbuntuVFSStore"],
]);

// Fix Dock unused import
fix(`${base}/components/Dock/Dock.tsx`, [
  ["  const vfsStore = useVFSStore();", "  // const vfsStore = useVFSStore();"],
]);

// Fix XTermReact unused React
fix(`${base}/components/TerminalEmulation/XTermReact.tsx`, [
  ["import React, {", "import {"],
]);

// Fix SystemMonitor
fix(`${base}/apps/SystemMonitor/SystemMonitor.tsx`, [
  ["import React, { useState } from 'react';", "import { } from 'react';"],
]);

// Fix useWindowAPI
fix(`${base}/hooks/useWindowAPI.ts`, [
  ["import { WindowState } from '../store';", "// import type { WindowState } from '../store';"],
]);

// Fix fd.ts unused imports
fix(`${base}/fs/fd.ts`, [
  ["import { stat } from './operations';", "// import { stat } from './operations';"],
  ["import { virtualDevices } from './devices';", "// import { virtualDevices } from './devices';"],
]);

// Fix WindowManagerEngine unused
fix(`${base}/engine/WindowManagerEngine.ts`, [
  [", clientY", ""],
]);

console.log('All fixes applied!');
