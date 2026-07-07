import React from 'react';
import './SettingsPanelWrapper.css';

interface SettingsPanelWrapperProps {
  title?: string;
  leftHeaderContent?: React.ReactNode;
  centerHeaderContent?: React.ReactNode;
  rightHeaderContent?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string | number;
}

export function SettingsPanelWrapper({ title: _title, leftHeaderContent, centerHeaderContent, rightHeaderContent, children, maxWidth }: SettingsPanelWrapperProps) {
  const hasHeader = leftHeaderContent || centerHeaderContent || rightHeaderContent;

  return (
    <div className="ubuntu-settings-panel-wrapper">
      <div className="settings-panel" style={maxWidth ? { maxWidth } : undefined}>
        {hasHeader && (
          <header className="ubuntu-settings-panel-header">
            {leftHeaderContent && (
              <div className="ubuntu-settings-panel-header-controls left">
                {leftHeaderContent}
              </div>
            )}
            {centerHeaderContent && (
              <div className="ubuntu-settings-panel-header-controls center" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                {centerHeaderContent}
              </div>
            )}
            {rightHeaderContent && (
              <div className="ubuntu-settings-panel-header-controls right">
                {rightHeaderContent}
              </div>
            )}
          </header>
        )}
        <div className="ubuntu-settings-panel-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
