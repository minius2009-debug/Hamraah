import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Megaphone, MapPin, Calendar, ExternalLink, RefreshCw } from 'lucide-react';

interface Update {
  id: string;
  title: string;
  content: string;
  category: 'Traffic' | 'Weather' | 'Event' | 'News';
  timestamp: string;
  location?: string;
}

const MOCK_UPDATES: Update[] = [
  {
    id: '1',
    title: 'Lowari Tunnel Open',
    content: 'The Lowari Tunnel is currently open for all types of traffic. Drivers are advised to follow speed limits inside the tunnel.',
    category: 'Traffic',
    timestamp: '2 hours ago',
    location: 'Lowari Tunnel'
  },
  {
    id: '2',
    title: 'Snowfall Alert',
    content: 'Moderate to heavy snowfall is expected in Upper Chitral (Booni, Mastuj) over the weekend. Prepare accordingly with supplies and warm clothing.',
    category: 'Weather',
    timestamp: '5 hours ago',
    location: 'Upper Chitral'
  },
  {
    id: '3',
    title: 'Jashan-e-Chitral Dates',
    content: 'The district administration has announced the preliminary dates for the annual Jashan-e-Chitral festival. Details to follow.',
    category: 'Event',
    timestamp: '1 day ago',
    location: 'Chitral Polo Ground'
  },
  {
    id: '4',
    title: 'Booni Road Maintenance',
    content: 'Maintenance work is underway on the Booni-Chitral road near Koghuzi. Expect minor delays during peak hours.',
    category: 'Traffic',
    timestamp: '1 day ago',
    location: 'Koghuzi'
  }
];

export const UpdatesScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState<Update[]>(MOCK_UPDATES);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Traffic': return 'bg-blue-100 text-blue-700';
      case 'Weather': return 'bg-amber-100 text-amber-700';
      case 'Event': return 'bg-purple-100 text-purple-700';
      case 'News': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-teal">Chitral Updates</h2>
          <p className="text-sm text-slate-500">Live news and alerts from the valley.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className={`p-3 bg-slate-50 rounded-2xl text-teal hover:bg-slate-100 transition-colors ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {updates.map((update, index) => (
          <motion.div
            key={update.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${getCategoryStyles(update.category)}`}>
                {update.category}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Calendar size={12} />
                {update.timestamp}
              </div>
            </div>

            <h3 className="text-lg font-bold text-teal mb-2 leading-tight">{update.title}</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              {update.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              {update.location && (
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin size={14} className="text-crimson" />
                  <span className="text-xs font-medium">{update.location}</span>
                </div>
              )}
              <button className="text-teal text-xs font-bold flex items-center gap-1 hover:underline">
                View Details <ExternalLink size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
