import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';

export function NetworkPanel() {
  return (
    <SettingsPanelWrapper title="Network">
      <div className="ubuntu-settings-panel-empty-state">
        <svg 
          width="96" 
          height="96" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ opacity: 0.3, marginBottom: '24px' }}
        >
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <path d="M6 18h.01" />
          <path d="M10 18h.01" />
          <path d="M14 18h.01" />
          <path d="M18 18h.01" />
          <path d="M12 14V2" />
          <path d="M8 6h8" />
          <path d="M10 10h4" />
        </svg>
        <h2 style={{ fontSize: '24px', fontWeight: 'normal', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>
          Network Settings Unavailable
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Your network connection is managed by your host operating system and browser.
        </p>
      </div>
    </SettingsPanelWrapper>
  );
}
