import React, { useEffect, useMemo, useState } from 'react';
import SongList from './SongList';
import SearchPage from './SearchPage';
import SettingsPage from './SettingsPage';
import ProfilePage from './ProfilePage';
import TopBar from './TopBar';
import { usePlayer } from '../hooks/usePlayer';
import { useAuth } from '../context/AuthContext';
import { ViewType } from '../App';
import { ICON_MORE_HORIZONTAL } from '../constants';
import { Song } from '../types';

interface MainContentProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

type LibraryTab = 'songs' | 'artists' | 'albums';
type DiscographyFilter = 'all' | 'albums' | 'singles' | 'popular';

const FOLLOWED_ARTISTS_KEY = 'ruby_followed_artists';
const USER_COLLECTIONS_KEY = 'ruby_user_collections';

const MainContent: React.FC<MainContentProps> = ({ activeView, setActiveView, onBack, onForward, canGoBack = false, canGoForward = false }) => {
  const {
    playlist,
    favorites,
    recentlyPlayed,
    playSong,
    loadPlaylist,
    toggleFavorite,
    currentSong,
  } = usePlayer();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMix, setActiveMix] = useState('home');
  const [mixMessage, setMixMessage] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('artists');
  const [statsPeriod, setStatsPeriod] = useState<'continuous' | 'week' | 'month' | 'quarter'>('continuous');
  const [followedArtists, setFollowedArtists] = useState<string[]>([]);
  const [artistFilter, setArtistFilter] = useState<DiscographyFilter>('all');
  const [artistSongSearch, setArtistSongSearch] = useState('');
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [openedAlbum, setOpenedAlbum] = useState<string | null>(null);
  const [collectionMessage, setCollectionMessage] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FOLLOWED_ARTISTS_KEY) || '[]');
      if (Array.isArray(saved)) setFollowedArtists(saved.filter((item): item is string => typeof item === 'string'));
    } catch {
      setFollowedArtists([]);
    }
  }, []);

  const persistFollowedArtists = (next: string[]) => {
    setFollowedArtists(next);
    localStorage.setItem(FOLLOWED_ARTISTS_KEY, JSON.stringify(next));
  };

  const quickPicks = useMemo(() => playlist.slice(0, 6), [playlist]);

  const artistsLibrary = useMemo(() => {
    const grouped = new Map<string, Song[]>();
    for (const song of playlist) {
      const artistName = (song.artist || 'Unknown Artist').trim() || 'Unknown Artist';
      const current = grouped.get(artistName) ?? [];
      current.push(song);
      grouped.set(artistName, current);
    }
    return Array.from(grouped.entries())
      .map(([artist, songs]) => ({ artist, songs }))
      .sort((a, b) => b.songs.length - a.songs.length || a.artist.localeCompare(b.artist));
  }, [playlist]);

  const albumsLibrary = useMemo(() => {
    const grouped = new Map<string, Song[]>();
    for (const song of playlist) {
      const album = (song.album || 'Unknown Album').trim() || 'Unknown Album';
      const current = grouped.get(album) ?? [];
      current.push(song);
      grouped.set(album, current);
    }
    return Array.from(grouped.entries())
      .map(([album, songs]) => ({ album, songs }))
      .sort((a, b) => b.songs.length - a.songs.length || a.album.localeCompare(b.album));
  }, [playlist]);

  useEffect(() => {
    if (!artistsLibrary.length) {
      setSelectedArtist('');
      return;
    }
    if (!selectedArtist || !artistsLibrary.some((item) => item.artist === selectedArtist)) {
      setSelectedArtist(artistsLibrary[0].artist);
    }
  }, [artistsLibrary, selectedArtist]);

  const selectedArtistEntry = artistsLibrary.find((item) => item.artist === selectedArtist);
  const selectedArtistSongs = selectedArtistEntry?.songs ?? [];

  const popularArtistSongs = useMemo(() => {
    return [...selectedArtistSongs].sort((a, b) => {
      if (a.id === currentSong?.id) return -1;
      if (b.id === currentSong?.id) return 1;
      return a.title.length - b.title.length;
    });
  }, [selectedArtistSongs, currentSong?.id]);

  const artistAlbums = useMemo(() => {
    const grouped = new Map<string, Song[]>();
    for (const song of selectedArtistSongs) {
      const album = (song.album || 'Unknown Album').trim() || 'Unknown Album';
      const current = grouped.get(album) ?? [];
      current.push(song);
      grouped.set(album, current);
    }

    return Array.from(grouped.entries()).map(([album, songs]) => {
      const lower = album.toLowerCase();
      const isSingleOrEP = lower.includes('single') || lower.includes('ep') || songs.length <= 2;
      const year = inferYearFromSong(songs[0]);
      return { album, songs, isSingleOrEP, year, cover: songs[0]?.albumArtUrl || '' };
    });
  }, [selectedArtistSongs]);

  const filteredArtistSongs = useMemo(() => {
    const base = selectedArtistSongs.filter((song) =>
      `${song.title} ${song.album}`.toLowerCase().includes(artistSongSearch.toLowerCase().trim())
    );

    if (artistFilter === 'popular') {
      return popularArtistSongs.filter((song) => base.some((item) => item.id === song.id));
    }
    if (artistFilter === 'albums') {
      const albumSongs = artistAlbums.filter((item) => !item.isSingleOrEP).flatMap((item) => item.songs);
      return albumSongs.filter((song) => base.some((item) => item.id === song.id));
    }
    if (artistFilter === 'singles') {
      const singles = artistAlbums.filter((item) => item.isSingleOrEP).flatMap((item) => item.songs);
      return singles.filter((song) => base.some((item) => item.id === song.id));
    }
    return base;
  }, [selectedArtistSongs, artistSongSearch, artistFilter, popularArtistSongs, artistAlbums]);

  const fansAlsoLike = useMemo(() => {
    const selected = selectedArtist.toLowerCase();
    return artistsLibrary
      .filter((item) => item.artist !== selectedArtist)
      .sort((a, b) => {
        const aMatch = sharedArtistScore(selected, a.artist.toLowerCase());
        const bMatch = sharedArtistScore(selected, b.artist.toLowerCase());
        return bMatch - aMatch || b.songs.length - a.songs.length;
      })
      .slice(0, 6);
  }, [artistsLibrary, selectedArtist]);

  const artistRecentlyPlayed = useMemo(() => {
    return recentlyPlayed.filter((song) => song.artist === selectedArtist).slice(0, 8);
  }, [recentlyPlayed, selectedArtist]);

  const isFollowingArtist = followedArtists.includes(selectedArtist);

  const toggleArtistFollow = () => {
    if (!selectedArtist) return;
    if (isFollowingArtist) {
      persistFollowedArtists(followedArtists.filter((name) => name !== selectedArtist));
      return;
    }
    persistFollowedArtists([...followedArtists, selectedArtist]);
  };

  const openArtistPage = (artistName: string) => {
    setSelectedArtist(artistName);
    setArtistFilter('all');
    setArtistSongSearch('');
    setOpenedAlbum(null);
    setShowAllPopular(false);
    setActiveView('artist');
  };

  const shareArtistProfile = async () => {
    const url = `${window.location.origin}/artist/${encodeURIComponent(selectedArtist)}`;
    const payload = {
      title: `${selectedArtist} on RUBI`,
      text: `Listen to ${selectedArtist} on RUBI`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // ignore share cancellation
    }
  };

  const addToUserCollection = (song: Song) => {
    try {
      const prev = JSON.parse(localStorage.getItem(USER_COLLECTIONS_KEY) || '[]');
      const next = [song, ...(Array.isArray(prev) ? prev : []).filter((item: Song) => item?.id !== song.id)].slice(0, 120);
      localStorage.setItem(USER_COLLECTIONS_KEY, JSON.stringify(next));
      setCollectionMessage(`${song.title} added to your collection`);
      setTimeout(() => setCollectionMessage(''), 1800);
    } catch {
      setCollectionMessage('Could not add to collection');
      setTimeout(() => setCollectionMessage(''), 1800);
    }
  };

  const createActivityMix = (mode: string): Song[] => {
    const modeKeywords: Record<string, string[]> = {
      home: ['chill', 'acoustic', 'relax', 'lofi', 'calm'],
      gym: ['workout', 'gym', 'energetic', 'boost', 'power'],
      driving: ['drive', 'night', 'road', 'mix', 'wave'],
      traveling: ['travel', 'journey', 'vibe', 'playlist', 'radio'],
    };

    const keywords = modeKeywords[mode] || [mode];
    const matched = playlist.filter((song) => {
      const text = `${song.title} ${song.artist} ${song.album}`.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword));
    });

    if (matched.length >= 3) return matched.slice(0, 15);
    const shuffled = [...playlist].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(15, shuffled.length));
  };

  const handlePlayMix = () => {
    if (!playlist.length) {
      setMixMessage('Library still loading. Please wait.');
      return;
    }

    const mix = createActivityMix(activeMix);
    if (!mix.length) {
      setMixMessage('No songs found for this mode.');
      return;
    }

    loadPlaylist(mix, true);
    setMixMessage(`${activeMix.charAt(0).toUpperCase() + activeMix.slice(1)} mix started`);
    setTimeout(() => setMixMessage(''), 1800);
  };

  const HomeScreen = () => (
    <div className="p-4 md:p-7 pb-40 md:pb-36 space-y-6">
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {['Music', 'Podcasts & Shows', 'Audiobooks'].map((item) => (
          <button
            key={item}
            className="whitespace-nowrap rounded-full px-6 py-2.5 bg-[#1d2430] border border-[#2c3644] text-[#e3eef8] text-sm font-semibold"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {quickPicks.slice(0, 6).map((song) => (
          <button
            key={song.id}
            onClick={() => playSong(song, playlist)}
            className="w-full flex items-center gap-3 rounded-2xl bg-[#1a2331] border border-[#24384b] px-0 py-0 hover:bg-[#213044] text-left overflow-hidden"
          >
            <img src={song.albumArtUrl} alt={song.title} className="w-16 h-16 object-cover shrink-0" loading="lazy" />
            <div className="min-w-0 flex-1 px-2">
              <p className="text-white text-base font-semibold truncate">{song.title}</p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openArtistPage(song.artist);
                }}
                className="text-[#8ed5ff] text-sm truncate hover:underline"
              >
                {song.artist}
              </button>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-[#264a66] bg-[#10263d] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[#8eb3d2] uppercase tracking-[0.25em] text-[11px] mb-2">Location + Activity Mix</p>
            <p className="text-white text-2xl font-semibold mb-4">Detected mode: {activeMix}</p>
          </div>
          <button
            onClick={handlePlayMix}
            className="rounded-full bg-[#63e1f6] text-[#0a2a44] font-semibold px-6 py-3"
          >
            Play Mix
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['home', 'gym', 'driving', 'traveling'].map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMix(mode)}
              className={`rounded-full px-5 py-2 text-sm capitalize border transition-colors ${activeMix === mode ? 'bg-[#63e1f6] text-[#07314e] border-[#63e1f6]' : 'bg-[#16314d] text-[#b6cae0] border-[#2d4965]'}`}
            >
              {mode}
            </button>
          ))}
        </div>
        {mixMessage ? <p className="text-xs text-[#9ed9ef] mt-3">{mixMessage}</p> : null}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-4xl sm:text-3xl font-black tracking-tight text-white">Top Artists</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {artistsLibrary.slice(0, 6).map((item) => (
            <button
              key={item.artist}
              onClick={() => openArtistPage(item.artist)}
              className="rounded-2xl border border-[#2a3e52] bg-[#122638] p-3 text-center"
            >
              <img src={item.songs[0]?.albumArtUrl} alt={item.artist} className="w-16 h-16 rounded-full object-cover mx-auto mb-2" loading="lazy" />
              <p className="text-white font-semibold text-sm truncate">{item.artist}</p>
            </button>
          ))}
        </div>
      </div>

      {playlist[0] ? (
        <button
          onClick={() => playSong(playlist[0], playlist)}
          className="w-full rounded-3xl bg-[#1a2431] border border-[#2a3647] p-4 md:p-5 flex items-center gap-4 text-left"
        >
          <img src={playlist[0].albumArtUrl} alt={playlist[0].title} className="w-28 h-28 rounded-2xl object-cover" loading="lazy" />
          <div className="min-w-0">
            <p className="text-[#8eb3d2] uppercase tracking-[0.2em] text-xs mb-2">Based on your taste</p>
            <p className="text-white text-xl font-bold truncate">{playlist[0].title}</p>
            <p className="text-[#c2d4e5] mt-1 truncate">{playlist[0].artist}</p>
            <p className="text-[#97aabf] mt-3">Tap to play</p>
          </div>
        </button>
      ) : null}
    </div>
  );

  const LibraryScreen = () => (
    <div className="p-4 md:p-7 pb-40 md:pb-36 space-y-6">
      <h1 className="text-4xl sm:text-3xl font-black tracking-tight">Your Library</h1>

      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        <LibraryPill label={`Songs (${playlist.length})`} active={libraryTab === 'songs'} onClick={() => setLibraryTab('songs')} />
        <LibraryPill label={`Artists (${artistsLibrary.length})`} active={libraryTab === 'artists'} onClick={() => setLibraryTab('artists')} />
        <LibraryPill label={`Albums (${albumsLibrary.length})`} active={libraryTab === 'albums'} onClick={() => setLibraryTab('albums')} />
      </div>

      {libraryTab === 'songs' && (
        <div className="rounded-3xl overflow-hidden p-3 bg-[var(--ruby-panel)] border border-[var(--ruby-border)]">
          <SongList songs={playlist} />
        </div>
      )}

      {libraryTab === 'artists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {artistsLibrary.map((item) => (
            <button
              key={item.artist}
              onClick={() => openArtistPage(item.artist)}
              className="rounded-3xl border border-[#2d465a] bg-[#142434] p-5 text-left hover:border-[#63e1f6]"
            >
              <div className="flex items-center gap-3">
                <img src={item.songs[0]?.albumArtUrl} alt={item.artist} className="w-14 h-14 rounded-full object-cover" loading="lazy" />
                <div>
                  <p className="text-white text-lg font-semibold truncate">{item.artist}</p>
                  <p className="text-[#8da5be] mt-1">{item.songs.length} songs</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {libraryTab === 'albums' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {albumsLibrary.map((item) => (
            <div key={item.album} className="rounded-3xl border border-[#2d465a] bg-[#142434] p-5">
              <p className="text-white text-lg font-semibold truncate">{item.album}</p>
              <p className="text-[#8da5be] mt-1">{item.songs.length} songs</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ArtistPage = () => {
    if (!selectedArtistEntry) {
      return (
        <div className="p-6 md:p-8">
          <p className="text-[#9ab2ca]">Artist not found.</p>
        </div>
      );
    }

    const monthlyListeners = formatMonthlyListeners(selectedArtist, selectedArtistSongs.length);
    const isVerified = selectedArtistSongs.length >= 3;
    const topPopular = (showAllPopular ? popularArtistSongs : popularArtistSongs.slice(0, 7));

    return (
      <div className="p-4 md:p-7 pb-40 md:pb-36 space-y-7">
        <section className="rounded-3xl border border-[#2c4f6d] bg-[linear-gradient(135deg,#10273f,#142f4a)] p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <img src={selectedArtistSongs[0]?.albumArtUrl} alt={selectedArtist} className="w-36 h-36 md:w-44 md:h-44 rounded-3xl object-cover border border-white/10" loading="lazy" />
            <div className="flex-1 min-w-0">
              <p className="text-[#7fd8f7] uppercase tracking-[0.22em] text-xs mb-2">Artist Profile</p>
              <h1 className="text-4xl md:text-5xl font-black leading-tight truncate">
                {selectedArtist} {isVerified ? <span className="text-[#63e1f6] text-2xl align-middle">?</span> : null}
              </h1>
              <p className="text-[#aac2d8] mt-2">{monthlyListeners} monthly listeners</p>
              <p className="text-[#8ca4bc] mt-1">{selectedArtistSongs.length} songs in library</p>

              <div className="flex flex-wrap gap-2 mt-5">
                <button onClick={() => loadPlaylist(selectedArtistSongs, true)} className="rounded-full bg-[#63e1f6] text-[#0a2a44] px-5 py-2 font-semibold">Play</button>
                <button onClick={() => loadPlaylist(shuffleSongs(selectedArtistSongs), true)} className="rounded-full border border-[#4f6f8a] bg-[#16314d] text-[#d9f0ff] px-5 py-2 font-semibold">Shuffle</button>
                <button onClick={toggleArtistFollow} className="rounded-full border border-[#4f6f8a] bg-[#17324f] text-white px-5 py-2">{isFollowingArtist ? 'Unfollow' : 'Follow'}</button>
                <button onClick={shareArtistProfile} className="rounded-full border border-[#4f6f8a] bg-[#17324f] text-white px-5 py-2">Share</button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold">Popular Songs</h2>
            <button onClick={() => setShowAllPopular((prev) => !prev)} className="text-[#8fd8f2] text-sm font-medium">
              {showAllPopular ? 'Show Less' : 'See All'}
            </button>
          </div>

          <div className="rounded-3xl border border-[#2d465a] bg-[#111f2f] overflow-hidden divide-y divide-white/5">
            {topPopular.map((song, index) => {
              const isLiked = favorites.some((fav) => fav.id === song.id);
              return (
                <div key={song.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#14283d]">
                  <button onClick={() => playSong(song, selectedArtistSongs)} className="w-8 h-8 rounded-full bg-[#0f2f4b] text-[#63e1f6] text-sm grid place-items-center">
                    ?
                  </button>
                  <button type="button" onClick={() => playSong(song, selectedArtistSongs)} className="min-w-0 flex-1 text-left">
                    <p className="text-white font-semibold truncate">
                      {song.title}
                      {index < 2 ? <span className="ml-2 text-xs text-[#ff9b6a]">??</span> : null}
                    </p>
                    <p className="text-[#8ea8c4] text-xs truncate">{song.duration}</p>
                  </button>
                  <button onClick={() => toggleFavorite(song)} className={`px-2 text-lg ${isLiked ? 'text-[#ff7b8f]' : 'text-[#8ea8c4]'}`}>?</button>
                  <button onClick={() => addToUserCollection(song)} className="px-2 text-sm text-[#8fd8f2]">Add</button>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">Discography</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
            {(['all', 'albums', 'singles', 'popular'] as DiscographyFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setArtistFilter(tab)}
                className={`rounded-full px-4 py-2 text-sm border capitalize ${artistFilter === tab ? 'bg-white text-[#0b2036] border-white' : 'bg-[#152b41] text-[#d7ecff] border-[#2a4e6e]'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {artistAlbums
              .filter((item) => {
                if (artistFilter === 'albums') return !item.isSingleOrEP;
                if (artistFilter === 'singles') return item.isSingleOrEP;
                return true;
              })
              .map((item) => (
                <button key={item.album} onClick={() => setOpenedAlbum(item.album)} className="rounded-2xl border border-[#2d465a] bg-[#142434] p-4 text-left">
                  <img src={item.cover} alt={item.album} className="w-full aspect-square rounded-xl object-cover mb-3" loading="lazy" />
                  <p className="text-white font-semibold truncate">{item.album}</p>
                  <p className="text-[#90a8c2] text-sm">{item.year} • {item.isSingleOrEP ? 'Single / EP' : 'Album'}</p>
                </button>
              ))}
          </div>

          {openedAlbum ? (
            <div className="mt-5 rounded-2xl border border-[#2d465a] bg-[#132334] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">{openedAlbum}</h3>
                <button onClick={() => setOpenedAlbum(null)} className="text-[#8fd8f2]">Close</button>
              </div>
              <SongList songs={artistAlbums.find((item) => item.album === openedAlbum)?.songs || []} />
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#2d465a] bg-[#132334] p-4">
            <h3 className="text-xl font-semibold mb-2">About Artist</h3>
            <p className="text-[#b5c8db] text-sm leading-relaxed mb-3">{buildArtistBio(selectedArtist, selectedArtistSongs.length)}</p>
            <p className="text-sm text-[#8ca4bc]">Genre: {guessGenre(selectedArtistSongs)}</p>
            <p className="text-sm text-[#8ca4bc]">Country: Global</p>
            <div className="flex gap-2 mt-3 text-sm">
              <a className="text-[#8fd8f2] hover:underline" target="_blank" rel="noreferrer" href={`https://www.instagram.com/explore/tags/${encodeURIComponent(selectedArtist.replace(/\s+/g, ''))}`}>Instagram</a>
              <a className="text-[#8fd8f2] hover:underline" target="_blank" rel="noreferrer" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedArtist)}`}>YouTube</a>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2d465a] bg-[#132334] p-4">
            <h3 className="text-xl font-semibold mb-2">Fans Also Like</h3>
            <div className="space-y-2">
              {fansAlsoLike.map((item) => (
                <button key={item.artist} onClick={() => openArtistPage(item.artist)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#17354f] text-left">
                  <img src={item.songs[0]?.albumArtUrl} alt={item.artist} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.artist}</p>
                    <p className="text-[#8ca4bc] text-xs">{item.songs.length} songs</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#2d465a] bg-[#132334] p-4">
          <h3 className="text-xl font-semibold mb-3">Search Inside Artist Songs</h3>
          <input
            value={artistSongSearch}
            onChange={(e) => setArtistSongSearch(e.target.value)}
            placeholder={`Search ${selectedArtist} songs...`}
            className="w-full h-11 rounded-xl bg-[#0e2a45] border border-[#245071] text-white placeholder-[#80a0be] px-4 outline-none focus:border-[#63e1f6]"
          />

          <div className="mt-4 rounded-xl border border-[#2b4660] bg-[#101f31] p-3">
            <SongList songs={filteredArtistSongs} />
          </div>
        </section>

        <section className="rounded-2xl border border-[#2d465a] bg-[#132334] p-4">
          <h3 className="text-xl font-semibold mb-3">Recently Played • {selectedArtist}</h3>
          {artistRecentlyPlayed.length === 0 ? (
            <p className="text-[#8ca4bc] text-sm">No recently played songs for this artist yet.</p>
          ) : (
            <div className="space-y-2">
              {artistRecentlyPlayed.map((song) => (
                <button key={`recent-${song.id}`} onClick={() => playSong(song, selectedArtistSongs)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#17354f] text-left">
                  <img src={song.albumArtUrl} alt={song.title} className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-semibold truncate">{song.title}</p>
                    <p className="text-[#8ca4bc] text-xs">{song.duration}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {collectionMessage ? (
          <p className="text-sm text-[#9ef1cd]">{collectionMessage}</p>
        ) : null}
      </div>
    );
  };

  const StatsScreen = () => (
    <div className="p-4 md:p-7 pb-40 md:pb-36 space-y-6">
      <h1 className="text-4xl sm:text-3xl font-black tracking-tight">Stats</h1>

      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {[
          { key: 'continuous', label: 'Continuous' },
          { key: 'week', label: '1 week' },
          { key: 'month', label: '1 month' },
          { key: 'quarter', label: '3 months' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatsPeriod(item.key as typeof statsPeriod)}
            className={`rounded-full px-6 py-2.5 border text-sm font-semibold ${statsPeriod === item.key ? 'bg-white text-[#061426] border-white' : 'bg-transparent text-white border-[#2b3d4c]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <StatsCard title="Songs" value={playlist.length} icon="?" />
      <StatsCard title="Artists" value={artistsLibrary.length} icon="?" />
      <StatsCard title="Albums" value={albumsLibrary.length} icon="?" />
      <StatsCard title="Followed Artists" value={followedArtists.length} icon="?" />
    </div>
  );

  return (
    <main className="flex-grow bg-[radial-gradient(circle_at_top_left,rgba(17,39,63,0.45),transparent_28%),#031528] relative flex flex-col h-full min-h-0 overflow-hidden">
      <TopBar
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onBack={onBack}
        onForward={onForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        {activeView === 'home' && <HomeScreen />}
        {activeView === 'search' && <SearchPage query={searchQuery} setQuery={setSearchQuery} />}
        {activeView === 'library' && <LibraryScreen />}
        {activeView === 'artist' && <ArtistPage />}
        {activeView === 'stats' && <StatsScreen />}
        {activeView === 'settings' && <SettingsPage />}
        {activeView === 'profile' && <ProfilePage />}

        {(activeView === 'favorites' || activeView === 'recent') && (
          <div className="p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
              <h1 className="text-4xl font-black mb-2 capitalize tracking-tighter">
                {activeView === 'recent' ? 'History' : 'Liked Songs'}
              </h1>
              <p className="text-[#9ab2ca] font-medium">
                {activeView === 'favorites'
                  ? `Saved songs by ${user?.name || 'you'} (${favorites.length})`
                  : `Curated picks for ${user?.name || 'you'}.`}
              </p>
            </header>
            <div className="rounded-[32px] overflow-hidden p-4 bg-[var(--ruby-panel)] border border-[var(--ruby-border)]">
              <SongList songs={activeView === 'favorites' ? favorites : recentlyPlayed} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

const LibraryPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap rounded-full px-6 py-2.5 text-sm border transition-colors ${
      active ? 'bg-white text-[#061426] border-white font-semibold' : 'bg-[#152433] text-white border-[#2b3d4c]'
    }`}
  >
    {label}
  </button>
);

const StatsCard: React.FC<{ title: string; value: number; icon: string }> = ({ title, value, icon }) => (
  <div className="rounded-3xl border border-[#2f3a45] bg-[linear-gradient(120deg,#191c23,#1a202b)] p-8 flex items-center justify-between">
    <div>
      <p className="text-[#9caab9] text-lg font-semibold">{title}</p>
      <p className="text-white text-4xl font-black">{value}</p>
    </div>
    <p className="text-5xl opacity-20">{icon}</p>
  </div>
);

const shuffleSongs = (songs: Song[]) => {
  const clone = [...songs];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

const inferYearFromSong = (song?: Song) => {
  if (!song) return '2024';
  const match = song.title.match(/(19|20)\d{2}/);
  return match?.[0] || '2024';
};

const sharedArtistScore = (a: string, b: string) => {
  const aParts = a.split(/\s+/).filter(Boolean);
  const bParts = new Set(b.split(/\s+/).filter(Boolean));
  return aParts.reduce((score, part) => score + (bParts.has(part) ? 2 : 0), 0);
};

const guessGenre = (songs: Song[]) => {
  const text = songs.map((song) => `${song.title} ${song.album}`).join(' ').toLowerCase();
  if (text.includes('lofi') || text.includes('acoustic')) return 'Lo-fi / Acoustic';
  if (text.includes('ncs') || text.includes('party')) return 'Electronic / Dance';
  if (text.includes('hip hop') || text.includes('rap')) return 'Hip-Hop';
  return 'Pop';
};

const buildArtistBio = (artist: string, songCount: number) => {
  return `${artist} is one of the standout artists in your RUBI library with ${songCount} tracks. Their sound blends mood, melody, and rhythm, making them perfect for focused listening and daily playlists.`;
};

const formatMonthlyListeners = (artist: string, songCount: number) => {
  let hash = 0;
  for (let i = 0; i < artist.length; i += 1) hash = (hash * 31 + artist.charCodeAt(i)) >>> 0;
  const base = 450000 + (hash % 3500000) + songCount * 12000;
  return `${new Intl.NumberFormat().format(base)} listeners`;
};

export default MainContent;


