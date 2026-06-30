import { useRef, useEffect, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWindowStore, useVFSStore } from '../../store';
import { TerminalOutput } from './TerminalOutput';
import type { HistoryEntry } from './TerminalOutput';
import { TerminalInput } from './TerminalInput';
import type { TerminalInputRef } from './TerminalInput';
import { parseCommand } from './commandParser/parser';
import { commandRegistry } from './commands';
import type { TerminalAppState } from './commands/types';
import { handleNano } from './commands/nano';
import { getHomeId } from '../../fs/seed';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { NanoEditor } from './NanoEditor';
import { UBUNTU_ACCOUNTS } from '../../../../config/accounts';
import { setTempExecutionUser } from '../../store/useUbuntuVFSStore';
import './Terminal.css';

interface TerminalProps {
  windowId: string;
}

export function Terminal({ windowId }: TerminalProps) {
  const windowState = useWindowStore(useCallback((s) => s.windows.find(w => w.id === windowId), [windowId]));
  const updateAppState = useWindowStore((s) => s.updateAppState);
  const vfsStore = useVFSStore();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<TerminalInputRef>(null);

  const username = useUbuntuAuthStore((s) => s.currentUser) || 'user';
  const HOME_ID = getHomeId(username);

  // Initialize app state
  const appState = (windowState?.appState as TerminalAppState) || {
    cwdId: HOME_ID,
    history: [],
    commandHistory: [],
    fontSize: 13,
  };

  const { cwdId, history, commandHistory, interactiveApp, nanoFileId, fontSize = 13 } = appState;

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when window is focused
  useEffect(() => {
    if (windowState?.isFocused && !interactiveApp) {
      inputRef.current?.focus();
    }
  }, [windowState?.isFocused, interactiveApp]);

  const generatePrompt = (currentCwdId: string) => {
    const absPath = vfsStore.getAbsolutePath(currentCwdId);
    const homePath = vfsStore.getAbsolutePath(HOME_ID);
    
    let displayPath = absPath;
    if (absPath.startsWith(homePath)) {
      displayPath = '~' + absPath.slice(homePath.length);
    }
    
    return `${username}@ubuntu:${displayPath}$ `;
  };

  const executeCommand = (cmdStr: string, asRoot: boolean) => {
    let output: string[] = [];
    let isError = false;
    let nextCwdId = cwdId;
    let shouldClear = false;
    let newInteractiveApp = interactiveApp;
    let newNanoFileId = nanoFileId;
    let clearCmdHistory = false;

    if (asRoot) setTempExecutionUser('root');

    const parsed = parseCommand(cmdStr);
    if (parsed) {
      if (parsed.name === 'nano' || parsed.name === 'vi') {
        const nanoResult = handleNano(parsed.name, parsed.args, cwdId);
        if (nanoResult.error) {
          output = nanoResult.error.output;
          isError = nanoResult.error.isError;
        } else if (nanoResult.fileId) {
          newInteractiveApp = 'nano';
          newNanoFileId = nanoResult.fileId;
          shouldClear = true;
        }
      } else {
        const handler = commandRegistry[parsed.name];
        if (handler) {
          const updateCwd = (id: string) => { nextCwdId = id; };
          const clearHistoryFn = () => { shouldClear = true; };
          const handlerResult = handler(parsed.args, cwdId, updateCwd, clearHistoryFn, appState);
          output = handlerResult.output;
          isError = handlerResult.isError || false;
          if (parsed.name === 'history' && parsed.args.includes('-c')) {
            clearCmdHistory = true;
          }
        } else {
          output = [`${parsed.name}: command not found`];
          isError = true;
        }
      }
    }

    if (asRoot) setTempExecutionUser(null);
    return { output, isError, nextCwdId, shouldClear, newInteractiveApp, newNanoFileId, clearCmdHistory, parsed };
  };

  const handleCommand = (rawCommand: string) => {
    if (appState.sudoPasswordPrompt) {
      const userObj = UBUNTU_ACCOUNTS.find(u => u.username === username);
      const isCorrect = userObj && userObj.password === rawCommand;

      const newHistoryEntry: HistoryEntry = {
        id: uuidv4(),
        prompt: `[sudo] password for ${username}: `,
        command: '',
        output: [],
      };

      if (!isCorrect) {
        newHistoryEntry.output = ['Sorry, try again.'];
        newHistoryEntry.isError = true;
        updateAppState(windowId, {
          ...appState,
          sudoPasswordPrompt: false,
          sudoPendingCommand: undefined,
          history: [...history, newHistoryEntry]
        });
        return;
      }

      const pendingCmd = appState.sudoPendingCommand || '';
      const execResult = executeCommand(pendingCmd, true);

      newHistoryEntry.output = execResult.output;
      newHistoryEntry.isError = execResult.isError;
      
      const newHistory = execResult.shouldClear ? [] : [...history, newHistoryEntry];
      
      const newCommandHistory = [...commandHistory];
      if (pendingCmd.trim()) {
        if (newCommandHistory.length === 0 || newCommandHistory[newCommandHistory.length - 1] !== `sudo ${pendingCmd}`) {
          newCommandHistory.push(`sudo ${pendingCmd}`);
        }
        if (newCommandHistory.length > 100) newCommandHistory.shift();
      }

      updateAppState(windowId, {
        ...appState,
        cwdId: execResult.nextCwdId,
        history: newHistory,
        commandHistory: execResult.clearCmdHistory ? [] : newCommandHistory,
        interactiveApp: execResult.newInteractiveApp,
        nanoFileId: execResult.newNanoFileId,
        sudoPasswordPrompt: false,
        sudoPendingCommand: undefined,
        sudoAuthorized: true,
      });
      return;
    }

    const trimmed = rawCommand.trim();
    const prompt = generatePrompt(cwdId);

    const newHistoryEntry: HistoryEntry = {
      id: uuidv4(),
      prompt,
      command: rawCommand,
      output: [],
    };

    if (!trimmed) {
      updateAppState(windowId, {
        ...appState,
        history: [...history, newHistoryEntry],
      });
      return;
    }

    const parsed = parseCommand(trimmed);
    if (parsed && parsed.name === 'sudo') {
      const userObj = UBUNTU_ACCOUNTS.find(u => u.username === username);
      if (userObj?.role !== 'admin') {
        newHistoryEntry.output = [`${username} is not in the sudoers file. This incident will be reported.`];
        newHistoryEntry.isError = true;
        updateAppState(windowId, { ...appState, history: [...history, newHistoryEntry] });
        return;
      }
      
      if (parsed.args.length === 0) {
        newHistoryEntry.output = ['usage: sudo command'];
        newHistoryEntry.isError = true;
        updateAppState(windowId, { ...appState, history: [...history, newHistoryEntry] });
        return;
      }

      if (!appState.sudoAuthorized) {
        updateAppState(windowId, {
           ...appState,
           history: [...history, newHistoryEntry],
           sudoPasswordPrompt: true,
           sudoPendingCommand: parsed.args.join(' ')
        });
        return;
      }
    }

    let isSudo = false;
    let cmdToRun = trimmed;
    if (parsed && parsed.name === 'sudo' && appState.sudoAuthorized) {
      isSudo = true;
      cmdToRun = parsed.args.join(' ');
    }

    const execResult = executeCommand(cmdToRun, isSudo);

    newHistoryEntry.output = execResult.output;
    newHistoryEntry.isError = execResult.isError;

    const newHistory = execResult.shouldClear ? [] : [...history, newHistoryEntry];
    
    const newCommandHistory = [...commandHistory];
    if (!execResult.clearCmdHistory) {
      if (newCommandHistory.length === 0 || newCommandHistory[newCommandHistory.length - 1] !== trimmed) {
        newCommandHistory.push(trimmed);
      }
      if (newCommandHistory.length > 100) newCommandHistory.shift();
    } else {
      newCommandHistory.length = 0;
    }

    updateAppState(windowId, {
      ...appState,
      cwdId: execResult.nextCwdId,
      history: newHistory,
      commandHistory: newCommandHistory,
      interactiveApp: execResult.newInteractiveApp,
      nanoFileId: execResult.newNanoFileId,
    });
  };

  if (interactiveApp === 'nano' && nanoFileId) {
    return (
      <div className="terminal-app">
        <NanoEditor 
          fileId={nanoFileId} 
          onExit={() => {
            updateAppState(windowId, {
              ...appState,
              interactiveApp: undefined,
              nanoFileId: undefined,
            });
          }} 
        />
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        updateAppState(windowId, { ...appState, fontSize: Math.min(fontSize + 1, 36) });
      } else if (e.key === '-') {
        e.preventDefault();
        updateAppState(windowId, { ...appState, fontSize: Math.max(fontSize - 1, 8) });
      } else if (e.key === '0') {
        e.preventDefault();
        updateAppState(windowId, { ...appState, fontSize: 13 });
      }
    }
  };

  return (
    <div className="terminal-app" onClick={() => inputRef.current?.focus()} onKeyDown={handleKeyDown} tabIndex={-1} style={{ fontSize: `${fontSize}px` }}>
      <div className="terminal-scroll-area" ref={scrollAreaRef}>
        <TerminalOutput history={history} />
        <TerminalInput
          ref={inputRef}
          prompt={appState.sudoPasswordPrompt ? `[sudo] password for ${username}: ` : generatePrompt(cwdId)}
          onCommand={handleCommand}
          commandHistory={commandHistory}
          isPassword={!!appState.sudoPasswordPrompt}
        />
      </div>
    </div>
  );
}

export function TerminalHeaderControls({ windowId }: { windowId: string }) {
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const windowState = useWindowStore(useCallback((s) => s.windows.find(w => w.id === windowId), [windowId]));
  const updateAppState = useWindowStore((s) => s.updateAppState);
  
  const appState = (windowState?.appState as TerminalAppState) || {};
  const fontSize = appState.fontSize || 13;

  const handleZoomIn = () => updateAppState(windowId, { ...appState, fontSize: Math.min(fontSize + 1, 36) });
  const handleZoomOut = () => updateAppState(windowId, { ...appState, fontSize: Math.max(fontSize - 1, 8) });

  return (
    <>
      {showSearch && (
        <input 
          type="text" 
          autoFocus
          placeholder="Find..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
             if (e.key === 'Enter') {
                (window as any).find(searchQuery, false, false, true, false, true, false);
             } else if (e.key === 'Escape') {
                setShowSearch(false);
             }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ 
             background: 'rgba(255,255,255,0.1)', 
             border: '1px solid rgba(255,255,255,0.2)', 
             color: 'white', 
             borderRadius: '4px', 
             padding: '2px 8px',
             width: '120px',
             fontSize: '12px',
             outline: 'none'
          }}
        />
      )}

      <button 
        title="Search"
        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary, #fff)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
        onClick={(e) => { e.stopPropagation(); setShowSearch(!showSearch); }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>

      <div style={{ position: 'relative' }}>
        <button 
          title="Terminal Menu"
          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary, #fff)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {showMenu && (
          <div 
            style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              background: 'var(--bg-panel, #333)', border: '1px solid var(--color-border, #444)', borderRadius: '6px',
              padding: '4px 0', minWidth: '150px', zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '6px 12px', fontSize: '13px', color: 'white', cursor: 'pointer' }} onClick={() => { setShowMenu(false); handleZoomIn(); }}>Zoom In (Ctrl++)</div>
            <div style={{ padding: '6px 12px', fontSize: '13px', color: 'white', cursor: 'pointer' }} onClick={() => { setShowMenu(false); handleZoomOut(); }}>Zoom Out (Ctrl+-)</div>
            <div style={{ height: '1px', background: 'var(--color-border, #444)', margin: '4px 0' }}></div>
            <div style={{ padding: '6px 12px', fontSize: '13px', color: 'white', cursor: 'pointer' }} onClick={() => { setShowMenu(false); navigator.clipboard.readText().then(text => window.alert('Clipboard: ' + text)); }}>Paste</div>
          </div>
        )}
      </div>
    </>
  );
}
