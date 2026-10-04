import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, CloudRain, Sun, Thermometer, BellRing, PhoneCall, Sparkles, Calendar, MapPin, Loader2, RefreshCw } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  isDay: boolean;
}

interface Event {
  title: string;
  date: string;
  description: string;
}

interface Wisdom {
  title: string;
  content: string;
}

export const RightSidebar: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [wisdom, setWisdom] = useState<Wisdom | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingWisdom, setLoadingWisdom] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetchWeather();
    fetchWisdom();
    fetchEvents();
  }, []);

  const fetchWeather = async () => {
    try {
      // Chitral coordinates: 35.85, 71.78
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=35.85&longitude=71.78&current_weather=true');
      const data = await res.json();
      const code = data.current_weather.weathercode;
      
      let condition = 'Clear';
      if (code > 0 && code <= 3) condition = 'Partly Cloudy';
      else if (code > 3 && code <= 48) condition = 'Foggy';
      else if (code > 48 && code <= 67) condition = 'Rainy';
      else if (code > 67 && code <= 77) condition = 'Snowy';
      else if (code > 77) condition = 'Stormy';

      setWeather({
        temp: Math.round(data.current_weather.temperature),
        condition,
        isDay: data.current_weather.is_day === 1
      });
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  const fetchWisdom = async () => {
    setLoadingWisdom(true);
    try {
      const res = await fetch('/api/ai/chitral-wisdom', { method: 'POST' });
      const data = await res.json();
      setWisdom(data);
    } catch (error) {
      console.error('Wisdom fetch error:', error);
    } finally {
      setLoadingWisdom(false);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/ai/chitral-events', { method: 'POST' });
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Events fetch error:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  return (
    <aside className="hidden lg:block w-80 h-screen sticky top-0 overflow-y-auto p-6 bg-slate-50 border-l border-slate-200 custom-scrollbar">
      {/* Weather Widget */}
      <div className="bg-gradient-to-br from-teal to-teal-dark p-6 rounded-[32px] text-white mb-6 shadow-xl shadow-teal/20 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Chitral, PK</p>
              <h3 className="text-3xl font-black">{weather ? `${weather.temp}°` : '--°'}</h3>
            </div>
            {weather?.condition.includes('Rain') ? <CloudRain size={40} className="text-gold" /> : (weather?.isDay ? <Sun size={40} className="text-gold" /> : <Cloud size={40} className="text-gold" />)}
          </div>
          <div className="flex items-center gap-2">
            <Thermometer size={14} className="opacity-70" />
            <p className="text-sm font-bold">{weather?.condition || 'Loading...'}</p>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
           {weather?.isDay ? <Sun size={120} /> : <Cloud size={120} />}
        </div>
      </div>

      {/* Chitral Wisdom Card */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6 group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-teal flex items-center gap-2">
            <Sparkles size={16} className="text-gold" />
            {wisdom?.title || 'Chitral Wisdom'}
          </h3>
          <button onClick={fetchWisdom} disabled={loadingWisdom} className="text-slate-400 hover:text-teal transition-colors disabled:opacity-30">
            <RefreshCw size={14} className={loadingWisdom ? 'animate-spin' : ''} />
          </button>
        </div>
        <AnimatePresence mode="wait">
          {loadingWisdom ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 flex justify-center">
              <Loader2 className="animate-spin text-slate-200" size={24} />
            </motion.div>
          ) : (
            <motion.p 
              key={wisdom?.content}
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-sm text-slate-600 leading-relaxed font-medium italic"
            >
              "{wisdom?.content}"
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Chitral Updates */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6 cursor-pointer hover:border-teal/20 transition-all" onClick={() => onTabChange('updates')}>
        <h3 className="font-bold text-teal mb-4 flex items-center justify-between">
          Chitral Updates
          <BellRing size={16} className="text-crimson" />
        </h3>
        <div className="space-y-4">
          <div className="pb-4 border-b border-slate-50">
            <p className="text-xs text-slate-500 mb-1">2 hours ago</p>
            <p className="text-sm font-bold text-teal">Lowari Tunnel is open for all traffic.</p>
          </div>
          <div className="pb-4 border-b border-slate-50">
            <p className="text-xs text-slate-500 mb-1">5 hours ago</p>
            <p className="text-sm font-bold text-teal">Weather alert: Rain expected in upper Chitral.</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events Widget */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6">
        <h3 className="font-bold text-teal mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-emerald-500" />
          Upcoming Events
        </h3>
        <div className="space-y-4">
          {loadingEvents ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="animate-spin text-slate-200" size={24} />
            </div>
          ) : (
            events.map((event, idx) => (
              <div key={idx} className="group">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{event.date}</p>
                <h4 className="text-sm font-black text-teal group-hover:text-emerald-600 transition-colors">{event.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                {idx < events.length - 1 && <div className="h-px bg-slate-50 mt-4" />}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Emergency Section */}
      <div className="bg-gold p-6 rounded-[32px] shadow-lg shadow-gold/20 text-teal cursor-pointer" onClick={() => onTabChange('emergency')}>
        <h3 className="font-bold mb-2 flex items-center justify-between">
          Emergency?
          <PhoneCall size={20} />
        </h3>
        <p className="text-sm font-medium mb-4 opacity-80">Quick access to local emergency services.</p>
        <button className="w-full bg-teal text-white py-3 rounded-xl font-bold text-sm shadow-md transition-transform active:scale-95">Open Hub</button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest pb-10">
        <MapPin size={10} />
        Hamraah Chitral Network
      </div>
    </aside>
  );
};
