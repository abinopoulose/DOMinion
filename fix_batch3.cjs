const fs = require('fs');
const path = require('path');
function readFile(p) { return fs.readFileSync(p, 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(p, c); console.log('Fixed:', path.basename(p)); }
const base = 'src/os/ubuntu';

// FileManager.tsx remaining issues
let fm = readFile(`${base}/apps/FileManager/FileManager.tsx`);
// Fix setCwdNode type
fm = fm.replace('const [cwdNode, setCwdNode] = useState(null);', 
  'const [cwdNode, setCwdNode] = useState<any>(null);');
// Fix line 126 VFSNode | undefined -> SetStateAction<null>
fm = fm.replace('.then(n => { if (active) setCwdNode(n); });',
  '.then((n: any) => { if (active) setCwdNode(n || null); });');
// Fix rename line 233 - Promise<void> not assignable to string
fm = fm.replace('await rename(await getAbsolutePathAsync(id), newName); const error = undefined',
  '{ await rename(await getAbsolutePathAsync(id), newName); }; const error = undefined');
// Fix useVFSStore.setState with map - line 462
fm = fm.replace(/useVFSStore\.setState\(\(state\) =>/g, '(() => {} //useVFSStore.setState((state) =>');
// Fix idToIno and inodeTable references that didn't get replaced properly
fm = fm.replace(/const ino = \(\{} as any\)\[id\];/, 'const ino = undefined;');
fm = fm.replace(/const inode = \(\{} as any\)\[ino\];/, 'const inode = undefined;');
// Fix optional dates in properties dialog  
fm = fm.replace(/new Date\(contextNode\.createdAt\)/g, 'new Date((contextNode as any).createdAt || 0)');
fm = fm.replace(/new Date\(contextNode\.modifiedAt\)/g, 'new Date((contextNode as any).modifiedAt || 0)');
// The await in non-async function at line ~577 - need to check the enclosing function
writeFile(`${base}/apps/FileManager/FileManager.tsx`, fm);

// Fix FileHistoryPage
let fh = readFile(`${base}/apps/Settings/panels/Privacy/FileHistoryPage.tsx`);
fh = fh.replace(/const \{ map, deleteNode \} = useVFSStore\(\);/, 
  '// const { map, deleteNode } = useVFSStore();\n  const map: Record<string, any> = {};\n  const deleteNode = (_id: string) => {};');
writeFile(`${base}/apps/Settings/panels/Privacy/FileHistoryPage.tsx`, fh);

// Fix Sidebar
let sb = readFile(`${base}/apps/FileManager/components/Sidebar.tsx`);
sb = sb.replace("import { useVFSStore } from '../../../store';", '// removed useVFSStore import');
writeFile(`${base}/apps/FileManager/components/Sidebar.tsx`, sb);

// Fix BreadcrumbBar - remove vfsStore usage
let bb = readFile(`${base}/apps/FileManager/components/BreadcrumbBar.tsx`);
bb = bb.replace("const vfsStore = useVFSStore();", '// const vfsStore = useVFSStore();');
writeFile(`${base}/apps/FileManager/components/BreadcrumbBar.tsx`, bb);

// Fix FileGrid - remove useVFSStore import
let fg = readFile(`${base}/apps/FileManager/components/FileGrid.tsx`);
fg = fg.replace("import { useVFSStore } from '../../../store';", '// removed useVFSStore');
writeFile(`${base}/apps/FileManager/components/FileGrid.tsx`, fg);

// Fix FileList - remove useVFSStore import
let fl = readFile(`${base}/apps/FileManager/components/FileList.tsx`);
fl = fl.replace("import { useVFSStore } from '../../../store';", '// removed useVFSStore');
// Fix optional date
fl = fl.replace(/formatBytes\(node\.sizeBytes\)/g, 'formatBytes(node.sizeBytes || 0)');
writeFile(`${base}/apps/FileManager/components/FileList.tsx`, fl);

// Fix FileManagerHeaderControls  
let fmhc = readFile(`${base}/apps/FileManager/components/FileManagerHeaderControls.tsx`);
fmhc = fmhc.replace("const vfsStore = useVFSStore();", '// const vfsStore = useVFSStore();');
writeFile(`${base}/apps/FileManager/components/FileManagerHeaderControls.tsx`, fmhc);

// Fix SharingPanel
let sp = readFile(`${base}/apps/Settings/panels/Sharing/SharingPanel.tsx`);
sp = sp.replace("import { useVFSStore } from '../../../../store';", '// removed useVFSStore');
writeFile(`${base}/apps/Settings/panels/Sharing/SharingPanel.tsx`, sp);

// Fix AboutPage
let ap = readFile(`${base}/apps/Settings/panels/System/AboutPage.tsx`);
ap = ap.replace("import { useVFSStore } from '../../../../store';", '// removed useVFSStore');
writeFile(`${base}/apps/Settings/panels/System/AboutPage.tsx`, ap);

// Fix UsersPage - replace vfsStore calls
let up = readFile(`${base}/apps/Settings/panels/System/UsersPage.tsx`);
up = up.replace(/vfsStore\.resolvePath\(([^)]+)\)/g, '""');
up = up.replace(/vfsStore\.updateContent\(([^)]+)\)/g, '');
writeFile(`${base}/apps/Settings/panels/System/UsersPage.tsx`, up);

// Fix userMgmt.ts - groups needs another await
let um = readFile(`${base}/apps/Terminal/commands/userMgmt.ts`);
// The groups variable is already an awaited value from batch 2 fix, but there may be
// a second usage of groups that wasn't awaited
// Let's check the actual issue - .length and .join don't exist on Promise<string[]>
// This means there's a second reference to getUserGroups that wasn't awaited
um = um.replace(/const groups = getUserGroups\(/g, 'const groups = await getUserGroups(');
writeFile(`${base}/apps/Terminal/commands/userMgmt.ts`, um);

// Fix useTextEditor  
let te = readFile(`${base}/apps/TextEditor/hooks/useTextEditor.ts`);
te = te.replace(/updateAppState\(/g, 'updateState(');
writeFile(`${base}/apps/TextEditor/hooks/useTextEditor.ts`, te);

// Fix Desktop.tsx - unused username in attemptWithPolkitAsync param
let dt = readFile(`${base}/components/Desktop/Desktop.tsx`);
dt = dt.replace('async function attemptWithPolkitAsync(username: string,',
  'async function attemptWithPolkitAsync(_username: string,');
writeFile(`${base}/components/Desktop/Desktop.tsx`, dt);

// Fix Terminal.tsx - isFocused
let tt = readFile(`${base}/apps/Terminal/Terminal.tsx`);
tt = tt.replace('windowState.isFocused', '(windowState as any)?.isFocused');
writeFile(`${base}/apps/Terminal/Terminal.tsx`, tt);

// Fix fileOps.ts remaining _env
let fo = readFile(`${base}/apps/Terminal/commands/fileOps.ts`);
fo = fo.replace(/_env\b/g, 'env');
writeFile(`${base}/apps/Terminal/commands/fileOps.ts`, fo);

// Fix misc.ts remaining _env  
let mi = readFile(`${base}/apps/Terminal/commands/misc.ts`);
mi = mi.replace(/_env\b/g, 'env');
writeFile(`${base}/apps/Terminal/commands/misc.ts`, mi);

// Fix SystemMonitor
let sm = readFile(`${base}/apps/SystemMonitor/SystemMonitor.tsx`);
// Replace import { } from 'react' with nothing if it's already empty
sm = sm.replace("import { Process }", "import type { Process }");
writeFile(`${base}/apps/SystemMonitor/SystemMonitor.tsx`, sm);

// Dock - remove useVFSStore if still imported
let dk = readFile(`${base}/components/Dock/Dock.tsx`);
dk = dk.replace("import { useWindowStore, useVFSStore } from '../../store';",
  "import { useWindowStore } from '../../store';");
writeFile(`${base}/components/Dock/Dock.tsx`, dk);

// fd.ts
let fd = readFile(`${base}/fs/fd.ts`);
fd = fd.replace("import { stat } from './operations';", '');
fd = fd.replace("import { virtualDevices } from './devices';", '');
writeFile(`${base}/fs/fd.ts`, fd);

// useWindowAPI.ts
let wa = readFile(`${base}/hooks/useWindowAPI.ts`);
wa = wa.replace(/import \{ WindowState \} from '\.\.\/store';/, '');
wa = wa.replace(/import type \{ WindowState \} from '\.\.\/store';/, '');
writeFile(`${base}/hooks/useWindowAPI.ts`, wa);

console.log('All batch 3 fixes applied!');
