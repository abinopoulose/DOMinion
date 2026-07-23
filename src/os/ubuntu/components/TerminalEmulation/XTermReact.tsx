import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';

export interface XTermReactRef {
  terminal: Terminal;
  fit: () => void;
  searchAddon: SearchAddon;
}

import type { ITerminalOptions } from '@xterm/xterm';

export interface XTermReactProps {
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  options?: ITerminalOptions;
}

export const XTermReact = forwardRef<XTermReactRef, XTermReactProps>(({ onData, onResize, options }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);

  useImperativeHandle(ref, () => ({
    get terminal() { return xtermRef.current!; },
    fit: () => {
      fitAddonRef.current?.fit();
    },
    get searchAddon() { return searchAddonRef.current!; }
  }));

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      scrollback: 10000,
      bellStyle: 'none',
      ...options,
    });
    
    term.onBell(() => {
      if (terminalRef.current) {
        terminalRef.current.style.transition = 'opacity 0.1s ease';
        terminalRef.current.style.opacity = '0.7';
        setTimeout(() => {
          if (terminalRef.current) {
            terminalRef.current.style.opacity = '1';
          }
        }, 100);
      }
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    const searchAddon = new SearchAddon();
    term.loadAddon(searchAddon);
    
    searchAddon.onDidChangeResults((e) => {
      window.dispatchEvent(new CustomEvent('terminal:search-results', {
        detail: { resultIndex: e?.resultIndex ?? -1, resultCount: e?.resultCount ?? 0 }
      }));
    });

    term.open(terminalRef.current);
    if (terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
      try { fitAddon.fit(); } catch {}
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;
    
    term.attachCustomKeyEventHandler((event) => {
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
        if (event.type === 'keydown') {
          const selection = term.getSelection();
          if (selection) navigator.clipboard.writeText(selection);
        }
        return false;
      }
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyV') {
        if (event.type === 'keydown') {
          navigator.clipboard.readText().then(text => {
            term.paste(text);
          }).catch(() => {});
        }
        return false;
      }
      return true;
    });

    let dataDisposable: any;
    if (onData) {
      dataDisposable = term.onData(onData);
    }

    let resizeDisposable: any;
    if (onResize) {
      resizeDisposable = term.onResize(({ cols, rows }) => onResize(cols, rows));
    }

    let resizeTimeout: any;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          if (terminalRef.current && terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
            try { fitAddonRef.current?.fit(); } catch {}
          }
        });
      }, 20);
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      dataDisposable?.dispose();
      resizeDisposable?.dispose();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (xtermRef.current && options) {
      Object.entries(options).forEach(([key, value]) => {
        try {
          (xtermRef.current!.options as any)[key] = value;
        } catch {
          // ignore invalid options
        }
      });
      setTimeout(() => {
        if (terminalRef.current && terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
          try { fitAddonRef.current?.fit(); } catch {}
        }
      }, 0);
    }
  }, [options]);

  return (
    <div 
      ref={terminalRef} 
      style={{ width: '100%', height: '100%', overflow: 'hidden' }} 
    />
  );
});
