import React from 'react';
import { Home, ClipboardList, Megaphone, User } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Services', icon: Home },
    { id: 'jobs', label: 'Market', icon: ClipboardList },
    { id: 'civic', label: 'Protest', icon: Megaphone },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/90 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center pb-safe md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center h-full transition-colors"
          >
            <Icon 
              size={22} 
              className={isActive ? 'text-teal' : 'text-slate-400'} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={`text-[10px] font-medium tracking-tight mt-1 ${isActive ? 'text-teal' : 'text-slate-500'}`}>
              {tab.label}
            </span>
            {isActive && <div className="absolute top-0 w-8 h-0.5 bg-teal rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
};
