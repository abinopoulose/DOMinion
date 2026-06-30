import React from 'react';
import './SettingsPanelWrapper.css';

interface SettingsPanelWrapperProps {
  title: string;
  leftHeaderContent?: React.ReactNode;
  rightHeaderContent?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsPanelWrapper({ title, leftHeaderContent, rightHeaderContent, children }: SettingsPanelWrapperProps) {
  return (
    <div className="ubuntu-settings-panel-wrapper">
      <div className="settings-panel">
        <header className="ubuntu-settings-panel-header">
          {leftHeaderContent && (
            <div className="ubuntu-settings-panel-header-controls left">
              {leftHeaderContent}
            </div>
          )}
          <h1 className="ubuntu-settings-panel-title">{title}</h1>
          {rightHeaderContent && (
            <div className="ubuntu-settings-panel-header-controls right">
              {rightHeaderContent}
            </div>
          )}
        </header>
        <div className="ubuntu-settings-panel-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
