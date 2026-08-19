import React, { useMemo, useState } from 'react';
import { Song } from '../../types';
import { ICON_NEXT, ICON_PAUSE, ICON_PLAY, ICON_PREV, ICON_REPEAT, ICON_REPEAT_ONE, ICON_SHUFFLE } from '../../constants';
import ModeSwitchController from './ModeSwitchController';
import { usePlayer } from '../../hooks/usePlayer';

interface FullPlayerAudioProps {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackMode: 'audio' | 'video';
  setPlaybackMode: (mode: 'audio' | 'video') => void;
  seek: (time: number) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  onMinimize: () => void;
  videoEnabled: boolean;
}

const formatTime = (time: number) => {
  if (!Number.isFinite(time) || time <= 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const FullPlayerAudio: React.FC<FullPlayerAudioProps> = ({
  song,
  isPlaying,
  currentTime,
  duration,
  playbackMode,
  setPlaybackMode,
  seek,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleShuffle,
  onToggleRepeat,
  isShuffle,
  repeatMode,
  onMinimize,
  videoEnabled,
}) => {
  const { currentLyrics } = usePlayer();
  const [showLyricsPanel, setShowLyricsPanel] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const lyricsText = useMemo(() => {
    if (!currentLyrics || currentLyrics.length === 0) return ['Lyrics not available.'];
    return currentLyrics.map((line) => line.text).filter(Boolean);
  }, [currentLyrics]);

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="absolute inset-0">
        <img src={song.albumArtUrl} alt={song.title} className="w-full h-full object-cover opacity-25 blur-3xl scale-110" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(24,42,68,0.72),rgba(3,8,16,0.96))]" />
      </div>

      <div className="relative z-10 max-w-[560px] mx-auto px-4 pb-8 pt-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onMinimize} className="px-3 py-1.5 text-xs rounded-lg border border-[#2c415d] bg-[#111d2d] text-white">Back</button>
          <ModeSwitchController
            playbackMode={playbackMode}
            setPlaybackMode={setPlaybackMode}
            currentSong={song}
            currentTime={currentTime}
            seek={seek}
            videoEnabled={videoEnabled}
          />
        </div>

        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <img src={song.albumArtUrl} alt={song.title} className="w-full aspect-square object-cover" />
        </div>

        <div className="mt-4">
          <h2 className="text-2xl text-white font-semibold truncate">{song.title}</h2>
          <p className="text-[#a8b7c8] mt-1 text-sm truncate">{song.artist}</p>
        </div>

        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full bg-[#67def2]" style={{ width: `${progress}%` }}></div>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => seek(Number(e.target.value))}
            className="w-full mt-1 accent-[#67def2]"
          />
          <div className="mt-1 flex justify-between text-xs text-[#8ea0b5]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[#d0dceb]">
          <button onClick={onToggleShuffle} className={`p-2 ${isShuffle ? 'text-[#67def2]' : 'text-white/70'}`}>{ICON_SHUFFLE}</button>
          <button onClick={onPrev} className="p-2">{React.cloneElement(ICON_PREV as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 26, height: 26 })}</button>
          <button onClick={onTogglePlay} className="w-14 h-14 rounded-full bg-white text-black grid place-items-center">
            {isPlaying
              ? React.cloneElement(ICON_PAUSE as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 24, height: 24, fill: 'black' })
              : React.cloneElement(ICON_PLAY as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 24, height: 24, fill: 'black' })}
          </button>
          <button onClick={onNext} className="p-2">{React.cloneElement(ICON_NEXT as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 26, height: 26 })}</button>
          <button onClick={onToggleRepeat} className={`p-2 ${repeatMode !== 'off' ? 'text-[#67def2]' : 'text-white/70'}`}>
            {repeatMode === 'one' ? ICON_REPEAT_ONE : ICON_REPEAT}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button onClick={() => setShowLyricsPanel((v) => !v)} className="rounded-xl border border-[#2b425f] bg-[#101f30] py-2 text-sm text-[#c5d5e6]">
            {showLyricsPanel ? 'Hide Lyrics' : 'Full Lyrics'}
          </button>
          <button className="rounded-xl border border-[#2b425f] bg-[#101f30] py-2 text-sm text-[#c5d5e6]">Equalizer</button>
          <button className="rounded-xl border border-[#2b425f] bg-[#101f30] py-2 text-sm text-[#c5d5e6]">Add to Playlist</button>
        </div>

        {showLyricsPanel && (
          <div className="mt-3 rounded-2xl border border-[#2b425f] bg-[#0f1a2a] p-3 max-h-48 overflow-y-auto no-scrollbar">
            {lyricsText.map((line, idx) => (
              <p key={`${line}-${idx}`} className="text-sm text-[#d7e4f1] leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullPlayerAudio;
