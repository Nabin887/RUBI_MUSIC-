
export interface Song {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  duration: string; 
  durationSeconds?: number;
  viewCount?: number;
  previewUrl: string | null;
  lyrics?: string;
}

export type Theme = 'light' | 'dark';

export interface LyricLine {
    time: number; // Time in seconds
    text: string;
}

export type VibeMode = 'Chill' | 'Energetic' | 'Focus' | 'Party' | 'Melancholy' | 'Late Night' | 'Sunday Morning';
