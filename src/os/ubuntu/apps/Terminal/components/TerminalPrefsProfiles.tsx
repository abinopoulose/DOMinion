import { useTerminalProfileStore } from '../store/useTerminalProfileStore';
import { LucidePlus, LucideMoreVertical, LucideCheck } from 'lucide-react';

export function TerminalPrefsProfiles() {
  const { profiles, activeProfileIndex, switchProfile, addProfile } = useTerminalProfileStore();
  const activeProfile = profiles[activeProfileIndex];

  if (!activeProfile) return null;

  return (
    <div className="term-prefs-profiles">
      <div className="term-prefs-list-group">
        <h3 className="term-prefs-list-title">Profiles</h3>
        <div className="term-prefs-list-card">
          {profiles.map((profile, idx) => {
            const isActive = idx === activeProfileIndex;
            return (
              <div 
                key={idx} 
                className="term-prefs-profile-row"
                onClick={() => switchProfile(idx)}
              >
                <div className="term-prefs-profile-info">
                  <span className="term-prefs-profile-name">{profile.name}</span>
                </div>
                <div className="term-prefs-profile-actions">
                  {isActive && (
                    <div className="term-prefs-profile-check">
                      <LucideCheck size={16} />
                    </div>
                  )}
                  <button 
                    className="term-prefs-icon-btn" 
                    style={{ width: 24, height: 24 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Future: Open profile context menu
                    }}
                  >
                    <LucideMoreVertical size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {profiles.length < 5 && (
            <button 
              className="term-prefs-profile-row term-prefs-add-btn" 
              onClick={() => addProfile('Untitled Profile')}
              style={{ justifyContent: 'center' }}
            >
              <LucidePlus size={16} /> Add Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
