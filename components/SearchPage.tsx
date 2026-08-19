import React, { useEffect, useMemo, useRef, useState } from 'react';
import SongList from './SongList';
import { Song } from '../types';
import { getFallbackSongs, searchSongs, SearchSortMode } from '../services/youtubeService';
import { ICON_SEARCH } from '../constants';

const RECENT_SEARCHES_KEY = 'ruby_recent_searches';

type FilterTab = 'all' | 'songs' | 'artists' | 'albums';

interface SearchPageProps {
  query?: string;
  setQuery?: (query: string) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ query = '', setQuery }) => {
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [fullSongsOnly, setFullSongsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SearchSortMode>('relevance');
  const searchRequestRef = useRef(0);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const requestId = searchRequestRef.current + 1;
      searchRequestRef.current = requestId;
      setIsSearching(true);
      const timeout = new Promise<Song[]>((resolve) => {
        setTimeout(() => resolve(getFallbackSongs(value)), 6000);
      });
      Promise.race([
        searchSongs(value, { maxResults: 120, fullSongsOnly, sortBy }),
        timeout,
      ])
        .then((songs) => {
          if (requestId !== searchRequestRef.current) return;
          setResults(songs);
          try {
            const prev = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
            const next = [value, ...(Array.isArray(prev) ? prev : []).filter((item) => item !== value)].slice(0, 8);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
          } catch {
            // ignore cache errors
          }
        })
        .catch((err) => {
          if (requestId !== searchRequestRef.current) return;
          console.error('Search failed:', err);
          setResults(getFallbackSongs(value));
        })
        .finally(() => {
          if (requestId === searchRequestRef.current) setIsSearching(false);
        });
    }, 80);

    return () => clearTimeout(timer);
  }, [query, fullSongsOnly, sortBy]);

  const uniqueArtists = useMemo(() => {
    const map = new Map<string, Song>();
    for (const song of results) {
      if (!map.has(song.artist)) map.set(song.artist, song);
    }
    return Array.from(map.values());
  }, [results]);

  const uniqueAlbums = useMemo(() => {
    const map = new Map<string, Song>();
    for (const song of results) {
      if (!map.has(song.album)) map.set(song.album, song);
    }
    return Array.from(map.values());
  }, [results]);

  const filteredSongs = useMemo(() => {
    if (activeTab === 'songs' || activeTab === 'all') return results;
    if (activeTab === 'artists') return uniqueArtists;
    return uniqueAlbums;
  }, [activeTab, results, uniqueArtists, uniqueAlbums]);

  const renderFilterPill = (tab: FilterTab, label: string) => {
    const isActive = activeTab === tab;
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`whitespace-nowrap rounded-full px-6 py-2.5 text-sm border transition-colors ${
          isActive ? 'bg-white text-[#121212] border-white font-semibold' : 'bg-[#2b2f36] text-[#e5e8ee] border-[#2d3b4f]'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden px-4 md:px-7 pt-5 pb-40 md:pb-36">
      <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar">
        {query.trim()
          ? [
              renderFilterPill('all', 'All'),
              renderFilterPill('songs', `Songs (${results.length})`),
              renderFilterPill('artists', `Artists (${uniqueArtists.length})`),
              renderFilterPill('albums', `Albums (${uniqueAlbums.length})`),
            ]
          : [
              renderFilterPill('all', 'All'),
              renderFilterPill('songs', 'Songs'),
              renderFilterPill('artists', 'Artists'),
              renderFilterPill('albums', 'Albums'),
            ]}
      </div>

      {query.trim() && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFullSongsOnly((prev) => !prev)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
              fullSongsOnly
                ? 'bg-[#1ad38f] border-[#1ad38f] text-[#06281e]'
                : 'bg-[#1a2430] border-[#2b3d4f] text-[#d4e3f3]'
            }`}
          >
            {fullSongsOnly ? 'Songs Only' : 'All Results'}
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="sortBy" className="text-xs text-[#9db3ca]">Sort</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SearchSortMode)}
              className="rounded-lg bg-[#11283d] border border-[#2f4d67] text-[#d7e8f8] text-xs px-3 py-2 outline-none"
            >
              <option value="relevance">Most relevant</option>
              <option value="popular">Most popular</option>
            </select>
          </div>
        </div>
      )}


      {query.trim() ? (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#63e1f6] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-[#8ea7c0]">Searching...</p>
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#8ea7c0]">
              <p className="text-lg font-semibold">No songs found for "{query.trim()}"</p>
              <p className="text-sm">Try a different artist/title, or disable "Songs Only".</p>
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden p-3 bg-[var(--ruby-panel)] border border-[var(--ruby-border)]">
              <p className="text-[11px] text-[#9bb2c9] mb-2 px-2">Duration is shown on the right of each result.</p>
              <SongList songs={filteredSongs} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center text-center">
          <div>
            <div className="w-28 h-28 rounded-full bg-[#11283d] text-[#8ea5bc] grid place-items-center mx-auto mb-6">
              {React.cloneElement(ICON_SEARCH as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 54, height: 54 })}
            </div>
            <h3 className="text-4xl sm:text-3xl font-bold text-white mb-2">Play what you love</h3>
            <p className="text-[#6f8499] text-2xl sm:text-lg">Search for artists, songs, and more using the bar above.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
