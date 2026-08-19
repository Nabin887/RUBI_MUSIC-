import { useEffect, useSyncExternalStore } from 'react';
import { ViewType } from '../App';

export interface AppSettings {
  theme: 'dark' | 'night';
  accent: 'emerald' | 'cyan';
  audioQuality: 'Basic (24kbps)' | 'Standard (96kbps)' | 'High (160kbps)' | 'Ultra (320kbps)';
  crossfade: number;
  normalizeVolume: boolean;
  automix: boolean;
  dataSaver: boolean;
  listeningActivity: boolean;
  showArtistHistory: boolean;
  showVisualizer: boolean;
  showLyricsByDefault: boolean;
  compactMode: boolean;
  reducedMotion: boolean;
  startPage: ViewType;
  cacheSize: string;
}

const SETTINGS_KEY = 'ruby_app_settings';

const defaultSettings: AppSettings = {
  theme: 'night',
  accent: 'cyan',
  audioQuality: 'High (160kbps)',
  crossfade: 6,
  normalizeVolume: true,
  automix: true,
  dataSaver: false,
  listeningActivity: true,
  showArtistHistory: true,
  showVisualizer: true,
  showLyricsByDefault: true,
  compactMode: false,
  reducedMotion: false,
  startPage: 'home',
  cacheSize: '1.2 GB',
};

let currentSettings: AppSettings = defaultSettings;
const listeners = new Set<() => void>();

const isBrowser = () => typeof window !== 'undefined';

const readSettings = (): AppSettings => {
  if (!isBrowser()) return defaultSettings;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
};

const applySettingsToDocument = (settings: AppSettings) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;
  const accent = settings.accent === 'cyan'
    ? { primary: '#66dff3', glow: 'rgba(102,223,243,0.32)', soft: '#123944' }
    : { primary: '#26d79b', glow: 'rgba(38,215,155,0.34)', soft: '#123a2d' };
  const theme = settings.theme === 'night'
    ? { bg: '#061319', panel: '#111f28', card: '#142633', border: '#274053' }
    : { bg: '#08171d', panel: '#14242c', card: '#182b38', border: '#2c4557' };

  root.style.setProperty('--ruby-accent', accent.primary);
  root.style.setProperty('--ruby-accent-glow', accent.glow);
  root.style.setProperty('--ruby-accent-soft', accent.soft);
  root.style.setProperty('--ruby-bg', theme.bg);
  root.style.setProperty('--ruby-panel', theme.panel);
  root.style.setProperty('--ruby-card', theme.card);
  root.style.setProperty('--ruby-border', theme.border);

  body.style.backgroundColor = theme.bg;
  body.classList.toggle('ruby-compact', settings.compactMode);
  body.classList.toggle('ruby-reduced-motion', settings.reducedMotion);
};

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const persistSettings = (settings: AppSettings) => {
  currentSettings = settings;
  if (isBrowser()) {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applySettingsToDocument(settings);
  }
  emitChange();
};

export const updateAppSettings = (patch: Partial<AppSettings>) => {
  persistSettings({ ...currentSettings, ...patch });
};

export const resetAppSettings = () => {
  persistSettings(defaultSettings);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== SETTINGS_KEY) return;
    currentSettings = readSettings();
    applySettingsToDocument(currentSettings);
    emitChange();
  };

  if (isBrowser()) {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (isBrowser()) {
      window.removeEventListener('storage', onStorage);
    }
  };
};

const getSnapshot = () => currentSettings;

currentSettings = readSettings();
applySettingsToDocument(currentSettings);

export const useAppSettings = () => {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    applySettingsToDocument(settings);
  }, [settings]);

  return {
    settings,
    updateSettings: updateAppSettings,
    resetSettings: resetAppSettings,
  };
};

export { defaultSettings };
