import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export interface XTermReactRef {
  terminal: Terminal;
  fit: () => void;
}

import { ITerminalOptions } from '@xterm/xterm';

export interface XTermReactProps {
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  options?: ITerminalOptions;
}

export const XTermReact = forwardRef<XTermReactRef, XTermReactProps>(({ onData, onResize, options }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useImperativeHandle(ref, () => ({
    get terminal() { return xtermRef.current!; },
    fit: () => {
      fitAddonRef.current?.fit();
    }
  }));

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      scrollback: 10000,
      ...options,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    let dataDisposable: any;
    if (onData) {
      dataDisposable = term.onData(onData);
    }

    let resizeDisposable: any;
    if (onResize) {
      resizeDisposable = term.onResize(({ cols, rows }) => onResize(cols, rows));
    }

    const handleWindowResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      dataDisposable?.dispose();
      resizeDisposable?.dispose();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (xtermRef.current && options) {
      Object.entries(options).forEach(([key, value]) => {
        try {
          xtermRef.current!.options[key as keyof ITerminalOptions] = value as any;
        } catch {
          // ignore invalid options
        }
      });
      setTimeout(() => fitAddonRef.current?.fit(), 0);
    }
  }, [options]);

  return (
    <div 
      ref={terminalRef} 
      style={{ width: '100%', height: '100%', overflow: 'hidden' }} 
    />
  );
});
