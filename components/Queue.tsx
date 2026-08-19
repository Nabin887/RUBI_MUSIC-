
import React, { useRef, useState } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { ICON_REMOVE, ICON_PLAY } from '../constants';

const DragHandleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-300 transition-colors">
        <circle cx="9" cy="12" r="1" />
        <circle cx="9" cy="5" r="1" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="15" cy="12" r="1" />
        <circle cx="15" cy="5" r="1" />
        <circle cx="15" cy="19" r="1" />
    </svg>
);

const Queue: React.FC = () => {
    const {
        playlist,
        currentSongIndex,
        toggleQueue,
        isQueueVisible,
        removeFromPlaylist,
        reorderPlaylist,
        playSong
    } = usePlayer();

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = 'move';
        // Set a transparent drag image or styling could go here
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
        setDragOverIndex(position);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            reorderPlaylist(dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
        setDragOverIndex(null);
    };

    return (
        <aside className={`absolute top-0 right-0 h-full w-full md:w-full md:max-w-sm bg-[#121212] md:rounded-lg border-l border-zinc-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isQueueVisible ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 flex-shrink-0 pt-10 md:pt-4">
                <h2 className="text-xl font-bold">Now Playing</h2>
                <button onClick={toggleQueue} className="text-zinc-400 hover:text-white transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-2 pb-32 md:pb-2">
                {playlist.length > 0 ? (
                    playlist.map((song, index) => {
                        const isCurrent = index === currentSongIndex;
                        const isDragTarget = index === dragOverIndex;
                        
                        return (
                            <div
                                key={`${song.id}-${index}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className={`group flex items-center justify-between gap-3 p-2 rounded-md transition-all duration-200 border border-transparent ${
                                    isCurrent ? 'bg-emerald-900/20' : 'hover:bg-zinc-800/50'
                                } ${isDragTarget ? 'border-emerald-500/50 bg-emerald-500/10' : ''}`}
                            >
                                {/* Drag Handle */}
                                <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-300">
                                    <DragHandleIcon />
                                </div>

                                <div className="flex items-center gap-3 overflow-hidden flex-grow cursor-pointer" onClick={() => !isCurrent && playSong(song, playlist)}>
                                    <div className="relative w-10 h-10 flex-shrink-0">
                                        <img src={song.albumArtUrl} alt={song.title} className="w-10 h-10 rounded shadow-sm" />
                                        {isCurrent && (
                                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                                               <div className="w-4 h-4 text-emerald-400 animate-pulse">
                                                  {ICON_PLAY}
                                               </div>
                                           </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`font-medium text-sm truncate ${isCurrent ? 'text-emerald-400' : 'text-white'}`}>{song.title}</p>
                                        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFromPlaylist(index)}
                                    className="text-zinc-500 hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0 p-2"
                                    aria-label={`Remove ${song.title} from queue`}
                                >
                                    {React.cloneElement(ICON_REMOVE as React.ReactElement<any>, {width: 16, height: 16})}
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                        <p className="italic">Your queue is empty.</p>
                        <p className="text-xs mt-2">Add songs from the library.</p>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Queue;
