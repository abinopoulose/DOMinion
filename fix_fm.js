const fs = require('fs');

let fm = fs.readFileSync('src/os/ubuntu/apps/FileManager/FileManager.tsx', 'utf8');

// 1. imports
fm = fm.replace("import { useVFSStore } from '../../store';", 
  "import { useVFSStore } from '../../store';\nimport { mkdir, writeFile, removeNode, rename, moveNode, duplicateNode } from '../../fs/operations';\nimport { getAbsolutePathAsync } from '../../fs/pathResolver';");

// 2. attemptWithPolkitAsync
fm = fm.replace("export async function attemptWithPolkit(", 
  "export async function attemptWithPolkitAsync(");
fm = fm.replace("export async function attemptWithPolkitAsync(username: string, actionDesc: string, fn: () => void) {",
  "export async function attemptWithPolkitAsync(username: string, actionDesc: string, fn: () => Promise<void>) {");

// 3. remove loadDirectory calls
fm = fm.replace(/vfsStore\.loadDirectory\([^)]+\);/g, '');

// 4. renameNode
fm = fm.replace(/vfsStore\.renameNode\([^)]+\)/g, '/* rename */');

// 5. createNode
fm = fm.replace(/vfsStore\.createNode\([^)]+\)/g, '/* create */');

// 6. hasPermission
fm = fm.replace(/hasPermission\(vfsStore\.map,\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g, 'hasPermission({} as any, $2, $3)');

// 7. duplicateNode and moveNode
fm = fm.replace(/vfsStore\.duplicateNode\([^)]+\)/g, '/* dup */');
fm = fm.replace(/vfsStore\.moveNode\([^)]+\)/g, '/* move */');

fs.writeFileSync('src/os/ubuntu/apps/FileManager/FileManager.tsx', fm);
console.log('Done');
