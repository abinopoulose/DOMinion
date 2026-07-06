import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { PANELS, getIconForPanel } from '../config/panels';

interface SettingsSidebarProps {
  searchQuery: string;
}

export function SettingsSidebar({ searchQuery }: SettingsSidebarProps) {
  const { activePanel, setActivePanel } = useSettingsStore();

  const filteredPanels = PANELS.filter(panel => 
    panel.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="ubuntu-settings-sidebar">
      <ul className="ubuntu-settings-sidebar-list">
        {filteredPanels.map((panel) => (
          <React.Fragment key={panel.id}>
            <li 
              className={`ubuntu-settings-sidebar-item ${activePanel === panel.id ? 'active' : ''}`}
              onClick={() => setActivePanel(panel.id)}
            >
              <div className="ubuntu-settings-sidebar-item-content">
                {getIconForPanel(panel.id)}
                <span>{panel.label}</span>
              </div>
            </li>
            {panel.separatorAfter && <li className="ubuntu-settings-sidebar-separator" />}
          </React.Fragment>
        ))}
      </ul>
    </aside>
  );
}
