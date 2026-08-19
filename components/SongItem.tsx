
import React, { useState } from 'react';
import { Song } from '../types';
import { usePlayer } from '../hooks/usePlayer';
import { ICON_PLAY } from '../constants';

interface SongItemProps {
  song: Song;
  index: number;
  playlist: Song[];
}

const SongItem: React.FC<SongItemProps> = ({ song, index, playlist }) => {
  const { playSong, currentSong, isPlaying, togglePlayPause } = usePlayer();
  const [isHovered, setIsHovered] = useState(false);

  const isActive = currentSong?.id === song.id;

  const handlePlay = () => {
    if (isActive) {
      togglePlayPause();
    } else {
      playSong(song, playlist);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`grid grid-cols-[auto,1fr,auto] md:grid-cols-[auto,1fr,1fr,auto] gap-4 items-center p-2 rounded-md hover:bg-[#2a2a2a] cursor-pointer group ${isActive ? 'text-green-500' : 'text-[#a1a1aa]'}`}
      onClick={handlePlay}
    >
      <div className="w-8 text-center text-sm font-medium">
        {isHovered || isActive ? (
          <button className={isActive && isPlaying ? 'text-green-500' : 'text-white'}>
             {isActive && isPlaying ? (
                 <span>II</span>
             ) : (
                 <span className="text-white fill-white">{ICON_PLAY}</span>
             )}
          </button>
        ) : (
          index + 1
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <img src={song.albumArtUrl} alt={song.title} className="w-10 h-10 rounded bg-zinc-800" />
        <div className="min-w-0">
          <p className={`font-medium text-base truncate ${isActive ? 'text-green-500' : 'text-white'}`}>{song.title}</p>
          <p className="text-sm truncate group-hover:text-white transition-colors">{song.artist}</p>
        </div>
      </div>

      <div className="hidden md:block text-sm truncate">{song.album}</div>
      
      <div className="text-sm font-mono text-right pr-1 md:pr-4">{song.duration}</div>
    </div>
  );
};

export default SongItem;
