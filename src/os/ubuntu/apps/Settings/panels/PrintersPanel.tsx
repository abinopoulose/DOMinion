import { SettingsPanelWrapper } from '../components/SettingsPanelWrapper';

export function PrintersPanel() {
  const headerContent = (
    <button className="ubuntu-settings-back-button" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
      Add Printer...
    </button>
  );

  return (
    <SettingsPanelWrapper title="Printers" headerContent={headerContent}>
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
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        <h2 style={{ fontSize: '24px', fontWeight: 'normal', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>
          No Printers Found
        </h2>
      </div>
    </SettingsPanelWrapper>
  );
}
