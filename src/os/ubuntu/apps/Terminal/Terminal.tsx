import { useRef, useEffect, useCallback } from 'react';
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
import { HOME_ID } from '../../fs/seed';
import { NanoEditor } from './NanoEditor';
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

  // Initialize app state
  const appState = (windowState?.appState as TerminalAppState) || {
    cwdId: HOME_ID,
    history: [],
    commandHistory: [],
  };

  const { cwdId, history, commandHistory, interactiveApp, nanoFileId } = appState;

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
    
    return `user@ubuntu:${displayPath}$ `;
  };

  const handleCommand = (rawCommand: string) => {
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
    let result = { output: [] as string[], isError: false };

    let nextCwdId = cwdId;
    let shouldClear = false;
    let newInteractiveApp = interactiveApp;
    let newNanoFileId = nanoFileId;
    const newCommandHistory = [...commandHistory];

    if (parsed) {
      if (parsed.name === 'nano' || parsed.name === 'vi') {
        const nanoResult = handleNano(parsed.name, parsed.args, cwdId);
        if (nanoResult.error) {
          result = nanoResult.error;
        } else if (nanoResult.fileId) {
          newInteractiveApp = 'nano';
          newNanoFileId = nanoResult.fileId;
          shouldClear = true;
        }
      } else {
        const handler = commandRegistry[parsed.name];
        if (handler) {
          const updateCwd = (id: string) => { nextCwdId = id; };
          const clearHistory = () => { shouldClear = true; };
          const handlerResult = handler(parsed.args, cwdId, updateCwd, clearHistory, appState);
          result = {
            output: handlerResult.output,
            isError: handlerResult.isError || false,
          };
          if (parsed.name === 'history' && parsed.args.includes('-c')) {
            newCommandHistory.length = 0;
          }
        } else {
          result = {
            output: [`${parsed.name}: command not found`],
            isError: true,
          };
        }
      }
    }

    newHistoryEntry.output = result.output;
    newHistoryEntry.isError = result.isError;

    const newHistory = shouldClear ? [] : [...history, newHistoryEntry];
    
    if (newCommandHistory.length > 0 || !(parsed?.name === 'history' && parsed?.args.includes('-c'))) {
      if (newCommandHistory[newCommandHistory.length - 1] !== trimmed) {
        newCommandHistory.push(trimmed);
      }
      // Limit command history to 100 entries
      if (newCommandHistory.length > 100) newCommandHistory.shift();
    }

    updateAppState(windowId, {
      cwdId: nextCwdId,
      history: newHistory,
      commandHistory: newCommandHistory,
      interactiveApp: newInteractiveApp,
      nanoFileId: newNanoFileId,
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

  return (
    <div className="terminal-app" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-scroll-area" ref={scrollAreaRef}>
        <TerminalOutput history={history} />
        <TerminalInput
          ref={inputRef}
          prompt={generatePrompt(cwdId)}
          onCommand={handleCommand}
          commandHistory={commandHistory}
        />
      </div>
    </div>
  );
}
