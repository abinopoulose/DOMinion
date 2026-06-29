import React, { useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWindowStore, useVFSStore } from '../../store';
import { TerminalOutput } from './TerminalOutput';
import type { HistoryEntry } from './TerminalOutput';
import { TerminalInput } from './TerminalInput';
import type { TerminalInputRef } from './TerminalInput';
import { parseCommand } from '../../core/commandParser/parser';
import { commandRegistry } from './commands';
import { HOME_ID } from '../../core/vfs/seed';
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
  const appState = (windowState?.appState as {
    cwdId: string;
    history: HistoryEntry[];
    commandHistory: string[];
  }) || {
    cwdId: HOME_ID,
    history: [],
    commandHistory: [],
  };

  const { cwdId, history, commandHistory } = appState;

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when window is focused
  useEffect(() => {
    if (windowState?.isFocused) {
      inputRef.current?.focus();
    }
  }, [windowState?.isFocused]);

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

    if (parsed) {
      const handler = commandRegistry[parsed.name];
      if (handler) {
        const updateCwd = (id: string) => { nextCwdId = id; };
        const clearHistory = () => { shouldClear = true; };
        const handlerResult = handler(parsed.args, cwdId, updateCwd, clearHistory);
        result = {
          output: handlerResult.output,
          isError: handlerResult.isError || false,
        };
      } else {
        result = {
          output: [`${parsed.name}: command not found`],
          isError: true,
        };
      }
    }

    newHistoryEntry.output = result.output;
    newHistoryEntry.isError = result.isError;

    const newHistory = shouldClear ? [] : [...history, newHistoryEntry];
    
    const newCommandHistory = [...commandHistory];
    if (newCommandHistory[newCommandHistory.length - 1] !== trimmed) {
      newCommandHistory.push(trimmed);
    }
    // Limit command history to 100 entries
    if (newCommandHistory.length > 100) newCommandHistory.shift();

    updateAppState(windowId, {
      cwdId: nextCwdId,
      history: newHistory,
      commandHistory: newCommandHistory,
    });
  };

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
