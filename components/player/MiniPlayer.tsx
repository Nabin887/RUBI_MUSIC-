import React from 'react';
import { Song } from '../../types';
import { ICON_NEXT, ICON_PAUSE, ICON_PLAY } from '../../constants';
import ModeSwitchController from './ModeSwitchController';

interface MiniPlayerProps {
  currentSong: Song;
  isPlaying: boolean;
  playbackMode: 'audio' | 'video';
  setPlaybackMode: (mode: 'audio' | 'video') => void;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExpand: () => void;
  onLongPress: () => void;
  videoEnabled: boolean;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentSong,
  isPlaying,
  playbackMode,
  setPlaybackMode,
  currentTime,
  duration,
  seek,
  onTogglePlay,
  onNext,
  onPrev,
  onExpand,
  onLongPress,
  videoEnabled,
}) => {
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className="fixed left-3 right-3 md:left-5 md:right-5 bottom-[82px] md:bottom-4 z-[70] rounded-2xl border border-[#27405d] bg-[#0d1625]/95 backdrop-blur-2xl shadow-[0_18px_40px_rgba(0,0,0,0.45)] overflow-hidden" onDoubleClick={onLongPress}>
      <div className="h-1 bg-white/10">
        <div className="h-full bg-[#63e1f6]" style={{ width: `${progress}%` }} />
      </div>

      <div className="px-3 py-2.5 flex items-center gap-3">
        <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={onExpand}>
          <img src={currentSong.albumArtUrl} alt={currentSong.title} className="w-11 h-11 rounded-lg object-cover shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{currentSong.title}</p>
            <p className="text-xs text-[#9fb1c5] truncate">{currentSong.artist}</p>
          </div>
        </button>

        <button onClick={onTogglePlay} className="w-9 h-9 rounded-full bg-white text-black grid place-items-center shrink-0">
          {isPlaying
            ? React.cloneElement(ICON_PAUSE as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 14, height: 14, fill: 'black' })
            : React.cloneElement(ICON_PLAY as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 14, height: 14, fill: 'black' })}
        </button>

        <button onClick={onNext} className="text-white/85 hover:text-white shrink-0">
          {React.cloneElement(ICON_NEXT as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 18, height: 18 })}
        </button>
      </div>

      <div className="px-3 pb-2.5 flex items-center justify-between">
        <button onClick={onPrev} className="text-xs text-[#9fb1c5] hover:text-white px-2">Back</button>
        <ModeSwitchController
          playbackMode={playbackMode}
          setPlaybackMode={setPlaybackMode}
          currentSong={currentSong}
          currentTime={currentTime}
          seek={seek}
          videoEnabled={videoEnabled}
        />
      </div>
    </div>
  );
};

export default MiniPlayer;
