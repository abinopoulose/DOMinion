import { SettingsDropdown } from '../../components/SettingsDropdown';

export function DiagnosticsPage() {
  return (
    <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>
      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Problem Reporting</div>
      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
        Sending reports of technical problems helps us improve Ubuntu. Reports are sent anonymously and are scrubbed of personal data. <a href="#" style={{ color: '#e5534b', textDecoration: 'none' }}>Learn more</a>
      </p>
      <div className="ubuntu-settings-list-group">
        <div className="ubuntu-settings-list-item" style={{ overflow: 'visible' }}>
          <span>Send error reports to Canonical</span>
          <SettingsDropdown
            value="manual"
            onChange={() => {}}
            options={[
              { value: 'automatic', label: 'Automatic' },
              { value: 'manual', label: 'Manual' },
              { value: 'never', label: 'Never' }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
