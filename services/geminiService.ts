
import { Type } from "@google/genai";
import { Song, LyricLine } from "../types";

// API keys must stay on a server-side proxy. Never embed Gemini credentials
// in the public GitHub Pages bundle.
const ai = null;

export const generatePlaylist = async (prompt: string, allSongs: Song[]): Promise<Song[]> => {
  if (!ai) {
    return allSongs.sort(() => 0.5 - Math.random()).slice(0, 5);
  }

  const allSongTitles = allSongs.map(song => song.title).join(", ");

  const generationPrompt = `
    You are an expert music playlist curator.
    Based on the user's request, create a playlist from the available songs.
    Only return a list of song titles that exactly match the titles from the provided list. Do not invent new songs.
    
    Available songs: ${allSongTitles}
    
    User request: "${prompt}"
  `;

  try {
    const response = await ai.models.generateContent({
      // Updated to gemini-3-flash-preview for basic text tasks
      model: 'gemini-3-flash-preview',
      contents: generationPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playlist: {
              type: Type.ARRAY,
              description: "A list of song titles for the playlist.",
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ["playlist"],
        },
      },
    });

    // Access text directly as a property, not a method
    const jsonText = response.text?.trim() || "{\"playlist\": []}";
    const generated = JSON.parse(jsonText);
    
    const playlistTitles: string[] = generated.playlist || [];

    const playlistSongs = playlistTitles
      .map(title => allSongs.find(song => song.title === title))
      .filter((song): song is Song => song !== undefined);

    return playlistSongs;

  } catch (error) {
    console.error("Error generating playlist with Gemini:", error);
    // Return a random subset of songs as a fallback
    return allSongs.sort(() => 0.5 - Math.random()).slice(0, 5);
  }
};

// Helper to parse LRC format (e.g., "[00:12] I'll be gone")
const parseLrcLyrics = (lrcString: string): LyricLine[] => {
    const lines = lrcString.split('\n');
    const result: LyricLine[] = [];
    
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

    lines.forEach(line => {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const totalSeconds = minutes * 60 + seconds;
            
            const text = line.replace(timeRegex, '').trim();
            if (text) {
                result.push({ time: totalSeconds, text });
            }
        }
    });
    
    return result;
};

const parseDurationToSeconds = (duration: string): number | null => {
    if (!duration || /live/i.test(duration)) return null;
    const parts = duration.split(":").map((p) => Number(p));
    if (parts.some((v) => Number.isNaN(v))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
};

const normalizeTimedLyrics = (lines: LyricLine[], songDurationSeconds: number | null): LyricLine[] => {
    const cleaned = lines
      .filter((line) => line && typeof line.text === "string" && line.text.trim().length > 0)
      .map((line, index) => ({
        time: Number.isFinite(line.time) ? Math.max(0, line.time) : index * 4,
        text: line.text.trim(),
      }))
      .sort((a, b) => a.time - b.time);

    if (cleaned.length === 0) return [];

    for (let i = 1; i < cleaned.length; i++) {
      if (cleaned[i].time <= cleaned[i - 1].time) {
        cleaned[i].time = cleaned[i - 1].time + 2.5;
      }
    }

    if (!songDurationSeconds || cleaned.length < 2) return cleaned;

    const first = cleaned[0].time;
    const last = cleaned[cleaned.length - 1].time;
    const targetEnd = Math.max(20, songDurationSeconds - 6);
    const span = Math.max(1, last - first);
    const shouldScale = last < targetEnd * 0.6 || last > targetEnd * 1.4;

    if (shouldScale) {
      const ratio = targetEnd / span;
      return cleaned.map((line) => ({
        ...line,
        time: Math.max(0, (line.time - first) * ratio),
      }));
    }

    return cleaned;
};

const cleanSongTitle = (title: string): string => {
    return title
      .replace(/\|.*$/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/official/gi, "")
      .replace(/lyric video/gi, "")
      .replace(/video/gi, "")
      .replace(/\s+/g, " ")
      .trim();
};

const unsyncedToTimedLyrics = (lyricsText: string, songDurationSeconds: number | null): LyricLine[] => {
    const lines = lyricsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return [];
    const step = songDurationSeconds
      ? Math.max(2.2, Math.min(8, (songDurationSeconds * 0.9) / lines.length))
      : 4;

    return lines.map((text, index) => ({
      time: Number((index * step).toFixed(2)),
      text,
    }));
};

export const getLyrics = async (song: Song): Promise<LyricLine[]> => {
    const songDurationSeconds = parseDurationToSeconds(song.duration);

    // 1. Check if song already has static lyrics attached (from Mock Data)
    if (song.lyrics) {
        const parsed = normalizeTimedLyrics(parseLrcLyrics(song.lyrics), songDurationSeconds);
        if (parsed.length > 0) return parsed;
    }

    // 2. Try public lyrics source (unsynced text converted to timed lines)
    try {
        const title = cleanSongTitle(song.title);
        const artist = song.artist.trim();
        const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);

        if (response.ok) {
            const data = await response.json();
            if (typeof data.lyrics === "string" && data.lyrics.trim()) {
                const timed = normalizeTimedLyrics(unsyncedToTimedLyrics(data.lyrics, songDurationSeconds), songDurationSeconds);
                if (timed.length > 0) return timed;
            }
        }
    } catch (error) {
        console.warn("Public lyrics source failed:", error);
    }

    // 3. Fallback to AI generation if available
    if (!ai) {
        return [
            { time: 0, text: song.title },
            { time: 3, text: `by ${song.artist}` },
            { time: 7, text: "Lyrics are loading from other sources." },
            { time: 12, text: "Try another song for synced lyrics." }
        ];
    }

    const prompt = `
    Generate synchronized lyrics for the song "${song.title}" by "${song.artist}". 
    Return a JSON object containing an array of lyric lines.
    Each line must have a 'time' (in seconds, as a number) indicating when the line *starts* singing, and 'text' (the lyric string).
    
    IMPORTANT: 
    1. Estimate the timestamps as accurately as possible based on the song structure (Intro, Verse 1, Chorus, etc.) if exact data is not known. 
    2. Ensure the timestamps are sequential.
    3. Include instrumental breaks as text: "[Instrumental]" with a duration.
    `;

    try {
        const response = await ai.models.generateContent({
            // Updated to gemini-3-flash-preview for basic text tasks
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lyrics: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    time: { type: Type.NUMBER },
                                    text: { type: Type.STRING }
                                },
                                required: ["time", "text"]
                            }
                        }
                    },
                    required: ["lyrics"]
                }
            }
        });

        // Access text directly as a property
        const jsonText = response.text?.trim() || "{\"lyrics\": []}";
        const data = JSON.parse(jsonText);
        const lines = Array.isArray(data.lyrics) ? data.lyrics : [];
        const normalized = normalizeTimedLyrics(lines, songDurationSeconds);
        if (normalized.length > 0) return normalized;
        return [
            { time: 0, text: `${song.title}` },
            { time: 3, text: `by ${song.artist}` },
            { time: 8, text: "Synced lyrics are not available for this song yet." },
            { time: 12, text: "Try another song for full lyrics." }
        ];
    } catch (error) {
        console.error("Error fetching lyrics:", error);
        return [
            { time: 0, text: `${song.title}` },
            { time: 3, text: `by ${song.artist}` },
            { time: 8, text: "Could not fetch synced lyrics right now." },
            { time: 12, text: "Please try a different track." }
        ];
    }
};
