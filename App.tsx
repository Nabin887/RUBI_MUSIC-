
import React, { useState } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Player from './components/Player';
import Queue from './components/Queue';
import MobileNav from './components/MobileNav';
import { usePlayer } from './hooks/usePlayer';
import { useAppSettings } from './hooks/useAppSettings';
import { AuthPage } from './pages/AuthPages';

export type ViewType = 'home' | 'search' | 'favorites' | 'recent' | 'settings' | 'library' | 'profile' | 'stats' | 'artist';

const MainApp: React.FC = () => {
  const { settings } = useAppSettings();
  const [history, setHistory] = useState<ViewType[]>([settings.startPage]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const activeView = history[historyIndex];

  const { isQueueVisible, isPlayerExpanded } = usePlayer();

  const navigateTo = (view: ViewType) => {
    if (view === activeView) return;
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, view]);
    setHistoryIndex(newHistory.length);
  };

  const goBack = () => { if (historyIndex > 0) setHistoryIndex(historyIndex - 1); };
  const goForward = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col md:p-2 font-sans bg-[radial-gradient(circle_at_top,#0a233d_0%,#031324_30%,#020d1c_100%)] text-white overflow-hidden transition-colors duration-300 selection:bg-[var(--ruby-accent)]/30">
      <div className="relative h-full w-full md:rounded-[20px] md:border md:border-[#1d3b58] overflow-hidden bg-[#021427] flex flex-col min-h-0">
      <div id="youtube-player-container" className="absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none -z-50" aria-hidden="true"></div>
      
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        <div className="hidden md:flex h-full border-r border-[#173651]">
            <Sidebar activeView={activeView} setActiveView={navigateTo} />
        </div>
        
        <div className="flex-1 flex flex-col relative w-full min-w-0 min-h-0">
            <MainContent 
                activeView={activeView} 
                setActiveView={navigateTo}
                onBack={goBack}
                onForward={goForward}
                canGoBack={historyIndex > 0}
                canGoForward={historyIndex < history.length - 1}
            />
             {isQueueVisible && <Queue />}
        </div>
      </div>

      {/* Floating Mini Player on Mobile, Docked on Desktop */}
      <div className={`z-[60] w-full shrink-0 transition-all duration-500 ${isPlayerExpanded ? 'absolute inset-0 h-full' : 'relative h-[90px] mb-[70px] md:mb-0'}`}>
          <Player />
      </div>

      <MobileNav activeView={activeView} setActiveView={navigateTo} />
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[var(--ruby-bg)]" />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <PlayerProvider>
      <MainApp />
    </PlayerProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
