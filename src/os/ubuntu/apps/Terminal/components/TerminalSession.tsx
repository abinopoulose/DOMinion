import React, { useEffect, useRef, useState, useCallback } from 'react';
import { XTermReact, type XTermReactRef } from '../../../components/TerminalEmulation/XTermReact';
import { ShellEnvironment } from '../engine/ShellEnvironment';
import { PTY } from '../engine/PTY';
import { NanoEditor } from '../components/NanoEditor';
import { useTerminalProfileStore } from '../store/useTerminalProfileStore';
import { themes } from '../themes';

export interface TerminalTabState {
  id: string;
  title: string;
  cwdId: string;
  cwdPath: string;
  effectiveUser: string;
  commandHistory: string[];
  interactiveApp?: string;
  nanoFileId?: string;
  hasShownMotd?: boolean;
  scrollbackContent?: string;
  envVars?: Record<string, string>;
  aliases?: Record<string, string>;
}

interface TerminalSessionProps {
  windowId: string;
  tab: TerminalTabState;
  isActive: boolean;
  onStateChange: (tabId: string, updates: Partial<TerminalTabState>) => void;
  onTabClose: (tabId: string) => void;
  isFocused: boolean;
  showToast: (msg: string) => void;
}

export const TerminalSession: React.FC<TerminalSessionProps> = ({ windowId, tab, isActive, onStateChange, onTabClose, isFocused, showToast }) => {
  const xtermRef = useRef<XTermReactRef>(null);
  const ptyRef = useRef<PTY | null>(null);
  
  const [interactiveApp, setInteractiveApp] = useState<'nano' | undefined>(tab.interactiveApp as any);
  const [nanoFileId, setNanoFileId] = useState<string | undefined>(tab.nanoFileId as string);

  const profile = useTerminalProfileStore(state => state.activeProfile);
  const theme = themes[profile.colorScheme] || themes['ubuntu'];

  useEffect(() => {
    if (!xtermRef.current) return;
    if (ptyRef.current) return; // already initialized
    
    // Initialize ShellEngine and PTY
    const env = new ShellEnvironment(tab.cwdId, tab.cwdPath, tab.effectiveUser, windowId);
    env.commandHistory = tab.commandHistory || [];

    // Restore persisted env vars and aliases
    if (tab.envVars) {
      env.envVars = { ...env.envVars, ...tab.envVars };
    }
    if (tab.aliases) {
      env.aliases = { ...env.aliases, ...tab.aliases };
    }
    
    const writeToTerm = (data: string) => {
      xtermRef.current?.terminal?.write(data);
    };

    const newPty = new PTY(writeToTerm, env);
    newPty.onCommandComplete = () => {
      let scrollbackContent = xtermRef.current?.serialize() ?? undefined;
      const MAX_SCROLLBACK_BYTES = 512 * 1024; // 512 KB per tab
      if (scrollbackContent && scrollbackContent.length > MAX_SCROLLBACK_BYTES) {
        scrollbackContent = scrollbackContent.slice(-MAX_SCROLLBACK_BYTES);
      }
      
      onStateChange(tab.id, {
        cwdId: env.cwdId,
        cwdPath: env.cwdPath,
        effectiveUser: env.effectiveUser,
        commandHistory: env.commandHistory,
        title: env.cwdPath === '/' ? '/' : env.cwdPath.split('/').pop() || '/',
        interactiveApp: env.interactiveApp as any,
        nanoFileId: env.nanoFileId,
        scrollbackContent,
        envVars: { ...env.envVars },
        aliases: { ...env.aliases },
      });
      // Reset interactive state in env after passing it up
      env.interactiveApp = undefined;
      env.nanoFileId = undefined;
    };

    newPty.onExitRequest = () => {
      onTabClose(tab.id);
    };

    ptyRef.current = newPty;

    const term = xtermRef.current.terminal;
    if (term) {
      term.attachCustomKeyEventHandler((e) => {
        if (e.type === 'keydown' && e.ctrlKey && e.shiftKey) {
          if (e.key.toLowerCase() === 'c') {
            e.preventDefault();
            const selection = term.getSelection();
            if (selection) {
              navigator.clipboard.writeText(selection).then(() => {
                showToast('Copied to clipboard');
              });
            }
            return false;
          }
          if (e.key.toLowerCase() === 'v') {
            e.preventDefault();
            navigator.clipboard.readText().then((text) => {
              newPty.handleData(text);
              showToast('Pasted from clipboard');
            });
            return false;
          }
        }
        return true;
      });
      
      // Also catch native paste (e.g. right click -> Paste, or middle click)
      const handleNativePaste = () => {
        showToast('Pasted from clipboard');
      };
      // We can hook to the terminal's containing element
      term.element?.addEventListener('paste', handleNativePaste);
      // Clean up handled later if needed, but since it's mounted once per tab it's ok
    }

    // Initial prompt and MOTD
    const timer = setTimeout(() => {
      if (tab.scrollbackContent) {
        writeToTerm(tab.scrollbackContent);
      } else if (!tab.hasShownMotd) {
        const motd = [
          `Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-31-generic x86_64)`,
          ``,
          ` * Documentation:  https://help.ubuntu.com`,
          ` * Management:     https://landscape.canonical.com`,
          ` * Support:        https://ubuntu.com/pro`,
          ``,
          `Last login: ${new Date().toDateString()} from 127.0.0.1`,
        ];
        motd.forEach(line => writeToTerm(line + '\r\n'));
        onStateChange(tab.id, { hasShownMotd: true });
      }
      newPty.initShell();
    }, 50);
    
    return () => {
      clearTimeout(timer);
      ptyRef.current = null;
    };
  }, []); // Run once on mount

  const handleData = useCallback((data: string) => {
    ptyRef.current?.handleData(data);
  }, []);

  const handleResize = useCallback((cols: number, rows: number) => {
    if (ptyRef.current) {
      ptyRef.current.env.updateEnv('COLUMNS', String(cols));
      ptyRef.current.env.updateEnv('LINES', String(rows));
    }
  }, []);

  // Serialize scrollback every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (xtermRef.current) {
        let content = xtermRef.current.serialize();
        if (content) {
          const MAX_SCROLLBACK_BYTES = 512 * 1024; // 512 KB per tab
          if (content.length > MAX_SCROLLBACK_BYTES) {
            content = content.slice(-MAX_SCROLLBACK_BYTES);
          }
          onStateChange(tab.id, { scrollbackContent: content });
        }
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [tab.id, onStateChange]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (xtermRef.current) {
        let content = xtermRef.current.serialize() ?? undefined;
        if (content) {
          const MAX_SCROLLBACK_BYTES = 512 * 1024;
          if (content.length > MAX_SCROLLBACK_BYTES) {
            content = content.slice(-MAX_SCROLLBACK_BYTES);
          }
          onStateChange(tab.id, { scrollbackContent: content });
        }
      }
    };
    
    window.addEventListener('app:before-unload', handleBeforeUnload);
    return () => window.removeEventListener('app:before-unload', handleBeforeUnload);
  }, [tab.id, onStateChange]);

  useEffect(() => {
    if (isActive && isFocused) {
      xtermRef.current?.terminal?.focus();
    }
  }, [isActive, isFocused]);

  useEffect(() => {
    if (isActive && xtermRef.current) {
      // Increase delay to ensure display:none is lifted before fit
      setTimeout(() => xtermRef.current?.fit(), 50);
    }
  }, [isActive]);

  // Search Event Listener
  useEffect(() => {
    const handleDoSearch = (e: any) => {
      const { windowId: searchWindowId, query, options, direction } = e.detail;
      if (searchWindowId === windowId && isActive && xtermRef.current) {
        const fullOptions = {
          ...options,
          decorations: {
            matchBackground: '#4a4a4a',
            matchBorder: 'transparent',
            matchOverviewRuler: '#4a4a4a',
            activeMatchBackground: '#ff8c00',
            activeMatchBorder: 'transparent',
            activeMatchColorOverviewRuler: '#ff8c00'
          }
        };
        if (direction === 'next') {
          xtermRef.current.searchAddon.findNext(query, fullOptions);
        } else {
          xtermRef.current.searchAddon.findPrevious(query, fullOptions);
        }
      }
    };
    
    const handleCloseSearch = (e: any) => {
      if (e.detail.windowId === windowId && isActive && xtermRef.current) {
        xtermRef.current.searchAddon.clearDecorations();
      }
    };

    window.addEventListener('terminal:do-search', handleDoSearch);
    window.addEventListener('terminal:close-search', handleCloseSearch);
    
    return () => {
      window.removeEventListener('terminal:do-search', handleDoSearch);
      window.removeEventListener('terminal:close-search', handleCloseSearch);
    };
  }, [windowId, isActive]);

  // Sync state from parent to local state for Nano
  useEffect(() => {
    setInteractiveApp(tab.interactiveApp as any);
    setNanoFileId(tab.nanoFileId);
  }, [tab.interactiveApp, tab.nanoFileId]);

  if (interactiveApp === 'nano' && nanoFileId) {
    return (
      <div className={`terminal-session-container ${isActive ? '' : 'hidden'}`}>
        <NanoEditor 
          fileId={nanoFileId} 
          onExit={() => {
            setInteractiveApp(undefined);
            setNanoFileId(undefined);
            onStateChange(tab.id, {
              interactiveApp: undefined,
              nanoFileId: undefined,
            });
            xtermRef.current?.terminal?.focus();
            ptyRef.current?.writePrompt();
          }} 
        />
      </div>
    );
  }

  return (
    <div className={`terminal-session-container ${isActive ? '' : 'hidden'}`}>
      <XTermReact 
        ref={xtermRef}
        onData={handleData}
        onResize={handleResize}
        options={{
          fontFamily: profile.fontFamily,
          fontSize: profile.fontSize,
          lineHeight: profile.lineHeight,
          letterSpacing: profile.letterSpacing,
          cursorStyle: profile.cursorStyle,
          cursorBlink: profile.cursorBlink === 'never' ? false : true,
          scrollback: profile.scrollbackLines,
          theme: theme,
        }}
      />
    </div>
  );
};
