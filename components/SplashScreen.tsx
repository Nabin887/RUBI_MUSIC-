
import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Wait for fade out
        }, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] bg-[#0F0F14] flex flex-col items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative mb-8">
                {/* Animated Logo */}
                <div className="w-24 h-24 bg-gradient-to-tr from-[#1DB954] to-[#8B5CF6] rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(29,185,84,0.3)] animate-bounce">
                    <span className="text-4xl font-black text-white italic">N</span>
                </div>
                {/* Wave Animation */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 h-8">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div
                            key={i}
                            className="w-1 bg-white/40 rounded-full animate-pulse"
                            style={{ height: `${20 + Math.random() * 40}%`, animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
            </div>
            <h1 className="relative text-5xl font-black tracking-tighter animate-pulse">
                <span className="absolute left-[3px] top-[3px] text-[#66a3ff] opacity-90">RUBY</span>
                <span className="relative text-white">RUBY</span>
            </h1>
            <p className="text-[#a1a1aa] text-sm uppercase tracking-[0.4em] mt-4 font-bold opacity-0 animate-in fade-in slide-in-from-bottom duration-1000 delay-500 fill-mode-forwards">Premium Audio</p>
        </div>
    );
};

export default SplashScreen;
