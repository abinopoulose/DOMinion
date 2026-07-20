import { create } from 'zustand';

export interface Process {
  pid: number;
  ppid: number;
  name: string;
  state: 'running' | 'sleeping' | 'zombie' | 'stopped';
  user: string;
  startTime: number;
  windowId?: string;
}

interface ProcessManagerState {
  processes: Process[];
  nextPid: number;
  spawn: (name: string, ppid: number, user: string, windowId?: string) => number;
  kill: (pid: number) => void;
  killByWindowId: (windowId: string) => void;
}

export const useProcessManager = create<ProcessManagerState>((set, get) => ({
  processes: [
    { pid: 1, ppid: 0, name: 'systemd', state: 'running', user: 'root', startTime: Date.now() },
    { pid: 2, ppid: 1, name: 'kthreadd', state: 'sleeping', user: 'root', startTime: Date.now() },
    { pid: 3, ppid: 1, name: 'dominion-wm', state: 'running', user: 'root', startTime: Date.now() }
  ],
  nextPid: 100,
  spawn: (name, ppid, user, windowId) => {
    const pid = get().nextPid;
    set(state => ({
      processes: [...state.processes, { pid, ppid, name, state: 'running', user, startTime: Date.now(), windowId }],
      nextPid: state.nextPid + 1
    }));
    return pid;
  },
  kill: (pid) => {
    set(state => ({ processes: state.processes.filter(p => p.pid !== pid) }));
  },
  killByWindowId: (windowId) => {
    set(state => ({ processes: state.processes.filter(p => p.windowId !== windowId) }));
  }
}));
