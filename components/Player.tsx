import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import {
  ICON_PLAY,
  ICON_PAUSE,
  ICON_NEXT,
  ICON_PREV,
  ICON_SHUFFLE,
  ICON_REPEAT,
  ICON_REPEAT_ONE,
  ICON_CHEVRON_DOWN,
  ICON_QUEUE,
} from '../constants';
import { useAppSettings } from '../hooks/useAppSettings';

type SleepOption = '15m' | '30m' | '45m' | 'Off';

interface DownloadedTrack {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  downloadedAt: string;
}

const DOWNLOADS_KEY = 'ruby_downloads';

const ICON_HEART = (filled: boolean) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#22c55e' : 'none'} stroke={filled ? '#22c55e' : 'currentColor'} strokeWidth="2">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const ICON_DOWNLOAD = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const Player: React.FC = () => {
  const { settings } = useAppSettings();
  const {
    isPlaying,
    currentSong,
    currentTime,
    duration,
    togglePlayPause,
    playNext,
    playPrev,
    seek,
    toggleQueue,
    isPlayerExpanded,
    togglePlayerExpansion,
    currentLyrics,
    isLyricsLoading,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    toggleFavorite,
    favorites,
  } = usePlayer();

  const [showLyrics, setShowLyrics] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<SleepOption>('Off');
  const activeLyricRef = useRef<HTMLParagraphElement>(null);

  const displayedLyrics = useMemo(() => {
    if (currentLyrics && currentLyrics.length > 0) return currentLyrics;
    return [
      { time: 0, text: 'No synced lyrics found for this track.' },
      { time: 2, text: 'Try another song or keep listening while Ruby searches.' },
    ];
  }, [currentLyrics]);

  const activeLyricIndex = displayedLyrics.findIndex((line, index) => {
    const nextLine = displayedLyrics[index + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  useEffect(() => {
    if (showLyrics && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex, showLyrics]);

  useEffect(() => {
    if (isPlayerExpanded) {
      setShowLyrics(settings.showLyricsByDefault);
    }
  }, [isPlayerExpanded, settings.showLyricsByDefault]);

  if (!currentSong) return null;

  const isFavorite = favorites.some((song) => song.id === currentSong.id);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time <= 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const saveDownloadedTrack = () => {
    const current: DownloadedTrack = {
      id: currentSong.id,
      title: currentSong.title,
      artist: currentSong.artist,
      videoId: currentSong.videoId,
      downloadedAt: new Date().toISOString(),
    };

    let prev: DownloadedTrack[] = [];
    try {
      prev = JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || '[]');
    } catch {
      prev = [];
    }
    const merged = [current, ...prev.filter((s) => s.id !== current.id)].slice(0, 100);
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(merged));

    const youtubeUrl = `https://www.youtube.com/watch?v=${currentSong.videoId}`;
    const m3u = `#EXTM3U\n#EXTINF:-1,${currentSong.artist} - ${currentSong.title}\n${youtubeUrl}\n`;
    const blob = new Blob([m3u], { type: 'audio/x-mpegurl' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentSong.title.replace(/[\\/:*?"<>|]/g, '_')}.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  if (isPlayerExpanded) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#030710] text-white flex flex-col p-6 md:p-8 overflow-y-auto">
        <div className="pointer-events-none absolute -top-20 -right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute bottom-20 -left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="flex items-center justify-between text-[#a9b6c7] mb-7">
          <button onClick={togglePlayerExpansion} className="p-2 -ml-2 hover:text-white">
            {ICON_CHEVRON_DOWN}
          </button>
          <p className="text-2xl sm:text-xl font-medium">Now Playing</p>
          <button onClick={saveDownloadedTrack} className="p-2 -mr-2 hover:text-white" title="Download track">
            {ICON_DOWNLOAD}
          </button>
        </div>

        <div className="w-full max-w-[640px] mx-auto">
          <div className="w-full rounded-2xl overflow-hidden bg-black border border-white/5 shadow-[0_16px_50px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-[1.01]">
            <img src={currentSong.albumArtUrl} alt={currentSong.title} className="w-full aspect-square object-cover" />
          </div>

          <div className="mt-8">
            <h2 className="text-[42px]/none sm:text-4xl font-semibold truncate">{currentSong.title}</h2>
            <p className="text-[#9ca7b8] text-[40px]/none sm:text-2xl mt-3 truncate">{currentSong.artist}</p>
          </div>

          <div className="mt-8">
            <div className="h-[8px] bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-300 shadow-[0_0_18px_rgba(255,255,255,0.4)]" style={{ width: `${progress}%` }} />
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onInput={(e) => seek(Number((e.target as HTMLInputElement).value))}
              className="w-full mt-[-8px] opacity-0 cursor-pointer"
            />
            <div className="flex justify-between text-[#8f98a8] text-[36px]/none sm:text-sm mt-3">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between text-[#adb8c9]">
            <button onClick={toggleShuffle} className={`p-2 transition-all ${isShuffle ? 'text-white scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}>{ICON_SHUFFLE}</button>
            <button onClick={playPrev} className="p-2 hover:text-white transition-transform hover:scale-110">{React.cloneElement(ICON_PREV as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 34, height: 34 })}</button>
            <button onClick={togglePlayPause} className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_15px_40px_rgba(255,255,255,0.2)] transition-transform hover:scale-105 active:scale-95">
              {isPlaying
                ? React.cloneElement(ICON_PAUSE as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 36, height: 36, fill: 'black' })
                : React.cloneElement(ICON_PLAY as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 36, height: 36, fill: 'black' })}
            </button>
            <button onClick={() => playNext()} className="p-2 hover:text-white transition-transform hover:scale-110">{React.cloneElement(ICON_NEXT as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 34, height: 34 })}</button>
            <button onClick={toggleRepeat} className={`p-2 transition-all ${repeatMode !== 'off' ? 'text-white scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}>
              {repeatMode === 'one' ? ICON_REPEAT_ONE : ICON_REPEAT}
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={saveDownloadedTrack}
              className="px-4 py-2 rounded-lg text-sm border bg-white/10 border-white/10"
            >
              Download
            </button>
            <button
              onClick={() => setShowLyrics((prev) => !prev)}
              className={`px-4 py-2 rounded-lg text-sm border ${showLyrics ? 'bg-[#1f2937] border-[#4b5563]' : 'bg-white/10 border-white/10'}`}
            >
              {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
            </button>
            {(['15m', '30m', '45m', 'Off'] as SleepOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setSleepTimer(option)}
                className={`px-4 py-2 rounded-lg text-sm border ${sleepTimer === option ? 'bg-[#374151] border-[#6b7280]' : 'bg-white/10 border-white/10 text-[#c2ccd8]'}`}
              >
                {option}
              </button>
            ))}
          </div>

          {showLyrics && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 max-h-[320px] overflow-y-auto no-scrollbar backdrop-blur-md">
              {isLyricsLoading ? <p className="text-[#a3b1c2] text-sm">Loading lyrics...</p> : null}
              <div className="space-y-3 mt-2">
                {displayedLyrics.map((line, idx) => (
                  <p
                    key={`${line.time}-${idx}`}
                    ref={idx === activeLyricIndex ? activeLyricRef : null}
                    className={`text-xl md:text-2xl transition-all duration-300 ${idx === activeLyricIndex ? 'text-white font-semibold scale-[1.01] translate-x-1' : 'text-[#7d8899]'}`}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[74px] md:bottom-0 left-0 right-0 h-[84px] md:h-[92px] glass md:border-t border-white/5 px-4 md:px-6 flex items-center justify-between z-[60]">
      <div className="flex items-center gap-3 w-1/2 min-w-0 cursor-pointer" onClick={togglePlayerExpansion}>
        <img src={currentSong.albumArtUrl} alt={currentSong.title} className="w-12 h-12 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{currentSong.title}</p>
          <p className="text-xs text-[#9ca7b8] truncate">{currentSong.artist}</p>
          {!isLyricsLoading && displayedLyrics[activeLyricIndex]?.text ? (
            <p className="text-[10px] text-[#8ee3ff] truncate">{displayedLyrics[activeLyricIndex].text}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(currentSong); }} className={`${isFavorite ? 'text-[#22c55e]' : 'text-white/40'} hover:text-white`}>
          {ICON_HEART(isFavorite)}
        </button>
        <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center">
          {isPlaying
            ? React.cloneElement(ICON_PAUSE as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 18, height: 18, fill: 'black' })
            : React.cloneElement(ICON_PLAY as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 18, height: 18, fill: 'black' })}
        </button>
        <button onClick={toggleQueue} className="text-white/50 hover:text-white">{ICON_QUEUE}</button>
      </div>
    </div>
  );
};

export default Player;
