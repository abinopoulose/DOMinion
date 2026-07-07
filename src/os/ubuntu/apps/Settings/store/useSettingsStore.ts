import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ubuntuIdbStorage } from '../../../store/persistence';

export type SettingsPanel = 
  | 'wifi'
  | 'network'
  | 'bluetooth'
  | 'appearance'
  | 'ubuntu-desktop'
  | 'search'
  | 'multitasking'
  | 'apps'
  | 'notifications'
  | 'privacy'
  | 'online-accounts'
  | 'sharing'
  | 'sound'
  | 'power'
  | 'displays'
  | 'mouse'
  | 'keyboard'
  | 'printers'
  | 'removable-media'
  | 'color'
  | 'accessibility'
  | 'system';

export type SystemSubPage = 
  | 'root'
  | 'region-language'
  | 'date-time'
  | 'users'
  | 'remote-desktop'
  | 'secure-shell'
  | 'about';

interface SettingsState {
  activePanel: SettingsPanel;
  systemSubPage: SystemSubPage;
  keyboardSubPage: 'root' | 'shortcuts';
  theme: 'light' | 'dark';
  accentColor: string;
  nightLight: boolean;
  dockPosition: 'left' | 'bottom' | 'right';
  dockIconSize: number;
  dockAutoHide: boolean;
  showDesktopIcons: boolean;
  wallpaper: string;
  powerMode: 'performance' | 'balanced' | 'power-saver';
  screenBlank: string;
  systemVolume: number;
  inputVolume: number;
  screenBrightness: number;
  hotCorner: boolean;
  activeScreenEdges: boolean;
  workspaceType: 'dynamic' | 'fixed';
  numberOfWorkspaces: number;
  multiMonitorWorkspaces: 'primary' | 'all';
  appSwitchingWorkspaces: 'all' | 'current';
  appSwitchingMonitors: 'all' | 'current';
  primaryButton: 'left' | 'right';
  mouseSpeed: number;
  mouseAcceleration: boolean;
  touchpadEnabled: boolean;
  disableTouchpadWhileTyping: boolean;
  touchpadPointerSpeed: number;
  secondaryClickMethod: 'two-finger' | 'corner';
  scrollMethod: 'two-finger' | 'edge';
  tapToClick: boolean;
  naturalScrolling: boolean;
  highContrast: boolean;
  largeText: boolean;
  switchDesktopShortcut: string;
  switchAppShortcut: string;
  desktopIconOrder: string[];
  desktopIconPositions: Record<string, { x: number; y: number }>;
  pinnedApps: string[];
  isSearchActive: boolean;
  searchQuery: string;
  
  // Clock Settings
  clockTimeFormat: '24-hour' | 'AM / PM';
  clockShowWeekday: boolean;
  clockShowDate: boolean;
  clockShowSeconds: boolean;
  clockShowWeekNumbers: boolean;
  
  // Actions
  setActivePanel: (panel: SettingsPanel) => void;
  setSystemSubPage: (page: SystemSubPage) => void;
  setKeyboardSubPage: (page: 'root' | 'shortcuts') => void;
  goBackFromSubPage: () => void;
  setIsSearchActive: (v: boolean) => void;
  setSearchQuery: (v: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
  setNightLight: (enabled: boolean) => void;
  setDockPosition: (position: 'left' | 'bottom' | 'right') => void;
  setDockIconSize: (size: number) => void;
  setDockAutoHide: (autoHide: boolean) => void;
  setShowDesktopIcons: (show: boolean) => void;
  setWallpaper: (wallpaper: string) => void;
  setPowerMode: (mode: 'performance' | 'balanced' | 'power-saver') => void;
  setScreenBlank: (value: string) => void;
  setSystemVolume: (v: number) => void;
  setInputVolume: (v: number) => void;
  setScreenBrightness: (v: number) => void;
  setHotCorner: (v: boolean) => void;
  setActiveScreenEdges: (v: boolean) => void;
  setWorkspaceType: (v: 'dynamic' | 'fixed') => void;
  setNumberOfWorkspaces: (v: number) => void;
  setMultiMonitorWorkspaces: (v: 'primary' | 'all') => void;
  setAppSwitchingWorkspaces: (v: 'all' | 'current') => void;
  setAppSwitchingMonitors: (v: 'all' | 'current') => void;
  setPrimaryButton: (v: 'left' | 'right') => void;
  setMouseSpeed: (v: number) => void;
  setMouseAcceleration: (v: boolean) => void;
  setTouchpadEnabled: (v: boolean) => void;
  setDisableTouchpadWhileTyping: (v: boolean) => void;
  setTouchpadPointerSpeed: (v: number) => void;
  setSecondaryClickMethod: (v: 'two-finger' | 'corner') => void;
  setScrollMethod: (v: 'two-finger' | 'edge') => void;
  setTapToClick: (v: boolean) => void;
  setNaturalScrolling: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setLargeText: (v: boolean) => void;
  setSwitchDesktopShortcut: (v: string) => void;
  setSwitchAppShortcut: (v: string) => void;
  setDesktopIconOrder: (v: string[]) => void;
  setDesktopIconPositions: (v: Record<string, { x: number; y: number }>) => void;
  setPinnedApps: (v: string[]) => void;
  setClockTimeFormat: (v: '24-hour' | 'AM / PM') => void;
  setClockShowWeekday: (v: boolean) => void;
  setClockShowDate: (v: boolean) => void;
  setClockShowSeconds: (v: boolean) => void;
  setClockShowWeekNumbers: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      activePanel: 'wifi',
      systemSubPage: 'root',
      keyboardSubPage: 'root',
      theme: 'light',
      accentColor: '#E95420',
      nightLight: false,
      dockPosition: 'left',
      dockIconSize: 48,
      dockAutoHide: false,
      showDesktopIcons: true,
      wallpaper: '',
      powerMode: 'balanced',
      screenBlank: '5',
      systemVolume: 70,
      inputVolume: 50,
      screenBrightness: 100,
      hotCorner: true,
      activeScreenEdges: true,
      workspaceType: 'dynamic',
      numberOfWorkspaces: 4,
      multiMonitorWorkspaces: 'primary',
      appSwitchingWorkspaces: 'all',
      appSwitchingMonitors: 'all',
      primaryButton: 'left',
      mouseSpeed: 50,
      mouseAcceleration: true,
      touchpadEnabled: true,
      disableTouchpadWhileTyping: true,
      touchpadPointerSpeed: 50,
      secondaryClickMethod: 'two-finger',
      scrollMethod: 'two-finger',
      tapToClick: true,
      naturalScrolling: true,
      highContrast: false,
      largeText: false,
      switchDesktopShortcut: 'ctrl+alt+arrow',
      switchAppShortcut: 'alt+tab',
      desktopIconOrder: [],
      desktopIconPositions: {},
      pinnedApps: ['file-manager', 'terminal', 'browser', 'settings'],
      isSearchActive: false,
      searchQuery: '',
      clockTimeFormat: '24-hour',
      clockShowWeekday: false,
      clockShowDate: true,
      clockShowSeconds: false,
      clockShowWeekNumbers: false,
      
      setActivePanel: (panel) => set({ activePanel: panel, systemSubPage: 'root', keyboardSubPage: 'root' }),
      setSystemSubPage: (page) => set({ systemSubPage: page }),
      setKeyboardSubPage: (page) => set({ keyboardSubPage: page }),
      goBackFromSubPage: () => set({ systemSubPage: 'root', keyboardSubPage: 'root' }),
      setIsSearchActive: (isSearchActive) => set({ isSearchActive }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setNightLight: (nightLight) => set({ nightLight }),
      setDockPosition: (dockPosition) => set({ dockPosition }),
      setDockIconSize: (dockIconSize) => set({ dockIconSize }),
      setDockAutoHide: (dockAutoHide) => set({ dockAutoHide }),
      setShowDesktopIcons: (showDesktopIcons) => set({ showDesktopIcons }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setPowerMode: (powerMode) => set({ powerMode }),
      setScreenBlank: (screenBlank) => set({ screenBlank }),
      setSystemVolume: (systemVolume) => set({ systemVolume }),
      setInputVolume: (inputVolume) => set({ inputVolume }),
      setScreenBrightness: (screenBrightness) => set({ screenBrightness }),
      setHotCorner: (hotCorner) => set({ hotCorner }),
      setActiveScreenEdges: (activeScreenEdges) => set({ activeScreenEdges }),
      setWorkspaceType: (workspaceType) => set({ workspaceType }),
      setNumberOfWorkspaces: (numberOfWorkspaces) => set({ numberOfWorkspaces }),
      setMultiMonitorWorkspaces: (multiMonitorWorkspaces) => set({ multiMonitorWorkspaces }),
      setAppSwitchingWorkspaces: (appSwitchingWorkspaces) => set({ appSwitchingWorkspaces }),
      setAppSwitchingMonitors: (appSwitchingMonitors) => set({ appSwitchingMonitors }),
      setPrimaryButton: (primaryButton) => set({ primaryButton }),
      setMouseSpeed: (mouseSpeed) => set({ mouseSpeed }),
      setMouseAcceleration: (mouseAcceleration) => set({ mouseAcceleration }),
      setTouchpadEnabled: (touchpadEnabled) => set({ touchpadEnabled }),
      setDisableTouchpadWhileTyping: (disableTouchpadWhileTyping) => set({ disableTouchpadWhileTyping }),
      setTouchpadPointerSpeed: (touchpadPointerSpeed) => set({ touchpadPointerSpeed }),
      setSecondaryClickMethod: (secondaryClickMethod) => set({ secondaryClickMethod }),
      setScrollMethod: (scrollMethod) => set({ scrollMethod }),
      setTapToClick: (tapToClick) => set({ tapToClick }),
      setNaturalScrolling: (naturalScrolling) => set({ naturalScrolling }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setLargeText: (largeText) => set({ largeText }),
      setSwitchDesktopShortcut: (switchDesktopShortcut) => set({ switchDesktopShortcut }),
      setSwitchAppShortcut: (switchAppShortcut) => set({ switchAppShortcut }),
      setDesktopIconOrder: (desktopIconOrder) => set({ desktopIconOrder }),
      setDesktopIconPositions: (desktopIconPositions) => set({ desktopIconPositions }),
      setPinnedApps: (pinnedApps) => set({ pinnedApps }),
      setClockTimeFormat: (clockTimeFormat) => set({ clockTimeFormat }),
      setClockShowWeekday: (clockShowWeekday) => set({ clockShowWeekday }),
      setClockShowDate: (clockShowDate) => set({ clockShowDate }),
      setClockShowSeconds: (clockShowSeconds) => set({ clockShowSeconds }),
      setClockShowWeekNumbers: (clockShowWeekNumbers) => set({ clockShowWeekNumbers }),
    }),
    {
      name: 'ubuntu-settings-storage',
      storage: createJSONStorage(() => ubuntuIdbStorage),
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        nightLight: state.nightLight,
        dockPosition: state.dockPosition,
        dockIconSize: state.dockIconSize,
        dockAutoHide: state.dockAutoHide,
        showDesktopIcons: state.showDesktopIcons,
        wallpaper: state.wallpaper,
        powerMode: state.powerMode,
        screenBlank: state.screenBlank,
        systemVolume: state.systemVolume,
        inputVolume: state.inputVolume,
        screenBrightness: state.screenBrightness,
        hotCorner: state.hotCorner,
        activeScreenEdges: state.activeScreenEdges,
        workspaceType: state.workspaceType,
        numberOfWorkspaces: state.numberOfWorkspaces,
        multiMonitorWorkspaces: state.multiMonitorWorkspaces,
        appSwitchingWorkspaces: state.appSwitchingWorkspaces,
        appSwitchingMonitors: state.appSwitchingMonitors,
        primaryButton: state.primaryButton,
        mouseSpeed: state.mouseSpeed,
        mouseAcceleration: state.mouseAcceleration,
        touchpadEnabled: state.touchpadEnabled,
        disableTouchpadWhileTyping: state.disableTouchpadWhileTyping,
        touchpadPointerSpeed: state.touchpadPointerSpeed,
        secondaryClickMethod: state.secondaryClickMethod,
        scrollMethod: state.scrollMethod,
        tapToClick: state.tapToClick,
        naturalScrolling: state.naturalScrolling,
        highContrast: state.highContrast,
        largeText: state.largeText,
        switchDesktopShortcut: state.switchDesktopShortcut,
        switchAppShortcut: state.switchAppShortcut,
        desktopIconOrder: state.desktopIconOrder,
        desktopIconPositions: state.desktopIconPositions,
        pinnedApps: state.pinnedApps,
        clockTimeFormat: state.clockTimeFormat,
        clockShowWeekday: state.clockShowWeekday,
        clockShowDate: state.clockShowDate,
        clockShowSeconds: state.clockShowSeconds,
        clockShowWeekNumbers: state.clockShowWeekNumbers,
      }),
    }
  )
);
