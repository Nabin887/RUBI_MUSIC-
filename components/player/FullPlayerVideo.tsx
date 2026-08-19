import React from 'react';
import { Song } from '../../types';
import { ICON_PAUSE, ICON_PLAY } from '../../constants';
import ModeSwitchController from './ModeSwitchController';

interface FullPlayerVideoProps {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackMode: 'audio' | 'video';
  setPlaybackMode: (mode: 'audio' | 'video') => void;
  seek: (time: number) => void;
  onTogglePlay: () => void;
  onMinimize: () => void;
  onDoubleTapSkip: (direction: 'back' | 'forward') => void;
  videoEnabled: boolean;
}

const formatTime = (time: number) => {
  if (!Number.isFinite(time) || time <= 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const FullPlayerVideo: React.FC<FullPlayerVideoProps> = ({
  song,
  isPlaying,
  currentTime,
  duration,
  playbackMode,
  setPlaybackMode,
  seek,
  onTogglePlay,
  onMinimize,
  onDoubleTapSkip,
  videoEnabled,
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(24,42,68,0.72),rgba(3,8,16,0.96))]">
      <div className="max-w-[560px] mx-auto px-4 pt-5 pb-8">
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

        <div
          className="relative rounded-3xl overflow-hidden border border-[#2d425d] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          onDoubleClick={(e: React.MouseEvent<HTMLDivElement>) => {
            const box = e.currentTarget.getBoundingClientRect();
            const side = e.clientX < box.left + box.width / 2 ? 'back' : 'forward';
            onDoubleTapSkip(side);
          }}
        >
          <div id="youtube-player-frame" className="w-full aspect-square bg-black" />

          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
            <div className="h-1 rounded-full bg-white/20 overflow-hidden">
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
            <div className="flex items-center justify-between mt-2">
              <button onClick={onTogglePlay} className="w-10 h-10 rounded-full bg-white text-black grid place-items-center">
                {isPlaying
                  ? React.cloneElement(ICON_PAUSE as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 15, height: 15, fill: 'black' })
                  : React.cloneElement(ICON_PLAY as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 15, height: 15, fill: 'black' })}
              </button>
              <div className="text-xs text-[#c5d3e1]">{formatTime(currentTime)} / {formatTime(duration)}</div>
              <button
                onClick={() => document.documentElement.requestFullscreen?.()}
                className="px-3 py-1.5 rounded-lg text-xs border border-[#39506c] bg-[#13243a]"
              >
                Fullscreen
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[#22384f] bg-[#0f1a2a] p-4">
          <p className="text-lg font-semibold truncate">{song.title}</p>
          <p className="text-[#9ab0c8] text-sm mt-1 truncate">{song.artist}</p>

          <div className="mt-3 flex items-center gap-2">
            <button className="px-3 py-2 rounded-lg bg-[#172a3f] border border-[#2b4867] text-sm">Like</button>
            <button className="px-3 py-2 rounded-lg bg-[#172a3f] border border-[#2b4867] text-sm">Save</button>
            <button onClick={() => setPlaybackMode('audio')} className="ml-auto px-3 py-2 rounded-lg bg-[#63e1f6] text-[#09283f] text-sm font-medium">
              Switch to Audio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPlayerVideo;
