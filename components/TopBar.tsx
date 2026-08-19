import React, { useState, useRef, useEffect } from 'react';
import { ICON_BELL, ICON_SEARCH, ICON_SETTINGS, ICON_ARROW_LEFT, ICON_ARROW_RIGHT } from '../constants';
import { ViewType } from '../App';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  activeView?: ViewType;
  setActiveView: (view: ViewType) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  setActiveView,
  searchQuery = '',
  onSearchQueryChange,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const notifications = [
    { id: 1, title: 'Welcome to RUBI', time: 'Just now', unread: true },
    { id: 2, title: 'Playlist refreshed', time: '1 hour ago', unread: true },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;
  const userName = user?.name?.trim() || 'suraj';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 bg-[#081b31]/95 backdrop-blur-xl min-h-[78px] border-b border-[#1d3d5a]">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={`w-10 h-10 rounded-full border grid place-items-center transition-colors ${
            canGoBack
              ? 'bg-[#0d2f53] border-[#1a4f79] text-[#c4d8eb] hover:bg-[#13406d]'
              : 'bg-[#0b1f37] border-[#12314d] text-[#5f7a95] cursor-not-allowed'
          }`}
          title="Back"
        >
          {React.cloneElement(ICON_ARROW_LEFT as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 18, height: 18 })}
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          className={`w-10 h-10 rounded-full border grid place-items-center transition-colors ${
            canGoForward
              ? 'bg-[#0d2f53] border-[#1a4f79] text-[#c4d8eb] hover:bg-[#13406d]'
              : 'bg-[#0b1f37] border-[#12314d] text-[#5f7a95] cursor-not-allowed'
          }`}
          title="Forward"
        >
          {React.cloneElement(ICON_ARROW_RIGHT as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 18, height: 18 })}
        </button>
      </div>

      <div className="flex-1 max-w-[640px] mx-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#85a2bf]">{ICON_SEARCH}</span>
          <input
            value={searchQuery}
            onFocus={() => setActiveView('search')}
            onChange={(e) => {
              onSearchQueryChange?.(e.target.value);
              if (e.target.value.length > 0) setActiveView('search');
            }}
            placeholder="Search songs..."
            className="w-full h-12 rounded-full bg-[#102b47] border border-[#2a4f70] text-white placeholder-[#7b96b0] pl-12 pr-12 outline-none focus:border-[#61dff6]"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#90a8c2]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22" opacity="0"/><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2" ref={notifRef}>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors relative ${showNotifications ? 'text-white' : 'text-[#aac3dc] hover:text-white'}`}
          >
            {ICON_BELL}
            {unreadCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#26e4ff] rounded-full"></span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#0c2744] border border-[#254666] rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-[#254666] font-bold text-xs uppercase tracking-widest text-[#8ea9c3]">Notifications</div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-[#254666] last:border-0">
                    <p className="text-sm text-white font-medium">{n.title}</p>
                    <p className="text-[10px] text-[#8ea9c3]">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setActiveView('settings')} className="p-2 text-[#aac3dc] hover:text-white hover:bg-white/10 rounded-full transition-colors">
          {ICON_SETTINGS}
        </button>

        <button
          onClick={() => setActiveView('profile')}
          className="h-10 rounded-full overflow-hidden border border-[#1a4364] bg-[#0f2944] px-2 pr-3 flex items-center gap-2"
          title="Open profile"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={userName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#0c698d] grid place-items-center text-white text-xs font-bold">{userName.charAt(0).toLowerCase()}</div>
          )}
          <span className="text-white text-sm">{userName}</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
