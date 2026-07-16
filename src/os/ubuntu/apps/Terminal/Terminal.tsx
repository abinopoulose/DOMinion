import { useRef, useEffect, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWindowStore, useVFSStore } from '../../store';
import { TerminalOutput } from './components/TerminalOutput';
import type { HistoryEntry } from './components/TerminalOutput';
import { TerminalInput } from './components/TerminalInput';
import type { TerminalInputRef } from './components/TerminalInput';
import type { TerminalAppState } from './commands/types';
import { parseCommand } from './commandParser';
import { handleNano } from './commands/nano';
import { commandRegistry } from './commands';
import { handleAutocomplete } from './utils/autocomplete';
import { openFile, writeToFile, readFile, closeFile, type ProcessState } from '../../fs/fd';
import { getHomeId } from '../../fs/seed';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { NanoEditor } from './components/NanoEditor';
import { setTempExecutionUser, useUbuntuVFSStore } from '../../store/useUbuntuVFSStore';
import { verifySudoPassword } from '../../services/sudoService';
import { handleSudo } from './commands/sudo';
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

  const username = useUbuntuAuthStore((s) => s.currentUser) || 'peasant';
  const HOME_ID = getHomeId(username);

  // Initialize app state
  const appState = (windowState?.appState as TerminalAppState) || {
    cwdId: HOME_ID,
    history: [],
    commandHistory: [],
    fontSize: 13,
  };

  let { cwdId = HOME_ID, history = [], commandHistory = [], interactiveApp, nanoFileId, fontSize = 13 } = appState;

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

  // Load directory whenever cwdId changes
  useEffect(() => {
    vfsStore.loadDirectory(cwdId);
  }, [cwdId]);

  const effectiveUser = appState.effectiveUser || username;

  const generatePrompt = (currentCwdId: string) => {
    const absPath = vfsStore.getAbsolutePath(currentCwdId);
    const homePath = vfsStore.getAbsolutePath(getHomeId(effectiveUser));
    
    let displayPath = absPath;
    if (absPath.startsWith(homePath)) {
      displayPath = '~' + absPath.slice(homePath.length);
    }
    
    const promptChar = effectiveUser === 'root' ? '#' : '$';
    const hostname = localStorage.getItem('ubuntu-hostname') || 'envyy';
    return `${effectiveUser}@${hostname}:${displayPath}${promptChar} `;
  };

  const executeCommand = async (cmdStr: string, asRoot: boolean) => {
    let output: string[] = [];
    let isError = false;
    let nextCwdId = cwdId;
    let shouldClear = false;
    let newInteractiveApp = interactiveApp;
    let newNanoFileId = nanoFileId;
    let clearCmdHistory = false;

    if (asRoot) setTempExecutionUser('root');

    const parsedPipeline = parseCommand(cmdStr);
    let finalParsed: any = null;

    if (parsedPipeline && parsedPipeline.length > 0) {
      finalParsed = parsedPipeline[0];
      let pipeBuffer = '';

      for (let cmdIndex = 0; cmdIndex < parsedPipeline.length; cmdIndex++) {
        const parsed = parsedPipeline[cmdIndex];
        const isLastCommand = cmdIndex === parsedPipeline.length - 1;
        const currentPipeInput = pipeBuffer;
        pipeBuffer = ''; // reset for next command

        // Expand ~ in arguments
        const store = useUbuntuVFSStore.getState();
        const homePath = store.getAbsolutePath(getHomeId(effectiveUser));
        parsed.args = parsed.args.map(arg => {
          if (arg === '~') return homePath;
          if (arg.startsWith('~/')) return arg.replace('~', homePath);
          return arg;
        });

        let isSuidElevated = false;
        if (!asRoot) {
          const store = useUbuntuVFSStore.getState();
          const binPaths = [`/usr/bin/${parsed.name}`, `/bin/${parsed.name}`];
          for (const p of binPaths) {
            const node = store.resolvePath(p);
            if (node && node.type === 'file' && node.permissions) {
              const mode = parseInt(node.permissions, 8);
              if ((mode & 0o4000) !== 0) { // SUID bit
                setTempExecutionUser(node.owner);
                isSuidElevated = true;
                break;
              }
            }
          }
        }

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
            
            let stdoutFd = 1;
            let stderrFd = 2;
            const openFds: number[] = [];
            
            if (parsed.redirections) {
              for (const red of parsed.redirections) {
                try {
                  const uid = appState.effectiveUser === 'root' ? 0 : 1000;
                  const mode = red.type === '>>' ? 'a' : red.type === '>' ? 'w' : 'r';
                  if (mode !== 'r') {
                    const fd = openFile(red.target, mode, cwdId, uid, 1000);
                    stdoutFd = fd;
                    openFds.push(fd);
                  }
                } catch (err: any) {
                  output.push(`bash: ${red.target}: ${err.message}`);
                  isError = true;
                  break;
                }
              }
            }
            
            let stdinFd = 0;
            
            if (parsed.redirections) {
              const stdinRedir = parsed.redirections.find(r => r.type === '<');
              if (stdinRedir) {
                try {
                  const uid = appState.effectiveUser === 'root' ? 0 : 1000;
                  stdinFd = openFile(stdinRedir.target, 'r', cwdId, uid, 1000);
                  openFds.push(stdinFd);
                } catch (err: any) {
                  output.push(`bash: ${stdinRedir.target}: ${err.message}`);
                  isError = true;
                }
              }
            }

            if (!isError) {
              const process: ProcessState = {
                pid: 100,
                fds: {},
                stdout: {
                  write: (data) => {
                    if (stdoutFd === 1) {
                      if (isLastCommand) output.push(data);
                      else pipeBuffer += data;
                    }
                    else writeToFile(stdoutFd, data);
                  },
                  writeLine: (data) => {
                    if (stdoutFd === 1) {
                      if (isLastCommand) output.push(data);
                      else pipeBuffer += (data + '\n');
                    }
                    else writeToFile(stdoutFd, data + '\n');
                  }
                },
                stderr: {
                  write: (data) => {
                    if (stderrFd === 2) { output.push(data); isError = true; }
                    else writeToFile(stderrFd, data);
                  },
                  writeLine: (data) => {
                    if (stderrFd === 2) { output.push(data); isError = true; }
                    else writeToFile(stderrFd, data + '\n');
                  }
                },
                stdin: {
                  readAll: () => {
                    if (stdinFd === 0) {
                      if (cmdIndex === 0) return '';
                      return currentPipeInput;
                    }
                    return readFile(stdinFd);
                  }
                }
              };
              
              const handlerResult = await handler(parsed.args, cwdId, updateCwd, clearHistoryFn, appState, process);
              
              if (handlerResult.nextCwdId) nextCwdId = handlerResult.nextCwdId;
              if (handlerResult.shouldClear) shouldClear = handlerResult.shouldClear;
              
              if (parsed.name === 'history' && parsed.args.includes('-c')) {
                clearCmdHistory = true;
              }

              if (handlerResult.newPasswdState) {
                return { output, isError, nextCwdId, shouldClear, newInteractiveApp, newNanoFileId, clearCmdHistory, parsed: finalParsed, newPasswdState: handlerResult.newPasswdState };
              }
            }
            
            for (const fd of openFds) closeFile(fd);

          } else {
            output = [`${parsed.name}: command not found`];
            isError = true;
          }
        }

        if (isSuidElevated) setTempExecutionUser(null);
        
        if (isError) break; // stop pipeline on error
      }
    }

    if (asRoot) setTempExecutionUser(null);
    return { output, isError, nextCwdId, shouldClear, newInteractiveApp, newNanoFileId, clearCmdHistory, parsed: finalParsed };
  };

  const handleCommand = async (rawCommand: string) => {
    const trimmed = rawCommand.trim();

    // === SUDO PASSWORD PROMPT MODE ===
    if (appState.sudoPasswordPrompt) {
      if (rawCommand === '__CTRL_C__') {
        const newHistoryEntry: HistoryEntry = {
          id: uuidv4(),
          prompt: `[sudo] password for ${username}: `,
          command: '',
          output: ['^C'],
        };
        updateAppState(windowId, {
          ...appState,
          sudoPasswordPrompt: false,
          sudoPendingCommand: undefined,
          sudoAttempts: 0,
          sudoTargetUser: undefined,
          history: [...history, newHistoryEntry],
        });
        return;
      }

      const targetUser = appState.sudoTargetUser || 'root';
      const pendingCmd = appState.sudoPendingCommand || '';
      const attempts = (appState.sudoAttempts || 0) + 1;
      
      const newHistoryEntry: HistoryEntry = {
        id: uuidv4(),
        prompt: `[sudo] password for ${username}: `,
        command: '',
        output: [],
      };

      const verifyResult = await verifySudoPassword(username, rawCommand, windowId, attempts);

      if (!verifyResult.success) {
        newHistoryEntry.isError = true;
        if (verifyResult.errorCode === 'MAX_ATTEMPTS') {
          newHistoryEntry.output = [verifyResult.error!];
          updateAppState(windowId, {
            ...appState,
            sudoPasswordPrompt: false,
            sudoPendingCommand: undefined,
            sudoTargetUser: undefined,
            sudoAttempts: 0,
            history: [...history, newHistoryEntry]
          });
        } else {
          newHistoryEntry.output = [verifyResult.error!];
          updateAppState(windowId, {
            ...appState,
            sudoAttempts: attempts,
            history: [...history, newHistoryEntry]
          });
        }
        return;
      }

      // Sudo authorized
      let execResult;
      if (pendingCmd === '__sudo_shell_authorized__') {
        execResult = { output: [], isError: false, shouldClear: false };
        updateAppState(windowId, {
          ...appState,
          effectiveUser: targetUser,
          userStack: [...(appState.userStack || []), username],
          sudoPasswordPrompt: false,
          sudoPendingCommand: undefined,
          sudoAttempts: 0,
          sudoTargetUser: undefined,
          history: [...history, newHistoryEntry]
        });
        return;
      } else if (pendingCmd) {
        const parsed = parseCommand(`sudo ${pendingCmd}`);
        let tempCwdId = cwdId;
        const sudoOutput: string[] = [];
        let sudoIsError = false;
        const mockProcess = {
          stdout: { writeLine: (l: string) => sudoOutput.push(l), write: (l: string) => sudoOutput.push(l) },
          stderr: { writeLine: (l: string) => { sudoOutput.push(l); sudoIsError = true; }, write: (l: string) => { sudoOutput.push(l); sudoIsError = true; } },
          stdin: { readAll: () => '' }
        };
        const sudoResult = await handleSudo(
          parsed![0].args, tempCwdId, (id: string) => { tempCwdId = id; }, () => {},
          appState, windowId, effectiveUser, mockProcess
        );
        execResult = { ...sudoResult, nextCwdId: tempCwdId, output: sudoOutput, isError: sudoIsError };
      } else {
        execResult = { output: [], isError: false, shouldClear: false };
      }

      newHistoryEntry.output = execResult.output || [];
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
        cwdId: execResult.nextCwdId || cwdId,
        history: newHistory,
        commandHistory: execResult.clearCmdHistory ? [] : newCommandHistory,
        interactiveApp: execResult.newInteractiveApp,
        nanoFileId: execResult.newNanoFileId,
        sudoPasswordPrompt: false,
        sudoPendingCommand: undefined,
        sudoTargetUser: undefined,
        sudoAttempts: 0,
        sudoAuthorized: true,
      });
      return;
    }

    // === SU PASSWORD PROMPT MODE ===
    if (appState.suPasswordPrompt) {
      if (rawCommand === '__CTRL_C__') {
        const newHistoryEntry: HistoryEntry = {
          id: uuidv4(),
          prompt: `Password: `,
          command: '',
          output: ['^C'],
        };
        updateAppState(windowId, {
          ...appState,
          suPasswordPrompt: false,
          sudoTargetUser: undefined,
          history: [...history, newHistoryEntry],
        });
        return;
      }

      const targetUser = appState.sudoTargetUser || 'root';
      const newHistoryEntry: HistoryEntry = {
        id: uuidv4(),
        prompt: `Password: `,
        command: '',
        output: [],
      };

      // su authenticates against the TARGET user's password, not the current user's
      const verifyResult = await verifySudoPassword(targetUser, rawCommand, windowId, 1);
      
      if (!verifyResult.success) {
        newHistoryEntry.isError = true;
        newHistoryEntry.output = ['su: Authentication failure'];
        updateAppState(windowId, {
          ...appState,
          suPasswordPrompt: false,
          sudoTargetUser: undefined,
          history: [...history, newHistoryEntry]
        });
        return;
      }

      // Success
      updateAppState(windowId, {
        ...appState,
        effectiveUser: targetUser,
        userStack: [...(appState.userStack || []), effectiveUser],
        suPasswordPrompt: false,
        sudoTargetUser: undefined,
        history: [...history, newHistoryEntry]
      });
      return;
    }

    // === PASSWD PASSWORD PROMPT MODE ===
    if (appState.passwdState) {
      const { step, targetUser, newPasswordAttempt } = appState.passwdState;

      if (rawCommand === '__CTRL_C__') {
        const newHistoryEntry: HistoryEntry = {
          id: uuidv4(),
          prompt: step === 'current' ? `Changing password for ${targetUser}.\n(current) UNIX password: ` :
                  step === 'new' ? `New password: ` : `Retype new password: `,
          command: '',
          output: ['^C'],
        };
        updateAppState(windowId, {
          ...appState,
          passwdState: undefined,
          history: [...history, newHistoryEntry],
        });
        return;
      }

      const promptStr = step === 'current' ? `Changing password for ${targetUser}.\n(current) UNIX password: ` :
                        step === 'new' ? `New password: ` : `Retype new password: `;
                        
      const newHistoryEntry: HistoryEntry = {
        id: uuidv4(),
        prompt: promptStr,
        command: '',
        output: [],
      };

      if (step === 'current') {
        const verifyResult = await verifySudoPassword(targetUser, rawCommand, windowId, 1);
        if (!verifyResult.success) {
          newHistoryEntry.isError = true;
          newHistoryEntry.output = ['passwd: Authentication token manipulation error', 'passwd: password unchanged'];
          updateAppState(windowId, {
            ...appState,
            passwdState: undefined,
            history: [...history, newHistoryEntry],
          });
        } else {
          updateAppState(windowId, {
            ...appState,
            passwdState: { ...appState.passwdState, step: 'new' },
            history: [...history, newHistoryEntry],
          });
        }
        return;
      }

      if (step === 'new') {
        updateAppState(windowId, {
          ...appState,
          passwdState: { ...appState.passwdState, step: 'confirm', newPasswordAttempt: rawCommand },
          history: [...history, newHistoryEntry],
        });
        return;
      }

      if (step === 'confirm') {
        if (rawCommand !== newPasswordAttempt) {
          newHistoryEntry.isError = true;
          newHistoryEntry.output = ['Sorry, passwords do not match.', 'passwd: Authentication token manipulation error', 'passwd: password unchanged'];
          updateAppState(windowId, {
            ...appState,
            passwdState: undefined,
            history: [...history, newHistoryEntry],
          });
          return;
        }

        const store = useUbuntuVFSStore.getState();
        const shadowNode = store.resolvePath('/etc/shadow');
        if (shadowNode && shadowNode.type === 'file') {
          const { hashPassword } = await import('../../utils/passwordHasher');
          const newHash = await hashPassword(rawCommand);
          const lines = shadowNode.content.split('\n');
          const userLineIdx = lines.findIndex(l => l.startsWith(targetUser + ':'));
          if (userLineIdx !== -1) {
            const parts = lines[userLineIdx].split(':');
            parts[1] = newHash;
            parts[2] = Math.floor(Date.now() / 86400000).toString();
            lines[userLineIdx] = parts.join(':');
            store.updateContent(shadowNode.id, lines.join('\n'), 'root');
            newHistoryEntry.output = ['passwd: password updated successfully'];
          } else {
             newHistoryEntry.output = [`passwd: user '${targetUser}' does not exist`];
             newHistoryEntry.isError = true;
          }
        } else {
          newHistoryEntry.output = ['passwd: password updated successfully'];
        }
        
        updateAppState(windowId, {
          ...appState,
          passwdState: undefined,
          history: [...history, newHistoryEntry],
        });
        return;
      }
    }

    const prompt = generatePrompt(cwdId);
    const newHistoryEntry: HistoryEntry = {
      id: uuidv4(),
      prompt,
      command: rawCommand,
      output: [],
    };

    if (rawCommand === '__CTRL_C__') {
      newHistoryEntry.output = ['^C'];
      updateAppState(windowId, {
        ...appState,
        history: [...history, newHistoryEntry],
      });
      return;
    }

    if (!trimmed) {
      updateAppState(windowId, {
        ...appState,
        history: [...history, newHistoryEntry],
      });
      return;
    }

    const parsed = parseCommand(trimmed);
    
    // PRE-LOAD LAZY PATHS
    if (parsed && parsed.length > 0) {
      for (const cmd of parsed) {
        let commandsToCheck = [cmd];
        if (cmd.name === 'sudo' || cmd.name === 'su') {
          // If sudo or su has a subcommand, parse it
          const subCmdStr = cmd.args.join(' ');
          if (subCmdStr) {
             const subParsed = parseCommand(subCmdStr);
             if (subParsed && subParsed.length > 0) commandsToCheck = commandsToCheck.concat(subParsed);
          }
        }
        
        for (const checkCmd of commandsToCheck) {
          if (['cd', 'ls', 'cat', 'nano', 'vi'].includes(checkCmd.name)) {
            const pathsToLoad = checkCmd.args.filter(a => !a.startsWith('-'));
            if (pathsToLoad.length === 0 && (checkCmd.name === 'ls' || checkCmd.name === 'cd')) {
              pathsToLoad.push('.');
            }
            for (const arg of pathsToLoad) {
               let path = arg;
               const store = useUbuntuVFSStore.getState();
               const homePath = store.getAbsolutePath(HOME_ID);
               if (path.startsWith('~/')) path = path.replace('~', homePath);
               else if (path === '~') path = homePath;
               await store.loadPathAsync(path, cwdId);
            }
          }
        }
      }
    }

    // Handle `exit` for su sessions
    if (parsed && parsed.length > 0 && parsed[0].name === 'exit') {
      if (appState.userStack && appState.userStack.length > 0) {
        const previousUser = appState.userStack[appState.userStack.length - 1];
        newHistoryEntry.output = ['exit'];
        updateAppState(windowId, {
          ...appState,
          effectiveUser: previousUser === username ? undefined : previousUser,
          userStack: appState.userStack.slice(0, -1),
          history: [...history, newHistoryEntry],
        });
        return;
      }
      // If no user stack, let normal exit command handle closing window
    }

    // Handle `sudo` delegation
    if (parsed && parsed.length > 0 && parsed[0].name === 'sudo') {
      const updateCwdId = (id: string) => { cwdId = id; }; // Or use a variable if needed, but here it's just a placeholder since sudo handles it
      const sudoOutput: string[] = [];
      let sudoIsError = false;
      const mockProcess = {
        stdout: { writeLine: (l: string) => sudoOutput.push(l), write: (l: string) => sudoOutput.push(l) },
        stderr: { writeLine: (l: string) => { sudoOutput.push(l); sudoIsError = true; }, write: (l: string) => { sudoOutput.push(l); sudoIsError = true; } },
        stdin: { readAll: () => '' }
      };
      const sudoResult = await handleSudo(
        parsed[0].args, cwdId, updateCwdId, () => {},
        appState, windowId, effectiveUser, mockProcess
      );

      if (sudoResult.needsPassword) {
        updateAppState(windowId, {
          ...appState,
          history: [...history, newHistoryEntry],
          sudoPasswordPrompt: true,
          sudoPendingCommand: sudoResult.pendingCommand,
          sudoTargetUser: sudoResult.targetUser,
          sudoAttempts: 0,
          sudoCancellable: true,
        });
        return;
      }

      newHistoryEntry.output = [...(sudoResult.output || []), ...sudoOutput];
      newHistoryEntry.isError = sudoResult.isError || sudoIsError;
      
      const newHistory = sudoResult.shouldClear ? [] : [...history, newHistoryEntry];
      const newCommandHistory = [...commandHistory, trimmed];
      if (newCommandHistory.length > 100) newCommandHistory.shift();

      updateAppState(windowId, {
        ...appState,
        cwdId: sudoResult.nextCwdId || cwdId,
        history: newHistory,
        commandHistory: sudoResult.clearCmdHistory ? [] : newCommandHistory,
        interactiveApp: sudoResult.newInteractiveApp,
        nanoFileId: sudoResult.newNanoFileId,
        passwdState: (sudoResult as any).newPasswdState,
      });
      return;
    }
    
    // Handle `su` command
    if (parsed && parsed.length > 0 && parsed[0].name === 'su') {
      const updateCwdId = (id: string) => { cwdId = id; };
      const suOutput: string[] = [];
      let suIsError = false;
      const processMock = {
        stdout: { write: (l: string) => suOutput.push(l), writeLine: (l: string) => suOutput.push(l) },
        stderr: { write: (l: string) => { suOutput.push(l); suIsError = true; }, writeLine: (l: string) => { suOutput.push(l); suIsError = true; } },
        stdin: { readAll: () => '' }, pid: 1, fds: {}
      } as any;
      const suResult = await commandRegistry['su'](parsed[0].args, cwdId, updateCwdId, () => {}, appState, processMock);
      
      if (!suIsError && !suResult.isError) {
        let targetUser = 'root';
        for (const arg of parsed[0].args) {
          if (!arg.startsWith('-')) {
            targetUser = arg;
            break;
          }
        }
        
        updateAppState(windowId, {
          ...appState,
          history: [...history, newHistoryEntry],
          suPasswordPrompt: true,
          sudoTargetUser: targetUser,
        });
        return;
      } else {
        newHistoryEntry.output = [...(suResult.output || []), ...suOutput];
        newHistoryEntry.isError = true;
        updateAppState(windowId, {
          ...appState,
          history: [...history, newHistoryEntry],
        });
        return;
      }
    }

    // Normal execution
    const execResult = await executeCommand(trimmed, false);

    newHistoryEntry.output = execResult.output || [];
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
      cwdId: execResult.nextCwdId || cwdId,
      history: newHistory,
      commandHistory: newCommandHistory,
      interactiveApp: execResult.newInteractiveApp,
      nanoFileId: execResult.newNanoFileId,
      passwdState: (execResult as any).newPasswdState,
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

  let currentPrompt = generatePrompt(cwdId);
  let isPasswordMode = false;
  if (appState.sudoPasswordPrompt) {
    currentPrompt = `[sudo] password for ${username}: `;
    isPasswordMode = true;
  } else if (appState.suPasswordPrompt) {
    currentPrompt = `Password: `;
    isPasswordMode = true;
  } else if (appState.passwdState) {
    const { step, targetUser } = appState.passwdState;
    currentPrompt = step === 'current' ? `Changing password for ${targetUser}.\n(current) UNIX password: ` :
                    step === 'new' ? `New password: ` : `Retype new password: `;
    isPasswordMode = true;
  }
  const handleTab = (currentInput: string, setInput: (v: string) => void) => {
    const result = handleAutocomplete(currentInput, cwdId);
    if (result.completion !== undefined) {
      setInput(result.completion);
    }
    if (result.suggestions && result.suggestions.length > 0) {
      const newHistoryEntry: HistoryEntry = {
        id: uuidv4(),
        prompt: currentPrompt,
        command: currentInput,
        output: result.suggestions,
      };
      updateAppState(windowId, {
        ...appState,
        history: [...history, newHistoryEntry],
      });
    }
  };

  return (
    <div 
      className="terminal-app" 
      onClick={(e) => { 
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        if (!window.getSelection()?.toString()) inputRef.current?.focus(); 
      }} 
      onKeyDown={handleKeyDown} 
      tabIndex={-1} 
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="terminal-scroll-area" ref={scrollAreaRef}>
        <TerminalOutput history={history} />
        <TerminalInput
          ref={inputRef}
          prompt={currentPrompt}
          onCommand={handleCommand}
          commandHistory={commandHistory}
          isPassword={isPasswordMode}
          onTab={handleTab}
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
  
  const appState = (windowState?.appState || {}) as TerminalAppState;
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
        style={{ background: '#373737', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', margin: '0 2px' }}
        onClick={(e) => { e.stopPropagation(); setShowSearch(!showSearch); }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>

      <div style={{ position: 'relative' }}>
        <button 
          title="Terminal Menu"
          style={{ background: '#373737', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', margin: '0 2px' }}
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {showMenu && (
          <div 
            style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              background: 'var(--color-bg-window, #333)', border: '1px solid var(--color-border, #444)', borderRadius: '6px',
              padding: '4px 0', minWidth: '150px', zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '6px 12px', fontSize: '13px', color: 'white', cursor: 'pointer' }} onClick={() => { setShowMenu(false); handleZoomIn(); }}>Zoom In (Ctrl++)</div>
            <div style={{ padding: '6px 12px', fontSize: '13px', color: 'white', cursor: 'pointer' }} onClick={() => { setShowMenu(false); handleZoomOut(); }}>Zoom Out (Ctrl+-)</div>
          </div>
        )}
      </div>
    </>
  );
}
