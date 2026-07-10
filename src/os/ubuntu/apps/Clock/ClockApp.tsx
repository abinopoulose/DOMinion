import { useState } from 'react';
import './ClockApp.css';
import { HeaderTabs } from './components/HeaderTabs';
import { WorldClocksView } from './views/WorldClocksView';
import { AlarmsView } from './views/AlarmsView';
import { StopwatchView } from './views/StopwatchView';
import { TimerView } from './views/TimerView';

export function ClockApp(_props: { windowId?: string }) {
  const [activeTab, setActiveTab] = useState('world');

  return (
    <div className="clock-app-container">
      <HeaderTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'world' && <WorldClocksView />}
      {activeTab === 'alarms' && <AlarmsView />}
      {activeTab === 'stopwatch' && <StopwatchView />}
      {activeTab === 'timer' && <TimerView />}
    </div>
  );
}

export function ClockHeaderControls(_props: { windowId: string }) {
  return null; 
}
