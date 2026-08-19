
import React from 'react';
import { ViewType } from '../App';
import { ICON_HOME, ICON_SEARCH, ICON_LIBRARY } from '../constants';
import { usePlayer } from '../hooks/usePlayer';

interface MobileNavProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeView, setActiveView }) => {
  const { isPlayerExpanded } = usePlayer();
  
  const NavItem = ({ view, icon, label }: { view: ViewType, icon: React.ReactNode, label: string }) => {
    const isActive = activeView === view;
    return (
      <button 
        onClick={() => setActiveView(view)}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300 ${isActive ? 'text-[#8cebf8]' : 'text-[#b2becd] hover:text-white'}`}
      >
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5 bg-[#123454] px-6 py-2 rounded-full border border-[#2d5e86]' : ''}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { 
              width: 24, 
              height: 24,
              strokeWidth: isActive ? 2.6 : 2
          })}
        </div>
        <span className={`text-[10px] font-medium ${isActive ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
      </button>
    );
  };

  // Hide when player is expanded to give more room to controls/lyrics
  if (isPlayerExpanded) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[86px] bg-[linear-gradient(180deg,#0a1f36,#081a2d)] backdrop-blur-2xl border-t border-[#234a69] z-[60] flex items-center justify-around px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.45)] rounded-t-3xl">
      <NavItem view="home" icon={ICON_HOME} label="Home" />
      <NavItem view="search" icon={ICON_SEARCH} label="Search" />
      <NavItem view="library" icon={ICON_LIBRARY} label="Library" />
    </div>
  );
};

export default MobileNav;
