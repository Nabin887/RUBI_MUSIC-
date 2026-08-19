import React, { useState } from 'react';
import { Song } from '../../types';

interface ModeSwitchControllerProps {
  playbackMode: 'audio' | 'video';
  setPlaybackMode: (mode: 'audio' | 'video') => void;
  currentSong: Song | null;
  currentTime: number;
  seek: (time: number) => void;
  videoEnabled: boolean;
  className?: string;
}

const AUDIO_ICON = '🎧';
const VIDEO_ICON = '📺';

const ModeSwitchController: React.FC<ModeSwitchControllerProps> = ({
  playbackMode,
  setPlaybackMode,
  currentSong,
  currentTime,
  seek,
  videoEnabled,
  className = '',
}) => {
  const [message, setMessage] = useState('');

  const switchMode = (target: 'audio' | 'video') => {
    if (target === playbackMode) return;

    if (target === 'video') {
      if (!videoEnabled) {
        setMessage('Video is disabled in settings');
        setTimeout(() => setMessage(''), 1800);
        return;
      }
      if (!currentSong?.videoId) {
        setMessage('Video not available');
        setTimeout(() => setMessage(''), 1800);
        return;
      }
    }

    const stamp = currentTime;
    setPlaybackMode(target);
    window.setTimeout(() => seek(stamp), 120);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center rounded-xl bg-[#101b2b] border border-[#24384f] p-1 gap-1 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
        <button
          onClick={() => switchMode('audio')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            playbackMode === 'audio' ? 'bg-[#43dbf2] text-[#0a2a44]' : 'text-[#d2ddeb] hover:bg-[#17293e]'
          }`}
        >
          {AUDIO_ICON} Audio
        </button>
        <button
          onClick={() => switchMode('video')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            playbackMode === 'video' ? 'bg-[#43dbf2] text-[#0a2a44]' : 'text-[#d2ddeb] hover:bg-[#17293e]'
          }`}
        >
          {VIDEO_ICON} Video
        </button>
      </div>
      {message ? (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] px-3 py-1.5 rounded-lg text-xs bg-[#2a1d22] border border-[#533142] text-[#ffc7d7] whitespace-nowrap">
          {message}
        </div>
      ) : null}
    </div>
  );
};

export default ModeSwitchController;
