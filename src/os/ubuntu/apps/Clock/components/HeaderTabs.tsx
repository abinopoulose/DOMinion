

interface HeaderTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function HeaderTabs({ activeTab, onTabChange }: HeaderTabsProps) {
  const tabs = ['World', 'Alarms', 'Stopwatch', 'Timer'];
  
  return (
    <div className="clock-header-tabs-container">
      <div className="clock-header-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`clock-tab-button ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
            onClick={() => onTabChange(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
