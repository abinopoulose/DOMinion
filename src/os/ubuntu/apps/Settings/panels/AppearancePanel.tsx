import { useSettingsStore } from '../store/useSettingsStore';
import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';
import './AppearancePanel.css';
import { useEffect, useMemo } from 'react';

const ACCENT_COLORS = [
  { id: 'orange', name: 'Orange', hex: '#E95420' },
  { id: 'bark', name: 'Bark', hex: '#785a46' },
  { id: 'sage', name: 'Sage', hex: '#43746a' },
  { id: 'olive', name: 'Olive', hex: '#5e6231' },
  { id: 'viridian', name: 'Viridian', hex: '#3a8276' },
  { id: 'prusink', name: 'Prusink', hex: '#2d5b69' },
  { id: 'blue', name: 'Blue', hex: '#0073E5' },
  { id: 'purple', name: 'Purple', hex: '#5e3a82' },
  { id: 'magenta', name: 'Magenta', hex: '#a24f6f' },
  { id: 'red', name: 'Red', hex: '#C7162B' },
];

export function AppearancePanel() {
  const { theme, setTheme, accentColor, setAccentColor, wallpaper, setWallpaper } = useSettingsStore();

  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', accentColor);
  }, [accentColor]);

  const availableWallpapers = useMemo(() => {
    const modules = import.meta.glob('/public/ubuntu/wallpapers/*.(jpg|jpeg|png|webp)', { eager: true });
    return Object.keys(modules).map(path => path.replace('/public', ''));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setWallpaper(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <SettingsPanelWrapper title="Appearance">
      <div className="ubuntu-settings-section-title" style={{ padding: '0 8px 8px', fontSize: '13px', fontWeight: 'bold', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase' }}>
        Style
      </div>
      
      <div className="settings-card appearance-style-card">
        <div className="appearance-theme-cards">
          <div 
            className={`appearance-theme-card ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <div className="appearance-theme-preview light">
              <div className="appearance-theme-preview-window" />
            </div>
            <span className="appearance-theme-label">Default</span>
          </div>

          <div 
            className={`appearance-theme-card ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <div className="appearance-theme-preview dark">
              <div className="appearance-theme-preview-window" />
            </div>
            <span className="appearance-theme-label">Dark</span>
          </div>
        </div>

        <div className="appearance-color-row">
          <span className="appearance-color-label">Color</span>
          <div className="appearance-accent-container">
            {ACCENT_COLORS.map(color => (
              <button
                key={color.id}
                className={`appearance-accent-color ${accentColor === color.hex ? 'active' : ''}`}
                style={{ 
                  backgroundColor: color.hex,
                  border: accentColor === color.hex ? `2px solid ${color.hex}` : '2px solid transparent',
                  boxShadow: accentColor === color.hex ? `inset 0 0 0 3px var(--color-bg-window)` : 'none'
                }}
                onClick={() => setAccentColor(color.hex)}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="appearance-background-header">
        <div className="ubuntu-settings-section-title" style={{ fontSize: '13px', fontWeight: 'bold', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase' }}>
          Background
        </div>
        <label className="appearance-add-picture-btn">
          + Add Picture...
          <input 
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </label>
      </div>
      
      <div className="settings-card appearance-background-card">
        <div className="appearance-wallpaper-grid">
          {availableWallpapers.map((url, idx) => (
            <div 
              key={idx} 
              className={`appearance-wallpaper-item ${wallpaper === url ? 'active' : ''}`}
              onClick={() => setWallpaper(url)}
            >
              <img src={url} alt="Wallpaper" loading="lazy" />
              {wallpaper === url && (
                <div className="appearance-wallpaper-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          
          {wallpaper && !availableWallpapers.includes(wallpaper) && wallpaper.startsWith('data:') && (
            <div 
              className="appearance-wallpaper-item active"
              onClick={() => setWallpaper(wallpaper)}
            >
              <img src={wallpaper} alt="Custom Wallpaper" />
              <div className="appearance-wallpaper-check">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsPanelWrapper>
  );
}
