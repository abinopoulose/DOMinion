import { useEffect } from 'react';
import { useProcessManager, type Process } from '../../services/ProcessManager';
import { useWindowAPI } from '../../hooks/useWindowAPI';
import './SystemMonitor.css';

export function SystemMonitor({ windowId }: { windowId: string }) {
  const { setTitle } = useWindowAPI(windowId);
  const processes = useProcessManager((s) => s.processes);
  const kill = useProcessManager((s) => s.kill);

  useEffect(() => {
    setTitle('System Monitor');
  }, [setTitle]);

  return (
    <div className="system-monitor-container">
      <div className="system-monitor-header">
        <h2>Processes</h2>
      </div>
      <div className="system-monitor-table-container">
        <table className="system-monitor-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>Name</th>
              <th>User</th>
              <th>State</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p: Process) => (
              <tr key={p.pid}>
                <td>{p.pid}</td>
                <td>{p.name}</td>
                <td>{p.user}</td>
                <td>
                  <span className={`state-badge state-${p.state}`}>{p.state}</span>
                </td>
                <td>
                  <button 
                    className="btn-kill"
                    onClick={() => {
                      if (window.confirm(`Force quit ${p.name} (PID: ${p.pid})?`)) {
                        kill(p.pid);
                        // Also kill window if present
                        if (p.windowId) {
                           const isIframe = window.self !== window.top;
                           if (isIframe && window.parent) {
                             // Let's send a custom IPC command to close the window
                             window.parent.postMessage({ type: 'OS_API_CLOSE_WINDOW', windowId: p.windowId }, '*');
                           }
                        }
                      }
                    }}
                    disabled={p.pid <= 3} // protect system processes
                  >
                    Force Quit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
