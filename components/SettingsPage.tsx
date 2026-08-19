import React, { useState } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { useAuth } from '../context/AuthContext';
import { ICON_SETTINGS } from '../constants';
import { useAppSettings } from '../hooks/useAppSettings';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-xs uppercase tracking-[0.2em] text-[#8ca5bf] mb-3">{title}</h2>
    <div className="rounded-2xl overflow-hidden border border-[#25374d] bg-[#111a28]">
      {children}
    </div>
  </section>
);

const Row: React.FC<{ label: string; description?: string; control: React.ReactNode }> = ({ label, description, control }) => (
  <div className="px-4 py-4 border-b border-white/5 last:border-b-0 flex items-center justify-between gap-4">
    <div>
      <p className="text-white text-sm font-medium">{label}</p>
      {description ? <p className="text-[#8ca5bf] text-xs mt-1">{description}</p> : null}
    </div>
    {control}
  </div>
);

const Toggle: React.FC<{ value: boolean; onChange: () => void }> = ({ value, onChange }) => (
  <button onClick={onChange} className={`w-11 h-6 rounded-full p-1 ${value ? 'bg-[#3de0a2]' : 'bg-[#334559]'}`}>
    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`} />
  </button>
);

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentVibe } = usePlayer();
  const { settings, updateSettings } = useAppSettings();

  const [crossfade, setCrossfade] = useState(6);
  const [automix, setAutomix] = useState(true);
  const [normalize, setNormalize] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [audioQuality, setAudioQuality] = useState('High');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 pb-56 md:pb-44">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-12 h-12 rounded-2xl bg-[#0f2b46] border border-[#2b4867] text-[#67def2] flex items-center justify-center">
          {React.cloneElement(ICON_SETTINGS as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 22, height: 22 })}
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          <p className="text-[#8ca5bf] text-sm">Simple music player preferences</p>
        </div>
      </div>

      <Section title="Profile">
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-white font-medium">{user?.name}</p>
            <p className="text-[#8ca5bf] text-sm">{user?.email}</p>
            <p className="text-[#67def2] text-xs mt-1">Current vibe: {currentVibe}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-3 py-2 rounded-lg border border-[#39506c] bg-[#13243a] text-sm text-white disabled:opacity-60"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </Section>

      <Section title="Audio">
        <Row
          label="Crossfade"
          description={`${crossfade}s between songs`}
          control={<input type="range" min={0} max={12} value={crossfade} onChange={(e) => setCrossfade(Number(e.target.value))} className="accent-[#67def2]" />}
        />
        <Row label="Automix" description="Smooth transition between songs" control={<Toggle value={automix} onChange={() => setAutomix((v) => !v)} />} />
        <Row label="Volume normalization" description="Keep volume level balanced" control={<Toggle value={normalize} onChange={() => setNormalize((v) => !v)} />} />
        <Row
          label="Audio quality"
          description="Streaming quality"
          control={
            <select value={audioQuality} onChange={(e) => setAudioQuality(e.target.value)} className="bg-[#0f1a29] border border-[#25374e] rounded-lg px-3 py-2 text-sm text-white">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          }
        />
      </Section>

      <Section title="App">
        <Row label="Data saver" description="Reduce data usage" control={<Toggle value={dataSaver} onChange={() => setDataSaver((v) => !v)} />} />
        <Row label="Notifications" description="Playback and release notifications" control={<Toggle value={notifications} onChange={() => setNotifications((v) => !v)} />} />
        <Row
          label="Show lyrics by default"
          description="Open lyrics when player expands"
          control={<Toggle value={settings.showLyricsByDefault} onChange={() => updateSettings({ showLyricsByDefault: !settings.showLyricsByDefault })} />}
        />
      </Section>
    </div>
  );
};

export default SettingsPage;
