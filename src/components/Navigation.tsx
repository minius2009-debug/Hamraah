import React from 'react';
import { Home, ClipboardList, User, BellRing, PhoneCall, LayoutDashboard, MessageSquare, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSupportClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onSupportClick }) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  
  const isProvider = profile?.role === 'provider';
  const isAdmin = profile?.role === 'admin';

  const tabs = [
    { id: 'home', label: t('nav_services'), icon: Home, hide: isProvider },
    { id: 'jobs', label: isProvider ? t('nav_dashboard') : t('nav_bookings'), icon: isProvider ? LayoutDashboard : ClipboardList },
    { id: 'updates', label: t('nav_updates'), icon: BellRing },
    { id: 'emergency', label: t('nav_emergency'), icon: PhoneCall },
    { id: 'admin', label: t('nav_admin'), icon: Shield, hide: !isAdmin },
    { id: 'support', label: t('nav_support'), icon: MessageSquare, onClick: onSupportClick },
  ].filter(t => !t.hide);

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-${tabs.length} items-center pb-safe md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if ('onClick' in tab && tab.onClick) {
                tab.onClick();
              } else {
                setActiveTab(tab.id);
              }
            }}
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

