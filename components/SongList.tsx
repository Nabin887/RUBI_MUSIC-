import React from 'react';
import { Song } from '../types';
import SongItem from './SongItem';
import { ICON_CLOCK } from '../constants';

interface SongListProps {
  songs: Song[];
}

const SongList: React.FC<SongListProps> = ({ songs }) => {
  if (!songs || songs.length === 0) {
    return <p className="text-zinc-500 italic p-4 text-center">Your queue is currently empty.</p>;
  }
  
  return (
    <div>
      <div className="grid grid-cols-[auto,1fr,auto] md:grid-cols-[auto,1fr,1fr,auto] gap-4 text-zinc-500 text-[10px] border-b border-white/5 pb-2 mb-2 uppercase tracking-widest font-bold px-3">
        <div className="text-center w-8">#</div>
        <div>Title</div>
        <div className="hidden md:block">Album</div>
        <div className="flex justify-end pr-2">{ICON_CLOCK}</div>
      </div>
      <div className="flex flex-col gap-0.5">
        {songs.map((song, index) => (
          <SongItem key={song.id} song={song} index={index} playlist={songs} />
        ))}
      </div>
    </div>
  );
};

export default SongList;
