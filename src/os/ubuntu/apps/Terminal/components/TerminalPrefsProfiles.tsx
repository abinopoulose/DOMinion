
import { useTerminalProfileStore } from '../store/useTerminalProfileStore';
import { LucidePlus, LucideMoreVertical } from 'lucide-react';
import { TerminalPrefsSelect } from './TerminalPrefsSelect';

export function TerminalPrefsProfiles() {
  const { profiles, activeProfileIndex, switchProfile, addProfile } = useTerminalProfileStore();
  const activeProfile = profiles[activeProfileIndex];

  if (!activeProfile) return null;

  return (
    <div className="term-prefs-profiles">
      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Profiles</h3>
        <div className="term-prefs-list-card">
          <div className="term-prefs-list-row" style={{ padding: '8px 16px' }}>
            <TerminalPrefsSelect 
              className="term-prefs-profile-select"
              value={activeProfileIndex.toString()}
              onChange={(val) => switchProfile(Number(val))}
              options={profiles.map((p, idx) => ({ value: idx.toString(), label: p.name }))}
            />
            <button className="term-prefs-icon-btn" style={{ width: 24, height: 24 }}>
              <LucideMoreVertical size={16} />
            </button>
          </div>
          <button 
            className="term-prefs-list-row term-prefs-add-btn" 
            onClick={() => addProfile(`Profile ${profiles.length + 1}`)}
          >
            <LucidePlus size={16} /> Add Profile
          </button>
        </div>
      </div>
      
    </div>
  );
}
