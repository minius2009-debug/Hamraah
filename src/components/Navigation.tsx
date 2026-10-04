import React from 'react';
import { Home, ClipboardList, Megaphone, User, BellRing, PhoneCall } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role?: string | null;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, role }) => {
  const tabs = [
    { id: 'home', label: role === 'provider' ? 'Gigs' : 'Services', icon: Home },
    { id: 'jobs', label: role === 'provider' ? 'Earnings' : 'Market', icon: ClipboardList },
    { id: 'updates', label: 'Updates', icon: BellRing },
    { id: 'emergency', label: 'Emergency', icon: PhoneCall },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center pb-safe md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center h-full transition-all relative"
          >
            <Icon 
              size={20} 
              className={isActive ? 'text-teal' : 'text-slate-400'} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={`text-[9px] font-bold tracking-tight mt-1 ${isActive ? 'text-teal' : 'text-slate-500'}`}>
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute top-0 w-8 h-1 bg-teal rounded-b-full shadow-sm shadow-teal/50" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

