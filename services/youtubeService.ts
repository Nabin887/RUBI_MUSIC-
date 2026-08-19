
import { Song } from '../types';

const IS_GITHUB_PAGES = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
const API_KEY = IS_GITHUB_PAGES
  ? ''
  : ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_YOUTUBE_API_KEY) || '');

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const MIN_SONG_SECONDS = 60; // 1 minute
const MAX_SONG_SECONDS = 600; // 10 minutes
const MAX_VIDEO_SECONDS = 900; // 15 minutes
const LIBRARY_FETCH_TIMEOUT_MS = 8000;

const GARBAGE_REGEX = /(#shorts|\bshorts\b|\breel\b|\bstatus\b|\bclip\b|\blyrics\b|\bteaser\b|\btrailer\b|\bedit\b|\breaction\b|\breact\b|\breview\b|\bpodcast\b|\binterview\b|\blive reaction\b|\btutorial\b|\bexplained\b|\bstory\b|\bnews\b|\bupdate\b|\bvlog\b|\bunboxing\b|\bchallenge\b|\bgaming\b|\bgameplay\b|\bstream\b|\blivestream\b|first time hearing|reacting to|my reaction|mashup|compilation|full album|best of|speed up|slowed|reverb|nightcore|8d audio)/i;
const SOFT_GARBAGE_REGEX = /(#shorts|\bshorts\b|\breel\b|\bstatus\b)/i;
const OFFICIAL_CHANNEL_REGEX = /vevo|official|records|music|entertainment|topic|tv|labels|label|productions|interactive|media/i;
const SONG_SIGNALS_REGEX = /(song|official|audio|music|track|single|album|ep|original|remix)/i;

export type SearchSortMode = 'relevance' | 'popular';

export interface SearchSongsOptions {
  maxResults?: number;
  fullSongsOnly?: boolean;
  sortBy?: SearchSortMode;
}

// Fallback data
const MOCK_LIBRARY: Song[] = [
  {
    id: 'jfKfPfyJRdk',
    videoId: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio - beats to relax/study to',
    artist: 'Lofi Girl',
    album: 'Lofi Girl',
    albumArtUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    duration: 'Live',
    previewUrl: null,
    lyrics: `[00:00] [Instrumental Lofi Beats]
[00:10] (Soft rain sounds in background)
[00:20] Relax, study, and chill...
[00:30] [Instrumental continues]
[00:45] (Page turning sound)
[01:00] Focus on your work...
[01:30] [Calm piano melody]
[02:00] Just vibe...`
  },
  {
     id: 'K4DyBUG242c',
     videoId: 'K4DyBUG242c',
     title: 'Cartoon - On & On (feat. Daniel Levi) [NCS Release]',
     artist: 'NoCopyrightSounds',
     album: 'NCS',
     albumArtUrl: 'https://i.ytimg.com/vi/K4DyBUG242c/hqdefault.jpg',
     duration: '3:28',
     previewUrl: null,
     lyrics: `[00:00] [Intro]
[00:10] Don't wait for me
[00:12] I'll be gone
[00:15] In a black Mercedes
[00:18] On & on
[00:20] Don't wait for me
[00:22] I'll be gone
[00:25] In a black Mercedes
[00:27] On & on
[00:30] And on & on
[00:32] On & on
[00:35] And on & on
[00:37] On & on
[00:40] (Beat Drop)
[01:00] I can't be
[01:02] What you want
[01:05] So let's keep it simple
[01:07] And move along
[01:10] I can't be
[01:12] What you want
[01:15] So let's keep it simple
[01:17] And move along`
  },
  {
    id: 'yJg-Y5byMMw',
    videoId: 'yJg-Y5byMMw',
    title: 'Warriyo - Mortals (feat. Laura Brehm) [NCS Release]',
    artist: 'NoCopyrightSounds',
    album: 'NCS',
    albumArtUrl: 'https://i.ytimg.com/vi/yJg-Y5byMMw/hqdefault.jpg',
    duration: '3:50',
    previewUrl: null,
    lyrics: `[00:00] [Intro]
[00:10] Stranded in the open
[00:13] Dried out tears of sorrow
[00:15] Lacking all emotion
[00:18] Staring down the barrel
[00:20] Waiting for the final
[00:23] Curtain call...
[00:25] (Bang)
[00:40] Stranded in the open
[00:43] Dried out tears of sorrow
[00:45] Lacking all emotion
[00:48] Staring down the barrel
[00:50] Waiting for the final
[00:53] Curtain call...
[01:00] [Instrumental Drop]
[01:30] Mortals...`
  }
];

const parseDuration = (isoDuration: string): string => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return '0:00';
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const displayMinutes = Math.floor(totalSeconds / 60);
  const displaySeconds = totalSeconds % 60;
  return `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`;
};

const parseIsoDurationToSeconds = (isoDuration?: string): number => {
  if (!isoDuration) return 0;
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return 0;
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

const cleanTitle = (title: string): string => {
  return title
    .replace(/^(REACTING TO|First time hearing|My reaction to|Reaction:)\s*/gi, '')
    .replace(/\(Official Music Video\)/gi, '')
    .replace(/\(Official Video\)/gi, '')
    .replace(/\[Official Music Video\]/gi, '')
    .replace(/\[Official Video\]/gi, '')
    .replace(/\(Lyric Video\)/gi, '')
    .replace(/\[Lyric Video\]/gi, '')
    .replace(/\(Official Audio\)/gi, '')
    .replace(/\[Official Audio\]/gi, '')
    .replace(/\(Audio\)/gi, '')
    .replace(/\[Audio\]/gi, '')
    .replace(/\(Music Video\)/gi, '')
    .replace(/\[Music Video\]/gi, '')
    .replace(/\(HD\)/gi, '')
    .replace(/\[HD\]/gi, '')
    .replace(/\(4K\)/gi, '')
    .replace(/\[4K\]/gi, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
};

const extractVideoId = (searchItem: any): string | null => {
  const rawId =
    typeof searchItem?.id === 'string'
      ? searchItem.id
      : searchItem?.id?.videoId || searchItem?.id;
  if (typeof rawId !== 'string') return null;
  const value = rawId.trim();
  return value.length > 0 ? value : null;
};

const mapYoutubeItemToSong = (searchItem: any, videoDetailsMap: any): Song | null => {
    const videoId = extractVideoId(searchItem);
    if (!videoId) return null;
    const details = videoDetailsMap[videoId] || searchItem;

    const durationIso =
      details?.contentDetails?.duration || searchItem?.contentDetails?.duration || 'PT0S';
    const durationSeconds = parseIsoDurationToSeconds(durationIso);

    const parsedViews = Number(details?.statistics?.viewCount || 0);
    const snippet = searchItem?.snippet || details?.snippet || {};
    const detailsSnippet = details?.snippet || {};

    return {
        id: videoId,
        videoId: videoId,
        title: cleanTitle(snippet?.title || detailsSnippet?.title || 'Unknown Title'),
        artist: snippet?.channelTitle || detailsSnippet?.channelTitle || 'Unknown Artist',
        album: snippet?.channelTitle || detailsSnippet?.channelTitle || 'Unknown Album',
        albumArtUrl:
          detailsSnippet?.thumbnails?.high?.url ||
          detailsSnippet?.thumbnails?.default?.url ||
          snippet?.thumbnails?.high?.url ||
          snippet?.thumbnails?.default?.url ||
          '',
        duration: parseDuration(durationIso),
        durationSeconds,
        viewCount: Number.isFinite(parsedViews) ? parsedViews : 0,
        previewUrl: null,
    };
};

const uniqueSongs = (songs: Song[]): Song[] => {
  const seen = new Set<string>();
  const output: Song[] = [];
  for (const song of songs) {
    if (seen.has(song.id)) continue;
    seen.add(song.id);
    output.push(song);
  }
  return output;
};

const readCachedSongs = (): Song[] => {
  try {
    const raw = localStorage.getItem('ruby_playlist') || localStorage.getItem('nabify_playlist') || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const buildSearchQueries = (query: string) => {
  const q = query.trim();
  if (!q) return [];
  return [
    `${q}`,
    `${q} official music video`,
    `${q} official audio`,
    `${q} song`,
    `${q} track`,
  ];
};

const parseYoutubeHtml = (html: string, maxResults: number) => {
  const match =
    html.match(/var ytInitialData = (\{.*?\});<\/script>/s) ||
    html.match(/window\["ytInitialData"\] = (\{.*?\});<\/script>/s);
  if (!match) return null;

  let data: any;
  try {
    data = JSON.parse(match[1]);
  } catch (error) {
    console.warn('Failed to parse ytInitialData JSON:', error);
    return null;
  }

  const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  const items = [];
  
  for (const c of contents) {
    if (c.itemSectionRenderer?.contents) {
      for (const item of c.itemSectionRenderer.contents) {
        if (item.videoRenderer) {
          const v = item.videoRenderer;
          const lengthStr = v.lengthText?.simpleText || '0:00';
          const parts = lengthStr.split(':').map(Number);
          let isoDuration = 'PT0S';
          if (parts.length === 3) isoDuration = `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
          else if (parts.length === 2) isoDuration = `PT${parts[0]}M${parts[1]}S`;
          
          items.push({
            id: { videoId: v.videoId },
            snippet: {
              title: v.title?.runs?.[0]?.text || '',
              channelTitle: v.ownerText?.runs?.[0]?.text || '',
              thumbnails: {
                high: { url: v.thumbnail?.thumbnails?.[0]?.url || '' },
                default: { url: v.thumbnail?.thumbnails?.[0]?.url || '' }
              }
            },
            contentDetails: {
              duration: isoDuration
            },
            statistics: {
              viewCount: v.viewCountText?.simpleText?.replace(/[^0-9]/g, '') || '0'
            }
          });
        }
      }
    }
  }
  return { items: items.slice(0, Math.min(50, maxResults)) };
};

const scrapeYoutubeSearch = async (query: string, maxResults: number) => {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
       const res2 = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
       if (!res2.ok) return null;
       const html = await res2.text();
       return parseYoutubeHtml(html, maxResults);
    }
    const html = await res.text();
    return parseYoutubeHtml(html, maxResults);
  } catch (err) {
    console.error("Scrape fallback failed:", err);
    return null;
  }
};

const fetchSearchPage = async (
  query: string,
  maxResults: number,
  pageToken?: string,
  durationMode: 'short' | 'medium' | 'long' | 'any' = 'any'
) => {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(Math.min(50, Math.max(1, maxResults))),
    key: API_KEY,
    videoEmbeddable: 'true',
    videoCategoryId: '10', // Music category
  });
  if (durationMode !== 'any') {
    params.set('videoDuration', durationMode);
  }
  if (pageToken) params.set('pageToken', pageToken);

  const response = await fetch(`${YOUTUBE_API_BASE_URL}/search?${params.toString()}`);
  if (response.ok) {
    try {
      return response.json();
    } catch (error) {
      console.warn('Invalid JSON from YouTube search API:', error);
    }
  }

  // API quota exceeded, invalid key, or error: use scraper fallback
  const scraped = await scrapeYoutubeSearch(query, maxResults);
  return scraped || { items: [] };
};

const fetchVideoDetailsMap = async (videoIds: string[]) => {
  if (videoIds.length === 0) return {};
  const detailsResponse = await fetch(
    `${YOUTUBE_API_BASE_URL}/videos?part=contentDetails,snippet,status,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
  );

  let detailsData: any = null;
  if (detailsResponse.ok) {
    detailsData = await detailsResponse.json();
  }

  const videoDetailsMap: { [key: string]: any } = {};
  (detailsData?.items || []).forEach((item: any) => {
    videoDetailsMap[item.id] = item;
  });
  return videoDetailsMap;
};

const containsGarbageTerms = (value: string) => {
  return GARBAGE_REGEX.test(value);
};

const containsSoftGarbageTerms = (value: string) => {
  return SOFT_GARBAGE_REGEX.test(value);
};

const matchesQueryTerms = (song: Song, query: string) => {
  const lowerTitle = song.title.toLowerCase();
  const lowerArtist = song.artist.toLowerCase();
  const tokens = query.toLowerCase().split(/\s+/).filter((x) => x.length > 2);
  return tokens.some((term) => lowerTitle.includes(term) || lowerArtist.includes(term));
};

const isOfficialChannel = (channelTitle: string) => {
  return OFFICIAL_CHANNEL_REGEX.test(channelTitle);
};

const hasSongSignals = (title: string, artist: string, query: string) => {
  const lowerTitle = title.toLowerCase();
  const lowerArtist = artist.toLowerCase();
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hasKeyword = SONG_SIGNALS_REGEX.test(lowerTitle);
  const hasOfficialArtist = OFFICIAL_CHANNEL_REGEX.test(lowerArtist);
  const queryInTitle = queryTerms.some((term) => term.length > 2 && lowerTitle.includes(term));
  const queryInArtist = queryTerms.some((term) => term.length > 2 && lowerArtist.includes(term));
  return hasKeyword || hasOfficialArtist || queryInTitle || queryInArtist;
};

const scoreSong = (song: Song, query: string) => {
  let score = 0;
  const lowerTitle = song.title.toLowerCase();
  const lowerArtist = song.artist.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const queryTerms = lowerQuery.split(/\s+/).filter(Boolean);

  // Exact Match Bonus (Spotify-like accuracy)
  if (lowerTitle === lowerQuery) score += 100;
  if (lowerTitle.includes(lowerQuery)) score += 40;

  // Official channel/artists get high priority
  if (OFFICIAL_CHANNEL_REGEX.test(lowerArtist)) score += 60;
  if (SONG_SIGNALS_REGEX.test(lowerTitle)) score += 35;

  // Duration scoring - prefer songs in typical length
  if (song.durationSeconds) {
    if (song.durationSeconds >= MIN_SONG_SECONDS && song.durationSeconds <= MAX_SONG_SECONDS) {
      score += 40;
    } else if (song.durationSeconds > MAX_VIDEO_SECONDS) {
      score -= 30; // Penalize very long videos
    }
  }

  // Query matching
  for (const term of queryTerms) {
    if (term.length < 3) continue;
    if (lowerTitle.includes(term)) score += 20;
    if (lowerArtist.includes(term)) score += 15;
  }

  // View count bonus (popularity)
  const views = song.viewCount || 0;
  score += Math.min(40, Math.log10(Math.max(views, 1)) * 7);

  return score;
};

const cleanAndFilterSongs = (songs: Song[], query: string, fullSongsOnly: boolean) => {
  return songs
    .filter((song) => song && song.title && song.artist)
    .filter((song) => !containsSoftGarbageTerms(song.title)) // Always hide shorts/reels
    .filter((song) => !containsSoftGarbageTerms(song.artist))
    .filter((song) => {
      if (fullSongsOnly) {
        if (containsGarbageTerms(song.title) || containsGarbageTerms(song.artist)) return false;
        if (!song.durationSeconds) return true;
        return song.durationSeconds >= MIN_SONG_SECONDS && song.durationSeconds <= MAX_SONG_SECONDS;
      }
      if (!song.durationSeconds) return true;
      return song.durationSeconds <= MAX_VIDEO_SECONDS;
    })
    .filter((song) => {
      if (!fullSongsOnly) return true;
      return (
        isOfficialChannel(song.artist) ||
        hasSongSignals(song.title, song.artist, query) ||
        matchesQueryTerms(song, query)
      );
    })
    .map((song) => ({ ...song }));
};

const relaxedFilterSongs = (songs: Song[], fullSongsOnly: boolean) => {
  return songs
    .filter((song) => song && song.title && song.artist)
    .filter((song) => !containsSoftGarbageTerms(song.title))
    .filter((song) => !containsSoftGarbageTerms(song.artist))
    .filter((song) => {
      if (!song.durationSeconds) return true;
      if (fullSongsOnly) {
        return song.durationSeconds >= MIN_SONG_SECONDS && song.durationSeconds <= MAX_SONG_SECONDS;
      }
      return song.durationSeconds <= MAX_VIDEO_SECONDS;
    })
    .map((song) => ({ ...song }));
};

const sortSongs = (songs: Song[], query: string, sortBy: SearchSortMode) => {
  const sorted = [...songs];
  if (sortBy === 'popular') {
    sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    return sorted;
  }
  sorted.sort((a, b) => scoreSong(b, query) - scoreSong(a, query));
  return sorted;
};

export const searchSongs = async (query: string, optionsOrMaxResults: number | SearchSongsOptions = 80): Promise<Song[]> => {
  try {
    const resolvedOptions: SearchSongsOptions =
      typeof optionsOrMaxResults === 'number' ? { maxResults: optionsOrMaxResults } : optionsOrMaxResults;
    const maxResults = resolvedOptions.maxResults ?? 80;
    const fullSongsOnly = resolvedOptions.fullSongsOnly ?? true;
    const sortBy: SearchSortMode = resolvedOptions.sortBy ?? 'relevance';

    const target = Math.min(Math.max(maxResults, 1), 200);

    // GitHub Pages cannot safely contain a YouTube key. For public builds,
    // use one focused YouTube page search so real query results are still
    // available through the CORS fallbacks, instead of searching the bundled
    // starter tracks only.
    if (!API_KEY) {
      const page = await Promise.race([
        scrapeYoutubeSearch(query, Math.min(target, 50)),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      const scrapedSongs = (page?.items || [])
        .map((item: any) => mapYoutubeItemToSong(item, {}))
        .filter((song: Song | null): song is Song => song !== null);
      // A proxy can return trending/search suggestions when YouTube is
      // challenged. Never show those as results for an unrelated query.
      const relevantScraped = scrapedSongs.filter((song) => matchesQueryTerms(song, query));
      const cleanScraped = cleanAndFilterSongs(relevantScraped, query, fullSongsOnly);
      if (cleanScraped.length > 0) {
        return sortSongs(cleanScraped, query, sortBy).slice(0, target);
      }
      return [];
    }

    const queryVariants = buildSearchQueries(query);
    // Use medium and long for songs, but since we filter by duration, we can be more flexible
    const durationModes: Array<'medium' | 'long' | 'any'> = ['medium', 'long', 'any'];

    let collected: Song[] = [];
    for (const queryVariant of queryVariants) {
      for (const durationMode of durationModes) {
        let pageToken: string | undefined;
        let guard = 0;
        while (collected.length < target && guard < 4) {
          guard += 1;
          const pageSize = Math.min(50, target - collected.length);
          const searchData = await fetchSearchPage(queryVariant, pageSize, pageToken, durationMode);
          if (!searchData?.items?.length) break;

          const videoIds = (searchData.items as any[])
            .map((item: any) => extractVideoId(item))
            .filter((id: string | null): id is string => Boolean(id));

          const detailsMap = await fetchVideoDetailsMap(videoIds);
          const pageSongs = searchData.items
            .map((item: any) => mapYoutubeItemToSong(item, detailsMap))
            .filter((song: Song | null): song is Song => song !== null);

          collected = uniqueSongs([...collected, ...pageSongs]);
          pageToken = searchData.nextPageToken;
          if (!pageToken) break;
        }
        if (collected.length >= target) break;
      }
      if (collected.length >= target) break;
    }

    let clean = cleanAndFilterSongs(collected, query, fullSongsOnly);

    // Relax filters if strict mode became too aggressive.
    if (clean.length === 0) {
      clean = relaxedFilterSongs(collected, fullSongsOnly);
    }

    if (clean.length < 5) {
      const fallbackQuery = `${query.trim()} official music video`;
      const fallbackPage = await fetchSearchPage(fallbackQuery, 25, undefined, 'any');
      if (fallbackPage?.items?.length) {
        const videoIds = (fallbackPage.items as any[])
          .map((item: any) => extractVideoId(item))
          .filter((id: string | null): id is string => Boolean(id));
        const fallbackDetails = await fetchVideoDetailsMap(videoIds);
        const fallbackSongs = fallbackPage.items
          .map((item: any) => mapYoutubeItemToSong(item, fallbackDetails))
          .filter((song: Song | null): song is Song => song !== null);
        clean = cleanAndFilterSongs(uniqueSongs([...clean, ...fallbackSongs]), query, fullSongsOnly);
        if (clean.length === 0) {
          clean = relaxedFilterSongs(uniqueSongs([...collected, ...fallbackSongs]), fullSongsOnly);
        }
      }
    }

    if (clean.length === 0) {
      const fallback = searchMockLibrary(query);
      if (fallback.length > 0) return sortSongs(uniqueSongs(fallback), query, sortBy).slice(0, target);
      return [];
    }

    return sortSongs(clean, query, sortBy).slice(0, target);
  } catch (error) {
    console.error("YouTube API Error:", error);
    return searchMockLibrary(query);
  }
};

export const getSearchSuggestions = async (query: string, maxResults = 8): Promise<string[]> => {
  const q = query.trim();
  if (!q) return [];

  if (!API_KEY) {
    return searchMockLibrary(q)
      .map((song) => `${song.title} - ${song.artist}`)
      .slice(0, maxResults);
  }

  try {
    const searchData = await fetchSearchPage(q, Math.min(15, maxResults * 2), undefined, 'any');
    const seen = new Set<string>();
    const suggestions: string[] = [];
    for (const item of searchData?.items || []) {
      const title = cleanTitle(item?.snippet?.title || '');
      const channel = item?.snippet?.channelTitle || '';
      const label = [title, channel].filter(Boolean).join(' - ').trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push(label);
      if (suggestions.length >= maxResults) break;
    }
    return suggestions;
  } catch (error) {
    console.warn('Suggestion fetch failed:', error);
    return [];
  }
};

const searchMockLibrary = (query: string): Song[] => {
    const lowerQuery = query.toLowerCase();
    const mergedLocal = uniqueSongs([...readCachedSongs(), ...MOCK_LIBRARY]);
    const strict = mergedLocal.filter(song => 
        song.title.toLowerCase().includes(lowerQuery) || 
        song.artist.toLowerCase().includes(lowerQuery) ||
        song.album.toLowerCase().includes(lowerQuery)
    );

    if (strict.length > 0) return strict;

    const terms = lowerQuery.split(/\s+/).filter((term) => term.length > 2);
    const relaxed = mergedLocal.filter((song) => {
      const haystack = `${song.title} ${song.artist} ${song.album}`.toLowerCase();
      return terms.some((term) => haystack.includes(term));
    });

    if (relaxed.length > 0) return relaxed;
    return mergedLocal.slice(0, 30); // fallback to existing library so users still get content instead of empty page
};

export const getFallbackSongs = (query = ''): Song[] => searchMockLibrary(query);

let librarySongsCache: Song[] | null = null;

export const getLibrarySongs = async (): Promise<Song[]> => {
  if (librarySongsCache) return librarySongsCache;

  // GitHub Pages has no server-side API proxy. Load the bundled starter songs
  // immediately when no YouTube key is configured instead of waiting on CORS
  // fallbacks that may never respond.
  if (!API_KEY) {
    librarySongsCache = MOCK_LIBRARY;
    return MOCK_LIBRARY;
  }
  
  try {
      const seedQueries = [
        'top songs playlist',
        'viral music hits',
        'new release songs',
        'lofi chill beats',
      ];

      const batches = await Promise.race([
        Promise.all(seedQueries.map((q) => searchSongs(q, 40))),
        new Promise<Song[][]>((_, reject) =>
          setTimeout(() => reject(new Error('Library request timed out')), LIBRARY_FETCH_TIMEOUT_MS)
        ),
      ]);
      const combinedFetched = uniqueSongs(batches.flat());

      if (!API_KEY || combinedFetched.length === 0) throw new Error("Fallback");

      const mockIds = new Set(MOCK_LIBRARY.map((s) => s.id));
      const filteredFetched = combinedFetched.filter((s) => !mockIds.has(s.id));
      const combined = [...MOCK_LIBRARY, ...filteredFetched];

      librarySongsCache = combined;
      return combined;
  } catch (error) {
      console.warn("Library fetch failed or using fallback.");
      librarySongsCache = MOCK_LIBRARY;
      return MOCK_LIBRARY;
  }
};

export const searchYoutube = searchSongs;
