import { ShellEnvironment } from './ShellEnvironment';
import { StandardStream, type StandardStreams } from './Streams';
import { parseCommand } from '../commandParser';
import { commandRegistry } from '../commands';
import { handleAutocomplete } from '../utils/autocomplete';
import { expandAll } from '../commandParser/expand';

export class PTY {
  private xtermWrite: (data: string) => void;
  public env: ShellEnvironment;
  private inputBuffer: string = '';
  private pendingMultiline: string = '';
  private isExecuting: boolean = false;
  private abortController: AbortController | null = null;
  public interactiveReadResolver: ((val: string) => void) | null = null;
  public isInteractiveReadSilent: boolean = false;
  
  private historyIndex: number = -1;
  private savedInputBuffer: string = '';
  private cursorPos: number = 0;
  
  private isReverseSearching: boolean = false;
  private searchQuery: string = '';

  public onClearRequest: () => void = () => {};
  public onExitRequest: () => void = () => {};
  public onCommandComplete: () => void = () => {};

  constructor(xtermWrite: (data: string) => void, env: ShellEnvironment) {
    this.xtermWrite = xtermWrite;
    this.env = env;
  }

  getPromptString(): string {
    if (this.isReverseSearching) {
      return `(reverse-i-search)\`${this.searchQuery}': `;
    }
    
    const ps1 = this.env.envVars['PS1'];
    if (ps1) {
      return this.expandPS1(ps1);
    }
    
    const homePath = this.env.effectiveUser === 'root' ? '/root' : `/home/${this.env.effectiveUser}`;
    let displayPath = this.env.cwdPath;
    if (displayPath.startsWith(homePath)) {
      displayPath = '~' + displayPath.slice(homePath.length);
    }
    const promptChar = this.env.effectiveUser === 'root' ? '#' : '$';
    const hostname = localStorage.getItem('ubuntu-hostname') || 'envyy';
    return `\x1b[32m${this.env.effectiveUser}@${hostname}\x1b[0m:\x1b[34m${displayPath}\x1b[0m${promptChar} `;
  }

  private expandPS1(ps1: string): string {
    let result = ps1;
    const hostname = localStorage.getItem('ubuntu-hostname') || 'envyy';
    const homePath = this.env.effectiveUser === 'root' ? '/root' : `/home/${this.env.effectiveUser}`;
    let displayPath = this.env.cwdPath;
    if (displayPath.startsWith(homePath)) {
      displayPath = '~' + displayPath.slice(homePath.length);
    }
    const basename = this.env.cwdPath === '/' ? '/' : this.env.cwdPath.split('/').pop() || '/';
    const promptChar = this.env.effectiveUser === 'root' ? '#' : '$';
    
    const now = new Date();
    const time24 = now.toTimeString().split(' ')[0]; // HH:MM:SS
    let h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const time12 = `${h.toString().padStart(2, '0')}:${m}:${s}`;
    
    result = result
      .replace(/\\u/g, this.env.effectiveUser)
      .replace(/\\h/g, hostname.split('.')[0])
      .replace(/\\H/g, hostname)
      .replace(/\\w/g, displayPath)
      .replace(/\\W/g, basename)
      .replace(/\\\$/g, promptChar)
      .replace(/\\d/g, now.toDateString())
      .replace(/\\t/g, time24)
      .replace(/\\T/g, time12)
      .replace(/\\@/g, `${time12} ${ampm}`)
      .replace(/\\n/g, '\r\n')
      .replace(/\\e/g, '\x1b')
      .replace(/\\033/g, '\x1b')
      .replace(/\\\[/g, '') // Non-printing start (ignore for display)
      .replace(/\\\]/g, '') // Non-printing end
      .replace(/\\\\/g, '\\');
      
    return result;
  }

  async initShell() {
    try {
      const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
      const { readFile } = await import('../../../fs/operations');
      const cwdAbs = await getAbsolutePathAsync(this.env.cwdId);
      const bashrcNode = await resolveRelativePathAsync(cwdAbs, `/home/${this.env.effectiveUser}/.bashrc`);
      
      if (bashrcNode && bashrcNode.type === 'file') {
        const absPath = await getAbsolutePathAsync(bashrcNode.id);
        const blob = await readFile(absPath);
        const content = await blob.text();
        
        const { ScriptParser } = await import('./ScriptParser');
        const { ScriptRunner } = await import('./ScriptRunner');
        const { StandardStream } = await import('./Streams');
        
        const parser = new ScriptParser(content);
        const ast = parser.parse();
        
        const runner = new ScriptRunner(this.env, { stdin: new StandardStream(false), stdout: new StandardStream(false), stderr: new StandardStream(false) });
        (runner as any).pty.onCommandComplete = () => {};
        
        // We do not want to output stdout to terminal during bashrc execution
        // except perhaps if there's an echo. But normally it's silent.
        
        await runner.execute(ast);
      }
    } catch (e) {
      // Ignore
    }
    
    this.writePrompt();
  }

  writePrompt() {
    this.xtermWrite(this.getPromptString());
  }

  private redrawLine() {
    this.xtermWrite('\r\x1b[K');
    this.writePrompt();
    this.xtermWrite(this.inputBuffer);
    
    if (this.cursorPos < this.inputBuffer.length) {
      const diff = this.inputBuffer.length - this.cursorPos;
      this.xtermWrite(`\x1b[${diff}D`);
    }
  }

  private handleHistoryUp() {
    if (this.env.commandHistory.length === 0) return;
    
    if (this.historyIndex === -1) {
      this.savedInputBuffer = this.inputBuffer;
      this.historyIndex = this.env.commandHistory.length - 1;
    } else if (this.historyIndex > 0) {
      this.historyIndex--;
    }
    
    this.inputBuffer = this.env.commandHistory[this.historyIndex];
    this.cursorPos = this.inputBuffer.length;
    this.redrawLine();
  }

  private handleHistoryDown() {
    if (this.historyIndex === -1) return;
    
    if (this.historyIndex < this.env.commandHistory.length - 1) {
      this.historyIndex++;
      this.inputBuffer = this.env.commandHistory[this.historyIndex];
    } else {
      this.historyIndex = -1;
      this.inputBuffer = this.savedInputBuffer;
    }
    
    this.cursorPos = this.inputBuffer.length;
    this.redrawLine();
  }

  private handleCursorLeft() {
    if (this.cursorPos > 0) {
      this.cursorPos--;
      this.xtermWrite('\x1b[D');
    }
  }

  private handleCursorRight() {
    if (this.cursorPos < this.inputBuffer.length) {
      this.cursorPos++;
      this.xtermWrite('\x1b[C');
    }
  }

  private handleHome() {
    if (this.cursorPos > 0) {
      const diff = this.cursorPos;
      this.cursorPos = 0;
      this.xtermWrite(`\x1b[${diff}D`);
    }
  }

  private handleEnd() {
    if (this.cursorPos < this.inputBuffer.length) {
      const diff = this.inputBuffer.length - this.cursorPos;
      this.cursorPos = this.inputBuffer.length;
      this.xtermWrite(`\x1b[${diff}C`);
    }
  }

  private handleReverseSearch(data: string) {
    if (data === '\r') {
      this.isReverseSearching = false;
      this.historyIndex = -1;
      this.cursorPos = this.inputBuffer.length;
      this.xtermWrite('\r\n');
      this.executeCommand(this.inputBuffer).then(() => {
        this.inputBuffer = '';
        this.isExecuting = false;
        this.cursorPos = 0;
        this.writePrompt();
        this.onCommandComplete();
      });
      return;
    }

    if (data === '\u0003' || data === '\x1b') {
      this.isReverseSearching = false;
      this.inputBuffer = this.savedInputBuffer;
      this.cursorPos = this.inputBuffer.length;
      this.historyIndex = -1;
      this.redrawLine();
      return;
    }

    if (data === '\u007F') {
      if (this.searchQuery.length > 0) {
        this.searchQuery = this.searchQuery.slice(0, -1);
      } else {
        return;
      }
    } else if (data >= String.fromCharCode(0x20) && data <= String.fromCharCode(0x7E)) {
      this.searchQuery += data;
    } else {
      return;
    }

    let found = false;
    for (let i = this.env.commandHistory.length - 1; i >= 0; i--) {
      if (this.env.commandHistory[i].includes(this.searchQuery)) {
        this.inputBuffer = this.env.commandHistory[i];
        found = true;
        break;
      }
    }
    if (!found) {
      this.inputBuffer = '';
    }
    this.redrawLine();
  }

  handleData(data: string) {
    if (this.isExecuting && !this.interactiveReadResolver) {
      return;
    }

    if (this.isReverseSearching) {
      this.handleReverseSearch(data);
      return;
    }

    if (data.startsWith('\x1b[')) {
      switch (data) {
        case '\x1b[A': this.handleHistoryUp(); break;
        case '\x1b[B': this.handleHistoryDown(); break;
        case '\x1b[C': this.handleCursorRight(); break;
        case '\x1b[D': this.handleCursorLeft(); break;
        case '\x1b[H': this.handleHome(); break;
        case '\x1b[F': this.handleEnd(); break;
      }
      return;
    } else if (data === '\x1b[1~') {
      this.handleHome();
      return;
    } else if (data === '\x1b[4~') {
      this.handleEnd();
      return;
    }

    switch (data) {
      case '\x0C': // Ctrl+L
        this.xtermWrite('\x1b[2J\x1b[3J\x1b[H');
        this.writePrompt();
        this.xtermWrite(this.inputBuffer);
        if (this.cursorPos < this.inputBuffer.length) {
          const diff = this.inputBuffer.length - this.cursorPos;
          this.xtermWrite(`\x1b[${diff}D`);
        }
        break;
      case '\x15': // Ctrl+U
        if (this.cursorPos > 0) {
          this.inputBuffer = this.inputBuffer.slice(this.cursorPos);
          this.cursorPos = 0;
          this.redrawLine();
        }
        break;
      case '\x0b': // Ctrl+K
        if (this.cursorPos < this.inputBuffer.length) {
          this.inputBuffer = this.inputBuffer.slice(0, this.cursorPos);
          this.redrawLine();
        }
        break;
      case '\x17': // Ctrl+W
        if (this.cursorPos > 0) {
          const beforeCursor = this.inputBuffer.slice(0, this.cursorPos);
          const afterCursor = this.inputBuffer.slice(this.cursorPos);
          
          const trimmed = beforeCursor.trimEnd();
          const lastSpaceIdx = trimmed.lastIndexOf(' ');
          const newBeforeCursor = lastSpaceIdx >= 0 ? trimmed.slice(0, lastSpaceIdx + 1) : '';
          
          this.inputBuffer = newBeforeCursor + afterCursor;
          this.cursorPos = newBeforeCursor.length;
          this.redrawLine();
        }
        break;
      case '\x04': // Ctrl+D
        if (this.inputBuffer.length === 0 && this.pendingMultiline.length === 0) {
          this.onExitRequest();
        } else if (this.cursorPos < this.inputBuffer.length) {
          // Forward delete
          const before = this.inputBuffer.slice(0, this.cursorPos);
          const after = this.inputBuffer.slice(this.cursorPos + 1);
          this.inputBuffer = before + after;
          this.redrawLine();
        }
        break;
      case '\x1A': // Ctrl+Z
        if (this.isExecuting) {
          this.abortController?.abort();
          this.isExecuting = false;
        }
        this.xtermWrite('^Z\r\n[1]+  Stopped\r\n');
        this.inputBuffer = '';
        this.pendingMultiline = '';
        this.cursorPos = 0;
        this.writePrompt();
        break;
      case '\r': // Enter
        if (this.interactiveReadResolver) {
          const result = this.inputBuffer;
          const resolver = this.interactiveReadResolver;
          this.inputBuffer = '';
          this.cursorPos = 0;
          this.interactiveReadResolver = null;
          this.isInteractiveReadSilent = false;
          this.xtermWrite('\r\n');
          resolver(result);
          break;
        }

        this.historyIndex = -1;
        this.cursorPos = this.inputBuffer.length;
        this.xtermWrite('\r\n');
        
        const fullInput = this.pendingMultiline + this.inputBuffer;
        if (fullInput.endsWith('\\')) {
          this.pendingMultiline = fullInput.slice(0, -1);
          this.inputBuffer = '';
          this.cursorPos = 0;
          this.xtermWrite('> ');
          return;
        }
        
        const hasUnclosedQuotes = (str: string) => {
          let inS = false, inD = false;
          for (const c of str) {
            if (c === "'" && !inD) inS = !inS;
            if (c === '"' && !inS) inD = !inD;
          }
          return inS || inD;
        };
        
        if (hasUnclosedQuotes(fullInput)) {
          this.pendingMultiline = fullInput + '\n';
          this.inputBuffer = '';
          this.cursorPos = 0;
          this.xtermWrite('> ');
          return;
        }
        
        this.executeCommand(fullInput).then(() => {
          this.inputBuffer = '';
          this.pendingMultiline = '';
          this.isExecuting = false;
          this.cursorPos = 0;
          this.writePrompt();
          this.onCommandComplete();
        });
        break;
      case '\u007F': // Backspace
        if (this.cursorPos > 0) {
          const before = this.inputBuffer.slice(0, this.cursorPos - 1);
          const after = this.inputBuffer.slice(this.cursorPos);
          this.inputBuffer = before + after;
          this.cursorPos--;
          this.redrawLine();
        }
        break;
      case '\u0003': // Ctrl+C
        if (this.interactiveReadResolver) {
          this.interactiveReadResolver('');
          this.interactiveReadResolver = null;
          this.xtermWrite('^C\r\n');
          this.writePrompt();
          break;
        }
        if (this.isExecuting) {
          this.abortController?.abort();
          this.isExecuting = false;
        }
        this.inputBuffer = '';
        this.pendingMultiline = '';
        this.cursorPos = 0;
        this.historyIndex = -1;
        this.xtermWrite('^C\r\n');
        this.writePrompt();
        break;
      case '\t': // Tab
        if (this.interactiveReadResolver) break; // Disable tab complete in read
        handleAutocomplete(this.inputBuffer, this.env.cwdPath).then(result => {
          if (result.completion) {
            const append = result.completion.substring(this.inputBuffer.length);
            this.inputBuffer += append;
            this.cursorPos += append.length;
            this.redrawLine();
          } else if (result.suggestions && result.suggestions.length > 0) {
            this.xtermWrite('\r\n' + result.suggestions.join('\r\n') + '\r\n');
            this.redrawLine();
          }
        });
        break;
      case '\x12': // Ctrl+R
        this.isReverseSearching = true;
        this.searchQuery = '';
        this.savedInputBuffer = this.inputBuffer;
        this.redrawLine();
        break;
      case '\x01': // Ctrl+A
        this.handleHome();
        break;
      case '\x05': // Ctrl+E
        this.handleEnd();
        break;
      case '\x15': // Ctrl+U
        if (this.cursorPos > 0) {
          this.inputBuffer = this.inputBuffer.slice(this.cursorPos);
          this.cursorPos = 0;
          this.redrawLine();
        }
        break;
      case '\x0B': // Ctrl+K
        if (this.cursorPos < this.inputBuffer.length) {
          this.inputBuffer = this.inputBuffer.slice(0, this.cursorPos);
          this.redrawLine();
        }
        break;
      case '\x17': // Ctrl+W
        if (this.cursorPos > 0) {
          const beforeCursor = this.inputBuffer.slice(0, this.cursorPos);
          const afterCursor = this.inputBuffer.slice(this.cursorPos);
          const match = beforeCursor.match(/(\S+\s*)$/);
          if (match) {
            const wordLength = match[0].length;
            this.inputBuffer = beforeCursor.slice(0, -wordLength) + afterCursor;
            this.cursorPos -= wordLength;
            this.redrawLine();
          }
        }
        break;
      default:
        if (data >= String.fromCharCode(0x20) && data <= String.fromCharCode(0x7E)) {
          const before = this.inputBuffer.slice(0, this.cursorPos);
          const after = this.inputBuffer.slice(this.cursorPos);
          this.inputBuffer = before + data + after;
          this.cursorPos += data.length;
          
          if (this.isInteractiveReadSilent) return;
          
          if (this.cursorPos === this.inputBuffer.length) {
            this.xtermWrite(data);
          } else {
            this.redrawLine();
          }
        }
    }
  }

  public interactiveRead(promptStr: string = '', silent: boolean = false): Promise<string> {
    if (promptStr) this.xtermWrite(promptStr);
    this.isInteractiveReadSilent = silent;
    this.inputBuffer = '';
    this.cursorPos = 0;
    return new Promise(resolve => {
      this.interactiveReadResolver = resolve;
    });
  }

  async executeCommand(rawStr: string) {
    this.isExecuting = true;
    this.abortController = new AbortController();
    this.env.abortSignal = this.abortController.signal;
    this.env.interactiveRead = this.interactiveRead.bind(this);
    
    const trimmed = rawStr.trim();
    
    if (trimmed) {
      this.env.commandHistory.push(trimmed);
      if (this.env.commandHistory.length > 100) this.env.commandHistory.shift();
    } else {
      return;
    }

    const chainedCommands = parseCommand(trimmed);
    if (!chainedCommands || chainedCommands.length === 0) return;

    // Check if it's a direct script execution (e.g. ./script.sh or /home/script.sh)
    const firstToken = chainedCommands[0].pipeline?.[0]?.name;
    if (firstToken && (firstToken.startsWith('./') || firstToken.startsWith('/'))) {
      try {
        const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
        const { readFile, stat } = await import('../../../fs/operations');
        const cwdAbs = await getAbsolutePathAsync(this.env.cwdId);
        const node = await resolveRelativePathAsync(cwdAbs, firstToken);
        if (node && node.type === 'file') {
          const absPath = await getAbsolutePathAsync(node.id);
          const fileStat = await stat(absPath);
          // Check mock executable bit (if owner exec is set or just assume yes for .sh)
          if ((fileStat.permissions & 0o100) || firstToken.endsWith('.sh')) {
            const blob = await readFile(absPath);
            const content = await blob.text();
            if (content.startsWith('#!/bin/bash') || content.startsWith('#!/bin/sh') || firstToken.endsWith('.sh')) {
              const { ScriptParser } = await import('./ScriptParser');
              const { ScriptRunner } = await import('./ScriptRunner');
              const parser = new ScriptParser(content);
              const ast = parser.parse();
              const runner = new ScriptRunner(this.env, { stdin: new StandardStream(false), stdout: new StandardStream(false), stderr: new StandardStream(true) });
              
              // Forward stdout to terminal
              (runner as any).pty.onCommandComplete = () => {};
              (runner as any).pty.xtermWrite = this.xtermWrite;

              this.env.lastExitCode = await runner.execute(ast);
              return;
            }
          }
        }
      } catch (e) {
        // Fallthrough
      }
    }

    let skipNext = false;
    let lastExitCode = 0;

    for (const chainedCmd of chainedCommands) {
      if (skipNext) {
        if (chainedCmd.chainOp === '&&' && lastExitCode !== 0) {
           skipNext = true;
        } else if (chainedCmd.chainOp === '||' && lastExitCode === 0) {
           skipNext = true;
        } else if (chainedCmd.chainOp === ';') {
           skipNext = false;
        } else {
           skipNext = false;
        }
        continue;
      }

      const pipeline = chainedCmd.pipeline;
      if (!pipeline || pipeline.length === 0) continue;

      let prevStdout: StandardStream | null = null;

      for (let i = 0; i < pipeline.length; i++) {
        const parsed = pipeline[i];
        const isFirst = i === 0;
        const isLast = i === pipeline.length - 1;

        const rawArgs = [parsed.name, ...parsed.args];
        const expandedArgs = await expandAll(rawArgs, this.env);
        
        let cmdName = expandedArgs.length > 0 ? expandedArgs[0] : parsed.name;
        let cmdArgs = expandedArgs.slice(1);

        if (this.env.aliases[cmdName]) {
          const aliasTokens = this.env.aliases[cmdName].split(' ').filter(Boolean);
          if (aliasTokens.length > 0) {
            cmdName = aliasTokens[0];
            cmdArgs = [...aliasTokens.slice(1), ...cmdArgs];
          }
        }

        let handler = commandRegistry[cmdName as any];
        if (!handler) {
          if (this.env.functions && this.env.functions[cmdName]) {
            const funcBody = this.env.functions[cmdName];
            
            // Create a dummy handler for the function
            handler = async (fArgs, fEnv, fStreams) => {
              const oldArgs = [...fEnv.positionalArgs];
              fEnv.positionalArgs = [cmdName, ...fArgs];
              
              const { ScriptRunner } = await import('./ScriptRunner');
              const runner = new ScriptRunner(fEnv, fStreams);
              (runner as any).pty.onCommandComplete = () => {};
              (runner as any).pty.xtermWrite = this.xtermWrite;
              
              const code = await runner.execute(funcBody);
              fEnv.positionalArgs = oldArgs;
              return code;
            };
          } else {
            this.xtermWrite(`${cmdName}: command not found\r\n`);
            this.env.lastExitCode = 127;
            lastExitCode = 127;
            break; 
          }
        }

        const streams: StandardStreams = {
          stdin: isFirst ? new StandardStream(false) : (prevStdout as StandardStream),
          stdout: new StandardStream(isLast),
          stderr: new StandardStream(true),
        };

        const inRedir = parsed.redirections?.find(r => r.type === '<');
        if (inRedir) {
          try {
            const expTarget = await expandAll([inRedir.target], this.env);
            const target = expTarget.length > 0 ? expTarget[0] : inRedir.target;
            const { resolveRelativePathAsync, getAbsolutePathAsync } = await import('../../../fs/pathResolver');
            const { readFile } = await import('../../../fs/operations');
            const cwdAbs = await getAbsolutePathAsync(this.env.cwdId);
            const targetNode = await resolveRelativePathAsync(cwdAbs, target);
            if (!targetNode) throw new Error(`${target}: No such file or directory`);
            const targetPath = await getAbsolutePathAsync(targetNode.id);
            const blob = await readFile(targetPath);
            const text = await blob.text();
            streams.stdin.appendToBuffer(text);
          } catch (e: any) {
            this.xtermWrite(`bash: ${inRedir.target}: No such file or directory\r\n`);
            this.env.lastExitCode = 1;
            lastExitCode = 1;
            break;
          }
        }

        let outRedirContent = '';
        const outRedir = parsed.redirections?.find(r => r.type === '>' || r.type === '>>');

        if (isLast && !outRedir) {
          streams.stdout.onData((data) => this.xtermWrite(data));
        } else if (outRedir) {
          streams.stdout.onData((data) => {
             outRedirContent += data;
          });
        }

        if (!isLast) {
          const nextStdin = new StandardStream(false);
          streams.stdout.onData((data) => {
            nextStdin.appendToBuffer(data);
          });
          prevStdout = nextStdin;
        }

        streams.stderr.onData((data) => {
          // Format stderr in red, ensuring we don't break newlines in a way that messes up xterm
          this.xtermWrite(`\x1b[31m${data.replace(/\r?\n$/, '')}\x1b[0m\r\n`);
        });

        try {
          if (typeof handler === 'function') {
             lastExitCode = await handler(cmdArgs, this.env, streams) ?? 0;
          } else if (typeof handler === 'object' && 'run' in handler) {
             lastExitCode = await (handler as any).run(cmdArgs, this.env, streams) ?? 0;
          } else {
             this.xtermWrite(`Command ${cmdName} is not migrated to new architecture.\r\n`);
             lastExitCode = 1;
          }
        } catch (err: any) {
          this.xtermWrite(`bash: ${err.message}\r\n`);
          lastExitCode = 1;
        }

        if (outRedir) {
          try {
             const expTarget = await expandAll([outRedir.target], this.env);
             const target = expTarget.length > 0 ? expTarget[0] : outRedir.target;
             const { resolveRelativePathAsync, getAbsolutePathAsync } = await import('../../../fs/pathResolver');
             const { writeFile } = await import('../../../fs/operations');
             const cwdAbs = await getAbsolutePathAsync(this.env.cwdId);
             let targetNode = await resolveRelativePathAsync(cwdAbs, target);
             let targetPath = '';
             if (targetNode) {
               targetPath = await getAbsolutePathAsync(targetNode.id);
             } else {
               const parts = target.split('/');
               const destName = parts.pop()!;
               const parentPath = parts.join('/') || '.';
               const parentNode = await resolveRelativePathAsync(cwdAbs, parentPath);
               if (!parentNode) throw new Error();
               const parentAbs = await getAbsolutePathAsync(parentNode.id);
               targetPath = parentAbs === '/' ? '/' + destName : parentAbs + '/' + destName;
             }
             await writeFile(targetPath, outRedirContent, { append: outRedir.type === '>>' });
          } catch (e: any) {
             this.xtermWrite(`bash: ${outRedir.target}: Permission denied or error\r\n`);
             lastExitCode = 1;
          }
        }

        this.env.lastExitCode = lastExitCode;
      }

      if (chainedCmd.chainOp === '&&' && lastExitCode !== 0) {
        skipNext = true;
      } else if (chainedCmd.chainOp === '||' && lastExitCode === 0) {
        skipNext = true;
      } else {
        skipNext = false;
      }
    }
  }
}
