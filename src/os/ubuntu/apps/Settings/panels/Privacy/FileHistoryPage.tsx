import { useState } from 'react';
import { SettingsDropdown } from '../../components/SettingsDropdown';
// useUbuntuVFSStore removed
import { getTrashId } from '../../../../fs/seed';
import { useUbuntuAuthStore } from '../../../../store/useUbuntuAuthStore';

export function FileHistoryPage() {
  const [fileHistory, setFileHistory] = useState(true);
  const [autoDeleteTrash, setAutoDeleteTrash] = useState(false);
  const [autoDeleteTemp, setAutoDeleteTemp] = useState(false);

  const currentUser = useUbuntuAuthStore(state => state.currentUser || 'ubuntu');

  const handleEmptyTrash = async () => {
    try {
      const dbModule = await import('../../../../fs/db');
      const operations = await import('../../../../fs/operations');
      const db = await dbModule.getDB();
      const trashId = getTrashId(currentUser);
      const children = await db.getAllFromIndex('inodes', 'by-parent', trashId);
      for (const child of children) {
        await operations.removeNode(child.id);
      }
    } catch (err) {
      console.error('Failed to empty trash', err);
    }
  };

  const handleDeleteTemp = async () => {
    try {
      const dbModule = await import('../../../../fs/db');
      const operations = await import('../../../../fs/operations');
      const db = await dbModule.getDB();
      const nodes = await db.getAllFromIndex('inodes', 'by-parent', 'root');
      const tmpNode = nodes.find(n => n.name === 'tmp');
      if (tmpNode) {
        const children = await db.getAllFromIndex('inodes', 'by-parent', tmpNode.id);
        for (const child of children) {
          await operations.removeNode(child.id);
        }
      }
    } catch (err) {
      console.error('Failed to clear tmp', err);
    }
  };

  return (
    <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>
      {/* File History Section */}
      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>File History</div>
      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        File history keeps a record of files that you have used. This information is shared between apps, and makes it easier to find files that you might want to use.
      </p>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '12px' }}>
        <div className="ubuntu-settings-list-item interactive" onClick={() => setFileHistory(!fileHistory)}>
          <span>File History</span>
          <div className={`ubuntu-settings-toggle ${fileHistory ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item" style={{ overflow: 'visible' }}>
          <span>File History Duration</span>
          <SettingsDropdown
            value="forever"
            onChange={() => {}}
            options={[
              { value: '1', label: '1 day' },
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
              { value: 'forever', label: 'Forever' }
            ]}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
        <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#e5534b', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
          Clear History...
        </button>
      </div>

      {/* Trash & Temporary Files Section */}
      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Trash & Temporary Files</div>
      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        Trash and temporary files can sometimes include personal or sensitive information. Automatically deleting them can help to protect privacy.
      </p>
      <div className="ubuntu-settings-list-group" style={{ marginBottom: '12px' }}>
        <div className="ubuntu-settings-list-item interactive" onClick={() => setAutoDeleteTrash(!autoDeleteTrash)}>
          <span>Automatically Delete Trash Content</span>
          <div className={`ubuntu-settings-toggle ${autoDeleteTrash ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item interactive" onClick={() => setAutoDeleteTemp(!autoDeleteTemp)}>
          <span>Automatically Delete Temporary Files</span>
          <div className={`ubuntu-settings-toggle ${autoDeleteTemp ? 'checked' : ''}`}>
            <div className="ubuntu-settings-toggle-knob" />
          </div>
        </div>
        <div className="ubuntu-settings-list-item" style={{ overflow: 'visible' }}>
          <span>Automatically Delete Period</span>
          <SettingsDropdown
            value="30"
            onChange={() => {}}
            options={[
              { value: '1', label: '1 hour' },
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' }
            ]}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '32px' }}>
        <button onClick={handleEmptyTrash} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#e5534b', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
          Empty Trash...
        </button>
        <button onClick={handleDeleteTemp} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#e5534b', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
          Delete Temporary Files...
        </button>
      </div>
    </div>
  );
}
