import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../hooks/usePlayer';

interface DownloadedTrack {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  downloadedAt: string;
}

const DOWNLOADS_KEY = 'ruby_downloads';

const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { recentlyPlayed, favorites } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(user?.name || '');

  useEffect(() => {
    setEditingName(user?.name || '');
  }, [user?.name]);

  const downloads = useMemo<DownloadedTrack[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || '[]');
    } catch {
      return [];
    }
  }, []);

  const onPickAvatar = () => fileInputRef.current?.click();

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateUser({ avatar: String(reader.result || '') });
    reader.readAsDataURL(file);
  };

  const onSaveName = () => {
    const clean = editingName.trim();
    if (clean) updateUser({ name: clean });
  };

  return (
    <div className="min-h-full bg-[#071321] text-white p-6 md:p-8 pb-36">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl border border-[#1d3046] bg-[#0d1a2b] p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <button onClick={onPickAvatar} className="w-24 h-24 rounded-2xl overflow-hidden border border-[#2a435e] bg-[#12243a] flex items-center justify-center shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-[#74e4f6]">{user?.name?.charAt(0) || 'R'}</span>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-[#88a8c6] mb-2">Ruby Profile</p>
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full max-w-md bg-[#10243a] border border-[#27425f] rounded-xl px-4 py-3 text-white text-2xl font-semibold outline-none"
              />
              <p className="text-[#8ea6bf] mt-2">{user?.email}</p>
            </div>
            <button onClick={onSaveName} className="rounded-xl px-5 py-3 bg-[#74e4f6] text-[#07253e] font-semibold">
              Save
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={onPickAvatar} className="rounded-lg px-4 py-2 border border-[#35536f] bg-[#11263d] text-sm text-white">
              Change Photo
            </button>
            <button onClick={logout} className="rounded-lg px-4 py-2 border border-[#5b3140] bg-[#2a1520] text-sm text-[#ffd0dc]">
              Logout
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={onAvatarChange} accept="image/*" className="hidden" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Favorites" value={favorites.length} />
          <StatCard label="Recently Played" value={recentlyPlayed.length} />
          <StatCard label="Downloads" value={downloads.length} />
        </div>

        <div className="rounded-3xl border border-[#1d3046] bg-[#0d1a2b] p-5">
          <h3 className="text-xl font-semibold mb-4">Downloaded Songs</h3>
          {downloads.length === 0 ? (
            <p className="text-[#8ea6bf]">No downloaded tracks yet. Use the download button in the player.</p>
          ) : (
            <div className="space-y-2">
              {downloads.slice(0, 30).map((song) => (
                <a
                  key={song.id}
                  href={`https://www.youtube.com/watch?v=${song.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-[#21364f] bg-[#12243a] px-4 py-3 hover:bg-[#172d47] transition-colors"
                >
                  <p className="font-semibold truncate">{song.title}</p>
                  <p className="text-sm text-[#8ea6bf] truncate">{song.artist}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-2xl border border-[#1d3046] bg-[#0d1a2b] p-4 text-center">
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs uppercase tracking-widest text-[#8ea6bf] mt-1">{label}</p>
  </div>
);

export default ProfilePage;
