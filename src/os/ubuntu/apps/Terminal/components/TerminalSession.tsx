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
}

interface TerminalSessionProps {
  windowId: string;
  tab: TerminalTabState;
  isActive: boolean;
  onStateChange: (tabId: string, updates: Partial<TerminalTabState>) => void;
  isFocused: boolean;
}

export const TerminalSession: React.FC<TerminalSessionProps> = ({ windowId, tab, isActive, onStateChange, isFocused }) => {
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
    
    const writeToTerm = (data: string) => {
      xtermRef.current?.terminal?.write(data);
    };

    const newPty = new PTY(writeToTerm, env);
    newPty.onCommandComplete = () => {
      onStateChange(tab.id, {
        cwdId: env.cwdId,
        cwdPath: env.cwdPath,
        effectiveUser: env.effectiveUser,
        commandHistory: env.commandHistory,
        title: env.cwdPath === '/' ? '/' : env.cwdPath.split('/').pop() || '/'
      });
    };
    ptyRef.current = newPty;

    // Initial prompt and MOTD
    const timer = setTimeout(() => {
      if (!tab.hasShownMotd) {
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

  useEffect(() => {
    if (isActive && isFocused) {
      xtermRef.current?.terminal?.focus();
    }
  }, [isActive, isFocused]);

  useEffect(() => {
    if (isActive && xtermRef.current) {
      // Small delay to ensure display:none is lifted before fit
      setTimeout(() => xtermRef.current?.fit(), 10);
    }
  }, [isActive]);

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
          cursorStyle: profile.cursorStyle,
          cursorBlink: profile.cursorBlink,
          scrollback: profile.scrollbackLines,
          theme: theme,
        }}
      />
    </div>
  );
};
