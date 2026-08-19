
import React, { createContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Song, LyricLine, VibeMode } from '../types';
import { getLibrarySongs } from '../services/youtubeService';
import { getLyrics, generatePlaylist } from '../services/geminiService';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (payload?: any) => void;
    YT: any;
  }
}

interface PlayerContextType {
  isPlaying: boolean;
  currentSong: Song | null;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Song[];
  playSong: (song: Song, playlist?: Song[]) => void;
  togglePlayPause: () => void;
  playNext: (isManual?: boolean) => void;
  playPrev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  loadPlaylist: (songs: Song[], autoPlay?: boolean) => void;
  isLibraryLoading: boolean;
  libraryLoadError: string | null;
  isQueueVisible: boolean;
  toggleQueue: () => void;
  removeFromPlaylist: (index: number) => void;
  reorderPlaylist: (sourceIndex: number, destinationIndex: number) => void;
  currentSongIndex: number | null;
  playingPreview: Song | null;
  isPreviewPlaying: boolean;
  playPreview: (song: Song) => void;
  favorites: Song[];
  toggleFavorite: (song: Song) => void;
  recentlyPlayed: Song[];
  isPlayerExpanded: boolean;
  togglePlayerExpansion: () => void;
  currentLyrics: LyricLine[] | null;
  isLyricsLoading: boolean;
  isShuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  toggleRepeat: () => void;
  currentVibe: VibeMode;
  generateVibeMix: () => void;
  playbackMode: 'audio' | 'video';
  setPlaybackMode: (mode: 'audio' | 'video') => void;
  modeSettings: {
    defaultPlaybackMode: 'audio' | 'video';
    alwaysPlayVideoWhenAvailable: boolean;
    backgroundPlayback: boolean;
    miniPlayerEnabled: boolean;
    pictureInPicture: boolean;
    youtubeVideoEnabled: boolean;
    videoQuality: '144p' | '360p' | '720p' | 'auto';
    showVideoThumbnails: boolean;
    restrictedMode: boolean;
    autoSwitchToAudioOnSlowNetwork: boolean;
    syncAudioVideoPlayback: boolean;
    autoSwitchAudioWhenLocked: boolean;
    autoSwitchVideoWhenUnlocked: boolean;
    adaptiveNetworkPlayback: boolean;
    disableVideoOnMobileData: boolean;
    wifiAllowVideo: boolean;
    mobileAllowVideo: boolean;
    dataSaver: boolean;
    downloadPreference: 'audio' | 'video';
    notificationsPlaybackControls: boolean;
    notificationsLockScreenControls: boolean;
    notificationsSmartMusic: boolean;
    youtubeHistorySync: boolean;
    appLockEnabled: boolean;
    appLockMethod: 'PIN' | 'Fingerprint';
    sleepTimer: 'Off' | '15m' | '30m' | '45m' | '60m';
    voiceControl: boolean;
    gestureControls: boolean;
    doubleTapSkip: boolean;
  };
  updateModeSettings: (patch: Partial<PlayerContextType['modeSettings']>) => void;
  resetModeSettings: () => void;
  triggerEnterPiP: () => Promise<void>;
  clearWatchAndListenHistory: () => void;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

interface PlayerProviderProps {
    children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const MODE_SETTINGS_KEY = 'ruby_player_mode_settings';
  const defaultModeSettings: PlayerContextType['modeSettings'] = {
    defaultPlaybackMode: 'audio',
    alwaysPlayVideoWhenAvailable: false,
    backgroundPlayback: true,
    miniPlayerEnabled: true,
    pictureInPicture: true,
    youtubeVideoEnabled: true,
    videoQuality: 'auto',
    showVideoThumbnails: true,
    restrictedMode: false,
    autoSwitchToAudioOnSlowNetwork: true,
    syncAudioVideoPlayback: true,
    autoSwitchAudioWhenLocked: false,
    autoSwitchVideoWhenUnlocked: false,
    adaptiveNetworkPlayback: true,
    disableVideoOnMobileData: true,
    wifiAllowVideo: true,
    mobileAllowVideo: false,
    dataSaver: false,
    downloadPreference: 'audio',
    notificationsPlaybackControls: true,
    notificationsLockScreenControls: true,
    notificationsSmartMusic: true,
    youtubeHistorySync: true,
    appLockEnabled: false,
    appLockMethod: 'Fingerprint',
    sleepTimer: 'Off',
    voiceControl: false,
    gestureControls: true,
    doubleTapSkip: true,
  };

  const readModeSettings = (): PlayerContextType['modeSettings'] => {
    try {
      return { ...defaultModeSettings, ...(JSON.parse(localStorage.getItem(MODE_SETTINGS_KEY) || '{}')) };
    } catch {
      return defaultModeSettings;
    }
  };

  const [modeSettings, setModeSettings] = useState<PlayerContextType['modeSettings']>(() => readModeSettings());
  const [playbackMode, setPlaybackModeState] = useState<'audio' | 'video'>(() => readModeSettings().defaultPlaybackMode);

  const [playlist, setPlaylist] = useState<Song[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('ruby_playlist') || localStorage.getItem('nabify_playlist') || '[]');
      } catch {
          return [];
      }
  });
  
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  
  const [favorites, setFavorites] = useState<Song[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('ruby_favorites') || localStorage.getItem('nabify_favorites') || '[]');
      } catch {
          return [];
      }
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() => {
       try {
           return JSON.parse(localStorage.getItem('ruby_history') || localStorage.getItem('nabify_history') || '[]');
       } catch {
           return [];
       }
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false); 
  const [libraryLoadError, setLibraryLoadError] = useState<string | null>(null);
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  const [currentLyrics, setCurrentLyrics] = useState<LyricLine[] | null>(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const lyricsRequestIdRef = useRef(0);
  const [currentVibe, setCurrentVibe] = useState<VibeMode>('Chill');

  const [isYTAPIReady, setIsYTAPIReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const ytPlayerRef = useRef<any>(null);
  const timePollerRef = useRef<number | undefined>(undefined);
  const pendingAutoPlayRef = useRef(false);

  const [playingPreview, setPlayingPreview] = useState<Song | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;

  const currentSong = currentSongIndex !== null ? playlist[currentSongIndex] : null;

  useEffect(() => { localStorage.setItem('ruby_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('ruby_history', JSON.stringify(recentlyPlayed)); }, [recentlyPlayed]);
  useEffect(() => { localStorage.setItem('ruby_playlist', JSON.stringify(playlist)); }, [playlist]);
  useEffect(() => { localStorage.setItem(MODE_SETTINGS_KEY, JSON.stringify(modeSettings)); }, [modeSettings]);

  const toggleShuffle = () => setIsShuffle(prev => !prev);
  const toggleRepeat = () => {
      setRepeatMode(prev => {
          if (prev === 'off') return 'all';
          if (prev === 'all') return 'one';
          return 'off';
      });
  };

  const setPlaybackMode = (mode: 'audio' | 'video') => {
    setPlaybackModeState(mode);
  };

  const updateModeSettings = (patch: Partial<PlayerContextType['modeSettings']>) => {
    setModeSettings(prev => ({ ...prev, ...patch }));
  };

  const resetModeSettings = () => {
    setModeSettings(defaultModeSettings);
    setPlaybackModeState(defaultModeSettings.defaultPlaybackMode);
  };

  const clearWatchAndListenHistory = () => {
    setRecentlyPlayed([]);
  };

  const triggerEnterPiP = async () => {
    const iframe = ytPlayerRef.current?.getIframe?.();
    if (!iframe || !modeSettings.pictureInPicture) return;
    try {
      const canRequest = (iframe as any).requestPictureInPicture;
      if (typeof canRequest === 'function') {
        await canRequest.call(iframe);
      }
    } catch (error) {
      console.warn('PiP request unavailable:', error);
    }
  };

  const generateVibeMix = async () => {
    const vibes: VibeMode[] = ['Chill', 'Energetic', 'Focus', 'Party', 'Melancholy', 'Late Night', 'Sunday Morning'];
    const nextIndex = (vibes.indexOf(currentVibe) + 1) % vibes.length;
    const nextVibe = vibes[nextIndex];
    setCurrentVibe(nextVibe);

    setIsLibraryLoading(true);
    try {
        const library = await getLibrarySongs();
        const songs = await generatePlaylist(`Create a ${nextVibe} playlist`, library);
        loadPlaylist(songs, true);
    } catch (err) {
        console.error("Failed to generate vibe mix:", err);
    } finally {
        setIsLibraryLoading(false);
    }
  };

  useEffect(() => {
      if (!currentSong) return;

      const requestId = lyricsRequestIdRef.current + 1;
      lyricsRequestIdRef.current = requestId;

      setCurrentLyrics(null);
      setIsLyricsLoading(true);
      getLyrics(currentSong).then(lyrics => {
          if (lyricsRequestIdRef.current !== requestId) return;
          setCurrentLyrics(lyrics);
      }).catch(err => {
          if (lyricsRequestIdRef.current !== requestId) return;
          console.error(err);
          setCurrentLyrics([{ time: 0, text: "Lyrics not available for this song yet." }]);
      }).finally(() => {
          if (lyricsRequestIdRef.current === requestId) {
            setIsLyricsLoading(false);
          }
      });
  }, [currentSong?.id]);

  useEffect(() => {
    previewAudioRef.current = new Audio();
    previewAudioRef.current.volume = 0.4;
    
    const audio = previewAudioRef.current;
    const onPlay = () => setIsPreviewPlaying(true);
    const onPause = () => setIsPreviewPlaying(false);
    const onEnded = () => {
      setIsPreviewPlaying(false);
      setPlayingPreview(null);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    }
  }, []);

  const togglePlayerExpansion = () => setIsPlayerExpanded(prev => !prev);

  const toggleFavorite = (song: Song) => {
      setFavorites(prev => {
          const exists = prev.find(s => s.id === song.id);
          if (exists) {
              return prev.filter(s => s.id !== song.id);
          }
          return [...prev, song];
      });
  };

  const addToRecentlyPlayed = (song: Song) => {
      setRecentlyPlayed(prev => {
          const filtered = prev.filter(s => s.id !== song.id);
          return [song, ...filtered].slice(0, 20); 
      });
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      window.onYouTubeIframeAPIReady = (_payload?: any) => setIsYTAPIReady(true);
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
    } else {
      setIsYTAPIReady(true);
    }

    return () => {
      clearInterval(timePollerRef.current);
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && modeSettings.autoSwitchAudioWhenLocked) {
        setPlaybackModeState('audio');
      }
      if (document.visibilityState === 'visible' && modeSettings.autoSwitchVideoWhenUnlocked) {
        setPlaybackModeState('video');
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [modeSettings.autoSwitchAudioWhenLocked, modeSettings.autoSwitchVideoWhenUnlocked]);

  useEffect(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const handleNetworkChange = () => {
      const effectiveType = String(connection.effectiveType || '');
      const isSlow = effectiveType.includes('2g') || effectiveType.includes('3g');
      const isMobile = !String(connection.type || '').includes('wifi');

      if ((modeSettings.autoSwitchToAudioOnSlowNetwork && isSlow) || (modeSettings.disableVideoOnMobileData && isMobile) || (modeSettings.dataSaver && isMobile)) {
        setPlaybackModeState('audio');
      }
    };

    connection.addEventListener?.('change', handleNetworkChange);
    handleNetworkChange();
    return () => connection.removeEventListener?.('change', handleNetworkChange);
  }, [
    modeSettings.autoSwitchToAudioOnSlowNetwork,
    modeSettings.disableVideoOnMobileData,
    modeSettings.dataSaver,
  ]);

  useEffect(() => {
    if (currentSong && modeSettings.alwaysPlayVideoWhenAvailable && modeSettings.youtubeVideoEnabled) {
      setPlaybackModeState('video');
    }
  }, [currentSong?.id, modeSettings.alwaysPlayVideoWhenAvailable, modeSettings.youtubeVideoEnabled]);

  const pollTime = useCallback(() => {
    const player = ytPlayerRef.current;
    if (!player || typeof player.getCurrentTime !== 'function') return;
    
    clearInterval(timePollerRef.current);

    timePollerRef.current = window.setInterval(() => {
      if(player && typeof player.getCurrentTime === 'function') {
        const time = player.getCurrentTime();
        if (time !== currentTime) {
            setCurrentTime(time);
        }
        const dur = player.getDuration();
        if (dur !== duration) {
            setDuration(dur);
        }
      }
    }, 500);
  }, [currentTime, duration]);

  const onPlayerReady = useCallback(() => {
    setIsPlayerReady(true);
    if (ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(volume);
      if (currentSongIndex !== null) {
        const song = playlistRef.current[currentSongIndex];
        if (song) {
          if (pendingAutoPlayRef.current || isPlaying) {
            ytPlayerRef.current.loadVideoById(song.videoId);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } else {
            ytPlayerRef.current.cueVideoById(song.videoId);
          }
        }
      }
    }
    pendingAutoPlayRef.current = false;
  }, [volume, currentSongIndex, isPlaying]);
  
  const playNext = useCallback((isManual = false) => {
      if (playlistRef.current.length === 0) return;
      
      const currentIndex = currentSongIndex === null ? -1 : currentSongIndex;
      let newIndex: number;

      // Repeat One only applies to automatic transitions
      if (repeatMode === 'one' && !isManual) {
          newIndex = currentIndex;
      } else if (isShuffle) {
          do {
              newIndex = Math.floor(Math.random() * playlistRef.current.length);
          } while (newIndex === currentIndex && playlistRef.current.length > 1);
      } else {
          newIndex = (currentIndex + 1) % playlistRef.current.length;
          // If repeat is off and we reached the end
          if (!isManual && repeatMode === 'off' && newIndex === 0 && currentIndex === playlistRef.current.length - 1) {
              setIsPlaying(false);
              return;
          }
      }
      
      const nextSong = playlistRef.current[newIndex];
      if (nextSong && ytPlayerRef.current && isPlayerReady) {
          ytPlayerRef.current.loadVideoById(nextSong.videoId);
          setCurrentSongIndex(newIndex);
          addToRecentlyPlayed(nextSong);
      }
  }, [currentSongIndex, isPlayerReady, isShuffle, repeatMode]);
  
  const onPlayerStateChange = useCallback((event: any) => {
    const state = event.data;
    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      pollTime();
    } else {
      if (state !== window.YT.PlayerState.BUFFERING) {
         setIsPlaying(false);
      }
      clearInterval(timePollerRef.current);
    }
    if (state === window.YT.PlayerState.ENDED) {
       playNext(false); // isManual = false for automatic transition
    }
  }, [playNext, pollTime]); 

  const onPlayerStateChangeRef = useRef(onPlayerStateChange);
  useEffect(() => {
      onPlayerStateChangeRef.current = onPlayerStateChange;
  }, [onPlayerStateChange]);

  useEffect(() => {
    if (isYTAPIReady && !ytPlayerRef.current) {
      const container = document.getElementById('youtube-player-container');
      if (container) {
          ytPlayerRef.current = new window.YT.Player('youtube-player-container', {
            height: '1', 
            width: '1', 
            playerVars: {
              'playsinline': 1,
              'autoplay': 1,
              'controls': 0,
              'origin': window.location.origin,
              'enablejsapi': 1,
            },
            events: {
              'onReady': onPlayerReady,
              'onStateChange': (e: any) => onPlayerStateChangeRef.current(e)
            }
          });
      }
    }
  }, [isYTAPIReady, onPlayerReady]); 
  
  useEffect(() => {
    const fetchInitialLibrary = async () => {
        if (playlist.length > 0) return;
        setIsLibraryLoading(true);
        setLibraryLoadError(null);
        try {
            const initialPlaylist = await getLibrarySongs();
            setPlaylist(initialPlaylist);
        } catch (error: any) {
            console.error(error);
            setPlaylist([]);
            setLibraryLoadError('Failed to load library.');
        } finally {
            setIsLibraryLoading(false);
        }
    };
    fetchInitialLibrary();
  }, []);
  
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (player && typeof player.setVolume === 'function') {
      player.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    const host = document.getElementById('youtube-player-container');
    const frame = document.getElementById('youtube-player-frame');
    if (!host) return;

    const shouldShowVideo =
      playbackMode === 'video' &&
      modeSettings.youtubeVideoEnabled &&
      modeSettings.syncAudioVideoPlayback &&
      isPlayerExpanded &&
      Boolean(currentSong);

    if (shouldShowVideo && frame) {
      if (host.parentElement !== frame) {
        frame.innerHTML = '';
        frame.appendChild(host);
      }

      host.style.position = 'absolute';
      host.style.left = '0';
      host.style.top = '0';
      host.style.width = '100%';
      host.style.height = '100%';
      host.style.opacity = '1';
      host.style.zIndex = '2';
      host.style.borderRadius = '0px';
      host.style.overflow = 'hidden';
      host.style.background = '#000';
      host.style.pointerEvents = 'auto';
      host.style.boxShadow = 'none';
      if (ytPlayerRef.current?.setSize) {
        ytPlayerRef.current.setSize(frame.clientWidth, frame.clientHeight);
      }
    } else {
      if (host.parentElement !== document.body) {
        document.body.appendChild(host);
      }
      host.style.position = 'absolute';
      host.style.left = '0';
      host.style.top = '0';
      host.style.width = '1px';
      host.style.height = '1px';
      host.style.opacity = '0';
      host.style.zIndex = '-50';
      host.style.pointerEvents = 'none';
      host.style.borderRadius = '0px';
      host.style.overflow = 'hidden';
      host.style.boxShadow = 'none';
      if (ytPlayerRef.current?.setSize) {
        ytPlayerRef.current.setSize(1, 1);
      }
    }
  }, [
    playbackMode,
    modeSettings.youtubeVideoEnabled,
    modeSettings.syncAudioVideoPlayback,
    isPlayerExpanded,
    currentSong?.id,
  ]);

  const playSong = (song: Song, playlistContext?: Song[]) => {
    const newPlaylist = playlistContext || playlistRef.current;
    const songIndex = newPlaylist.findIndex(s => s.id === song.id);
    
    if (songIndex !== -1) {
      if (playlistContext) {
        setPlaylist(newPlaylist);
      }
      setCurrentSongIndex(songIndex);
      addToRecentlyPlayed(song);
      if (window.innerWidth < 768) {
        setIsPlayerExpanded(true);
      }
    }

    const player = ytPlayerRef.current;
    if (!player || !isPlayerReady) {
      pendingAutoPlayRef.current = true;
      setIsPlaying(true);
      return;
    }

    player.loadVideoById(song.videoId);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    const player = ytPlayerRef.current;
    if (!player || !isPlayerReady) return;
    
    const playerState = player.getPlayerState();
    if (playerState === window.YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const playPrev = () => {
    if (playlistRef.current.length === 0 || !ytPlayerRef.current || !isPlayerReady) return;

    // Get absolute latest time from player for accuracy
    const actualTime = ytPlayerRef.current.getCurrentTime();
    
    // 3-second rule: Skip to beginning if played more than 3 seconds
    if (actualTime > 3) {
        seek(0);
        return;
    }

    const currentIndex = currentSongIndex === null ? 0 : currentSongIndex;
    let newIndex: number;

    if (isShuffle) {
         newIndex = Math.floor(Math.random() * playlistRef.current.length);
    } else {
         newIndex = (currentIndex - 1 + playlistRef.current.length) % playlistRef.current.length;
    }
    
    const prevSong = playlistRef.current[newIndex];
    if (prevSong) {
        ytPlayerRef.current.loadVideoById(prevSong.videoId);
        setCurrentSongIndex(newIndex);
        addToRecentlyPlayed(prevSong);
    }
  };

  const seek = (time: number) => {
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  };
  
  const loadPlaylist = (songs: Song[], autoPlay = false) => {
    setPlaylist(songs);
    if (songs.length === 0) {
      setCurrentSongIndex(null);
      if (ytPlayerRef.current) ytPlayerRef.current.stopVideo();
      setIsPlaying(false);
      return;
    }

    if (autoPlay && songs[0]) {
      setCurrentSongIndex(0);
      addToRecentlyPlayed(songs[0]);
      if (ytPlayerRef.current && isPlayerReady) {
        ytPlayerRef.current.loadVideoById(songs[0].videoId);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } else {
      setCurrentSongIndex(0);
      if (ytPlayerRef.current && isPlayerReady) {
        ytPlayerRef.current.cueVideoById(songs[0].videoId);
      }
      setIsPlaying(false);
    }
  };

  const toggleQueue = () => setIsQueueVisible(prev => !prev);

  const removeFromPlaylist = (indexToRemove: number) => {
    const currentPlaylist = playlistRef.current;
    let newIndex = currentSongIndex;
    
    if (currentSongIndex !== null) {
        if (indexToRemove < currentSongIndex) {
            newIndex = currentSongIndex - 1;
        } 
    }

    const newPlaylist = currentPlaylist.filter((_, index) => index !== indexToRemove);
    setPlaylist(newPlaylist);
    setCurrentSongIndex(newIndex);
  };
  
  const reorderPlaylist = (sourceIndex: number, destinationIndex: number) => {
      const newPlaylist = [...playlist];
      const [removed] = newPlaylist.splice(sourceIndex, 1);
      newPlaylist.splice(destinationIndex, 0, removed);

      if (currentSongIndex !== null) {
          let newIndex = currentSongIndex;
          if (currentSongIndex === sourceIndex) {
              newIndex = destinationIndex;
          } else if (sourceIndex < currentSongIndex && destinationIndex >= currentSongIndex) {
              newIndex--;
          } else if (sourceIndex > currentSongIndex && destinationIndex <= currentSongIndex) {
              newIndex++;
          }
          setCurrentSongIndex(newIndex);
      }
      setPlaylist(newPlaylist);
  };

  const playPreview = (song: Song) => {
    if (!song.previewUrl || !previewAudioRef.current) return;
    
    if (playingPreview?.id === song.id) {
      if (previewAudioRef.current.paused) {
        previewAudioRef.current.play();
      } else {
        previewAudioRef.current.pause();
      }
    } else {
      setPlayingPreview(song);
      previewAudioRef.current.src = song.previewUrl;
      previewAudioRef.current.play();
    }
  };

  const value = {
    isPlaying,
    currentSong,
    currentTime,
    duration,
    volume,
    playlist,
    playSong,
    togglePlayPause,
    playNext: () => playNext(true), // Expose as manual skip
    playPrev,
    seek,
    setVolume,
    loadPlaylist,
    isLibraryLoading,
    libraryLoadError,
    isQueueVisible,
    toggleQueue,
    removeFromPlaylist,
    reorderPlaylist,
    currentSongIndex,
    playingPreview,
    isPreviewPlaying,
    playPreview,
    favorites,
    toggleFavorite,
    recentlyPlayed,
    isPlayerExpanded,
    togglePlayerExpansion,
    currentLyrics,
    isLyricsLoading,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    currentVibe,
    generateVibeMix,
    playbackMode,
    setPlaybackMode,
    modeSettings,
    updateModeSettings,
    resetModeSettings,
    triggerEnterPiP,
    clearWatchAndListenHistory,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};
