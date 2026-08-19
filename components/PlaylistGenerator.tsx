
import React, { useState } from 'react';
import { generatePlaylist } from '../services/geminiService';
import { usePlayer } from '../hooks/usePlayer';

const PlaylistGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loadPlaylist, playlist: allSongs } = usePlayer();

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const newPlaylist = await generatePlaylist(prompt, allSongs);
      loadPlaylist(newPlaylist, true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden p-8 rounded-[40px] glass group">
      {/* Abstract background gradient */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#1DB954]/20 rounded-full blur-[60px] transition-transform duration-1000 group-hover:scale-150"></div>
      
      <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#1DB954] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
              </div>
              <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter">AI Vibe Mix</h2>
                  <p className="text-[#a1a1aa] text-xs font-medium">Type your mood, we'll handle the rest.</p>
              </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Chill late night study vibes'"
              className="flex-grow bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder-[#a1a1aa]/50 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-[#1DB954]/30 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-white text-black font-black uppercase text-xs tracking-widest px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xl"
            >
              {isLoading ? (
                  <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Curating...</span>
                  </div>
              ) : 'Generate'}
            </button>
          </div>
      </div>
    </div>
  );
};

export default PlaylistGenerator;
