import { useContext } from 'react';
import { create } from 'zustand';
import { LucideSearch, LucideType, LucideUser, LucideKeyboard, LucideUsers, LucideX } from 'lucide-react';
import { WindowDragContext } from '../../../components/Window/Window';
import { TerminalPrefsAppearance } from './TerminalPrefsAppearance';
import { TerminalPrefsBehavior } from './TerminalPrefsBehavior';
import { TerminalPrefsShortcuts } from './TerminalPrefsShortcuts';
import { TerminalPrefsProfiles } from './TerminalPrefsProfiles';
import './TerminalPreferences.css';

interface TerminalPrefsUIStore {
  activeTab: 'appearance' | 'behavior' | 'shortcuts' | 'profiles';
  setActiveTab: (tab: 'appearance' | 'behavior' | 'shortcuts' | 'profiles') => void;
}

const useTerminalPrefsUIStore = create<TerminalPrefsUIStore>((set) => ({
  activeTab: 'appearance',
  setActiveTab: (activeTab) => set({ activeTab })
}));

export function TerminalPreferencesHeader({ onClose }: { onClose?: () => void }) {
  const { activeTab, setActiveTab } = useTerminalPrefsUIStore();
  const dragHandlers = useContext(WindowDragContext);
  
  return (
    <div 
      className="term-prefs-header-controls"
      onPointerDown={(dragHandlers as any)?.onPointerDown}
      onPointerMove={(dragHandlers as any)?.onPointerMove}
      onPointerUp={(dragHandlers as any)?.onPointerUp}
    >
      <button className="term-prefs-icon-btn"><LucideSearch size={16} /></button>
      <div className="term-prefs-tabs">
        <button 
          className={`term-prefs-tab ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <LucideType size={14} /> Appearance
        </button>
        <button 
          className={`term-prefs-tab ${activeTab === 'behavior' ? 'active' : ''}`}
          onClick={() => setActiveTab('behavior')}
        >
          <LucideUser size={14} /> Behavior
        </button>
        <button 
          className={`term-prefs-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
          onClick={() => setActiveTab('shortcuts')}
        >
          <LucideKeyboard size={14} /> Shortcuts
        </button>
        <button 
          className={`term-prefs-tab ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          <LucideUsers size={14} /> Profiles
        </button>
      </div>
      <div style={{ flex: 1 }} />
      <button className="term-prefs-icon-btn" onClick={onClose}><LucideX size={16} /></button>
    </div>
  );
}

export function TerminalPreferences({ onClose }: { onClose?: () => void }) {
  const { activeTab } = useTerminalPrefsUIStore();

  return (
    <div className="term-prefs-modal">
      <TerminalPreferencesHeader onClose={onClose} />
      <div className="term-prefs-content">
        {activeTab === 'appearance' && <TerminalPrefsAppearance />}
        {activeTab === 'behavior' && <TerminalPrefsBehavior />}
        {activeTab === 'shortcuts' && <TerminalPrefsShortcuts />}
        {activeTab === 'profiles' && <TerminalPrefsProfiles />}
      </div>
    </div>
  );
}
