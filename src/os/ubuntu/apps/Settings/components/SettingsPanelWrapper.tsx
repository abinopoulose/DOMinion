import React from 'react';
import './SettingsPanelWrapper.css';

interface SettingsPanelWrapperProps {
  title?: string;
  leftHeaderContent?: React.ReactNode;
  rightHeaderContent?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsPanelWrapper({ title, leftHeaderContent, rightHeaderContent, children }: SettingsPanelWrapperProps) {
  const hasHeader = leftHeaderContent || rightHeaderContent;

  return (
    <div className="ubuntu-settings-panel-wrapper">
      <div className="settings-panel">
        {hasHeader && (
          <header className="ubuntu-settings-panel-header">
            {leftHeaderContent && (
              <div className="ubuntu-settings-panel-header-controls left">
                {leftHeaderContent}
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
