import { useEffect } from 'react';
import { useSystemDialogStore } from '../../store/useSystemDialogStore';
import { useHardwareStore } from '../../../../hardware/store/useHardwareStore';
import { useUbuntuAuthStore } from '../../store/useUbuntuAuthStore';
import { useWindowStore } from '../../store/useUbuntuWindowStore';
import { PolkitDialog } from './PolkitDialog';
import './SystemDialog.css';

export function SystemDialog() {
  const { activeDialog, closeDialog } = useSystemDialogStore();
  const powerOff = useHardwareStore((s) => s.powerOff);
  const logout = useUbuntuAuthStore((s) => s.logout);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeDialog) {
        closeDialog();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDialog, closeDialog]);

  useEffect(() => {
    if (!activeDialog || activeDialog === 'auth' || activeDialog === 'polkit') return;
    
    const dialogToExecute = activeDialog;

    const timer = setTimeout(() => {
      useSystemDialogStore.getState().closeDialog();
      
      if (dialogToExecute === 'power_off') {
        useWindowStore.getState().clearAllWindows();
        useHardwareStore.getState().powerOff();
      } else if (dialogToExecute === 'restart') {
        useWindowStore.getState().clearAllWindows();
        useHardwareStore.getState().powerOff();
        setTimeout(() => useHardwareStore.getState().turnOn(), 3500);
      } else if (dialogToExecute === 'log_out') {
        useUbuntuAuthStore.getState().logout();
      }
    }, 60000);

    return () => clearTimeout(timer);
  }, [activeDialog]);

  if (!activeDialog) return null;

  let title = '';
  let message = '';
  let actionText = '';
  let isDestructive = false;
  let action = () => {};

  switch (activeDialog) {
    case 'power_off':
      title = 'Power Off';
      message = 'The system will power off automatically in 60 seconds.';
      actionText = 'Power Off';
      isDestructive = true;
      action = () => { closeDialog(); useWindowStore.getState().clearAllWindows(); powerOff(); };
      break;
    case 'restart':
      title = 'Restart';
      message = 'The system will restart automatically in 60 seconds.';
      actionText = 'Restart';
      isDestructive = true;
      action = () => { 
        closeDialog(); 
        useWindowStore.getState().clearAllWindows(); 
        const hw = useHardwareStore.getState();
        hw.powerOff();
        setTimeout(() => hw.turnOn(), 3500);
      };
      break;
    case 'log_out':
      title = 'Log Out';
      message = 'You will be logged out automatically in 60 seconds.';
      actionText = 'Log Out';
      isDestructive = false;
      action = () => { closeDialog(); logout(); };
      break;
    case 'suspend':
      title = 'Suspend';
      message = 'Are you sure you want to suspend the system?';
      actionText = 'Suspend';
      isDestructive = false;
      action = () => { closeDialog(); useHardwareStore.getState().suspend(); };
      break;
  }

  if (activeDialog === 'auth' || activeDialog === 'polkit') {
    return <PolkitDialog />;
  }

  return (
    <div className="system-dialog-overlay" onClick={closeDialog}>
      <div className="system-dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="system-dialog-header">{title}</div>
        <div className="system-dialog-body">{message}</div>
        <div className="system-dialog-actions">
          <button className="system-dialog-btn system-dialog-btn-cancel" onClick={closeDialog}>
            Cancel
          </button>
          <button 
            className={`system-dialog-btn ${isDestructive ? 'system-dialog-btn-destructive' : 'system-dialog-btn-primary'}`} 
            onClick={action}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
}
