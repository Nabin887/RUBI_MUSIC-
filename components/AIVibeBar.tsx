
import React, { useState, useEffect } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { VibeMode } from '../types';

const VibeIcons: Record<VibeMode, React.ReactNode> = {
    'Chill': <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>,
    'Energetic': <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    'Focus': <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
    'Party': <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
    'Melancholy': <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><circle cx="12" cy="12" r="10"/></svg>,
    'Late Night': <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
    'Sunday Morning': <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a5 5 0 0 0-10 0"/></svg>,
};

const VibeColors: Record<VibeMode, string> = {
    'Chill': 'from-blue-400 to-cyan-300',
    'Energetic': 'from-yellow-400 to-orange-500',
    'Focus': 'from-emerald-400 to-teal-500',
    'Party': 'from-purple-500 to-pink-500',
    'Melancholy': 'from-indigo-400 to-blue-600',
    'Late Night': 'from-indigo-900 to-purple-800',
    'Sunday Morning': 'from-yellow-200 to-amber-400',
};

const AIVibeBar: React.FC = () => {
    const { currentVibe, generateVibeMix } = usePlayer();
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
        setIsAnimating(true);
        generateVibeMix();
        setTimeout(() => setIsAnimating(false), 1000);
    };

    return (
        <button
            onClick={handleClick}
            className="group relative flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
            title="Generate AI Recommendations based on current vibe"
        >
            {/* Pulsing Glow Effect */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${VibeColors[currentVibe]} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
            <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${VibeColors[currentVibe]} opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-500 animate-pulse`} />

            {/* Icon Circle */}
            <div className={`relative w-6 h-6 rounded-full bg-gradient-to-br ${VibeColors[currentVibe]} flex items-center justify-center shadow-inner text-black/80`}>
                {VibeIcons[currentVibe]}
            </div>

            {/* Text Content */}
            <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-none mb-0.5">Current Vibe</span>
                <span className={`text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r ${VibeColors[currentVibe]} leading-none`}>
                   {currentVibe}
                </span>
            </div>

            {/* Action Arrow (Animated) */}
            <div className={`text-zinc-500 transition-transform duration-300 ${isAnimating ? 'rotate-180 text-white' : 'group-hover:translate-x-1'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
        </button>
    );
};

export default AIVibeBar;
