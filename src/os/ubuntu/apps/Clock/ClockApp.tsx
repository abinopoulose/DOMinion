import { useState, useEffect, useMemo } from 'react';
import { useWindowAPI } from '../../hooks/useWindowAPI';
import './ClockApp.css';
import { HeaderTabs } from './components/HeaderTabs';
import { WorldClocksView } from './views/WorldClocksView';
import { AlarmsView } from './views/AlarmsView';
import { StopwatchView } from './views/StopwatchView';
import { TimerView } from './views/TimerView';

export function ClockApp({ windowId }: { windowId?: string }) {
  const { getState, updateState } = useWindowAPI(windowId || '');
  const initialAppState = useMemo(() => getState<any>() || {}, [getState]);

  const [activeTab, setActiveTab] = useState(initialAppState.activeTab || 'world');

  // Sync activeTab back to appState for persistence
  useEffect(() => {
    if (windowId) {
      updateState({ activeTab });
    }
  }, [activeTab, updateState, windowId]);

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
