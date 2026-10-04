import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, User, Search, X, Globe } from 'lucide-react';

interface HeaderProps {
  title: string;
  onNotificationClick?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onNotificationClick, searchQuery, setSearchQuery }) => {
  const { profile } = useAuth();
  const { language, setLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <img 
          src="/src/assets/images/hamrah_logo_1790495411663.jpg" 
          alt="Hamrah Logo" 
          className="w-8 h-8 rounded-lg"
        />
        <h1 className="text-lg font-bold text-teal tracking-tight hidden lg:block">Hamraah</h1>
      </div>
      
      <div className="flex-1 max-w-md relative group">
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search services..."
          className="w-full bg-slate-100 border-none rounded-xl py-2 px-10 text-sm focus:ring-2 focus:ring-teal/20 focus:bg-white transition-all placeholder:text-slate-400"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal transition-colors" size={16} />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
           {['en', 'khw', 'ur'].map((l) => (
             <button
               key={l}
               onClick={() => setLanguage(l as any)}
               className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${
                 language === l ? 'bg-white text-teal shadow-sm' : 'text-slate-400'
               }`}
             >
               {l}
             </button>
           ))}
        </div>

        <button 
          onClick={onNotificationClick}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-teal transition-colors relative"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
};
