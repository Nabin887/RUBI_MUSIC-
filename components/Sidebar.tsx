import React from 'react';
import { ICON_HOME, ICON_SEARCH, ICON_LIBRARY } from '../constants';
import { ViewType } from '../App';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="w-[320px] h-full bg-[#021427] flex flex-col p-4">
      <div className="rounded-2xl border border-[#1a3a58] bg-[#0d2740] p-4 mb-7">
        <p className="text-xs tracking-[0.25em] text-[#64dff5] uppercase mb-2">Music OS</p>
        <div className="flex items-center gap-3 px-1 cursor-pointer" onClick={() => setActiveView('home')}>
        <div className="w-10 h-10 bg-gradient-to-br from-[#0adc7b] to-[#16b86f] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(10,220,123,0.35)]">
          <span className="text-2xl font-black text-white italic">R</span>
        </div>
        <h1 className="relative text-[30px]/none font-black tracking-tighter">
          <span className="absolute left-[2px] top-[2px] text-[#66a3ff] opacity-90">RUBI</span>
          <span className="relative text-white">RUBI</span>
        </h1>
        </div>
      </div>

      <nav className="space-y-1.5">
        <NavItem icon={ICON_HOME} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')} />
        <NavItem icon={ICON_SEARCH} label="Search" active={activeView === 'search'} onClick={() => setActiveView('search')} />
        <NavItem icon={ICON_LIBRARY} label="Your Library" active={activeView === 'library'} onClick={() => setActiveView('library')} />
        <NavItem
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="20" x2="20" y2="20" />
              <line x1="8" y1="16" x2="8" y2="10" />
              <line x1="12" y1="16" x2="12" y2="4" />
              <line x1="16" y1="16" x2="16" y2="8" />
            </svg>
          }
          label="Stats"
          active={activeView === 'stats'}
          onClick={() => setActiveView('stats')}
        />
      </nav>

      <div className="mt-10 pt-10 border-t border-[#111d2d] space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#9fb6d1] mb-4 ml-4">My Collection</p>
        <NavItem
          icon={
            <div className="w-6 h-6 bg-gradient-to-br from-[#1ce08a] to-[#07c871] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#1ce08a]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 0 1 7.5 3c1.74 0 3.41.81 4.5 2.09A6.07 6.07 0 0 1 16.5 3 5.5 5.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.5Z" />
              </svg>
            </div>
          }
          label="Liked Songs"
          active={activeView === 'favorites'}
          onClick={() => setActiveView('favorites')}
        />
        <NavItem
          icon={<div className="w-6 h-6 bg-[#1a2433] rounded-lg flex items-center justify-center text-white text-[10px] font-bold">H</div>}
          label="History"
          active={activeView === 'recent'}
          onClick={() => setActiveView('recent')}
        />
      </div>

    </aside>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-bold text-sm ripple ${
      active ? 'text-white bg-[#17385b] shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-[#2e6d93]' : 'text-[#97a9c1] hover:text-white hover:bg-[#0e2b47]'
    }`}
  >
    <span className={`transition-colors duration-300 ${active ? 'text-[#1ce08a]' : ''}`}>{icon}</span>
    <span className="tracking-tight">{label}</span>
  </button>
);

export default Sidebar;
