import { describe, it, expect } from 'vitest';
import { useProcessManager } from '../../../../src/os/ubuntu/services/ProcessManager';

describe('Process Manager', () => {
  it('has initial processes', () => {
    const { processes } = useProcessManager.getState();
    expect(processes.length).toBeGreaterThan(0);
    expect(processes.find(p => p.name === 'systemd')).toBeDefined();
  });

  it('spawns a new process', () => {
    const pid = useProcessManager.getState().spawn('test_proc', 1, 'abino', 'win1');
    expect(pid).toBeGreaterThan(0);
    
    const { processes } = useProcessManager.getState();
    const proc = processes.find(p => p.pid === pid);
    expect(proc).toBeDefined();
    expect(proc?.name).toBe('test_proc');
    expect(proc?.windowId).toBe('win1');
  });

  it('kills a process by pid', () => {
    const pid = useProcessManager.getState().spawn('test_proc_kill', 1, 'abino');
    expect(useProcessManager.getState().processes.find(p => p.pid === pid)).toBeDefined();
    
    useProcessManager.getState().kill(pid);
    expect(useProcessManager.getState().processes.find(p => p.pid === pid)).toBeUndefined();
  });

  it('kills processes by window id', () => {
    useProcessManager.getState().spawn('proc1', 1, 'abino', 'win_kill');
    useProcessManager.getState().spawn('proc2', 1, 'abino', 'win_kill');
    
    useProcessManager.getState().killByWindowId('win_kill');
    const { processes } = useProcessManager.getState();
    expect(processes.find(p => p.windowId === 'win_kill')).toBeUndefined();
  });
});
