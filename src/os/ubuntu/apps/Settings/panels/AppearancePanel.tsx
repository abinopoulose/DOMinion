import { useSettingsStore } from '../store/useSettingsStore';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import './AppearancePanel.css';
import { useEffect } from 'react';

const ACCENT_COLORS = [
  { id: 'orange', name: 'Orange', hex: '#E95420' },
  { id: 'bark', name: 'Bark', hex: '#785a46' },
  { id: 'sage', name: 'Sage', hex: '#43746a' },
  { id: 'olive', name: 'Olive', hex: '#5e6231' },
  { id: 'viridian', name: 'Viridian', hex: '#3a8276' },
  { id: 'prusink', name: 'Prusink', hex: '#2d5b69' },
  { id: 'magenta', name: 'Magenta', hex: '#a24f6f' },
  { id: 'purple', name: 'Purple', hex: '#5e3a82' },
];

export function AppearancePanel() {
  const { theme, setTheme, accentColor, setAccentColor, wallpaper, setWallpaper } = useSettingsStore();

  useEffect(() => {
    // Apply accent color directly to document body or root
    document.documentElement.style.setProperty('--color-accent', accentColor);
  }, [accentColor]);

  return (
    <SettingsPanelWrapper title="Appearance">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '13px', fontWeight: 'bold', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase' }}>
        Style
      </div>
      
      <div className="appearance-theme-cards">
        <div 
          className={`appearance-theme-card ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
        >
          <div className="appearance-theme-preview light">
            <div className="appearance-theme-preview-header" />
            <div className="appearance-theme-preview-body">
              <div className="appearance-theme-preview-window" />
            </div>
          </div>
          <span className="appearance-theme-label">Light</span>
        </div>

        <div 
          className={`appearance-theme-card ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
        >
          <div className="appearance-theme-preview dark">
            <div className="appearance-theme-preview-header" />
            <div className="appearance-theme-preview-body">
              <div className="appearance-theme-preview-window" />
            </div>
          </div>
          <span className="appearance-theme-label">Dark</span>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '32px 8px 8px', fontSize: '13px', fontWeight: 'bold', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase' }}>
        Color
      </div>
      
      <div className="settings-card">
        <div className="settings-row" style={{ justifyContent: 'center', padding: '16px' }}>
          <div className="appearance-accent-container">
          {ACCENT_COLORS.map(color => (
            <button
              key={color.id}
              className={`appearance-accent-color ${accentColor === color.hex ? 'active' : ''}`}
              style={{ backgroundColor: color.hex }}
              onClick={() => setAccentColor(color.hex)}
              title={color.name}
              aria-label={`Set accent color to ${color.name}`}
            >
              {accentColor === color.hex && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="ubuntu-settings-section-title" style={{ padding: '32px 8px 8px', fontSize: '13px', fontWeight: 'bold', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase' }}>
        Background
      </div>
      
      <div className="settings-card">
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="settings-row-title">Custom Wallpaper</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{
                background: 'var(--color-surface-hover)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                Upload File
                <input 
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        if (e.target?.result) {
                          setWallpaper(e.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <button 
                onClick={() => setWallpaper('')}
                style={{
                  background: 'var(--color-surface-hover)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                Reset
              </button>
            </div>
          </div>
          
          <input 
            type="text" 
            value={wallpaper} 
            onChange={(e) => setWallpaper(e.target.value)}
            placeholder="/ubuntu_wallpaper.jpg or https://..."
            style={{ 
              background: 'rgba(0,0,0,0.05)', 
              border: '1px solid rgba(0,0,0,0.1)', 
              color: 'var(--text-primary, #1e1e1e)',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              width: '100%'
            }}
          />
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
